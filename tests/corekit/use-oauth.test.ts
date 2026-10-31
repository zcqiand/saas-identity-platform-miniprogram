// @vitest-environment jsdom
/**
 * useOAuth 7 条（M04.F03.I01 authorize 组 + M04.F03.I02 exchange/refresh 组，
 * knife4 Task 2 Step 1）：mock 只在 seams——生成 OauthApi 方法面注入 fake（反目标：
 * 不 mock 传输语义之外的东西）；SessionStore 走内存缝（token store 注入 +
 * adoptLogin 入账 ready，adoptOAuthToken 真跑——exchange/refresh 的入账断言
 * store.getToken()/getRefreshToken()）。React 18.3 act + react-dom/client 渲染
 * 探针，形状照 use-admin-clients.test.ts；SessionStore/TokenStore 构造触 Taro
 * storage，故 @tarojs/taro 照 use-members.test.ts 垫 mock（hook 本体不触 Taro）。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const setStorageSync = vi.hoisted(() => vi.fn());
const getStorageSync = vi.hoisted(() => vi.fn(() => ""));
const removeStorageSync = vi.hoisted(() => vi.fn());

vi.mock("@tarojs/taro", () => ({
  default: { setStorageSync, getStorageSync, removeStorageSync },
}));

import type { OAuthSeams } from "../../src/corekit/use-oauth";
import {
  OAUTH_DEFAULT_SCOPE,
  OAUTH_REDIRECT_URI,
  useOAuth,
} from "../../src/corekit/use-oauth";
import { fnTest } from "../fn";
import { ResponseError } from "../../src/generated/runtime";
import type { SysUser, TokenResponse } from "../../src/generated";
import { SessionStore } from "../../src/corekit/session-store";
import { createInMemoryTokenStore } from "../../src/corekit/token-store";

const D0 = new Date("2026-01-01T00:00:00Z");

function sysUser(): SysUser {
  return {
    id: "u1",
    username: "alice",
    email: "alice@example.com",
    status: "active",
    createdAt: D0,
    updatedAt: D0,
  };
}

function tokenRes(over: Partial<TokenResponse> = {}): TokenResponse {
  return {
    accessToken: "at1",
    refreshToken: "rt1",
    tokenType: "Bearer",
    expiresIn: 3600,
    userId: "u1",
    clientId: "saas-console",
    tenantId: "t1",
    ...over,
  };
}

/** 生成 API fake（seams 缝级 mock，不 mock 传输）。 */
function makeSeams() {
  return {
    oauth: {
      oAuthAuthorize: vi.fn(),
      oAuthToken: vi.fn(),
    },
  };
}
type SeamsFake = ReturnType<typeof makeSeams>;

/** 内存缝 SessionStore：adoptLogin 入账 ready（adoptOAuthToken 需 ready）。
 * apiBaseUrl 用空串 thunk：reBootstrap 对空 baseURL 早退，本文件模块注册表里
 * 不落全局 config（defaultSeams fail-fast 测试依赖 currentConfig() 保持缺失）。 */
function makeStore(): {
  store: SessionStore;
  tokens: ReturnType<typeof createInMemoryTokenStore>;
} {
  // SessionStore 无 token 读面：入账断言打在注入的 TokenStore 缝上
  const tokens = createInMemoryTokenStore();
  const store = new SessionStore({
    tokenStore: tokens,
    apiBaseUrl: () => "",
    clientId: "saas-console",
  });
  store.adoptLogin({
    user: sysUser(),
    availableTenants: [],
    userId: "u1",
    clientId: "saas-console",
    currentTenantId: "t1",
    accessToken: "tok",
    refreshToken: "ref",
  });
  return { store, tokens };
}

function renderUseOAuth(
  clientId: string,
  options?: { store?: SessionStore; seams?: OAuthSeams },
): {
  hook: { current?: ReturnType<typeof useOAuth> };
  store: SessionStore;
  /** 自建 store 时返回其 token 缝（入账断言打这里）；外注 store 时 undefined。 */
  tokens?: ReturnType<typeof createInMemoryTokenStore>;
} {
  const made = options?.store ? undefined : makeStore();
  const store = options?.store ?? made!.store;
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const hook: { current?: ReturnType<typeof useOAuth> } = {};
  function Probe() {
    hook.current = useOAuth(clientId, { ...options, store });
    return null;
  }
  act(() => {
    root.render(createElement(Probe));
  });
  return { hook, store, tokens: made?.tokens };
}

/** 在 act 里跑一个动作，吞掉 rejection 供断言。 */
async function call(
  fn: () => Promise<unknown>,
): Promise<{ ok: boolean; value?: unknown }> {
  let out: { ok: boolean; value?: unknown } | undefined;
  await act(async () => {
    try {
      out = { ok: true, value: await fn() };
    } catch (e) {
      out = { ok: false, value: e };
    }
  });
  return out as { ok: boolean; value?: unknown };
}

describe("useOAuth（授权码三步流，knife4 T2）", () => {
  let seams: SeamsFake;

  beforeEach(() => {
    seams = makeSeams();
  });

  function mount() {
    return renderUseOAuth("saas-console", {
      seams: seams as unknown as OAuthSeams,
    });
  }

  /** authorize 成功铺底（回显 state 的 echo fake），返回 hook 与 store。 */
  async function authorized() {
    seams.oauth.oAuthAuthorize.mockImplementation(
      async (req: { authorizeCodeRequest: { state: string } }) => ({
        code: "ac-1",
        state: req.authorizeCodeRequest.state,
      }),
    );
    const { hook, store, tokens } = mount();
    const out = await call(() => hook.current!.authorize());
    expect(out.value).toBe(true);
    seams.oauth.oAuthAuthorize.mockClear();
    return { hook, store, tokens: tokens! };
  }

  /** authorize + exchange 铺底（token {at1,rt1} 已入账）。 */
  async function exchanged() {
    seams.oauth.oAuthToken.mockResolvedValue(tokenRes());
    const ctx = await authorized();
    const out = await call(() => ctx.hook.current!.exchangeCode());
    expect(out.value).toBe(true);
    seams.oauth.oAuthToken.mockClear();
    return ctx;
  }

  fnTest(
    ["M04.F03.I01"],
    "authorize 置 code 并回显 state——request 带 scope=openid/responseType=code/redirectUri，无 clientSecret；state 呈 uuid v4 形状",
    async () => {
      const { hook } = mount();
      // echo fake：响应 state 与发送值一致（合法 IdP 回传）
      seams.oauth.oAuthAuthorize.mockImplementation(
        async (req: { authorizeCodeRequest: { state: string } }) => ({
          code: "ac-1",
          state: req.authorizeCodeRequest.state,
        }),
      );
      expect(hook.current!.code).toBeNull();
      expect(hook.current!.state).toBeNull();

      const out = await call(() => hook.current!.authorize());
      expect(out.value).toBe(true);

      const req = seams.oauth.oAuthAuthorize.mock.calls[0]![0].authorizeCodeRequest;
      // state 回显：hook.state 与 seam 实收的 request.state 相等，且呈 uuid v4 形状
      expect(hook.current!.state).toBe(req.state);
      expect(req.state).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
      expect(req.scope).toBe(OAUTH_DEFAULT_SCOPE);
      expect(req.scope).toBe("openid");
      expect(req.responseType).toBe("code");
      expect(req.redirectUri).toBe(OAUTH_REDIRECT_URI);
      expect("clientSecret" in req).toBe(false);
      expect(hook.current!.code).toBe("ac-1");
      expect(hook.current!.phase).toBe("idle");
      expect(hook.current!.error).toBeUndefined();
    },
  );

  fnTest(
    ["M04.F03.I01"],
    "state 回传不一致 fail-fast——返回 false + error 含「疑似 CSRF」+ code 仍 null",
    async () => {
      seams.oauth.oAuthAuthorize.mockResolvedValue({
        code: "ac-evil",
        state: "tampered-state",
      });
      const { hook } = mount();

      const out = await call(() => hook.current!.authorize());
      expect(out.value).toBe(false);
      expect(hook.current!.error).toContain("疑似 CSRF");
      expect(hook.current!.code).toBeNull();
      expect(hook.current!.state).toBeNull();
      expect(hook.current!.phase).toBe("failed");
      // 授权码已丢弃：后续 exchange 无码可换
      expect(seams.oauth.oAuthToken).not.toHaveBeenCalled();
    },
  );

  fnTest(
    ["M04.F03.I01"],
    "authorize 失败清残留 code/state——先成功（ac-1）再来一次 state 不一致，code/state 回 null 且 exchangeCode 随后被拒「尚无授权码」",
    async () => {
      const { hook } = await authorized();
      expect(hook.current!.code).toBe("ac-1");

      seams.oauth.oAuthAuthorize.mockResolvedValue({
        code: "ac-evil",
        state: "tampered-state",
      });
      const out = await call(() => hook.current!.authorize());
      expect(out.value).toBe(false);
      // swift OAuthViewModel :71-74：失败路径显式置 nil，与「已丢弃授权码」同义
      expect(hook.current!.code).toBeNull();
      expect(hook.current!.state).toBeNull();

      seams.oauth.oAuthToken.mockResolvedValue(tokenRes());
      const ex = await call(() => hook.current!.exchangeCode());
      expect(ex.value).toBe(false);
      expect(hook.current!.error).toContain("尚无授权码");
      expect(seams.oauth.oAuthToken).not.toHaveBeenCalled();
    },
  );

  fnTest(
    ["M04.F03.I01"],
    "authorize 网络异常也清残留 code/state——先成功（ac-1）再来一次 seam reject，code/state 回 null",
    async () => {
      const { hook } = await authorized();
      expect(hook.current!.code).toBe("ac-1");

      seams.oauth.oAuthAuthorize.mockRejectedValue(
        new ResponseError(new Response(null, { status: 503 })),
      );
      const out = await call(() => hook.current!.authorize());
      expect(out.value).toBe(false);
      // swift OAuthViewModel :82-85：异常路径同样置 nil
      expect(hook.current!.code).toBeNull();
      expect(hook.current!.state).toBeNull();
      expect(hook.current!.error).toBe("请求失败（HTTP 503）");
    },
  );

  fnTest(
    ["M04.F03.I02"],
    "exchangeCode 无授权码先拒——error「尚无授权码」且 seam 未被调",
    async () => {
      const { hook } = mount();

      const out = await call(() => hook.current!.exchangeCode());
      expect(out.value).toBe(false);
      expect(hook.current!.error).toContain("尚无授权码");
      expect(seams.oauth.oAuthToken).not.toHaveBeenCalled();
    },
  );

  fnTest(
    ["M04.F03.I02"],
    "exchangeCode 走 authorization_code 且入账——tokenRequest 形状（grantType/code/clientId/redirectUri，无 clientSecret）+ store.getToken()==at1 + hook.token 非空",
    async () => {
      const { hook, tokens } = await authorized();
      seams.oauth.oAuthToken.mockResolvedValue(
        tokenRes({ accessToken: "at1", refreshToken: "rt1" }),
      );

      const out = await call(() => hook.current!.exchangeCode());
      expect(out.value).toBe(true);

      expect(seams.oauth.oAuthToken).toHaveBeenCalledTimes(1);
      const req = seams.oauth.oAuthToken.mock.calls[0]![0].tokenRequest;
      expect(req.grantType).toBe("authorization_code");
      expect(req.code).toBe("ac-1");
      expect(req.clientId).toBe("saas-console");
      expect(req.redirectUri).toBe(OAUTH_REDIRECT_URI);
      expect("clientSecret" in req).toBe(false);

      // T1 adoptOAuthToken 入账：token 对真落缝
      expect(tokens.getToken()).toBe("at1");
      expect(tokens.getRefreshToken()).toBe("rt1");
      expect(hook.current!.token?.accessToken).toBe("at1");
      expect(hook.current!.phase).toBe("idle");
    },
  );

  fnTest(
    ["M04.F03.I02"],
    "refreshToken 无 token 先拒——未 exchange 直接 refresh，error「尚无 refresh token」",
    async () => {
      const { hook } = await authorized();

      const out = await call(() => hook.current!.refreshToken());
      expect(out.value).toBe(false);
      expect(hook.current!.error).toContain("尚无 refresh token");
      expect(seams.oauth.oAuthToken).not.toHaveBeenCalled();
    },
  );

  fnTest(
    ["M04.F03.I02"],
    "refreshToken 走 refresh_token 且全新对入账——grantType=refresh_token + store 换成 {at2,rt2}",
    async () => {
      const { hook, tokens } = await exchanged();
      seams.oauth.oAuthToken.mockResolvedValue(
        tokenRes({ accessToken: "at2", refreshToken: "rt2" }),
      );

      const out = await call(() => hook.current!.refreshToken());
      expect(out.value).toBe(true);

      const req = seams.oauth.oAuthToken.mock.calls[0]![0].tokenRequest;
      expect(req.grantType).toBe("refresh_token");
      expect(req.refreshToken).toBe("rt1");
      expect(req.clientId).toBe("saas-console");
      expect("clientSecret" in req).toBe(false);

      // 轮换：全新对替换（swift OAuthViewModel 同款）
      expect(tokens.getToken()).toBe("at2");
      expect(tokens.getRefreshToken()).toBe("rt2");
      expect(hook.current!.token?.accessToken).toBe("at2");
      expect(hook.current!.token?.refreshToken).toBe("rt2");
    },
  );

  fnTest(
    ["M04.F03.I02"],
    "失败落 errorMessage 不 throw——token 端点 403 → 返回 false + error「请求失败（HTTP 403）」+ phase failed",
    async () => {
      const { hook } = await authorized();
      seams.oauth.oAuthToken.mockRejectedValue(
        new ResponseError(new Response(null, { status: 403 })),
      );

      const out = await call(() => hook.current!.exchangeCode());
      expect(out.value).toBe(false);
      expect(hook.current!.error).toBe("请求失败（HTTP 403）");
      expect(hook.current!.phase).toBe("failed");
    },
  );

  // 工程设施测试，不挂业务功能 ID（fn.ts 纪律）
  it("busy 期再入守卫——authorize 卡在 pending seam 时 exchangeCode 立即 false 且 seam 未被调（可控 resolve 收尾防悬挂）", async () => {
    let resolveAuthorize!: (v: { code: string; state: string }) => void;
    seams.oauth.oAuthAuthorize.mockImplementation(
      () =>
        new Promise<{ code: string; state: string }>((res) => {
          resolveAuthorize = res;
        }),
    );
    const { hook } = mount();

    let authorizeOut: boolean | undefined;
    let busyOut: boolean | undefined;
    await act(async () => {
      // authorize 同步段（busyRef=true + 发请求）先跑，卡在 pending promise
      const pendingAuthorize = hook.current!.authorize();
      busyOut = await hook.current!.exchangeCode();
      // 收尾：echo resolve 放行卡住的 authorize，避免悬挂
      const sent = seams.oauth.oAuthAuthorize.mock.calls[0]![0].authorizeCodeRequest;
      resolveAuthorize({ code: "ac-late", state: sent.state });
      authorizeOut = await pendingAuthorize;
    });

    expect(busyOut).toBe(false);
    expect(seams.oauth.oAuthToken).not.toHaveBeenCalled();
    expect(authorizeOut).toBe(true);
    expect(hook.current!.code).toBe("ac-late");
  });

  it("无缝未注时 defaultSeams 走 currentConfig()，缺失 throw（照 use-admin-clients 形状 fail-fast）", async () => {
    const { hook } = renderUseOAuth("saas-console"); // 不注 seams
    const out = await call(() => hook.current!.authorize());
    expect(out.ok).toBe(false);
    expect((out.value as Error).message).toContain("currentConfig() 缺失");
  });
});

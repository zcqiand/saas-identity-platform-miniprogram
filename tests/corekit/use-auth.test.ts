// @vitest-environment jsdom
/**
 * useAuth 10 条（对照 swift AuthViewModelTests，knife2 Task 2 Step 3）：
 * mock 只在 seams——SessionStore 走内存缝、生成 API 方法注入 fake（反目标：
 * 不 mock 传输语义之外的东西）。React 18.3 act + react-dom/client 渲染探针，
 * jsdom 环境系 vitest 自带依赖，无新增依赖。
 */
import { beforeEach, describe, expect, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const storage = vi.hoisted(() => new Map<string, string>());
const setStorageSync = vi.hoisted(() => vi.fn());
const getStorageSync = vi.hoisted(() => vi.fn());
const removeStorageSync = vi.hoisted(() => vi.fn());

vi.mock("@tarojs/taro", () => ({
  default: { setStorageSync, getStorageSync, removeStorageSync },
}));

import type {
  AuthSeams,
  UseAuthOptions,
  UseAuthResult,
} from "../../src/corekit/use-auth";
import { useAuth } from "../../src/corekit/use-auth";
import { fnTest } from "../fn";
import { SessionStore } from "../../src/corekit/session-store";
import { createInMemoryTokenStore, type TokenStore } from "../../src/corekit/token-store";
import { FetchError, ResponseError } from "../../src/generated/runtime";
import type {
  CurrentUser,
  LoginResponse,
  SwitchTenantResponse,
  SysUser,
  TenantMembership,
} from "../../src/generated";

const user: SysUser = {
  id: "u1",
  username: "alice",
  email: "alice@login.example",
  status: "active",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-02T00:00:00Z"),
};

const membership: TenantMembership = {
  id: "m1",
  userId: "u1",
  tenantId: "t1",
  roleIds: ["r1"],
  status: "active",
  joinedAt: new Date("2026-01-01T00:00:00Z"),
};

const membershipT2: TenantMembership = {
  id: "m2",
  userId: "u1",
  tenantId: "t2",
  roleIds: ["r1"],
  status: "active",
  joinedAt: new Date("2026-01-03T00:00:00Z"),
};

const whoamiUser: CurrentUser = {
  id: "u1",
  email: "alice@whoami.example",
  memberships: [membership],
  currentTenantId: "t1",
};

function loginRes(over: Partial<LoginResponse> = {}): LoginResponse {
  return {
    user,
    availableTenants: [membership],
    userId: "u1",
    clientId: "saas-console",
    currentTenantId: "t1",
    accessToken: "tok",
    refreshToken: "ref",
    ...over,
  };
}

function switchRes(over: Partial<SwitchTenantResponse> = {}): SwitchTenantResponse {
  return {
    accessToken: "tok2",
    refreshToken: "ref2",
    expiresAt: new Date("2026-02-01T00:00:00Z"),
    tenantId: "t2",
    ...over,
  };
}

/** 生成 API fake（seams 缝级 mock，不 mock 传输）。 */
function makeSeams() {
  return {
    auth: { sessionsLogin: vi.fn(), sessionsLogout: vi.fn() },
    me: { meWhoami: vi.fn(), meListMyTenants: vi.fn(), meSwitchTenant: vi.fn() },
  };
}
type SeamsFake = ReturnType<typeof makeSeams>;

function makeStore(tokenStore: TokenStore = createInMemoryTokenStore()): SessionStore {
  return new SessionStore({
    tokenStore,
    apiBaseUrl: "http://localhost:5104",
    clientId: "saas-console",
  });
}

function renderUseAuth(
  clientId: string,
  options?: UseAuthOptions,
): { current?: UseAuthResult } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const ref: { current?: UseAuthResult } = {};
  function Probe() {
    ref.current = useAuth(clientId, options);
    return null;
  }
  act(() => {
    root.render(createElement(Probe));
  });
  return ref;
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

describe("useAuth（动作面随 swift AuthViewModel）", () => {
  let seams: SeamsFake;
  let tokenStore: TokenStore;
  let store: SessionStore;

  beforeEach(() => {
    storage.clear();
    setStorageSync.mockReset();
    getStorageSync.mockReset();
    removeStorageSync.mockReset();
    getStorageSync.mockImplementation((key: string) => storage.get(key) ?? "");
    setStorageSync.mockImplementation((key: string, value: string) => {
      storage.set(key, value);
    });
    removeStorageSync.mockImplementation((key: string) => {
      storage.delete(key);
    });
    seams = makeSeams();
    tokenStore = createInMemoryTokenStore();
    store = makeStore(tokenStore);
  });

  function mount(clientId = "saas-console") {
    return renderUseAuth(clientId, { store, seams: seams as unknown as AuthSeams });
  }

  async function loginOk(hook: { current?: UseAuthResult }) {
    seams.auth.sessionsLogin.mockResolvedValue(loginRes());
    const out = await call(() => hook.current!.login("alice", "dev123456"));
    expect(out.ok).toBe(true);
    seams.auth.sessionsLogin.mockClear();
  }

  fnTest(
    ["M01.F04.I01"],
    "login 成功 → phase ready + user/tenants 就位（请求体带 clientId，ADR-0019）",
    async () => {
      seams.auth.sessionsLogin.mockResolvedValue(loginRes());
      const hook = mount();
      expect(hook.current!.phase).toBe("needsLogin");

      const out = await call(() => hook.current!.login("alice", "dev123456"));
      expect(out.ok).toBe(true);
      expect(seams.auth.sessionsLogin).toHaveBeenCalledTimes(1);
      expect(seams.auth.sessionsLogin).toHaveBeenCalledWith({
        loginRequest: {
          username: "alice",
          password: "dev123456",
          clientId: "saas-console",
        },
      });
      expect(hook.current!.phase).toBe("ready");
      expect(hook.current!.user?.username).toBe("alice");
      expect(hook.current!.tenants).toEqual([membership]);
      expect(hook.current!.currentTenantId).toBe("t1");
      expect(hook.current!.error).toBeUndefined();
    },
  );

  fnTest(
    ["M01.F04.I01"],
    "login 缺 clientId 前置炸（ADR-0019）：请求不发、store 未动、error 落文案",
    async () => {
      const hook = mount("");
      const out = await call(() => hook.current!.login("alice", "dev123456"));
      expect(out.ok).toBe(false);
      expect(seams.auth.sessionsLogin).not.toHaveBeenCalled();
      expect(hook.current!.error).toBe("clientId 未配置，请先完成配置");
      expect(hook.current!.phase).toBe("needsLogin");
      expect(tokenStore.getToken()).toBeUndefined();
      expect(hook.current!.user).toBeUndefined();
    },
  );

  fnTest(
    ["M01.F04.I01"],
    "login 失败（401）→ phase needsLogin + error=「请求失败（HTTP 401）」+ store 未动",
    async () => {
      seams.auth.sessionsLogin.mockRejectedValue(
        new ResponseError(new Response(null, { status: 401 })),
      );
      const hook = mount();
      const out = await call(() => hook.current!.login("alice", "wrong"));
      expect(out.ok).toBe(false);
      expect(hook.current!.phase).toBe("needsLogin");
      expect(hook.current!.error).toBe("请求失败（HTTP 401）");
      expect(tokenStore.getToken()).toBeUndefined();
      expect(tokenStore.getRefreshToken()).toBeUndefined();
      expect(hook.current!.user).toBeUndefined();
      expect(hook.current!.tenants).toEqual([]);
    },
  );

  fnTest(
    ["M01.F04.I01"],
    "login 传输层失败（FetchError 带 cause）→ error 露出底层 errMsg（knife2 T5 诊断钉：appservice 全局量缺口定案依据）",
    async () => {
      seams.auth.sessionsLogin.mockRejectedValue(
        new FetchError(new Error("request:fail socket time out")),
      );
      const hook = mount();
      const out = await call(() => hook.current!.login("alice", "dev123456"));
      expect(out.ok).toBe(false);
      expect(hook.current!.error).toContain("request:fail socket time out");
      expect(hook.current!.phase).toBe("needsLogin");
    },
  );

  fnTest(
    ["M01.F01.I01"],
    "whoami 成功 → user.email 更新（D6：username 快照、email whoami）",
    async () => {
      const hook = mount();
      await loginOk(hook);
      expect(hook.current!.user?.email).toBe("alice@login.example");

      seams.me.meWhoami.mockResolvedValue(whoamiUser);
      const out = await call(() => hook.current!.whoami());
      expect(out.ok).toBe(true);
      expect(hook.current!.user?.email).toBe("alice@whoami.example");
      expect(hook.current!.user?.username).toBe("alice");
    },
  );

  fnTest(
    ["M01.F01.I01"],
    "whoami 成功 → currentTenantId 吸收 whoami 返回值（刀3 遗留 minor 收口）",
    async () => {
      const hook = mount();
      await loginOk(hook);
      // 基准：登录快照落 t1
      expect(hook.current!.currentTenantId).toBe("t1");

      // whoami 返回带不同租户上下文 → hook 以 whoami 为真值覆盖快照
      seams.me.meWhoami.mockResolvedValue({ ...whoamiUser, currentTenantId: "t9" });
      const out = await call(() => hook.current!.whoami());
      expect(out.ok).toBe(true);
      expect(hook.current!.currentTenantId).toBe("t9");
    },
  );

  fnTest(
    ["M01.F01.I01"],
    "whoami 失败 → user 保持 + error 落文案（不兜底清空）",
    async () => {
      const hook = mount();
      await loginOk(hook);

      seams.me.meWhoami.mockRejectedValue(
        new ResponseError(new Response(null, { status: 500 })),
      );
      const out = await call(() => hook.current!.whoami());
      expect(out.ok).toBe(false);
      expect(hook.current!.error).toBe("请求失败（HTTP 500）");
      expect(hook.current!.user?.email).toBe("alice@login.example");
      expect(hook.current!.phase).toBe("ready");
    },
  );

  fnTest(
    ["M01.F03.I02"],
    "switchTenant 成功 → 换发 token + currentTenantId 更新 + 重拉 whoami",
    async () => {
      const hook = mount();
      await loginOk(hook);
      seams.me.meSwitchTenant.mockResolvedValue(switchRes());
      // 切到 t2 后 whoami 反映新上下文（T12 吸收语义：whoami 成功即覆盖）
      seams.me.meWhoami.mockResolvedValue({ ...whoamiUser, currentTenantId: "t2" });

      const out = await call(() => hook.current!.switchTenant("t2"));
      expect(out.ok).toBe(true);
      expect(seams.me.meSwitchTenant).toHaveBeenCalledWith({ tenantId: "t2" });
      expect(tokenStore.getToken()).toBe("tok2");
      expect(hook.current!.currentTenantId).toBe("t2");
      expect(hook.current!.phase).toBe("ready");
      expect(seams.me.meWhoami).toHaveBeenCalledTimes(1);
    },
  );

  fnTest(
    ["M01.F03.I02"],
    "switchTenant 失败 → 保旧会话（token/currentTenantId 原样）+ error 可重试",
    async () => {
      const hook = mount();
      await loginOk(hook);
      seams.me.meSwitchTenant.mockRejectedValue(
        new ResponseError(new Response(null, { status: 403 })),
      );

      const out = await call(() => hook.current!.switchTenant("t2"));
      expect(out.ok).toBe(false);
      expect(hook.current!.error).toBe("请求失败（HTTP 403）");
      expect(tokenStore.getToken()).toBe("tok");
      expect(hook.current!.currentTenantId).toBe("t1");
      expect(hook.current!.phase).toBe("ready");
    },
  );

  fnTest(
    ["M01.F03.I01"],
    "listTenants 成功真值覆盖；失败返 undefined（与空数组区分）+ 旧列表保留",
    async () => {
      const hook = mount();
      await loginOk(hook);

      seams.me.meListMyTenants.mockResolvedValue([membershipT2]);
      const okOut = await call(() => hook.current!.listTenants());
      expect(okOut.value).toEqual([membershipT2]);
      expect(hook.current!.tenants).toEqual([membershipT2]);

      seams.me.meListMyTenants.mockRejectedValue(
        new ResponseError(new Response(null, { status: 500 })),
      );
      const failOut = await call(() => hook.current!.listTenants());
      expect(failOut.value).toBeUndefined();
      expect(hook.current!.tenants).toEqual([membershipT2]);
      expect(hook.current!.error).toBe("请求失败（HTTP 500）");
    },
  );

  fnTest(
    ["M01.F04.I06"],
    "logout 未登录 → 不发服务端请求（守卫）+ 本地清理强制回 needsLogin",
    async () => {
      const hook = mount();
      const out = await call(() => hook.current!.logout());
      expect(out.ok).toBe(true);
      expect(seams.auth.sessionsLogout).not.toHaveBeenCalled();
      expect(hook.current!.phase).toBe("needsLogin");
      expect(tokenStore.getToken()).toBeUndefined();
      expect(hook.current!.user).toBeUndefined();
      expect(hook.current!.tenants).toEqual([]);
    },
  );

  fnTest(
    ["M01.F04.I06"],
    "logout 已登录 → 先服务端（尽力而为）再本地清理（服务端炸不拦清理）",
    async () => {
      const hook = mount();
      await loginOk(hook);
      tokenStore.setToken("tok");
      seams.auth.sessionsLogout.mockRejectedValue(new Error("network down"));

      const out = await call(() => hook.current!.logout());
      expect(out.ok).toBe(true);
      expect(seams.auth.sessionsLogout).toHaveBeenCalledTimes(1);
      expect(hook.current!.phase).toBe("needsLogin");
      expect(tokenStore.getToken()).toBeUndefined();
      expect(storage.has("corekit.session")).toBe(false);
      expect(hook.current!.user).toBeUndefined();
    },
  );
});

// @vitest-environment jsdom
/**
 * useAdminClients 15 条（M04.F01.I01-I06 + M04.F02.I01，knife3 Task 10 Step 1）：
 * mock 只在 seams——生成 AdminClientsApi/ClientsApi 方法面注入 fake（反目标：不
 * mock 传输语义之外的东西）。React 18.3 act + react-dom/client 渲染探针，形状照
 * use-admin-tenants.test.ts；hook 本体不触 Taro，无需 @tarojs/taro mock。
 *
 * 本 hook 是 platform-admin 面：非 tenant 作用域，无 store/session 选项（与
 * use-members/use-roles/use-tenant-applications 不同形），因此没有缺租户
 * fail-fast 测试——工程测试只有 defaultSeams 配置缺失这一条。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import type {
  AdminClientsSeams,
  CreateOAuthClientRequest,
  OAuthClient,
  OAuthClientPublicInfo,
  UpdateOAuthClientRequest,
} from "../../src/corekit/use-admin-clients";
import { useAdminClients } from "../../src/corekit/use-admin-clients";
import { fnTest } from "../fn";
import { ResponseError } from "../../src/generated/runtime";
import type { AdminClientsListClients200Response } from "../../src/generated";

function client(over: Partial<OAuthClient> = {}): OAuthClient {
  return {
    id: "c1-uuid",
    clientId: "web-app",
    clientName: "Web App",
    grantTypes: "authorization_code,refresh_token",
    redirectUris: "https://web.example/callback",
    scopes: "openid,profile",
    accessTokenValidity: 3600,
    refreshTokenValidity: 86400,
    autoApprove: false,
    status: 1,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...over,
  };
}

function listRes(items: OAuthClient[]): AdminClientsListClients200Response {
  return { items, page: 1, pageSize: 20, total: items.length };
}

/** 生成 API fake（seams 缝级 mock，不 mock 传输）。 */
function makeSeams() {
  return {
    clients: {
      adminClientsListClients: vi.fn(),
      adminClientsGetClient: vi.fn(),
      adminClientsCreateClient: vi.fn(),
      adminClientsUpdateClient: vi.fn(),
      adminClientsDeleteClient: vi.fn(),
      adminClientsSetClientStatus: vi.fn(),
    },
    publicClients: {
      clientsGetClient: vi.fn(),
    },
  };
}
type SeamsFake = ReturnType<typeof makeSeams>;

function renderUseAdminClients(options?: { seams?: AdminClientsSeams }): {
  current?: ReturnType<typeof useAdminClients>;
} {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const ref: { current?: ReturnType<typeof useAdminClients> } = {};
  function Probe() {
    ref.current = useAdminClients(options);
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

describe("useAdminClients（admin 应用面，knife3 T10）", () => {
  let seams: SeamsFake;

  beforeEach(() => {
    seams = makeSeams();
  });

  function mount() {
    return renderUseAdminClients({ seams: seams as unknown as AdminClientsSeams });
  }

  /** 先 load 成功铺底，返回挂载好的 hook。 */
  async function loaded(items: OAuthClient[] = [client()]) {
    seams.clients.adminClientsListClients.mockResolvedValue(listRes(items));
    const hook = mount();
    const out = await call(() => hook.current!.load());
    expect(out.value).toBe(true);
    seams.clients.adminClientsListClients.mockClear();
    return { hook, items };
  }

  fnTest(
    ["M04.F01.I01"],
    "load 成功 → 不传分页全量请求，200 响应 items 解包落 state，返回 true、phase 回 idle",
    async () => {
      const rows = [
        client(),
        client({ id: "c2-uuid", clientId: "mini-app", clientName: "Mini App" }),
      ];
      seams.clients.adminClientsListClients.mockResolvedValue(listRes(rows));
      const hook = mount();
      expect(hook.current!.phase).toBe("idle");
      expect(hook.current!.clients).toEqual([]);

      const out = await call(() => hook.current!.load());
      expect(out.value).toBe(true);
      // 全量：不传 page/pageSize（随 swift）
      expect(seams.clients.adminClientsListClients).toHaveBeenCalledWith();
      expect(hook.current!.clients).toEqual(rows);
      expect(hook.current!.phase).toBe("idle");
      expect(hook.current!.error).toBeUndefined();
    },
  );

  fnTest(
    ["M04.F01.I01"],
    "load 失败（seams reject 500）→ 返回 false + error 落 errorMessage 文案 + phase failed + 旧列表保留",
    async () => {
      const { hook, items } = await loaded();

      seams.clients.adminClientsListClients.mockRejectedValue(
        new ResponseError(new Response(null, { status: 500 })),
      );
      const out = await call(() => hook.current!.load());
      expect(out.value).toBe(false);
      expect(hook.current!.clients).toEqual(items);
      expect(hook.current!.error).toBe("请求失败（HTTP 500）");
      expect(hook.current!.phase).toBe("failed");
    },
  );

  fnTest(
    ["M04.F01.I02"],
    "create 成功 → 捕获体原样透传（grantTypes 等全部由页面传，hook 不兜底默认值）+ 新 client 原位追加且不再调 listClients",
    async () => {
      const { hook, items } = await loaded();
      const created = client({
        id: "c9-uuid",
        clientId: "new-app",
        clientName: "New App",
      });
      seams.clients.adminClientsCreateClient.mockResolvedValue(created);

      // grantTypes 明文传入：hook 不注入 authorization_code 默认（页面表单义务）
      const request: CreateOAuthClientRequest = {
        clientId: "new-app",
        clientName: "New App",
        clientSecret: "s3cret",
        grantTypes: "authorization_code",
        redirectUris: "https://new.example/cb",
        scopes: "openid",
      };
      const out = await call(() => hook.current!.create(request));
      expect(out.value).toBe(true);
      expect(seams.clients.adminClientsCreateClient).toHaveBeenCalledTimes(1);
      expect(seams.clients.adminClientsCreateClient).toHaveBeenCalledWith({
        createOAuthClientRequest: request,
      });
      expect(seams.clients.adminClientsListClients).not.toHaveBeenCalled();
      expect(hook.current!.clients).toEqual([...items, created]);
      expect(hook.current!.phase).toBe("idle");
    },
  );

  fnTest(
    ["M04.F01.I02"],
    "create clientId 重复（409）→ 返回 false + error「请求失败（HTTP 409）」+ 列表不动",
    async () => {
      const { hook, items } = await loaded();
      seams.clients.adminClientsCreateClient.mockRejectedValue(
        new ResponseError(new Response(null, { status: 409 })),
      );

      const out = await call(() =>
        hook.current!.create({
          clientId: "web-app",
          clientName: "Dup",
          clientSecret: "x",
          grantTypes: "authorization_code",
          redirectUris: "https://dup.example/cb",
        }),
      );
      expect(out.value).toBe(false);
      expect(hook.current!.error).toBe("请求失败（HTTP 409）");
      expect(hook.current!.clients).toEqual(items);
      expect(hook.current!.phase).toBe("failed");
    },
  );

  fnTest(
    ["M04.F01.I03"],
    "get 成功 → 返回 OAuthClient 本体（请求带 { clientId }；契约密钥仅指纹，无 secret 字段期待）",
    async () => {
      const { hook } = await loaded();
      const found = client({ clientId: "mini-app", clientName: "Mini App" });
      seams.clients.adminClientsGetClient.mockResolvedValue(found);

      const out = await call(() => hook.current!.get("mini-app"));
      expect(out.value).toEqual(found);
      expect(seams.clients.adminClientsGetClient).toHaveBeenCalledWith({
        clientId: "mini-app",
      });
      // 契约口径：I03 密钥仅回指纹——生成的 OAuthClient 类型根本没有 secret
      // 字段（tsc 层面即证明），展示层无明文密钥可期待
    },
  );

  fnTest(
    ["M04.F01.I03"],
    "get 失败（404）→ 返回 undefined（不 reject）+ error 落文案",
    async () => {
      const { hook } = await loaded();
      seams.clients.adminClientsGetClient.mockRejectedValue(
        new ResponseError(new Response(null, { status: 404 })),
      );

      const out = await call(() => hook.current!.get("missing"));
      expect(out.value).toBeUndefined();
      expect(hook.current!.error).toBe("请求失败（HTTP 404）");
    },
  );

  fnTest(
    ["M04.F01.I04"],
    "update 成功 → 捕获体 partial 原样透传（未传键不注入）+ 列表按 clientId 原位替换（其余项不动）",
    async () => {
      const rows = [
        client(),
        client({ id: "c2-uuid", clientId: "mini-app", clientName: "Mini App" }),
      ];
      const { hook } = await loaded(rows);
      const updated = client({
        clientId: "mini-app",
        clientName: "Mini App v2",
        status: 0,
      });
      seams.clients.adminClientsUpdateClient.mockResolvedValue(updated);

      // partial：只传 clientName 一个键，hook 不补任何默认
      const request: UpdateOAuthClientRequest = { clientName: "Mini App v2" };
      const out = await call(() => hook.current!.update("mini-app", request));
      expect(out.value).toBe(true);
      expect(seams.clients.adminClientsUpdateClient).toHaveBeenCalledWith({
        clientId: "mini-app",
        updateOAuthClientRequest: request,
      });
      expect(hook.current!.clients).toEqual([rows[0], updated]);
      expect(hook.current!.phase).toBe("idle");
    },
  );

  fnTest(["M04.F01.I04"], "update 失败（500）→ 返回 false + 列表原样不动", async () => {
    const rows = [
      client(),
      client({ id: "c2-uuid", clientId: "mini-app", clientName: "Mini App" }),
    ];
    const { hook } = await loaded(rows);
    seams.clients.adminClientsUpdateClient.mockRejectedValue(
      new ResponseError(new Response(null, { status: 500 })),
    );

    const out = await call(() => hook.current!.update("mini-app", { clientName: "X" }));
    expect(out.value).toBe(false);
    expect(hook.current!.clients).toEqual(rows);
    expect(hook.current!.phase).toBe("failed");
  });

  fnTest(
    ["M04.F01.I05"],
    "remove 成功 → 捕获 clientId 原样（字符串寻址非 UUID）+ 按 clientId 原位移除（delete 是保留字，动作名 remove）",
    async () => {
      const rows = [
        client(),
        client({ id: "c2-uuid", clientId: "mini-app", clientName: "Mini App" }),
      ];
      const { hook } = await loaded(rows);
      seams.clients.adminClientsDeleteClient.mockResolvedValue(undefined);

      const out = await call(() => hook.current!.remove("web-app"));
      expect(out.value).toBe(true);
      expect(seams.clients.adminClientsDeleteClient).toHaveBeenCalledWith({
        clientId: "web-app",
      });
      expect(hook.current!.clients).toEqual([rows[1]]);
      expect(hook.current!.phase).toBe("idle");
    },
  );

  fnTest(["M04.F01.I05"], "remove 失败（500）→ 返回 false + 列表原样不动", async () => {
    const rows = [client()];
    const { hook } = await loaded(rows);
    seams.clients.adminClientsDeleteClient.mockRejectedValue(
      new ResponseError(new Response(null, { status: 500 })),
    );

    const out = await call(() => hook.current!.remove("web-app"));
    expect(out.value).toBe(false);
    expect(hook.current!.clients).toEqual(rows);
    expect(hook.current!.phase).toBe("failed");
  });

  fnTest(
    ["M04.F02.I01"],
    "setStatus 成功 → 捕获 status Int 原样（1=启用 0=停用，hook 不换算）+ 按 clientId 原位替换",
    async () => {
      const rows = [
        client(),
        client({ id: "c2-uuid", clientId: "mini-app", clientName: "Mini App" }),
      ];
      const { hook } = await loaded(rows);
      const toggled = client({ clientId: "mini-app", status: 0 });
      seams.clients.adminClientsSetClientStatus.mockResolvedValue(toggled);

      const out = await call(() => hook.current!.setStatus("mini-app", 0));
      expect(out.value).toBe(true);
      expect(seams.clients.adminClientsSetClientStatus).toHaveBeenCalledWith({
        clientId: "mini-app",
        adminClientsSetClientStatusRequest: { status: 0 },
      });
      expect(hook.current!.clients).toEqual([rows[0], toggled]);
      expect(hook.current!.phase).toBe("idle");
    },
  );

  fnTest(
    ["M04.F02.I01"],
    "setStatus 失败（500）→ 返回 false + 列表原样不动",
    async () => {
      const rows = [client()];
      const { hook } = await loaded(rows);
      seams.clients.adminClientsSetClientStatus.mockRejectedValue(
        new ResponseError(new Response(null, { status: 500 })),
      );

      const out = await call(() => hook.current!.setStatus("web-app", 0));
      expect(out.value).toBe(false);
      expect(hook.current!.clients).toEqual(rows);
      expect(hook.current!.phase).toBe("failed");
    },
  );

  fnTest(
    ["M04.F01.I06"],
    "publicInfo 成功 → 走 publicClients 匿名端点返回公共三元组（请求带 { clientId }）",
    async () => {
      const info: OAuthClientPublicInfo = {
        clientId: "web-app",
        clientName: "Web App",
        status: 1,
      };
      seams.publicClients.clientsGetClient.mockResolvedValue(info);

      const hook = mount();
      const out = await call(() => hook.current!.publicInfo("web-app"));
      expect(out.value).toEqual(info);
      expect(seams.publicClients.clientsGetClient).toHaveBeenCalledWith({
        clientId: "web-app",
      });
    },
  );

  fnTest(
    ["M04.F01.I06"],
    "publicInfo 失败（404）→ 返回 undefined（不 reject）+ error 落文案",
    async () => {
      seams.publicClients.clientsGetClient.mockRejectedValue(
        new ResponseError(new Response(null, { status: 404 })),
      );

      const hook = mount();
      const out = await call(() => hook.current!.publicInfo("missing"));
      expect(out.value).toBeUndefined();
      expect(hook.current!.error).toBe("请求失败（HTTP 404）");
    },
  );

  // 工程设施测试，不挂业务功能 ID（fn.ts 纪律）
  it("无缝未注时 defaultSeams 走 currentConfig()，缺失 throw（照 use-auth 形状 fail-fast）", async () => {
    const hook = renderUseAdminClients(); // 不注 seams
    const out = await call(() => hook.current!.load());
    expect(out.ok).toBe(false);
    expect((out.value as Error).message).toContain("currentConfig() 缺失");
  });
});

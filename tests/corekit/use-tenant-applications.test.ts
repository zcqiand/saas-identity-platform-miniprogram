// @vitest-environment jsdom
/**
 * useTenantApplications 8 条（M00.F05.I01-I04，knife3 Task 8 Step 1）：
 * mock 只在 seams——生成 TenantApplicationsApi 方法面注入 fake（反目标：
 * 不 mock 传输语义之外的东西）；SessionStore 走内存缝（token store 注入 +
 * adoptLogin 入账 currentTenantId）。React 18.3 act + react-dom/client 渲染
 * 探针，形状照 use-members.test.ts（T4 准绳）；SessionStore 构造会触 Taro
 * storage，故 @tarojs/taro 照 use-auth.test.ts 垫 mock（hook 本体不触 Taro）。
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

import type { TenantApplication } from "../../src/corekit/use-tenant-applications";
import { useTenantApplications } from "../../src/corekit/use-tenant-applications";
import { fnTest } from "../fn";
import { ResponseError } from "../../src/generated/runtime";
import type { TenantApplicationsSeams } from "../../src/corekit/use-tenant-applications";
import { SessionStore } from "../../src/corekit/session-store";
import { createInMemoryTokenStore } from "../../src/corekit/token-store";

const D0 = new Date("2026-01-01T00:00:00Z");
const D1 = new Date("2027-12-31T23:59:59Z");

function appRow(over: Partial<TenantApplication> = {}): TenantApplication {
  return {
    id: "app-1",
    tenantId: "t1",
    clientId: "saas-console",
    status: 1,
    expireTime: D0,
    createdAt: D0,
    ...over,
  };
}

function listRes<T>(items: T[]): {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
} {
  return { items, page: 1, pageSize: 20, total: items.length };
}

/** 生成 API fake（seams 缝级 mock，不 mock 传输）。 */
function makeSeams() {
  return {
    apps: {
      tenantApplicationsListTenantApplications: vi.fn(),
      tenantApplicationsSubscribeTenantApplication: vi.fn(),
      tenantApplicationsUpdateTenantApplication: vi.fn(),
      tenantApplicationsRemoveTenantApplication: vi.fn(),
    },
  };
}
type SeamsFake = ReturnType<typeof makeSeams>;

/** 内存缝 SessionStore；withTenant=true 时经 adoptLogin 入账 currentTenantId="t1"。
 * apiBaseUrl 用空串 thunk：reBootstrap 对空 baseURL 早退，本文件模块注册表里
 * 不落全局 config（defaultSeams fail-fast 测试依赖 currentConfig() 保持缺失）。 */
function makeStore(withTenant = true): SessionStore {
  const store = new SessionStore({
    tokenStore: createInMemoryTokenStore(),
    apiBaseUrl: () => "",
    clientId: "saas-console",
  });
  if (withTenant) {
    store.adoptLogin({
      user: {
        id: "boss",
        username: "boss",
        email: "boss@example.com",
        status: "active",
        createdAt: D0,
        updatedAt: D0,
      },
      availableTenants: [],
      userId: "boss",
      clientId: "saas-console",
      currentTenantId: "t1",
      accessToken: "tok",
      refreshToken: "ref",
    });
  }
  return store;
}

function renderUseTenantApplications(options?: {
  store?: SessionStore;
  seams?: TenantApplicationsSeams;
}): { current?: ReturnType<typeof useTenantApplications> } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const ref: { current?: ReturnType<typeof useTenantApplications> } = {};
  function Probe() {
    ref.current = useTenantApplications(options);
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

describe("useTenantApplications（租户订阅应用面，knife3 T8）", () => {
  let seams: SeamsFake;

  beforeEach(() => {
    seams = makeSeams();
  });

  function mount(store: SessionStore = makeStore()) {
    return renderUseTenantApplications({
      store,
      seams: seams as unknown as TenantApplicationsSeams,
    });
  }

  /** 先 load 成功铺底，返回挂载好的 hook。 */
  async function loaded(rows: TenantApplication[] = [appRow()]) {
    seams.apps.tenantApplicationsListTenantApplications.mockResolvedValue(listRes(rows));
    const hook = mount();
    const out = await call(() => hook.current!.load());
    expect(out.value).toBe(true);
    seams.apps.tenantApplicationsListTenantApplications.mockClear();
    return { hook, rows };
  }

  fnTest(
    ["M00.F05.I01"],
    "load 成功 → applications 落 state，返回 true、phase 回 idle",
    async () => {
      const rows = [
        appRow(),
        appRow({ id: "app-2", clientId: "lab-management", status: 0 }),
      ];
      seams.apps.tenantApplicationsListTenantApplications.mockResolvedValue(
        listRes(rows),
      );
      const hook = mount();
      expect(hook.current!.applications).toEqual([]);

      const out = await call(() => hook.current!.load());
      expect(out.value).toBe(true);
      expect(hook.current!.applications).toEqual(rows);
      expect(hook.current!.phase).toBe("idle");
      expect(hook.current!.error).toBeUndefined();
      // 当前租户快照上下文；分页参数不传（后端默认）
      expect(seams.apps.tenantApplicationsListTenantApplications).toHaveBeenCalledTimes(
        1,
      );
      expect(seams.apps.tenantApplicationsListTenantApplications).toHaveBeenCalledWith({
        tenantId: "t1",
      });
    },
  );

  fnTest(
    ["M00.F05.I01"],
    "load 时 currentTenantId 缺失 → 不发请求 + error=「未选择租户，无法加载订阅应用」+ phase failed",
    async () => {
      const hook = mount(makeStore(false));
      const out = await call(() => hook.current!.load());
      expect(out.value).toBe(false);
      expect(seams.apps.tenantApplicationsListTenantApplications).not.toHaveBeenCalled();
      expect(hook.current!.error).toBe("未选择租户，无法加载订阅应用");
      expect(hook.current!.phase).toBe("failed");
    },
  );

  fnTest(
    ["M00.F05.I02"],
    "subscribe 成功 → 原位追加；捕获体 clientId + expireTime 未传键缺席",
    async () => {
      const { hook, rows } = await loaded();
      const created = appRow({ id: "app-9", clientId: "lab-management" });
      seams.apps.tenantApplicationsSubscribeTenantApplication.mockResolvedValue(created);

      const out = await call(() => hook.current!.subscribe("lab-management"));
      expect(out.value).toBe(true);
      expect(
        seams.apps.tenantApplicationsSubscribeTenantApplication,
      ).toHaveBeenCalledTimes(1);
      const arg =
        seams.apps.tenantApplicationsSubscribeTenantApplication.mock.calls[0]![0];
      expect(arg.tenantId).toBe("t1");
      expect(arg.subscribeTenantApplicationRequest).toEqual({
        clientId: "lab-management",
      });
      expect("expireTime" in arg.subscribeTenantApplicationRequest).toBe(false);
      expect(hook.current!.applications).toEqual([...rows, created]);
      expect(hook.current!.phase).toBe("idle");

      // 带 expireTime：原样进体（Date 形态直传，生成物 runtime 管序列化）
      await call(() => hook.current!.subscribe("lab-management", D1));
      const arg2 =
        seams.apps.tenantApplicationsSubscribeTenantApplication.mock.calls[1]![0];
      expect(arg2.subscribeTenantApplicationRequest).toEqual({
        clientId: "lab-management",
        expireTime: D1,
      });
    },
  );

  fnTest(
    ["M00.F05.I02"],
    "subscribe 重复订阅 400 → 红字如实呈现（errorMessage），列表不动",
    async () => {
      const { hook, rows } = await loaded();
      seams.apps.tenantApplicationsSubscribeTenantApplication.mockRejectedValue(
        new ResponseError(new Response(null, { status: 400 })),
      );

      const out = await call(() => hook.current!.subscribe("saas-console"));
      expect(out.value).toBe(false);
      expect(hook.current!.applications).toEqual(rows);
      expect(hook.current!.error).toBe("请求失败（HTTP 400）");
      expect(hook.current!.phase).toBe("failed");
    },
  );

  fnTest(
    ["M00.F05.I03"],
    "update 捕获体 partial（status/expireTime undefined 不出现）+ 原位替换",
    async () => {
      const { hook, rows } = await loaded();
      const updated = appRow({ status: 0 });
      seams.apps.tenantApplicationsUpdateTenantApplication.mockResolvedValue(updated);

      const out = await call(() => hook.current!.update("saas-console", 0));
      expect(out.value).toBe(true);
      const arg = seams.apps.tenantApplicationsUpdateTenantApplication.mock.calls[0]![0];
      expect(arg.tenantId).toBe("t1");
      expect(arg.clientId).toBe("saas-console");
      expect(arg.updateTenantApplicationRequest).toEqual({ status: 0 });
      expect("expireTime" in arg.updateTenantApplicationRequest).toBe(false);
      // 按 clientId 原位替换
      expect(hook.current!.applications).toEqual(
        rows.map((r) => (r.clientId === "saas-console" ? updated : r)),
      );
      expect(hook.current!.phase).toBe("idle");

      // 只改到期时间：status 键缺席（partial 语义，不猜默认；expireTime 不传=不改，CT I76 实证）
      const extended = appRow({ expireTime: D1 });
      seams.apps.tenantApplicationsUpdateTenantApplication.mockResolvedValue(extended);
      await call(() => hook.current!.update("saas-console", undefined, D1));
      const arg2 = seams.apps.tenantApplicationsUpdateTenantApplication.mock.calls[1]![0];
      expect("status" in arg2.updateTenantApplicationRequest).toBe(false);
      expect(arg2.updateTenantApplicationRequest.expireTime).toEqual(D1);
      expect(hook.current!.applications).toEqual([extended]);
    },
  );

  fnTest(
    ["M00.F05.I04"],
    "remove 成功 → clientId 字符串寻址原样（非 UUID）+ 本地移除",
    async () => {
      const rows = [appRow(), appRow({ id: "app-2", clientId: "lab-management" })];
      const { hook } = await loaded(rows);
      seams.apps.tenantApplicationsRemoveTenantApplication.mockResolvedValue(undefined);

      const out = await call(() => hook.current!.remove("lab-management"));
      expect(out.value).toBe(true);
      expect(seams.apps.tenantApplicationsRemoveTenantApplication).toHaveBeenCalledWith({
        tenantId: "t1",
        clientId: "lab-management",
      });
      expect(hook.current!.applications).toEqual([rows[0]]);
      expect(hook.current!.phase).toBe("idle");
    },
  );

  fnTest(
    ["M00.F05.I04"],
    "remove 未知 clientId 404 → 红字如实呈现，列表不动",
    async () => {
      const { hook, rows } = await loaded();
      seams.apps.tenantApplicationsRemoveTenantApplication.mockRejectedValue(
        new ResponseError(new Response(null, { status: 404 })),
      );

      const out = await call(() => hook.current!.remove("no-such-app"));
      expect(out.value).toBe(false);
      expect(hook.current!.applications).toEqual(rows);
      expect(hook.current!.error).toBe("请求失败（HTTP 404）");
      expect(hook.current!.phase).toBe("failed");
    },
  );

  // 工程设施测试，不挂业务功能 ID（fn.ts 纪律）
  it("无缝未注时 defaultSeams 走 currentConfig()，缺失 throw（照 T2/T4 形状 fail-fast）", async () => {
    const hook = renderUseTenantApplications({ store: makeStore() }); // 有租户上下文，不注 seams
    const out = await call(() => hook.current!.load());
    expect(out.ok).toBe(false);
    expect((out.value as Error).message).toContain("currentConfig() 缺失");
  });
});

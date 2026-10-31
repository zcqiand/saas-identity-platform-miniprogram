// @vitest-environment jsdom
/**
 * useAdminTenants 11 条（M00.F01.I01-I05，knife3 Task 2 Step 1）：
 * mock 只在 seams——生成 AdminTenantsApi 方法面注入 fake（反目标：不 mock 传输
 * 语义之外的东西）。React 18.3 act + react-dom/client 渲染探针，形状照
 * use-auth.test.ts；hook 本体不触 Taro，无需 @tarojs/taro mock。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import type {
  AdminTenantsSeams,
  CreateTenantRequest,
  Tenant,
  UpdateTenantRequest,
} from "../../src/corekit/use-admin-tenants";
import { useAdminTenants } from "../../src/corekit/use-admin-tenants";
import { fnTest } from "../fn";
import { ResponseError } from "../../src/generated/runtime";
import type { AdminTenantsListTenants200Response } from "../../src/generated";

function tenant(over: Partial<Tenant> = {}): Tenant {
  return {
    id: "t1",
    tenantKey: "acme",
    name: "Acme",
    status: "active",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...over,
  };
}

function listRes(items: Tenant[]): AdminTenantsListTenants200Response {
  return { items, page: 1, pageSize: 20, total: items.length };
}

/** 生成 API fake（seams 缝级 mock，不 mock 传输）。 */
function makeSeams() {
  return {
    adminTenants: {
      adminTenantsListTenants: vi.fn(),
      adminTenantsCreateTenant: vi.fn(),
      adminTenantsGetTenant: vi.fn(),
      adminTenantsUpdateTenant: vi.fn(),
      adminTenantsDeleteTenant: vi.fn(),
    },
  };
}
type SeamsFake = ReturnType<typeof makeSeams>;

function renderUseAdminTenants(options?: { seams?: AdminTenantsSeams }): {
  current?: ReturnType<typeof useAdminTenants>;
} {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const ref: { current?: ReturnType<typeof useAdminTenants> } = {};
  function Probe() {
    ref.current = useAdminTenants(options);
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

describe("useAdminTenants（admin 租户面，knife3 T2）", () => {
  let seams: SeamsFake;

  beforeEach(() => {
    seams = makeSeams();
  });

  function mount() {
    return renderUseAdminTenants({ seams: seams as unknown as AdminTenantsSeams });
  }

  /** 先 load 成功铺底，返回挂载好的 hook。 */
  async function loaded(items: Tenant[] = [tenant()]) {
    seams.adminTenants.adminTenantsListTenants.mockResolvedValue(listRes(items));
    const hook = mount();
    const out = await call(() => hook.current!.load());
    expect(out.value).toBe(true);
    seams.adminTenants.adminTenantsListTenants.mockClear();
    return { hook, items };
  }

  fnTest(
    ["M00.F01.I01"],
    "load 成功 → 200 响应 items 解包落 state，返回 true、phase 回 idle",
    async () => {
      const rows = [tenant(), tenant({ id: "t2", tenantKey: "beta", name: "Beta" })];
      seams.adminTenants.adminTenantsListTenants.mockResolvedValue(listRes(rows));
      const hook = mount();
      expect(hook.current!.phase).toBe("idle");
      expect(hook.current!.tenants).toEqual([]);

      const out = await call(() => hook.current!.load());
      expect(out.value).toBe(true);
      expect(hook.current!.tenants).toEqual(rows);
      expect(hook.current!.phase).toBe("idle");
      expect(hook.current!.error).toBeUndefined();
    },
  );

  fnTest(
    ["M00.F01.I01"],
    "load 失败（seams reject 500）→ 返回 false + error 落 errorMessage 文案 + phase failed + 旧列表保留",
    async () => {
      const { hook, items } = await loaded();

      seams.adminTenants.adminTenantsListTenants.mockRejectedValue(
        new ResponseError(new Response(null, { status: 500 })),
      );
      const out = await call(() => hook.current!.load());
      expect(out.value).toBe(false);
      expect(hook.current!.tenants).toEqual(items);
      expect(hook.current!.error).toBe("请求失败（HTTP 500）");
      expect(hook.current!.phase).toBe("failed");
    },
  );

  fnTest(
    ["M00.F01.I02"],
    "create 成功 → 新租户原位追加且不再调 listTenants（调用次数断言，随 swift 不重拉）",
    async () => {
      const { hook, items } = await loaded();
      const created = tenant({ id: "t9", tenantKey: "gamma", name: "Gamma" });
      seams.adminTenants.adminTenantsCreateTenant.mockResolvedValue(created);

      const request: CreateTenantRequest = { tenantKey: "gamma", name: "Gamma" };
      const out = await call(() => hook.current!.create(request));
      expect(out.value).toBe(true);
      expect(seams.adminTenants.adminTenantsCreateTenant).toHaveBeenCalledTimes(1);
      expect(seams.adminTenants.adminTenantsCreateTenant).toHaveBeenCalledWith({
        createTenantRequest: request,
      });
      expect(seams.adminTenants.adminTenantsListTenants).not.toHaveBeenCalled();
      expect(hook.current!.tenants).toEqual([...items, created]);
      expect(hook.current!.phase).toBe("idle");
    },
  );

  fnTest(
    ["M00.F01.I02"],
    "create tenantKey 重复（409）→ 返回 false + error「请求失败（HTTP 409）」+ 列表不动",
    async () => {
      const { hook, items } = await loaded();
      seams.adminTenants.adminTenantsCreateTenant.mockRejectedValue(
        new ResponseError(new Response(null, { status: 409 })),
      );

      const out = await call(() =>
        hook.current!.create({ tenantKey: "acme", name: "Dup" }),
      );
      expect(out.value).toBe(false);
      expect(hook.current!.error).toBe("请求失败（HTTP 409）");
      expect(hook.current!.tenants).toEqual(items);
      expect(hook.current!.phase).toBe("failed");
    },
  );

  fnTest(["M00.F01.I03"], "get 成功 → 返回 Tenant 本体（请求带 { id }）", async () => {
    const { hook } = await loaded();
    const found = tenant({ id: "t2", tenantKey: "beta", name: "Beta" });
    seams.adminTenants.adminTenantsGetTenant.mockResolvedValue(found);

    const out = await call(() => hook.current!.get("t2"));
    expect(out.value).toEqual(found);
    expect(seams.adminTenants.adminTenantsGetTenant).toHaveBeenCalledWith({ id: "t2" });
  });

  fnTest(
    ["M00.F01.I03"],
    "get 失败（404）→ 返回 undefined（不 reject）+ error 落文案",
    async () => {
      const { hook } = await loaded();
      seams.adminTenants.adminTenantsGetTenant.mockRejectedValue(
        new ResponseError(new Response(null, { status: 404 })),
      );

      const out = await call(() => hook.current!.get("missing"));
      expect(out.value).toBeUndefined();
      expect(hook.current!.error).toBe("请求失败（HTTP 404）");
    },
  );

  fnTest(["M00.F01.I04"], "update 成功 → 列表按 id 原位替换（其余项不动）", async () => {
    const rows = [tenant(), tenant({ id: "t2", tenantKey: "beta", name: "Beta" })];
    const { hook } = await loaded(rows);
    const updated = tenant({
      id: "t2",
      tenantKey: "beta",
      name: "Beta v2",
      status: "suspended",
    });
    seams.adminTenants.adminTenantsUpdateTenant.mockResolvedValue(updated);

    const request: UpdateTenantRequest = { name: "Beta v2", status: "suspended" };
    const out = await call(() => hook.current!.update("t2", request));
    expect(out.value).toBe(true);
    expect(seams.adminTenants.adminTenantsUpdateTenant).toHaveBeenCalledWith({
      id: "t2",
      updateTenantRequest: request,
    });
    expect(hook.current!.tenants).toEqual([rows[0], updated]);
    expect(hook.current!.phase).toBe("idle");
  });

  fnTest(["M00.F01.I04"], "update 失败（500）→ 返回 false + 列表原样不动", async () => {
    const rows = [tenant(), tenant({ id: "t2", tenantKey: "beta", name: "Beta" })];
    const { hook } = await loaded(rows);
    seams.adminTenants.adminTenantsUpdateTenant.mockRejectedValue(
      new ResponseError(new Response(null, { status: 500 })),
    );

    const out = await call(() => hook.current!.update("t2", { name: "X" }));
    expect(out.value).toBe(false);
    expect(hook.current!.tenants).toEqual(rows);
    expect(hook.current!.phase).toBe("failed");
  });

  fnTest(
    ["M00.F01.I05"],
    "remove 成功 → 按 id 原位移除（delete 是保留字，动作名 remove；请求带 { id }）",
    async () => {
      const rows = [tenant(), tenant({ id: "t2", tenantKey: "beta", name: "Beta" })];
      const { hook } = await loaded(rows);
      seams.adminTenants.adminTenantsDeleteTenant.mockResolvedValue(undefined);

      const out = await call(() => hook.current!.remove("t1"));
      expect(out.value).toBe(true);
      expect(seams.adminTenants.adminTenantsDeleteTenant).toHaveBeenCalledWith({
        id: "t1",
      });
      expect(hook.current!.tenants).toEqual([rows[1]]);
      expect(hook.current!.phase).toBe("idle");
    },
  );

  fnTest(["M00.F01.I05"], "remove 失败（500）→ 返回 false + 列表原样不动", async () => {
    const rows = [tenant()];
    const { hook } = await loaded(rows);
    seams.adminTenants.adminTenantsDeleteTenant.mockRejectedValue(
      new ResponseError(new Response(null, { status: 500 })),
    );

    const out = await call(() => hook.current!.remove("t1"));
    expect(out.value).toBe(false);
    expect(hook.current!.tenants).toEqual(rows);
    expect(hook.current!.phase).toBe("failed");
  });

  // 工程设施测试，不挂业务功能 ID（fn.ts 纪律）
  it("无缝未注时 defaultSeams 走 currentConfig()，缺失 throw（照 use-auth 形状 fail-fast）", async () => {
    const hook = renderUseAdminTenants(); // 不注 seams
    const out = await call(() => hook.current!.load());
    expect(out.ok).toBe(false);
    expect((out.value as Error).message).toContain("currentConfig() 缺失");
  });
});

// @vitest-environment jsdom
/**
 * useRoles（M00.F03.I01-I05 + M00.F04.I02-I04，knife3 Task 6 Step 1）：
 * 形状照 use-members.test.ts（T4）。mock 只在 seams——生成 TenantRolesApi/
 * TenantRoleMenusApi/ClientMenusApi 方法面注入 fake；SessionStore 链会触
 * Taro storage，故 @tarojs/taro 照 use-auth.test.ts 垫 mock（hook 本体不触
 * Taro）。store 走内存缝（token store 注入 + adoptLogin 入账 currentTenantId）。
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

import type {
  RoleMenuGrant,
  RolesSeams,
  SysMenu,
  SysRole,
} from "../../src/corekit/use-roles";
import { useRoles } from "../../src/corekit/use-roles";
import { fnTest } from "../fn";
import { ResponseError } from "../../src/generated/runtime";
import { SysMenuType } from "../../src/generated";
import { SessionStore } from "../../src/corekit/session-store";
import { createInMemoryTokenStore } from "../../src/corekit/token-store";

const D0 = new Date("2026-01-01T00:00:00Z");

function roleRow(over: Partial<SysRole> = {}): SysRole {
  return {
    id: "r1",
    tenantId: "t1",
    clientId: "saas-console",
    roleCode: "tenant_admin",
    roleName: "租户管理员",
    isPreset: true,
    status: 1,
    createdAt: D0,
    updatedAt: D0,
    ...over,
  };
}

function menuRow(over: Partial<SysMenu> = {}): SysMenu {
  return {
    id: "m1",
    clientId: "saas-console",
    parentId: "",
    title: "工作台",
    type: SysMenuType.Menu,
    sortOrder: 0,
    status: 1,
    createdAt: D0,
    ...over,
  };
}

function grantRow(over: Partial<RoleMenuGrant> = {}): RoleMenuGrant {
  return {
    roleId: "r1",
    tenantId: "t1",
    menuIds: ["m1", "m2"],
    updatedAt: D0,
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
    roles: {
      tenantRolesListSysRoles: vi.fn(),
      tenantRolesCreateSysRole: vi.fn(),
      tenantRolesGetSysRole: vi.fn(),
      tenantRolesUpdateSysRole: vi.fn(),
      tenantRolesDeleteSysRole: vi.fn(),
    },
    roleMenus: {
      tenantRoleMenusListSysRoleMenus: vi.fn(),
      tenantRoleMenusSetSysRoleMenus: vi.fn(),
      tenantRoleMenusClearSysRoleMenus: vi.fn(),
    },
    clientMenus: {
      clientMenusListSysMenus: vi.fn(),
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

function renderUseRoles(options?: { store?: SessionStore; seams?: RolesSeams }): {
  current?: ReturnType<typeof useRoles>;
} {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const ref: { current?: ReturnType<typeof useRoles> } = {};
  function Probe() {
    ref.current = useRoles(options);
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

describe("useRoles（租户角色 + 角色菜单授权面，knife3 T6）", () => {
  let seams: SeamsFake;

  beforeEach(() => {
    seams = makeSeams();
  });

  function mount(store: SessionStore = makeStore()) {
    return renderUseRoles({ store, seams: seams as unknown as RolesSeams });
  }

  /** 先 load 成功铺底（角色列表 [r1]），返回挂载好的 hook。 */
  async function loaded(rows: SysRole[] = [roleRow()]) {
    seams.roles.tenantRolesListSysRoles.mockResolvedValue(listRes(rows));
    const hook = mount();
    const out = await call(() => hook.current!.load());
    expect(out.value).toBe(true);
    seams.roles.tenantRolesListSysRoles.mockClear();
    return { hook, rows };
  }

  /** 铺底 + loadGrants 成功（grants [m1,m2] + 勾选清单 [m1,m2,m3]）。 */
  async function grantsLoaded() {
    const { hook, rows } = await loaded();
    const g = grantRow();
    const menus = [
      menuRow(),
      menuRow({ id: "m2", title: "成员" }),
      menuRow({ id: "m3", title: "角色" }),
    ];
    seams.roleMenus.tenantRoleMenusListSysRoleMenus.mockResolvedValue(g);
    seams.clientMenus.clientMenusListSysMenus.mockResolvedValue(menus);
    const ok = await call(() => hook.current!.loadGrants("r1", "saas-console"));
    expect(ok.value).toBe(true);
    seams.roleMenus.tenantRoleMenusListSysRoleMenus.mockClear();
    seams.clientMenus.clientMenusListSysMenus.mockClear();
    return { hook, rows, grant0: g, menus };
  }

  fnTest(
    ["M00.F03.I01"],
    "load 成功 → 角色列表落 state，返回 true、phase 回 idle",
    async () => {
      const rows = [
        roleRow(),
        roleRow({ id: "r2", roleCode: "approver", roleName: "审批员" }),
      ];
      seams.roles.tenantRolesListSysRoles.mockResolvedValue(listRes(rows));
      const hook = mount();
      expect(hook.current!.roles).toEqual([]);

      const out = await call(() => hook.current!.load());
      expect(out.value).toBe(true);
      expect(hook.current!.roles).toEqual(rows);
      expect(hook.current!.phase).toBe("idle");
      expect(hook.current!.error).toBeUndefined();
      expect(seams.roles.tenantRolesListSysRoles).toHaveBeenCalledTimes(1);
      expect(seams.roles.tenantRolesListSysRoles).toHaveBeenCalledWith({
        tenantId: "t1",
      });
    },
  );

  fnTest(
    ["M00.F03.I01"],
    "load 时 currentTenantId 缺失 → 不发请求 + error=「未选择租户，无法加载角色」+ phase failed",
    async () => {
      const hook = mount(makeStore(false));
      const out = await call(() => hook.current!.load());
      expect(out.value).toBe(false);
      expect(seams.roles.tenantRolesListSysRoles).not.toHaveBeenCalled();
      expect(hook.current!.error).toBe("未选择租户，无法加载角色");
      expect(hook.current!.phase).toBe("failed");
    },
  );

  fnTest(
    ["M00.F03.I02"],
    "create 成功 → 原位追加；请求体 clientId/roleCode/roleName 进体、description 缺席；重名 500 红字如实（不前置校验）",
    async () => {
      const { hook, rows } = await loaded();
      const created = roleRow({
        id: "r9",
        roleCode: "auditor",
        roleName: "审计员",
      });
      seams.roles.tenantRolesCreateSysRole.mockResolvedValue(created);

      const out = await call(() =>
        hook.current!.create("saas-console", "auditor", "审计员"),
      );
      expect(out.value).toBe(true);
      expect(seams.roles.tenantRolesCreateSysRole).toHaveBeenCalledTimes(1);
      const arg = seams.roles.tenantRolesCreateSysRole.mock.calls[0]![0];
      expect(arg.tenantId).toBe("t1");
      expect(arg.createSysRoleRequest).toEqual({
        clientId: "saas-console",
        roleCode: "auditor",
        roleName: "审计员",
      });
      expect(hook.current!.roles).toEqual([...rows, created]);
      expect(hook.current!.phase).toBe("idle");

      // description 传了才进体（契约 optional，键缺席口径）
      await call(() =>
        hook.current!.create("saas-console", "viewer", "观察员", "只读角色"),
      );
      const arg2 = seams.roles.tenantRolesCreateSysRole.mock.calls[1]![0];
      expect(arg2.createSysRoleRequest.description).toBe("只读角色");

      // 重名 roleCode：后端 500 空 body，前端不前置校验——红字如实呈现
      seams.roles.tenantRolesCreateSysRole.mockRejectedValue(
        new ResponseError(new Response(null, { status: 500 })),
      );
      const fail = await call(() =>
        hook.current!.create("saas-console", "auditor", "审计员"),
      );
      expect(fail.value).toBe(false);
      expect(hook.current!.error).toBe("请求失败（HTTP 500）");
      expect(hook.current!.phase).toBe("failed");
    },
  );

  fnTest(
    ["M00.F03.I03"],
    "refresh 成功 → getRole 回读权威行原位替换（I03 角色详情）",
    async () => {
      const { hook, rows } = await loaded();
      const authoritative = roleRow({
        roleName: "租户管理员（新）",
        description: "刷新后的描述",
      });
      seams.roles.tenantRolesGetSysRole.mockResolvedValue(authoritative);

      const out = await call(() => hook.current!.refresh("r1"));
      expect(out.value).toBe(true);
      expect(seams.roles.tenantRolesGetSysRole).toHaveBeenCalledWith({
        tenantId: "t1",
        roleId: "r1",
      });
      expect(hook.current!.roles).toEqual(
        rows.map((r) => (r.id === "r1" ? authoritative : r)),
      );
      expect(hook.current!.phase).toBe("idle");
    },
  );

  fnTest(
    ["M00.F03.I04"],
    "update 捕获请求体：undefined 字段不出现（PATCH partial）；成功原位替换",
    async () => {
      const { hook, rows } = await loaded();
      const updated = roleRow({ roleName: "新名" });
      seams.roles.tenantRolesUpdateSysRole.mockResolvedValue(updated);

      const out = await call(() => hook.current!.update("r1", "新名"));
      expect(out.value).toBe(true);
      const arg = seams.roles.tenantRolesUpdateSysRole.mock.calls[0]![0];
      expect(arg.tenantId).toBe("t1");
      expect(arg.roleId).toBe("r1");
      expect("roleName" in arg.updateSysRoleRequest).toBe(true);
      expect(arg.updateSysRoleRequest.roleName).toBe("新名");
      expect("description" in arg.updateSysRoleRequest).toBe(false);
      expect("roleCode" in arg.updateSysRoleRequest).toBe(false);
      expect("status" in arg.updateSysRoleRequest).toBe(false);
      expect(hook.current!.roles).toEqual(rows.map((r) => (r.id === "r1" ? updated : r)));
      expect(hook.current!.phase).toBe("idle");

      // 只传 description：roleName 键缺席（partial 语义，不留旧值猜默认）
      seams.roles.tenantRolesUpdateSysRole.mockClear();
      await call(() => hook.current!.update("r1", undefined, "新描述"));
      const arg2 = seams.roles.tenantRolesUpdateSysRole.mock.calls[0]![0];
      expect("roleName" in arg2.updateSysRoleRequest).toBe(false);
      expect("description" in arg2.updateSysRoleRequest).toBe(true);
    },
  );

  fnTest(
    ["M00.F03.I04"],
    "setStatus 成功 → status 走同一 PATCH 更新体（Int 口径 1=启用 0=停用），响应体可信原位替换",
    async () => {
      const { hook } = await loaded();
      const disabled = roleRow({ status: 0 });
      seams.roles.tenantRolesUpdateSysRole.mockResolvedValue(disabled);

      const out = await call(() => hook.current!.setStatus("r1", 0));
      expect(out.value).toBe(true);
      expect(seams.roles.tenantRolesUpdateSysRole).toHaveBeenCalledWith({
        tenantId: "t1",
        roleId: "r1",
        updateSysRoleRequest: { status: 0 },
      });
      expect(hook.current!.roles).toEqual([disabled]);
      expect(hook.current!.phase).toBe("idle");
    },
  );

  fnTest(
    ["M00.F03.I05"],
    "remove 成功 → 本地移除（DELETE 参数 roleId 原样）",
    async () => {
      const rows = [
        roleRow(),
        roleRow({ id: "r2", roleCode: "approver", roleName: "审批员" }),
      ];
      const { hook } = await loaded(rows);
      seams.roles.tenantRolesDeleteSysRole.mockResolvedValue(undefined);

      const out = await call(() => hook.current!.remove("r1"));
      expect(out.value).toBe(true);
      expect(seams.roles.tenantRolesDeleteSysRole).toHaveBeenCalledWith({
        tenantId: "t1",
        roleId: "r1",
      });
      expect(hook.current!.roles).toEqual([rows[1]]);
      expect(hook.current!.phase).toBe("idle");
    },
  );

  fnTest(
    ["M00.F04.I02"],
    "loadGrants 成功 → grants+menuList 落 state；并发两缝都被调（GET grants 带 clientId 上下文）",
    async () => {
      const g = grantRow();
      const menus = [menuRow(), menuRow({ id: "m2", title: "成员" })];
      seams.roles.tenantRolesListSysRoles.mockResolvedValue(listRes([roleRow()]));
      seams.roleMenus.tenantRoleMenusListSysRoleMenus.mockResolvedValue(g);
      seams.clientMenus.clientMenusListSysMenus.mockResolvedValue(menus);
      const { hook } = await loaded();
      expect(hook.current!.grants).toBeUndefined();
      expect(hook.current!.menuList).toEqual([]);

      const out = await call(() => hook.current!.loadGrants("r1", "saas-console"));
      expect(out.value).toBe(true);
      expect(seams.roleMenus.tenantRoleMenusListSysRoleMenus).toHaveBeenCalledTimes(1);
      expect(seams.roleMenus.tenantRoleMenusListSysRoleMenus).toHaveBeenCalledWith({
        tenantId: "t1",
        roleId: "r1",
        clientId: "saas-console",
      });
      expect(seams.clientMenus.clientMenusListSysMenus).toHaveBeenCalledTimes(1);
      expect(seams.clientMenus.clientMenusListSysMenus).toHaveBeenCalledWith({
        clientId: "saas-console",
      });
      expect(hook.current!.grants).toEqual(g);
      expect(hook.current!.menuList).toEqual(menus);
      expect(hook.current!.phase).toBe("idle");
    },
  );

  fnTest(
    ["M00.F04.I03"],
    "saveGrants 捕获请求体 = { menuIds } 全量集合（Set 语义消费侧去重）；成功后 grants 从 PUT 响应原位更新",
    async () => {
      const { hook } = await grantsLoaded();
      const saved = grantRow({
        menuIds: ["m1", "m3"],
        updatedAt: new Date("2026-02-01T00:00:00Z"),
      });
      seams.roleMenus.tenantRoleMenusSetSysRoleMenus.mockResolvedValue(saved);

      const out = await call(() => hook.current!.saveGrants("r1", ["m1", "m3", "m1"]));
      expect(out.value).toBe(true);
      expect(seams.roleMenus.tenantRoleMenusSetSysRoleMenus).toHaveBeenCalledTimes(1);
      const arg = seams.roleMenus.tenantRoleMenusSetSysRoleMenus.mock.calls[0]![0];
      expect(arg.tenantId).toBe("t1");
      expect(arg.roleId).toBe("r1");
      expect(arg.setSysRoleMenusRequest).toEqual({ menuIds: ["m1", "m3"] });
      // grants 状态来自 PUT 响应体（RoleMenuGrant 消费，与 members assignRoles 不同）
      expect(hook.current!.grants).toEqual(saved);
      expect(hook.current!.grants!.menuIds).toEqual(["m1", "m3"]);
      expect(hook.current!.phase).toBe("idle");
    },
  );

  fnTest(
    ["M00.F04.I04"],
    "clearGrants 成功 → DELETE 204 后本地 grants.menuIds=[]（本地聚合，不发二次 GET 也不再 PUT）",
    async () => {
      const { hook } = await grantsLoaded();
      seams.roleMenus.tenantRoleMenusClearSysRoleMenus.mockResolvedValue(undefined);

      const out = await call(() => hook.current!.clearGrants("r1"));
      expect(out.value).toBe(true);
      expect(seams.roleMenus.tenantRoleMenusClearSysRoleMenus).toHaveBeenCalledWith({
        tenantId: "t1",
        roleId: "r1",
      });
      expect(hook.current!.grants!.menuIds).toEqual([]);
      // 本地聚合：清空后不再回读列表、不再整批设置
      expect(seams.roleMenus.tenantRoleMenusListSysRoleMenus).not.toHaveBeenCalled();
      expect(seams.roleMenus.tenantRoleMenusSetSysRoleMenus).not.toHaveBeenCalled();
      expect(hook.current!.phase).toBe("idle");
    },
  );

  // 工程设施测试，不挂业务功能 ID（fn.ts 纪律）
  it("无缝未注时 defaultSeams 走 currentConfig()，缺失 throw（照 T2/T4 形状 fail-fast）", async () => {
    const hook = renderUseRoles({ store: makeStore() }); // 有租户上下文，不注 seams
    const out = await call(() => hook.current!.load());
    expect(out.ok).toBe(false);
    expect((out.value as Error).message).toContain("currentConfig() 缺失");
  });
});

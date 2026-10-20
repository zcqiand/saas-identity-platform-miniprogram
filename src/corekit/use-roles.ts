import { useCallback, useRef, useState } from "react";
import type {
  CreateSysRoleRequest,
  RoleMenuGrant,
  SysMenu,
  SysRole,
  UpdateSysRoleRequest,
} from "../generated";
import { TenantRolesApi } from "../generated/apis/TenantRolesApi";
import { TenantRoleMenusApi } from "../generated/apis/TenantRoleMenusApi";
import { ClientMenusApi } from "../generated/apis/ClientMenusApi";
import { CLIENT_ID } from "../config/client";
import { currentConfig } from "./api-client";
import { errorMessage } from "./error-message";
import type { SessionStore } from "./session-store";
import { sharedSessionStore } from "./use-auth";

/**
 * useRoles——swift 角色面（角色 CRUD + RoleMenuGrantsSection 勾选清单）动作面的
 * React 等价（knife3 Task 6，M00.F03.I01-I05 + M00.F04.I02-I04，REQ-2026-003）：
 * - load：角色列表（currentTenantId 缺失 fail-fast「未选择租户」不发请求）
 * - create：重名 roleCode 后端 500 空 body——前端不前置校验，红字如实走
 *   errorMessage；description 契约 optional，传了才进体
 * - update：PATCH partial，undefined 字段不进请求体；roleCode 不可改
 *   （UpdateSysRoleRequest 无此字段，hook 面也不收）；setStatus 走同一
 *   PATCH 更新体（Int 口径 1=启用 0=停用），响应体可信原位替换
 * - remove：DELETE 204 → 本地移除（动作名 remove 非 delete）；refresh：
 *   getRole 权威行原位替换（I03 角色详情）
 * - loadGrants(roleId, clientId)：并发 Promise.all 拉 grants（已授权菜单
 *   回显）+ 勾选清单 menuList（按 clientId 拉，随 swift RoleMenuGrantsSection）
 * - saveGrants(roleId, menuIds)：PUT 全量替换，menuIds Set 语义消费侧去重
 *   后整体进体；成功后 grants 原位更新自 PUT 响应体（RoleMenuGrant 响应可信，
 *   与 members assignRoles 的「PUT 体不消费」口径不同）
 * - clearGrants(roleId)：DELETE 204 → 本地 grants.menuIds=[]，不发二次 GET
 *   （清空语义本地聚合，不再回读）
 * - 动作统一 `phase: "idle" | "busy" | "failed"` 三态 + `error?: string`，
 *   返回 `Promise<boolean>`；错误文案统一走 errorMessage；失败不 throw 出
 *   hook 边界（seamsOf 配置缺失 throw 例外，照 T2/T4）
 *
 * mock 纪律：seams 只注入生成 API 方法面（Pick<TenantRolesApi/
 * TenantRoleMenusApi/ClientMenusApi,…>），测试传 fake；store 构造注入，缺省
 * 进程级共享 store（use-auth sharedSessionStore + CLIENT_ID，App 层单例同一实例）。
 */

// 再出口消费面类型（页面只认 hook 模块，不必各自摸生成物）
export type {
  CreateSysRoleRequest,
  RoleMenuGrant,
  SysMenu,
  SysRole,
  UpdateSysRoleRequest,
} from "../generated";

export interface RolesSeams {
  roles: Pick<
    TenantRolesApi,
    | "tenantRolesListSysRoles"
    | "tenantRolesCreateSysRole"
    | "tenantRolesGetSysRole"
    | "tenantRolesUpdateSysRole"
    | "tenantRolesDeleteSysRole"
  >;
  roleMenus: Pick<
    TenantRoleMenusApi,
    | "tenantRoleMenusListSysRoleMenus"
    | "tenantRoleMenusSetSysRoleMenus"
    | "tenantRoleMenusClearSysRoleMenus"
  >;
  clientMenus: Pick<ClientMenusApi, "clientMenusListSysMenus">;
}

export type RolesPhase = "idle" | "busy" | "failed";

export interface UseRolesOptions {
  /** 缺省用进程级共享 SessionStore（App 层单例）；测试注入内存缝。 */
  store?: SessionStore;
  /** 缺省现配生成 TenantRolesApi/TenantRoleMenusApi/ClientMenusApi；测试注入 fake（seams 缝级 mock）。 */
  seams?: RolesSeams;
}

function defaultSeams(): RolesSeams {
  // fail-fast（T2/T4 形状）：bootstrap 未跑就现配 API 会静默打到空 basePath，宁可早炸
  const config = currentConfig();
  if (!config) {
    throw new Error(
      "currentConfig() 缺失：先 bootstrap(baseURL) 再发请求（禁默认值兜底，suite-hard-rules §1）",
    );
  }
  return {
    roles: new TenantRolesApi(config),
    roleMenus: new TenantRoleMenusApi(config),
    clientMenus: new ClientMenusApi(config),
  };
}

export function useRoles(options?: UseRolesOptions): {
  roles: SysRole[];
  grants?: RoleMenuGrant;
  menuList: SysMenu[];
  phase: RolesPhase;
  error?: string;
  load(): Promise<boolean>;
  create(
    clientId: string,
    roleCode: string,
    roleName: string,
    description?: string,
  ): Promise<boolean>;
  update(roleId: string, roleName?: string, description?: string): Promise<boolean>;
  setStatus(roleId: string, status: number): Promise<boolean>;
  remove(roleId: string): Promise<boolean>;
  refresh(roleId: string): Promise<boolean>;
  loadGrants(roleId: string, clientId: string): Promise<boolean>;
  saveGrants(roleId: string, menuIds: string[]): Promise<boolean>;
  clearGrants(roleId: string): Promise<boolean>;
} {
  // store 一经首渲染钉死（useState initializer 只跑一次），options 走 ref 免闭包陈旧
  const [store] = useState(() => options?.store ?? sharedSessionStore(CLIENT_ID));
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const seamsOf = () => optionsRef.current?.seams ?? defaultSeams();

  const [roles, setRoles] = useState<SysRole[]>([]);
  const [grants, setGrants] = useState<RoleMenuGrant | undefined>(undefined);
  const [menuList, setMenuList] = useState<SysMenu[]>([]);
  const [phase, setPhase] = useState<RolesPhase>("idle");
  const [error, setError] = useState<string | undefined>(undefined);

  // 租户作用域真源 = 会话快照 currentTenantId，动作时刻现读（不缓存渲染时值）
  const tenantIdOf = () => store.snapshot()?.currentTenantId;
  const noTenantFail = (action: string) => {
    setError(`未选择租户，${action}`);
    setPhase("failed");
  };

  const replaceRow = useCallback((row: SysRole) => {
    setRoles((prev) => prev.map((r) => (r.id === row.id ? row : r)));
  }, []);

  // @impl M00.F03.I01 — 角色列表
  const load = useCallback(async (): Promise<boolean> => {
    const tenantId = tenantIdOf();
    if (!tenantId) {
      noTenantFail("无法加载角色");
      return false;
    }
    const seams = seamsOf();
    setPhase("busy");
    try {
      const res = await seams.roles.tenantRolesListSysRoles({ tenantId });
      setRoles(res.items);
      setError(undefined);
      setPhase("idle");
      return true;
    } catch (e) {
      // 失败旧列表保留（不兜底清空）
      setError(errorMessage(e));
      setPhase("failed");
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // @impl M00.F03.I02 — 创建角色（重名 roleCode 后端 500 空 body，红字如实不前置校验）
  const create = useCallback(
    async (
      clientId: string,
      roleCode: string,
      roleName: string,
      description?: string,
    ): Promise<boolean> => {
      const tenantId = tenantIdOf();
      if (!tenantId) {
        noTenantFail("无法新建角色");
        return false;
      }
      const request: CreateSysRoleRequest = { clientId, roleCode, roleName };
      if (description !== undefined) request.description = description;
      const seams = seamsOf();
      setPhase("busy");
      try {
        const created = await seams.roles.tenantRolesCreateSysRole({
          tenantId,
          createSysRoleRequest: request,
        });
        setRoles((prev) => [...prev, created]);
        setError(undefined);
        setPhase("idle");
        return true;
      } catch (e) {
        setError(errorMessage(e));
        setPhase("failed");
        return false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // @impl M00.F03.I04 — 更新角色（PATCH partial：undefined 字段不进请求体；roleCode 不可改）
  const update = useCallback(
    async (roleId: string, roleName?: string, description?: string): Promise<boolean> => {
      const tenantId = tenantIdOf();
      if (!tenantId) {
        noTenantFail("无法编辑角色");
        return false;
      }
      const request: UpdateSysRoleRequest = {};
      if (roleName !== undefined) request.roleName = roleName;
      if (description !== undefined) request.description = description;
      const seams = seamsOf();
      setPhase("busy");
      try {
        const updated = await seams.roles.tenantRolesUpdateSysRole({
          tenantId,
          roleId,
          updateSysRoleRequest: request,
        });
        replaceRow(updated);
        setError(undefined);
        setPhase("idle");
        return true;
      } catch (e) {
        setError(errorMessage(e));
        setPhase("failed");
        return false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [replaceRow],
  );

  // @impl M00.F03.I04 — 状态切换（走同一 PATCH 更新体；Int 口径 1=启用 0=停用，响应体可信）
  const setStatus = useCallback(
    async (roleId: string, status: number): Promise<boolean> => {
      const tenantId = tenantIdOf();
      if (!tenantId) {
        noTenantFail("无法切换角色状态");
        return false;
      }
      const seams = seamsOf();
      setPhase("busy");
      try {
        const updated = await seams.roles.tenantRolesUpdateSysRole({
          tenantId,
          roleId,
          updateSysRoleRequest: { status },
        });
        replaceRow(updated);
        setError(undefined);
        setPhase("idle");
        return true;
      } catch (e) {
        setError(errorMessage(e));
        setPhase("failed");
        return false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [replaceRow],
  );

  // @impl M00.F03.I05 — 删除角色（DELETE 204 → 本地移除）
  const remove = useCallback(
    async (roleId: string): Promise<boolean> => {
      const tenantId = tenantIdOf();
      if (!tenantId) {
        noTenantFail("无法移除角色");
        return false;
      }
      const seams = seamsOf();
      setPhase("busy");
      try {
        await seams.roles.tenantRolesDeleteSysRole({ tenantId, roleId });
        setRoles((prev) => prev.filter((r) => r.id !== roleId));
        setError(undefined);
        setPhase("idle");
        return true;
      } catch (e) {
        setError(errorMessage(e));
        setPhase("failed");
        return false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // @impl M00.F03.I03 — 回读单角色（权威行原位替换，详情刷新）
  const refresh = useCallback(
    async (roleId: string): Promise<boolean> => {
      const tenantId = tenantIdOf();
      if (!tenantId) {
        noTenantFail("无法刷新角色");
        return false;
      }
      const seams = seamsOf();
      setPhase("busy");
      try {
        const authoritative = await seams.roles.tenantRolesGetSysRole({
          tenantId,
          roleId,
        });
        replaceRow(authoritative);
        setError(undefined);
        setPhase("idle");
        return true;
      } catch (e) {
        setError(errorMessage(e));
        setPhase("failed");
        return false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [replaceRow],
  );

  // @impl M00.F04.I02 — 角色已授权菜单查询（并发 grants + 勾选清单）
  const loadGrants = useCallback(
    async (roleId: string, clientId: string): Promise<boolean> => {
      const tenantId = tenantIdOf();
      if (!tenantId) {
        noTenantFail("无法加载角色菜单");
        return false;
      }
      const seams = seamsOf();
      setPhase("busy");
      try {
        const [g, menus] = await Promise.all([
          seams.roleMenus.tenantRoleMenusListSysRoleMenus({
            tenantId,
            roleId,
            clientId,
          }),
          seams.clientMenus.clientMenusListSysMenus({ clientId }),
        ]);
        setGrants(g);
        setMenuList(menus);
        setError(undefined);
        setPhase("idle");
        return true;
      } catch (e) {
        setError(errorMessage(e));
        setPhase("failed");
        return false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // @impl M00.F04.I03 — 整批设置角色菜单（PUT 全量替换；成功后 grants 原位更新自响应体）
  const saveGrants = useCallback(
    async (roleId: string, menuIds: string[]): Promise<boolean> => {
      const tenantId = tenantIdOf();
      if (!tenantId) {
        noTenantFail("无法保存角色菜单");
        return false;
      }
      const seams = seamsOf();
      setPhase("busy");
      try {
        // Set 语义消费侧去重后全量进体（PUT 全量替换）
        const unique = Array.from(new Set(menuIds));
        const saved = await seams.roleMenus.tenantRoleMenusSetSysRoleMenus({
          tenantId,
          roleId,
          setSysRoleMenusRequest: { menuIds: unique },
        });
        setGrants(saved);
        setError(undefined);
        setPhase("idle");
        return true;
      } catch (e) {
        setError(errorMessage(e));
        setPhase("failed");
        return false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // @impl M00.F04.I04 — 清空角色菜单（DELETE 204 → 本地 menuIds=[]，不发二次 GET）
  const clearGrants = useCallback(
    async (roleId: string): Promise<boolean> => {
      const tenantId = tenantIdOf();
      if (!tenantId) {
        noTenantFail("无法清空角色菜单");
        return false;
      }
      const seams = seamsOf();
      setPhase("busy");
      try {
        await seams.roleMenus.tenantRoleMenusClearSysRoleMenus({
          tenantId,
          roleId,
        });
        // 清空语义本地聚合，不再回读（列表清空可推导，无需二次 GET）
        setGrants((prev) =>
          prev
            ? { ...prev, menuIds: [] }
            : { roleId, tenantId, menuIds: [], updatedAt: new Date() },
        );
        setError(undefined);
        setPhase("idle");
        return true;
      } catch (e) {
        setError(errorMessage(e));
        setPhase("failed");
        return false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return {
    roles,
    grants,
    menuList,
    phase,
    error,
    load,
    create,
    update,
    setStatus,
    remove,
    refresh,
    loadGrants,
    saveGrants,
    clearGrants,
  };
}

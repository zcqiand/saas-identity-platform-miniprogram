import { useCallback, useRef, useState } from "react";
import type {
  CreateSysUserRequest,
  SysRole,
  TenantMemberUserView,
  TenantMemberView,
  TenantMembersInviteTenantUserRequest,
  UpdateSysUserRequest,
} from "../generated";
import { TenantMemberStatus } from "../generated";
import { TenantMembersApi } from "../generated/apis/TenantMembersApi";
import { TenantRolesApi } from "../generated/apis/TenantRolesApi";
import { CLIENT_ID } from "../config/client";
import { currentConfig } from "./api-client";
import { errorMessage } from "./error-message";
import type { SessionStore } from "./session-store";
import { sharedSessionStore } from "./use-auth";

/**
 * useMembers——swift MembersViewModel.swift（292 行）动作面的 React 等价
 * （knife3 Task 4，M00.F02.I01-I06+I08 + M01.F02.I01，REQ-2026-003/009）：
 * - load :88（并发 Promise.all 拉成员+角色；currentTenantId 缺失 fail-fast
 *   「未选择租户」不发请求，Q1）
 * - assignRoles :115（M01.F02.I01 全量覆盖；REQ-009 Q2：roles PUT 响应体的
 *   status 字段 wire 上不可信——成功后必须 getMember 回读、以回读行原位替换，
 *   回读失败整步 false；PUT 响应体不消费）
 * - create :142（email 契约 optional 但后端必填，live 400 实证 → hook 参数
 *   必填；密码长度前端不拦，后端裁）
 * - update :162（PATCH partial：undefined 字段不进请求体）；changeStatus :180
 *   （响应体可信，原位替换）；remove :201（DELETE 204 → 本地移除，只断
 *   membership 不删全局用户）；invite :216（响应嵌套 TenantMemberView →
 *   flatRow 扁平化入列，枚举对不上整步 false）；refresh :232（getMember
 *   权威行原位替换，详情刷新与 roles 回读共用）
 * - 动作统一 `phase: "idle" | "busy" | "failed"` 三态 + `error?: string`，
 *   返回 `Promise<boolean>`；错误文案统一走 errorMessage；失败不 throw 出
 *   hook 边界（seamsOf 配置缺失 throw 例外，照 T2）
 *
 * mock 纪律：seams 只注入生成 API 方法面（Pick<TenantMembersApi/TenantRolesApi,…>），
 * 测试传 fake；store 构造注入，缺省进程级共享 store（use-auth sharedSessionStore
 * + CLIENT_ID，App 层单例同一实例）。
 */

// 再出口消费面类型（页面只认 hook 模块，不必各自摸生成物）
export type {
  CreateSysUserRequest,
  SysRole,
  TenantMemberStatus,
  TenantMemberUserView,
  TenantMemberView,
  TenantMembersInviteTenantUserRequest,
  UpdateSysUserRequest,
} from "../generated";

export interface MembersSeams {
  members: Pick<
    TenantMembersApi,
    | "tenantMembersListTenantUsers"
    | "tenantMembersCreateTenantUser"
    | "tenantMembersGetTenantUser"
    | "tenantMembersUpdateTenantUser"
    | "tenantMembersDeleteTenantUser"
    | "tenantMembersInviteTenantUser"
    | "tenantMembersChangeTenantUserStatus"
    | "tenantMembersAssignTenantMemberRoles"
  >;
  roles: Pick<TenantRolesApi, "tenantRolesListSysRoles">;
}

export type MembersPhase = "idle" | "busy" | "failed";

export interface UseMembersOptions {
  /** 缺省用进程级共享 SessionStore（App 层单例）；测试注入内存缝。 */
  store?: SessionStore;
  /** 缺省现配生成 TenantMembersApi/TenantRolesApi；测试注入 fake（seams 缝级 mock）。 */
  seams?: MembersSeams;
}

function defaultSeams(): MembersSeams {
  // fail-fast（T2 形状）：bootstrap 未跑就现配 API 会静默打到空 basePath，宁可早炸
  const config = currentConfig();
  if (!config) {
    throw new Error(
      "currentConfig() 缺失：先 bootstrap(baseURL) 再发请求（禁默认值兜底，suite-hard-rules §1）",
    );
  }
  return { members: new TenantMembersApi(config), roles: new TenantRolesApi(config) };
}

/** 邀请响应嵌套 → 列表扁平行映射（Q4 纯函数，swift flatRow :263 同构）：
 * id/username/email/status/时间戳取 user.*，tenantId 取 member.tenantId，
 * roleIds 取 view.roles。列表行 status = user.status（member.status=active 是
 * membership 侧口径，被邀 user 未激活时两者并存——live 实证）。user.status
 * rawValue 落不到 TenantMemberStatus 值域 = 返 undefined fail-fast，不猜默认。 */
export function flatRow(from: TenantMemberView): TenantMemberUserView | undefined {
  const raw = from.user.status as string;
  if (!(Object.values(TenantMemberStatus) as string[]).includes(raw)) {
    return undefined;
  }
  return {
    id: from.user.id,
    tenantId: from.member.tenantId,
    username: from.user.username,
    email: from.user.email,
    status: raw as TenantMemberStatus,
    roleIds: from.roles,
    createdAt: from.user.createdAt,
    updatedAt: from.user.updatedAt,
  };
}

export function useMembers(options?: UseMembersOptions): {
  members: TenantMemberUserView[];
  roles: SysRole[];
  phase: MembersPhase;
  error?: string;
  load(): Promise<boolean>;
  create(
    username: string,
    password: string,
    email: string,
    mobile?: string,
  ): Promise<boolean>;
  update(userId: string, email?: string, mobile?: string): Promise<boolean>;
  changeStatus(userId: string, status: TenantMemberStatus): Promise<boolean>;
  remove(userId: string): Promise<boolean>;
  invite(email: string, mobile?: string): Promise<boolean>;
  refresh(userId: string): Promise<boolean>;
  assignRoles(roleIds: string[], userId: string): Promise<boolean>;
} {
  // store 一经首渲染钉死（useState initializer 只跑一次），options 走 ref 免闭包陈旧
  const [store] = useState(() => options?.store ?? sharedSessionStore(CLIENT_ID));
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const seamsOf = () => optionsRef.current?.seams ?? defaultSeams();

  const [members, setMembers] = useState<TenantMemberUserView[]>([]);
  const [roles, setRoles] = useState<SysRole[]>([]);
  const [phase, setPhase] = useState<MembersPhase>("idle");
  const [error, setError] = useState<string | undefined>(undefined);

  // 租户作用域真源 = 会话快照 currentTenantId，动作时刻现读（不缓存渲染时值）
  const tenantIdOf = () => store.snapshot()?.currentTenantId;
  const noTenantFail = (action: string) => {
    setError(`未选择租户，${action}`);
    setPhase("failed");
  };

  const replaceRow = useCallback((row: TenantMemberUserView) => {
    setMembers((prev) => prev.map((m) => (m.id === row.id ? row : m)));
  }, []);

  // @impl M00.F02.I01 — 成员列表（并发拉成员+角色）
  const load = useCallback(async (): Promise<boolean> => {
    const tenantId = tenantIdOf();
    if (!tenantId) {
      noTenantFail("无法加载成员");
      return false;
    }
    const seams = seamsOf();
    setPhase("busy");
    try {
      const [m, r] = await Promise.all([
        seams.members.tenantMembersListTenantUsers({ tenantId }),
        seams.roles.tenantRolesListSysRoles({ tenantId }),
      ]);
      setMembers(m.items);
      setRoles(r.items);
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

  // @impl M00.F02.I02 — 创建成员（成功追加行）
  const create = useCallback(
    async (
      username: string,
      password: string,
      email: string,
      mobile?: string,
    ): Promise<boolean> => {
      const tenantId = tenantIdOf();
      if (!tenantId) {
        noTenantFail("无法新建成员");
        return false;
      }
      const request: CreateSysUserRequest = { username, password, email };
      if (mobile !== undefined) request.mobile = mobile;
      const seams = seamsOf();
      setPhase("busy");
      try {
        const created = await seams.members.tenantMembersCreateTenantUser({
          tenantId,
          createSysUserRequest: request,
        });
        setMembers((prev) => [...prev, created]);
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

  // @impl M00.F02.I04 — 更新成员（PATCH partial：undefined 字段不进请求体）
  const update = useCallback(
    async (userId: string, email?: string, mobile?: string): Promise<boolean> => {
      const tenantId = tenantIdOf();
      if (!tenantId) {
        noTenantFail("无法编辑成员");
        return false;
      }
      const request: UpdateSysUserRequest = {};
      if (email !== undefined) request.email = email;
      if (mobile !== undefined) request.mobile = mobile;
      const seams = seamsOf();
      setPhase("busy");
      try {
        const updated = await seams.members.tenantMembersUpdateTenantUser({
          tenantId,
          userId,
          updateSysUserRequest: request,
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

  // @impl M00.F02.I08 — 状态切换（响应体可信，随 swift 原位替换）
  const changeStatus = useCallback(
    async (userId: string, status: TenantMemberStatus): Promise<boolean> => {
      const tenantId = tenantIdOf();
      if (!tenantId) {
        noTenantFail("无法切换成员状态");
        return false;
      }
      const seams = seamsOf();
      setPhase("busy");
      try {
        const updated = await seams.members.tenantMembersChangeTenantUserStatus({
          tenantId,
          userId,
          tenantMembersChangeTenantUserStatusRequest: { status },
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

  // @impl M00.F02.I05 — 删除成员（DELETE 204 → 本地移除，只断 membership）
  const remove = useCallback(
    async (userId: string): Promise<boolean> => {
      const tenantId = tenantIdOf();
      if (!tenantId) {
        noTenantFail("无法移除成员");
        return false;
      }
      const seams = seamsOf();
      setPhase("busy");
      try {
        await seams.members.tenantMembersDeleteTenantUser({ tenantId, userId });
        setMembers((prev) => prev.filter((m) => m.id !== userId));
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

  // @impl M00.F02.I06 — 邀请成员（响应嵌套 TenantMemberView → flatRow 入列）
  const invite = useCallback(
    async (email: string, mobile?: string): Promise<boolean> => {
      const tenantId = tenantIdOf();
      if (!tenantId) {
        noTenantFail("无法邀请成员");
        return false;
      }
      const request: TenantMembersInviteTenantUserRequest = { email };
      if (mobile !== undefined) request.mobile = mobile;
      const seams = seamsOf();
      setPhase("busy");
      try {
        const view = await seams.members.tenantMembersInviteTenantUser({
          tenantId,
          tenantMembersInviteTenantUserRequest: request,
        });
        const row = flatRow(view);
        if (!row) {
          setError("邀请响应 status 无法映射到成员口径");
          setPhase("failed");
          return false;
        }
        setMembers((prev) => [...prev, row]);
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

  // @impl M00.F02.I03 — 回读单成员（详情刷新 + roles 分配回读共用）
  const refresh = useCallback(
    async (userId: string): Promise<boolean> => {
      const tenantId = tenantIdOf();
      if (!tenantId) {
        noTenantFail("无法刷新成员");
        return false;
      }
      const seams = seamsOf();
      setPhase("busy");
      try {
        const authoritative = await seams.members.tenantMembersGetTenantUser({
          tenantId,
          userId,
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

  // @impl M01.F02.I01 — 分配角色（PUT 全量覆盖 + getMember 回读，REQ-009 Q2）
  const assignRoles = useCallback(
    async (roleIds: string[], userId: string): Promise<boolean> => {
      const tenantId = tenantIdOf();
      if (!tenantId) {
        noTenantFail("无法分配角色");
        return false;
      }
      const seams = seamsOf();
      setPhase("busy");
      try {
        // PUT 响应体不消费（status 字段 wire 上不可信，REQ-009 Q2）
        await seams.members.tenantMembersAssignTenantMemberRoles({
          tenantId,
          userId,
          setTenantMemberRolesRequest: { roleIds },
        });
        const authoritative = await seams.members.tenantMembersGetTenantUser({
          tenantId,
          userId,
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

  return {
    members,
    roles,
    phase,
    error,
    load,
    create,
    update,
    changeStatus,
    remove,
    invite,
    refresh,
    assignRoles,
  };
}

// @vitest-environment jsdom
/**
 * useMembers 11 条（M00.F02.I01-I06+I08 + M01.F02.I01，knife3 Task 4 Step 1）：
 * mock 只在 seams——生成 TenantMembersApi/TenantRolesApi 方法面注入 fake（反目标：
 * 不 mock 传输语义之外的东西）；SessionStore 走内存缝（token store 注入 +
 * adoptLogin 入账 currentTenantId）。React 18.3 act + react-dom/client 渲染探针，
 * 形状照 use-admin-tenants.test.ts；SessionStore 构造会触 Taro storage，故
 * @tarojs/taro 照 use-auth.test.ts 垫 mock（hook 本体不触 Taro）。
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
  MembersSeams,
  SysRole,
  TenantMemberUserView,
  TenantMemberView,
} from "../../src/corekit/use-members";
import { flatRow, useMembers } from "../../src/corekit/use-members";
import { fnTest } from "../fn";
import { ResponseError } from "../../src/generated/runtime";
import type { SysUser, TenantMember } from "../../src/generated";
import { SessionStore } from "../../src/corekit/session-store";
import { createInMemoryTokenStore } from "../../src/corekit/token-store";

const D0 = new Date("2026-01-01T00:00:00Z");

function memberRow(over: Partial<TenantMemberUserView> = {}): TenantMemberUserView {
  return {
    id: "u1",
    tenantId: "t1",
    username: "alice",
    email: "alice@example.com",
    status: "active",
    roleIds: ["r1"],
    createdAt: D0,
    updatedAt: D0,
    ...over,
  };
}

function sysUser(over: Partial<SysUser> = {}): SysUser {
  return {
    id: "u1",
    username: "alice",
    email: "alice@example.com",
    status: "active",
    createdAt: D0,
    updatedAt: D0,
    ...over,
  };
}

/** 嵌套视图（invite 响应形状）：member.userId 与 user.id 默认同指一人。 */
function memberView(
  over: {
    member?: Partial<TenantMember>;
    user?: Partial<SysUser>;
    roles?: string[];
  } = {},
): TenantMemberView {
  const u = sysUser(over.user);
  return {
    member: {
      id: "m1",
      tenantId: "t1",
      userId: u.id,
      isOwner: false,
      status: "active",
      createdAt: D0,
      updatedAt: D0,
      ...over.member,
    },
    user: u,
    roles: over.roles ?? ["r1"],
  };
}

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
    members: {
      tenantMembersListTenantUsers: vi.fn(),
      tenantMembersCreateTenantUser: vi.fn(),
      tenantMembersGetTenantUser: vi.fn(),
      tenantMembersUpdateTenantUser: vi.fn(),
      tenantMembersDeleteTenantUser: vi.fn(),
      tenantMembersInviteTenantUser: vi.fn(),
      tenantMembersChangeTenantUserStatus: vi.fn(),
      tenantMembersAssignTenantMemberRoles: vi.fn(),
    },
    roles: { tenantRolesListSysRoles: vi.fn() },
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
      user: sysUser({ id: "boss", username: "boss" }),
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

function renderUseMembers(options?: { store?: SessionStore; seams?: MembersSeams }): {
  current?: ReturnType<typeof useMembers>;
} {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const ref: { current?: ReturnType<typeof useMembers> } = {};
  function Probe() {
    ref.current = useMembers(options);
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

describe("useMembers（租户成员面，knife3 T4）", () => {
  let seams: SeamsFake;

  beforeEach(() => {
    seams = makeSeams();
  });

  function mount(store: SessionStore = makeStore()) {
    return renderUseMembers({ store, seams: seams as unknown as MembersSeams });
  }

  /** 先 load 成功铺底，返回挂载好的 hook。 */
  async function loaded(
    rows: TenantMemberUserView[] = [memberRow()],
    roles: SysRole[] = [roleRow()],
  ) {
    seams.members.tenantMembersListTenantUsers.mockResolvedValue(listRes(rows));
    seams.roles.tenantRolesListSysRoles.mockResolvedValue(listRes(roles));
    const hook = mount();
    const out = await call(() => hook.current!.load());
    expect(out.value).toBe(true);
    seams.members.tenantMembersListTenantUsers.mockClear();
    seams.roles.tenantRolesListSysRoles.mockClear();
    return { hook, rows, roles };
  }

  fnTest(
    ["M00.F02.I01"],
    "load 成功 → members+roles 并发落 state，返回 true、phase 回 idle",
    async () => {
      const rows = [memberRow(), memberRow({ id: "u2", username: "bob" })];
      const roleRows = [
        roleRow(),
        roleRow({ id: "r2", roleCode: "approver", roleName: "审批员" }),
      ];
      seams.members.tenantMembersListTenantUsers.mockResolvedValue(listRes(rows));
      seams.roles.tenantRolesListSysRoles.mockResolvedValue(listRes(roleRows));
      const hook = mount();
      expect(hook.current!.members).toEqual([]);
      expect(hook.current!.roles).toEqual([]);

      const out = await call(() => hook.current!.load());
      expect(out.value).toBe(true);
      expect(hook.current!.members).toEqual(rows);
      expect(hook.current!.roles).toEqual(roleRows);
      expect(hook.current!.phase).toBe("idle");
      expect(hook.current!.error).toBeUndefined();
      // 两请求都带 tenantId 上下文（当前租户快照）
      expect(seams.members.tenantMembersListTenantUsers).toHaveBeenCalledTimes(1);
      expect(seams.members.tenantMembersListTenantUsers).toHaveBeenCalledWith({
        tenantId: "t1",
      });
      expect(seams.roles.tenantRolesListSysRoles).toHaveBeenCalledWith({
        tenantId: "t1",
      });
    },
  );

  fnTest(
    ["M00.F02.I01"],
    "load 时 currentTenantId 缺失 → 不发请求 + error=「未选择租户，无法加载成员」+ phase failed",
    async () => {
      const hook = mount(makeStore(false));
      const out = await call(() => hook.current!.load());
      expect(out.value).toBe(false);
      expect(seams.members.tenantMembersListTenantUsers).not.toHaveBeenCalled();
      expect(seams.roles.tenantRolesListSysRoles).not.toHaveBeenCalled();
      expect(hook.current!.error).toBe("未选择租户，无法加载成员");
      expect(hook.current!.phase).toBe("failed");
    },
  );

  fnTest(
    ["M00.F02.I02"],
    "create 成功 → 原位追加；请求体 email 必填进体、密码 ≥6 前端不拦（后端裁）",
    async () => {
      const { hook, rows } = await loaded();
      const created = memberRow({
        id: "u9",
        username: "carol",
        email: "carol@example.com",
      });
      seams.members.tenantMembersCreateTenantUser.mockResolvedValue(created);

      const out = await call(() =>
        hook.current!.create("carol", "S3cure!pass", "carol@example.com"),
      );
      expect(out.value).toBe(true);
      expect(seams.members.tenantMembersCreateTenantUser).toHaveBeenCalledTimes(1);
      const arg = seams.members.tenantMembersCreateTenantUser.mock.calls[0]![0];
      expect(arg.tenantId).toBe("t1");
      expect(arg.createSysUserRequest).toEqual({
        username: "carol",
        password: "S3cure!pass",
        email: "carol@example.com",
      });
      expect(hook.current!.members).toEqual([...rows, created]);
      expect(hook.current!.phase).toBe("idle");

      // 契约 optional 的 mobile 未传 → 请求体键缺席；短密码原样透传（长度后端裁）
      await call(() => hook.current!.create("dave", "123", "dave@example.com"));
      const arg2 = seams.members.tenantMembersCreateTenantUser.mock.calls[1]![0];
      expect(arg2.createSysUserRequest.password).toBe("123");
      expect("mobile" in arg2.createSysUserRequest).toBe(false);
    },
  );

  fnTest(
    ["M00.F02.I04"],
    "update 捕获请求体：undefined 字段不出现（PATCH partial）；成功原位替换",
    async () => {
      const { hook, rows } = await loaded();
      const updated = memberRow({ email: "new@example.com" });
      seams.members.tenantMembersUpdateTenantUser.mockResolvedValue(updated);

      const out = await call(() => hook.current!.update("u1", "new@example.com"));
      expect(out.value).toBe(true);
      const arg = seams.members.tenantMembersUpdateTenantUser.mock.calls[0]![0];
      expect(arg.tenantId).toBe("t1");
      expect(arg.userId).toBe("u1");
      expect("email" in arg.updateSysUserRequest).toBe(true);
      expect(arg.updateSysUserRequest.email).toBe("new@example.com");
      expect("mobile" in arg.updateSysUserRequest).toBe(false);
      expect(hook.current!.members).toEqual(
        rows.map((r) => (r.id === "u1" ? updated : r)),
      );
      expect(hook.current!.phase).toBe("idle");

      // 只传 mobile：email 键缺席（partial 语义，不留旧值猜默认）
      seams.members.tenantMembersUpdateTenantUser.mockClear();
      await call(() => hook.current!.update("u1", undefined, "13800000000"));
      const arg2 = seams.members.tenantMembersUpdateTenantUser.mock.calls[0]![0];
      expect("email" in arg2.updateSysUserRequest).toBe(false);
      expect("mobile" in arg2.updateSysUserRequest).toBe(true);
    },
  );

  fnTest(
    ["M00.F02.I08"],
    "changeStatus 成功 → 响应体可信（随 swift），原位替换",
    async () => {
      const { hook } = await loaded();
      const suspended = memberRow({ status: "suspended" });
      seams.members.tenantMembersChangeTenantUserStatus.mockResolvedValue(suspended);

      const out = await call(() => hook.current!.changeStatus("u1", "suspended"));
      expect(out.value).toBe(true);
      expect(seams.members.tenantMembersChangeTenantUserStatus).toHaveBeenCalledWith({
        tenantId: "t1",
        userId: "u1",
        tenantMembersChangeTenantUserStatusRequest: { status: "suspended" },
      });
      expect(hook.current!.members).toEqual([suspended]);
      expect(hook.current!.phase).toBe("idle");
    },
  );

  fnTest(
    ["M00.F02.I05"],
    "remove 成功 → 本地移除（DELETE 参数 userId 原样；只断 membership 不删全局用户）",
    async () => {
      const rows = [memberRow(), memberRow({ id: "u2", username: "bob" })];
      const { hook } = await loaded(rows);
      seams.members.tenantMembersDeleteTenantUser.mockResolvedValue(undefined);

      const out = await call(() => hook.current!.remove("u1"));
      expect(out.value).toBe(true);
      expect(seams.members.tenantMembersDeleteTenantUser).toHaveBeenCalledWith({
        tenantId: "t1",
        userId: "u1",
      });
      expect(hook.current!.members).toEqual([rows[1]]);
      expect(hook.current!.phase).toBe("idle");
    },
  );

  fnTest(
    ["M00.F02.I06"],
    "invite 成功 → 响应 TenantMemberView 经 flatRow 扁平化入列（status 取 user 口径）",
    async () => {
      const { hook, rows } = await loaded();
      seams.members.tenantMembersInviteTenantUser.mockResolvedValue(
        memberView({
          member: { userId: "u8" },
          user: {
            id: "u8",
            username: "invited@example.com",
            email: "invited@example.com",
            status: "invited",
          },
          roles: [],
        }),
      );

      const out = await call(() => hook.current!.invite("invited@example.com"));
      expect(out.value).toBe(true);
      expect(seams.members.tenantMembersInviteTenantUser).toHaveBeenCalledWith({
        tenantId: "t1",
        tenantMembersInviteTenantUserRequest: { email: "invited@example.com" },
      });
      expect(hook.current!.members.length).toBe(rows.length + 1);
      expect(hook.current!.members[rows.length]).toEqual({
        id: "u8",
        tenantId: "t1",
        username: "invited@example.com",
        email: "invited@example.com",
        status: "invited",
        roleIds: [],
        createdAt: D0,
        updatedAt: D0,
      });
      expect(hook.current!.phase).toBe("idle");
    },
  );

  fnTest(
    ["M00.F02.I06"],
    "flatRow 枚举 rawValue 对不上 → 返 undefined（fail-fast 不猜默认）；invite 遇到则整步 false 不入列",
    async () => {
      // 纯函数面：user.status 落不到 TenantMemberStatus 值域 → undefined
      expect(
        flatRow(
          memberView({ user: { status: "locked" as unknown as SysUser["status"] } }),
        ),
      ).toBeUndefined();

      const { hook, rows } = await loaded();
      seams.members.tenantMembersInviteTenantUser.mockResolvedValue(
        memberView({ user: { status: "locked" as unknown as SysUser["status"] } }),
      );
      const out = await call(() => hook.current!.invite("x@example.com"));
      expect(out.value).toBe(false);
      expect(hook.current!.members).toEqual(rows);
      expect(hook.current!.error).toBe("邀请响应 status 无法映射到成员口径");
      expect(hook.current!.phase).toBe("failed");
    },
  );

  fnTest(
    ["M00.F02.I03"],
    "refresh 成功 → getMember 回读原位替换（详情刷新与 roles 回读共用）",
    async () => {
      const { hook, rows } = await loaded();
      const authoritative = memberRow({
        email: "fresh@example.com",
        roleIds: ["r1", "r2"],
      });
      seams.members.tenantMembersGetTenantUser.mockResolvedValue(authoritative);

      const out = await call(() => hook.current!.refresh("u1"));
      expect(out.value).toBe(true);
      expect(seams.members.tenantMembersGetTenantUser).toHaveBeenCalledWith({
        tenantId: "t1",
        userId: "u1",
      });
      expect(hook.current!.members).toEqual(
        rows.map((r) => (r.id === "u1" ? authoritative : r)),
      );
      expect(hook.current!.phase).toBe("idle");
    },
  );

  fnTest(
    ["M01.F02.I01"],
    "assignRoles 成功 → PUT 全量覆盖后必须 getMember 回读，以回读行原位替换；不消费 PUT 响应体（REQ-009 Q2）",
    async () => {
      const { hook } = await loaded();
      // PUT 响应体 status 字段 wire 上不可信（挂起成员假报 active）——构造一个
      // 与回读行可区分的假体，断言 state 不来自它
      seams.members.tenantMembersAssignTenantMemberRoles.mockResolvedValue(
        memberRow({ status: "active", roleIds: ["stale-put-body"] }),
      );
      const authoritative = memberRow({ status: "suspended", roleIds: ["r1", "r2"] });
      seams.members.tenantMembersGetTenantUser.mockResolvedValue(authoritative);

      const out = await call(() => hook.current!.assignRoles(["r1", "r2"], "u1"));
      expect(out.value).toBe(true);
      expect(seams.members.tenantMembersAssignTenantMemberRoles).toHaveBeenCalledTimes(1);
      expect(seams.members.tenantMembersAssignTenantMemberRoles).toHaveBeenCalledWith({
        tenantId: "t1",
        userId: "u1",
        setTenantMemberRolesRequest: { roleIds: ["r1", "r2"] },
      });
      expect(seams.members.tenantMembersGetTenantUser).toHaveBeenCalledTimes(1);
      expect(seams.members.tenantMembersGetTenantUser).toHaveBeenCalledWith({
        tenantId: "t1",
        userId: "u1",
      });
      // state 来自回读行（suspended + [r1,r2]），不是 PUT 体（active + stale）
      expect(hook.current!.members).toEqual([authoritative]);
      expect(hook.current!.members[0]!.roleIds).toEqual(["r1", "r2"]);
      expect(hook.current!.members[0]!.status).toBe("suspended");
      expect(hook.current!.phase).toBe("idle");
    },
  );

  fnTest(
    ["M01.F02.I01"],
    "assignRoles 回读失败（GET 500）→ 整步 false + 列表不动 + error 落文案",
    async () => {
      const { hook, rows } = await loaded();
      seams.members.tenantMembersAssignTenantMemberRoles.mockResolvedValue(memberRow());
      seams.members.tenantMembersGetTenantUser.mockRejectedValue(
        new ResponseError(new Response(null, { status: 500 })),
      );

      const out = await call(() => hook.current!.assignRoles(["r1"], "u1"));
      expect(out.value).toBe(false);
      expect(hook.current!.members).toEqual(rows);
      expect(hook.current!.error).toBe("请求失败（HTTP 500）");
      expect(hook.current!.phase).toBe("failed");
    },
  );

  // 工程设施测试，不挂业务功能 ID（fn.ts 纪律）
  it("无缝未注时 defaultSeams 走 currentConfig()，缺失 throw（照 T2 形状 fail-fast）", async () => {
    const hook = renderUseMembers({ store: makeStore() }); // 有租户上下文，不注 seams
    const out = await call(() => hook.current!.load());
    expect(out.ok).toBe(false);
    expect((out.value as Error).message).toContain("currentConfig() 缺失");
  });
});

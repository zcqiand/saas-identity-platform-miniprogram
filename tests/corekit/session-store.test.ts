import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => new Map<string, string>());

const setStorageSync = vi.hoisted(() => vi.fn());
const getStorageSync = vi.hoisted(() => vi.fn());
const removeStorageSync = vi.hoisted(() => vi.fn());
const request = vi.hoisted(() => vi.fn());

vi.mock("@tarojs/taro", () => ({
  default: { setStorageSync, getStorageSync, removeStorageSync, request },
}));

import { bootstrap, currentConfig } from "../../src/corekit/api-client";
import { SessionStore, type SessionPhase } from "../../src/corekit/session-store";
import { createInMemoryTokenStore, type TokenStore } from "../../src/corekit/token-store";
import type {
  LoginResponse,
  SwitchTenantResponse,
  SysUser,
  TenantMembership,
} from "../../src/generated";

const API_BASE = "http://localhost:5104";

const user: SysUser = {
  id: "u1",
  username: "alice",
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

function makeStore(tokenStore: TokenStore = createInMemoryTokenStore()): SessionStore {
  return new SessionStore({ tokenStore, apiBaseUrl: API_BASE, clientId: "saas-console" });
}

function authHeader(): string | null {
  return new Headers(currentConfig()?.headers).get("Authorization");
}

describe("SessionStore（状态机随 swift SessionStore）", () => {
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
    bootstrap(API_BASE);
  });

  it("init 无 token、配置齐 → needsLogin（snapshot 为空）", () => {
    const store = makeStore();
    expect(store.phase).toBe("needsLogin" satisfies SessionPhase);
    expect(store.snapshot()).toBeUndefined();
  });

  it("init 有 token+快照 → ready", () => {
    const tokenStore = createInMemoryTokenStore();
    tokenStore.setToken("tok");
    setStorageSync(
      "corekit.session",
      JSON.stringify({ user, tenants: [membership], currentTenantId: "t1" }),
    );
    const store = new SessionStore({
      tokenStore,
      apiBaseUrl: API_BASE,
      clientId: "saas-console",
    });
    expect(store.phase).toBe("ready");
    expect(store.snapshot()?.currentTenantId).toBe("t1");
  });

  it("重生：同一 fake storage 重 init 断言复原（user/tenants/currentTenantId/expiresAt，日期 revive 钉死）", () => {
    const tokenStore = createInMemoryTokenStore();
    const first = new SessionStore({
      tokenStore,
      apiBaseUrl: API_BASE,
      clientId: "saas-console",
    });
    first.adoptLogin(loginRes());
    first.adoptSwitch(switchRes());
    expect(first.phase).toBe("ready");

    // 同一 storage（tokenStore + Taro storage map）重建实例 = 冷启重生
    const second = new SessionStore({
      tokenStore,
      apiBaseUrl: API_BASE,
      clientId: "saas-console",
    });
    expect(second.phase).toBe("ready");
    expect(second.snapshot()?.user.username).toBe("alice");
    expect(second.snapshot()?.tenants).toHaveLength(1);
    expect(second.snapshot()?.currentTenantId).toBe("t2");
    // JSON 往返后日期字段必须 revive 回 Date——DATE_KEYS 摘除即此三条全红
    expect(second.snapshot()?.user.createdAt).toEqual(new Date("2026-01-01T00:00:00Z"));
    expect(second.snapshot()?.tenants[0]?.joinedAt).toEqual(
      new Date("2026-01-01T00:00:00Z"),
    );
    expect(second.snapshot()?.expiresAt).toEqual(new Date("2026-02-01T00:00:00Z"));
  });

  it("apiBaseUrl thunk 抛错 → needsSetup（即便 token+快照在位，swift isConfigured false 口径）", () => {
    const tokenStore = createInMemoryTokenStore();
    tokenStore.setToken("tok");
    setStorageSync(
      "corekit.session",
      JSON.stringify({ user, tenants: [membership], currentTenantId: "t1" }),
    );
    const store = new SessionStore({
      tokenStore,
      apiBaseUrl: () => {
        throw new Error("TARO_APP_API_BASE_URL 缺失");
      },
      clientId: "saas-console",
    });
    expect(store.phase).toBe("needsSetup");

    const unconfigured = new SessionStore({
      tokenStore: createInMemoryTokenStore(),
      apiBaseUrl: () => {
        throw new Error("TARO_APP_API_BASE_URL 缺失");
      },
      clientId: "saas-console",
    });
    expect(unconfigured.phase).toBe("needsSetup");
  });

  it("adoptLogin 存双 token+快照（user/availableTenants/currentTenantId）→ ready + Bearer 重注", () => {
    const tokenStore = createInMemoryTokenStore();
    const store = makeStore(tokenStore);
    store.adoptLogin(loginRes());
    expect(store.phase).toBe("ready");
    expect(tokenStore.getToken()).toBe("tok");
    expect(tokenStore.getRefreshToken()).toBe("ref");
    expect(store.snapshot()?.user.id).toBe("u1");
    expect(store.snapshot()?.tenants).toEqual([membership]);
    expect(store.snapshot()?.currentTenantId).toBe("t1");
    expect(storage.get("corekit.session")).toBeTruthy();
    expect(authHeader()).toBe("Bearer tok");
  });

  it("adoptLogin 失败口径：res 无 accessToken → throw，phase 保持 needsLogin、store 不动", () => {
    const tokenStore = createInMemoryTokenStore();
    const store = makeStore(tokenStore);
    expect(() => store.adoptLogin(loginRes({ accessToken: undefined }))).toThrow(
      /accessToken/,
    );
    expect(store.phase).toBe("needsLogin");
    expect(tokenStore.getToken()).toBeUndefined();
    expect(tokenStore.getRefreshToken()).toBeUndefined();
    expect(store.snapshot()).toBeUndefined();
    expect(storage.has("corekit.session")).toBe(false);
  });

  it("adoptLogin refreshToken 缺席 → 旧 refresh 清空（swift :110-116 双分支）", () => {
    const tokenStore = createInMemoryTokenStore();
    tokenStore.setToken("old");
    tokenStore.setRefreshToken("oldRef");
    const store = makeStore(tokenStore);
    store.adoptLogin(loginRes({ refreshToken: undefined }));
    expect(tokenStore.getToken()).toBe("tok");
    expect(tokenStore.getRefreshToken()).toBeUndefined();
  });

  it("adoptSwitch 换发 token + 更新 currentTenantId + expiresAt 随快照", () => {
    const tokenStore = createInMemoryTokenStore();
    const store = makeStore(tokenStore);
    store.adoptLogin(loginRes());
    store.adoptSwitch(switchRes());
    expect(tokenStore.getToken()).toBe("tok2");
    expect(tokenStore.getRefreshToken()).toBe("ref2");
    expect(store.snapshot()?.currentTenantId).toBe("t2");
    expect(store.snapshot()?.expiresAt).toEqual(new Date("2026-02-01T00:00:00Z"));
    expect(store.snapshot()?.user.id).toBe("u1");
    expect(store.phase).toBe("ready");
    expect(authHeader()).toBe("Bearer tok2");
  });

  it("adoptSwitch 失败口径：无 accessToken → 保旧（一个字节都不动）", () => {
    const tokenStore = createInMemoryTokenStore();
    const store = makeStore(tokenStore);
    store.adoptLogin(loginRes());
    expect(() => store.adoptSwitch(switchRes({ accessToken: "" }))).toThrow(
      /accessToken/,
    );
    expect(tokenStore.getToken()).toBe("tok");
    expect(tokenStore.getRefreshToken()).toBe("ref");
    expect(store.snapshot()?.currentTenantId).toBe("t1");
    expect(store.phase).toBe("ready");
    expect(authHeader()).toBe("Bearer tok");
  });

  it("adoptSwitch 未登录（needsLogin）→ throw 且不动", () => {
    const tokenStore = createInMemoryTokenStore();
    const store = makeStore(tokenStore);
    expect(() => store.adoptSwitch(switchRes())).toThrow(/未登录|ready/);
    expect(tokenStore.getToken()).toBeUndefined();
    expect(store.phase).toBe("needsLogin");
  });

  it("adoptLogout 清 token+快照回 needsLogin，Authorization 头摘除", () => {
    const tokenStore = createInMemoryTokenStore();
    const store = makeStore(tokenStore);
    store.adoptLogin(loginRes());
    store.adoptLogout();
    expect(store.phase).toBe("needsLogin");
    expect(tokenStore.getToken()).toBeUndefined();
    expect(tokenStore.getRefreshToken()).toBeUndefined();
    expect(store.snapshot()).toBeUndefined();
    expect(storage.has("corekit.session")).toBe(false);
    expect(authHeader()).toBeNull();
  });

  it("refreshTenants 真值覆盖 + 写穿 storage（swift :212-224，空数组也照写）", () => {
    const store = makeStore();
    store.adoptLogin(loginRes());
    store.refreshTenants([]);
    expect(store.snapshot()?.tenants).toEqual([]);
    const persisted = JSON.parse(storage.get("corekit.session") ?? "{}") as {
      tenants?: unknown;
    };
    expect(persisted.tenants).toEqual([]);
  });

  it("refreshTenants 未登录（needsLogin）→ throw 且 store 不动", () => {
    const store = makeStore();
    expect(() => store.refreshTenants([membership])).toThrow(/未登录|ready/);
    expect(store.snapshot()).toBeUndefined();
  });
});

import { useCallback, useRef, useState } from "react";
import type { CurrentUser, SysUser, TenantMembership } from "../generated";
import { AuthApi } from "../generated/apis/AuthApi";
import { MeApi } from "../generated/apis/MeApi";
import { apiBaseUrl } from "../config/app-config";
import { currentConfig } from "./api-client";
import { errorMessage } from "./error-message";
import type { SessionPhase, SessionSnapshot } from "./session-store";
import { SessionStore } from "./session-store";
import { createTaroTokenStore } from "./token-store";

/**
 * useAuth——swift AuthViewModel.swift 动作面的 React 等价（knife2 Task 2）：
 * login :64（clientId 前置 fail-fast→adoptLogin，ADR-0019）/ whoami :84（失败
 * user 保持）/ switchTenant :102（adoptSwitch→重拉 whoami）/ listTenants :119
 * （真值覆盖，失败返 undefined 与空数组区分）/ logout :133（服务端尽力而为 +
 * 本地清理强制，未登录守卫随 swift AccountView :31-35）。
 *
 * 错误文案映射走 error-message.ts 的 errorMessage（swift message(of:) :141-146
 * 同构）。失败落 error 态并
 * reject（login/whoami/switchTenant）；listTenants 契约返回 undefined 不 reject；
 * logout 永不 reject。401 拦截在桥层（taro-fetch setOnUnauthorized，D3），
 * 本层不感知 401，页面禁各自处理。
 *
 * mock 纪律：seams 只注入生成 API 方法面（Pick<AuthApi/MeApi,…>），测试传
 * fake；不注入时每次动作按调用时刻 currentConfig() 现配生成实例——login/切租户
 * 后 Bearer 重注换的是新 Configuration 对象。
 */

export interface AuthSeams {
  auth: Pick<AuthApi, "sessionsLogin" | "sessionsLogout">;
  me: Pick<MeApi, "meWhoami" | "meListMyTenants" | "meSwitchTenant">;
}

export interface UseAuthOptions {
  /** 缺省用进程级共享 SessionStore（App 层单例）；测试注入内存缝。 */
  store?: SessionStore;
  /** 缺省现配生成 AuthApi/MeApi；测试注入 fake（seams 缝级 mock）。 */
  seams?: AuthSeams;
}

export interface UseAuthResult {
  phase: SessionPhase;
  /** 登录快照用户（username 口径）+ whoami 的 email 覆写（D6）。 */
  user?: SysUser;
  tenants: TenantMembership[];
  currentTenantId?: string;
  error?: string;
  login(username: string, password: string): Promise<void>;
  whoami(): Promise<void>;
  switchTenant(tenantId: string): Promise<void>;
  /** 失败返回 undefined（与空数组区分，swift nil 同款），旧列表保留。 */
  listTenants(): Promise<TenantMembership[] | undefined>;
  logout(): Promise<void>;
}

let sharedStore: SessionStore | undefined;

/** 进程级共享 store（App 层单例）；apiBaseUrl 走 thunk 缺失时由 SessionStore
 * 判 needsSetup，此处不做 env 兜底（suite-hard-rules §1）。App 层 401 回调与
 * 启动跳板经此取同一实例（T4 接线），页面经 useAuth 缺省也落到它。 */
export function sharedSessionStore(clientId: string): SessionStore {
  if (!sharedStore) {
    sharedStore = new SessionStore({
      tokenStore: createTaroTokenStore(),
      apiBaseUrl,
      clientId,
    });
  }
  return sharedStore;
}

function defaultSeams(): AuthSeams {
  // fail-fast（T2 挂账 minor）：bootstrap 未跑就现配 API 会静默打到空 basePath，宁可早炸
  const config = currentConfig();
  if (!config) {
    throw new Error(
      "currentConfig() 缺失：先 bootstrap(baseURL) 再发请求（禁默认值兜底，suite-hard-rules §1）",
    );
  }
  return { auth: new AuthApi(config), me: new MeApi(config) };
}

interface SessionView {
  phase: SessionPhase;
  snapshot: SessionSnapshot | undefined;
}

export function useAuth(clientId: string, options?: UseAuthOptions): UseAuthResult {
  // store 一经首渲染钉死（useState initializer 只跑一次），options 走 ref 免闭包陈旧
  const [store] = useState(() => options?.store ?? sharedSessionStore(clientId));
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const seamsOf = () => optionsRef.current?.seams ?? defaultSeams();

  const [view, setView] = useState<SessionView>(() => ({
    phase: store.phase,
    snapshot: store.snapshot(),
  }));
  const [whoamiUser, setWhoamiUser] = useState<CurrentUser | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  const sync = useCallback(() => {
    setView({ phase: store.phase, snapshot: store.snapshot() });
  }, [store]);

  const whoami = useCallback(async (): Promise<void> => {
    try {
      const u = await seamsOf().me.meWhoami();
      setWhoamiUser(u);
      setError(undefined);
    } catch (e) {
      // 失败 user 保持（swift :91-94 不兜底清空）
      setError(errorMessage(e));
      throw e;
    } finally {
      sync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, sync]);

  const login = useCallback(
    async (username: string, password: string): Promise<void> => {
      // clientId 前置炸（ADR-0019）：请求不发、store 不动
      if (!clientId.trim()) {
        const msg = "clientId 未配置，请先完成配置";
        setError(msg);
        throw new Error(msg);
      }
      try {
        const res = await seamsOf().auth.sessionsLogin({
          loginRequest: { username, password, clientId },
        });
        store.adoptLogin(res);
        setError(undefined);
      } catch (e) {
        setError(errorMessage(e));
        throw e;
      } finally {
        sync();
      }
    },
    [clientId, store, sync],
  );

  const switchTenant = useCallback(
    async (tenantId: string): Promise<void> => {
      try {
        const res = await seamsOf().me.meSwitchTenant({ tenantId });
        store.adoptSwitch(res);
        setError(undefined);
      } catch (e) {
        // adoptSwitch fail-fast 在前，失败 store 未动、旧会话保原样可重试
        setError(errorMessage(e));
        throw e;
      } finally {
        sync();
      }
      // 成功后重拉 whoami 反映新上下文（swift :108 `_ = await whoami()`）——
      // 重拉失败不影响切换已成功
      try {
        await whoami();
      } catch {
        /* 尽力而为 */
      }
    },
    [store, sync, whoami],
  );

  const listTenants = useCallback(async (): Promise<TenantMembership[] | undefined> => {
    try {
      const tenants = await seamsOf().me.meListMyTenants();
      store.refreshTenants(tenants);
      setError(undefined);
      return tenants;
    } catch (e) {
      // 返回 undefined 与空数组区分（swift nil 同款），旧列表保留
      setError(errorMessage(e));
      return undefined;
    } finally {
      sync();
    }
  }, [store, sync]);

  const logout = useCallback(async (): Promise<void> => {
    // 守卫（swift AccountView :31-35 同款）：无会话就没啥可吊销的，不发服务端请求
    try {
      if (store.phase === "ready") {
        await seamsOf().auth.sessionsLogout();
      }
    } catch {
      // 服务端吊销尽力而为（swift try? 同款），不拦本地清理
    }
    setWhoamiUser(undefined);
    store.adoptLogout(); // 本地清理强制
    setError(undefined);
    sync();
  }, [store, sync]);

  const snapshotUser = view.snapshot?.user;
  const user: SysUser | undefined = snapshotUser
    ? { ...snapshotUser, email: whoamiUser?.email ?? snapshotUser.email }
    : undefined;

  return {
    phase: view.phase,
    user,
    tenants: view.snapshot?.tenants ?? [],
    currentTenantId: view.snapshot?.currentTenantId,
    error,
    login,
    whoami,
    switchTenant,
    listTenants,
    logout,
  };
}

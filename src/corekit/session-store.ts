import Taro from "@tarojs/taro";
import type {
  LoginResponse,
  SwitchTenantResponse,
  SysUser,
  TenantMembership,
} from "../generated";
import { bootstrap } from "./api-client";
import type { TokenStore } from "./token-store";

/**
 * 会话状态机（lab/swift SessionStore 同构，REQ-2026-001 T-2；saas 契约形状适配）。
 * needsSetup=未配后端（baseURL/clientId 任一缺）；needsLogin=配置齐无会话（登录页）；
 * ready=已登录。token/refreshToken 走 TokenStore 注入缝（App 层绑 Taro storage，
 * 测试绑内存 fake）；baseURL/clientId 由构造注入（本刀编译期钉 saas-console，D6）；
 * 会话快照（user/tenants，非密）落 Taro storage `corekit.session`——都是用户显式
 * 登录的持久化，不是代码默认值兜底（§1 / ADR-0019）。
 * 状态派生随 swift SessionStore.swift:56-74；adoptLogin :108-116；adoptSwitch
 * :139-170；登出清账 :228-248。401 失效与登出共用 adoptLogout 语义（AC-4/AC-5）。
 */

export type SessionPhase = "needsSetup" | "needsLogin" | "ready";

const SESSION_KEY = "corekit.session";

/** 会话快照（非密态）：登录响应里的用户与租户成员关系 + 当前租户上下文 +
 * 切换租户换发 token 的过期时刻（可选，老快照缺字段可解码，REQ-2026-002 Q2）。 */
export interface SessionSnapshot {
  user: SysUser;
  tenants: TenantMembership[];
  currentTenantId?: string;
  expiresAt?: Date;
}

/** 日期字段还原：JSON 往返后 ISO 串 revive 回 Date（swift JSONDecoder 同责）。 */
const DATE_KEYS = new Set([
  "expiresAt",
  "joinedAt",
  "createdAt",
  "updatedAt",
  "lockedUntil",
]);

export class SessionStore {
  private readonly tokenStore: TokenStore;
  private readonly apiBaseUrl: string | (() => string);
  private readonly clientId: string;
  private _phase: SessionPhase;
  private _snapshot?: SessionSnapshot;

  constructor(options: {
    tokenStore: TokenStore;
    apiBaseUrl: string | (() => string);
    clientId: string;
  }) {
    this.tokenStore = options.tokenStore;
    this.apiBaseUrl = options.apiBaseUrl;
    this.clientId = options.clientId;

    const token = this.tokenStore.getToken();
    const configured = this.isConfigured();

    if (token && token.trim()) {
      const snapshot = this.readSnapshot();
      if (snapshot) {
        this._snapshot = snapshot;
      }
      this._phase = configured ? "ready" : "needsSetup";
    } else {
      // 密态缺失：上一任会话快照不许呈现（失效即回登录页，AC-5）。
      this.tokenStore.clear();
      Taro.removeStorageSync(SESSION_KEY);
      this._snapshot = undefined;
      this._phase = configured ? "needsLogin" : "needsSetup";
    }
  }

  get phase(): SessionPhase {
    return this._phase;
  }

  snapshot(): SessionSnapshot | undefined {
    return this._snapshot;
  }

  /** 登录成功后的入账（swift :104-132）：token 对落缝 + 快照落 storage + Bearer
   * 重注，状态进 ready。响应缺 accessToken = 不入账（fail-fast，不留半会话）。 */
  adoptLogin(response: LoginResponse): void {
    const accessToken = response.accessToken;
    if (!accessToken || !accessToken.trim()) {
      throw new Error("登录响应缺 accessToken（fail-fast 不入半会话）");
    }
    this.tokenStore.setToken(accessToken);
    const refreshToken = response.refreshToken;
    if (refreshToken && refreshToken.trim()) {
      this.tokenStore.setRefreshToken(refreshToken);
    } else {
      // 缺 refresh：旧值不许残留（swift :114 同款 delete 分支）
      this.clearRefreshOnly();
    }
    this._snapshot = {
      user: response.user,
      tenants: response.availableTenants,
      currentTenantId: response.currentTenantId,
    };
    this.writeSnapshot();
    this.reBootstrap(accessToken);
    this._phase = "ready";
  }

  /** 切换租户入账（swift :139-170）：SwitchTenantResponse 换发新 token 对，
   * user/tenants 不变；currentTenantId 更新、expiresAt 随快照记录、Bearer 重注，
   * phase 保持 ready。缺 accessToken 或未登录 = fail-fast 一个字节都不动（AC-3）。 */
  adoptSwitch(response: SwitchTenantResponse): void {
    if (this._phase !== "ready") {
      throw new Error("未登录，不能切换租户（需 ready）");
    }
    if (!response.accessToken || !response.accessToken.trim()) {
      throw new Error("切换响应缺 accessToken（fail-fast 保旧会话）");
    }
    this.tokenStore.setToken(response.accessToken);
    if (response.refreshToken && response.refreshToken.trim()) {
      this.tokenStore.setRefreshToken(response.refreshToken);
    } else {
      this.clearRefreshOnly();
    }
    this._snapshot = this._snapshot
      ? {
          ...this._snapshot,
          currentTenantId: response.tenantId,
          expiresAt: response.expiresAt,
        }
      : undefined;
    this.writeSnapshot();
    this.reBootstrap(response.accessToken);
  }

  /** 登出/401 失效共用（swift logout :227-238）：清密态 + 快照，留配置直接回登录页。
   * 本地清理强制；服务端调用尽力而为属调用方（Task 2 动作面）职责。 */
  adoptLogout(): void {
    this.tokenStore.clear();
    Taro.removeStorageSync(SESSION_KEY);
    this._snapshot = undefined;
    this._phase = "needsLogin";
    this.reBootstrap(undefined);
  }

  private isConfigured(): boolean {
    let baseURL: string;
    try {
      baseURL =
        typeof this.apiBaseUrl === "function" ? this.apiBaseUrl() : this.apiBaseUrl;
    } catch {
      return false;
    }
    return Boolean(baseURL.trim()) && Boolean(this.clientId.trim());
  }

  /** 重注/摘除 Bearer（swift :129/:168/:237 同位）：失败不掩盖入账成功。 */
  private reBootstrap(token: string | undefined): void {
    let baseURL: string;
    try {
      baseURL =
        typeof this.apiBaseUrl === "function" ? this.apiBaseUrl() : this.apiBaseUrl;
    } catch {
      return;
    }
    if (!baseURL.trim()) return;
    try {
      bootstrap(baseURL, token);
    } catch {
      // baseURL 已过校验；仅 Bearer 重注失败时不掩盖登录/切换成功
    }
  }

  private clearRefreshOnly(): void {
    // TokenStore 缝无单键 delete（随 swift KeychainTokenStore 面窄化），借 clear+重写
    const token = this.tokenStore.getToken();
    this.tokenStore.clear();
    if (token) this.tokenStore.setToken(token);
  }

  private writeSnapshot(): void {
    if (!this._snapshot) return;
    try {
      Taro.setStorageSync(SESSION_KEY, JSON.stringify(this._snapshot));
    } catch {
      // 快照落盘尽力而为（swift try? encode 同款）；内存态已是真相
    }
  }

  private readSnapshot(): SessionSnapshot | undefined {
    try {
      const raw = Taro.getStorageSync(SESSION_KEY);
      if (typeof raw !== "string" || !raw) return undefined;
      const parsed = JSON.parse(raw, (key, value) =>
        DATE_KEYS.has(key) && typeof value === "string" ? new Date(value) : value,
      ) as SessionSnapshot;
      if (!parsed || typeof parsed !== "object" || !parsed.user) return undefined;
      return parsed;
    } catch {
      return undefined;
    }
  }
}

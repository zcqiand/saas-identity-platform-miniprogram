import { useCallback, useRef, useState } from "react";
import type { TokenResponse } from "../generated";
import { OauthApi } from "../generated/apis/OauthApi";
import { AuthorizeCodeRequestResponseTypeEnum } from "../generated/models/AuthorizeCodeRequest";
import { TokenRequestGrantTypeEnum } from "../generated/models/TokenRequest";
import { CLIENT_ID } from "../config/client";
import { currentConfig } from "./api-client";
import { errorMessage } from "./error-message";
import type { SessionStore } from "./session-store";
import { sharedSessionStore } from "./use-auth";

/**
 * useOAuth——swift OAuthViewModel 三步流（knife4 Task 2，M04.F03.I01-I02）：
 * authorize（签发授权码，CSRF state 回传校验）/ exchangeCode（授权码换 token，
 * adoptOAuthToken 入账）/ refreshToken（轮换全新对替换）。redirectUri/scope 随
 * swift OAuthViewModel 常量；state 用 Math.random 十六进制拼 uuid v4 形状——
 * weapp 无 crypto.randomUUID，禁引依赖。
 *
 * 动作统一 `phase: "idle" | "busy" | "failed"` 三态 + `error?: string`，返回
 * `Promise<boolean>`；错误文案统一走 errorMessage（knife3 公共提取件）；失败不
 * throw 出 hook 边界（seamsOf 配置缺失 throw 例外，照 use-roles T6）。busy 期
 * 再入动作直接返回 false（busyRef 守卫，不发请求不覆盖错误态）。
 *
 * clientSecret 恒不传：saas-console 是公共 client（无 secret），token 请求体
 * 只带 grantType 必需键面——hook 不注入任何默认凭据（ADR-0019 / §1 同源纪律）。
 * refreshToken 的来源 = 当前 hook 态 token.refreshToken（swift 同款：首轮
 * exchange 后必有；尚无 token 时 fail-fast「尚无 refresh token，请先换 token」）。
 *
 * mock 纪律：seams 只注入生成 API 方法面（Pick<OauthApi,…>），测试传 fake；
 * store 构造注入，缺省进程级共享 store（use-auth sharedSessionStore + CLIENT_ID，
 * App 层单例同一实例）。
 */

// 再出口消费面类型（页面只认 hook 模块，不必各自摸生成物）
export type { TokenResponse } from "../generated";

export const OAUTH_REDIRECT_URI = "saasidentity://oauth/callback";
export const OAUTH_DEFAULT_SCOPE = "openid";

/** uuid v4 形状（8-4-4-4-12 十六进制）：Math.random 每 4 位一签，禁引依赖。 */
export function generateOAuthState(): string {
  const hex4 = () =>
    Math.floor(Math.random() * 0x10000)
      .toString(16)
      .padStart(4, "0");
  return `${hex4()}${hex4()}-${hex4()}-${hex4()}-${hex4()}-${hex4()}${hex4()}${hex4()}`;
}

export interface OAuthSeams {
  oauth: Pick<OauthApi, "oAuthAuthorize" | "oAuthToken">;
}

export type OAuthPhase = "idle" | "busy" | "failed";

export interface UseOAuthOptions {
  /** 缺省用进程级共享 SessionStore（App 层单例）；测试注入内存缝。 */
  store?: SessionStore;
  /** 缺省现配生成 OauthApi；测试注入 fake（seams 缝级 mock）。 */
  seams?: OAuthSeams;
}

function defaultSeams(): OAuthSeams {
  // fail-fast（T2/T4 形状）：bootstrap 未跑就现配 API 会静默打到空 basePath，宁可早炸
  const config = currentConfig();
  if (!config) {
    throw new Error(
      "currentConfig() 缺失：先 bootstrap(baseURL) 再发请求（禁默认值兜底，suite-hard-rules §1）",
    );
  }
  return { oauth: new OauthApi(config) };
}

export function useOAuth(
  clientId: string,
  options?: UseOAuthOptions,
): {
  phase: OAuthPhase;
  error?: string;
  code: string | null;
  state: string | null;
  token: TokenResponse | null;
  authorize(): Promise<boolean>;
  exchangeCode(): Promise<boolean>;
  refreshToken(): Promise<boolean>;
} {
  // store 一经首渲染钉死（useState initializer 只跑一次），options 走 ref 免闭包陈旧
  const [store] = useState(() => options?.store ?? sharedSessionStore(CLIENT_ID));
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const seamsOf = () => optionsRef.current?.seams ?? defaultSeams();

  const [code, setCode] = useState<string | null>(null);
  const [state, setState] = useState<string | null>(null);
  const [token, setToken] = useState<TokenResponse | null>(null);
  const [phase, setPhase] = useState<OAuthPhase>("idle");
  const [error, setError] = useState<string | undefined>(undefined);

  // busy 期再入守卫：ref 而非 phase 态（setState 异步，同 tick 连发拦不住）
  const busyRef = useRef(false);

  const authorize = useCallback(async (): Promise<boolean> => {
    if (busyRef.current) return false;
    const api = seamsOf().oauth;
    busyRef.current = true;
    setPhase("busy");
    try {
      // state 先落 hook 态再发送：回显与 CSRF 校验同源（本次发送值即真值）
      const sent = generateOAuthState();
      setState(sent);
      const res = await api.oAuthAuthorize({
        authorizeCodeRequest: {
          clientId,
          redirectUri: OAUTH_REDIRECT_URI,
          responseType: AuthorizeCodeRequestResponseTypeEnum.Code,
          scope: OAUTH_DEFAULT_SCOPE,
          state: sent,
        },
      });
      if (res.state !== sent) {
        // CSRF fail-fast：授权码丢弃，不发后续 token 请求。残留 code/state 一并
        // 清空（swift OAuthViewModel :71-74 失败路径显式置 nil），与「已丢弃授权
        // 码」文案同义——否则旧码可被下一次 exchange 误用
        setCode(null);
        setState(null);
        setError("state 回传不一致（疑似 CSRF），已丢弃授权码");
        setPhase("failed");
        return false;
      }
      setCode(res.code);
      setError(undefined);
      setPhase("idle");
      return true;
    } catch (e) {
      // 异常路径同样清残留（swift :82-85 同款置 nil）：签发没成，旧码不留
      setCode(null);
      setState(null);
      setError(errorMessage(e));
      setPhase("failed");
      return false;
    } finally {
      busyRef.current = false;
    }
  }, [clientId]);

  const exchangeCode = useCallback(async (): Promise<boolean> => {
    if (busyRef.current) return false;
    if (!code) {
      setError("尚无授权码，请先签发");
      setPhase("failed");
      return false;
    }
    const api = seamsOf().oauth;
    busyRef.current = true;
    setPhase("busy");
    try {
      // 公共 client：恒不带 clientSecret（hook 不注入任何默认凭据）
      const res = await api.oAuthToken({
        tokenRequest: {
          grantType: TokenRequestGrantTypeEnum.AuthorizationCode,
          code,
          clientId,
          redirectUri: OAUTH_REDIRECT_URI,
        },
      });
      store.adoptOAuthToken(res); // T1：token 对落缝 + Bearer 重注（fail-fast 原样冒泡）
      setToken(res);
      setError(undefined);
      setPhase("idle");
      return true;
    } catch (e) {
      setError(errorMessage(e));
      setPhase("failed");
      return false;
    } finally {
      busyRef.current = false;
    }
  }, [clientId, code, store]);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (busyRef.current) return false;
    // 来源 = 当前 hook 态 token.refreshToken（swift OAuthViewModel 同款）
    const current = token?.refreshToken;
    if (!current) {
      setError("尚无 refresh token，请先换 token");
      setPhase("failed");
      return false;
    }
    const api = seamsOf().oauth;
    busyRef.current = true;
    setPhase("busy");
    try {
      const res = await api.oAuthToken({
        tokenRequest: {
          grantType: TokenRequestGrantTypeEnum.RefreshToken,
          refreshToken: current,
          clientId,
        },
      });
      store.adoptOAuthToken(res); // 轮换：全新对替换
      setToken(res);
      setError(undefined);
      setPhase("idle");
      return true;
    } catch (e) {
      setError(errorMessage(e));
      setPhase("failed");
      return false;
    } finally {
      busyRef.current = false;
    }
  }, [clientId, token, store]);

  return { phase, error, code, state, token, authorize, exchangeCode, refreshToken };
}

import { useCallback, useRef, useState } from "react";
import type {
  SubscribeTenantApplicationRequest,
  TenantApplication,
  TenantApplicationsListTenantApplications200Response,
  UpdateTenantApplicationRequest,
} from "../generated";
import { TenantApplicationsApi } from "../generated/apis/TenantApplicationsApi";
import { CLIENT_ID } from "../config/client";
import { currentConfig } from "./api-client";
import { errorMessage } from "./error-message";
import type { SessionStore } from "./session-store";
import { sharedSessionStore } from "./use-auth";

/**
 * useTenantApplications——swift 订阅应用面动作的 React 等价（knife3 Task 8，
 * M00.F05.I01-I04，REQ-2026-003）：
 * - load：列出租户当前订阅的全部应用（I01；currentTenantId 缺失 fail-fast
 *   「未选择租户，无法加载订阅应用」不发请求，use-members 同款 Q1 形状）
 * - subscribe（I02）：POST 成功响应体 TenantApplication 原位追加，不重拉列表；
 *   未知 clientId 404 / 重复订阅 400 的红字如实呈现（errorMessage），不猜语义
 * - update（I03）：PATCH partial——undefined 参数不进请求体（expireTime 不传
 *   =不改）；成功响应体按 clientId 原位替换
 * - remove（I04）：DELETE 204 → 本地按 clientId 移除；路径 clientId 是字符串
 *   寻址非 UUID（Review Focus 5），参数原样透传不做格式加工
 * - 动作统一 `phase: "idle" | "busy" | "failed"` 三态 + `error?: string`，
 *   返回 `Promise<boolean>`；错误文案统一走 errorMessage；失败不 throw 出
 *   hook 边界（seamsOf 配置缺失 throw 例外，照 T2 准绳）
 * - wire 日期形态：生成物 runtime 已配日期解析（刀 1 桥层口径），hook 不自写
 *   formatter，expireTime 以 Date 直传
 *
 * mock 纪律：seams 只注入生成 API 方法面（Pick<TenantApplicationsApi,…>），
 * 测试传 fake；store 构造注入，缺省进程级共享 store（use-auth
 * sharedSessionStore + CLIENT_ID，App 层单例同一实例）。
 */

// 再出口消费面类型（页面只认 hook 模块，不必各自摸生成物）
export type {
  SubscribeTenantApplicationRequest,
  TenantApplication,
  TenantApplicationsListTenantApplications200Response,
  UpdateTenantApplicationRequest,
} from "../generated";

export interface TenantApplicationsSeams {
  apps: Pick<
    TenantApplicationsApi,
    | "tenantApplicationsListTenantApplications"
    | "tenantApplicationsSubscribeTenantApplication"
    | "tenantApplicationsUpdateTenantApplication"
    | "tenantApplicationsRemoveTenantApplication"
  >;
}

export type TenantApplicationsPhase = "idle" | "busy" | "failed";

export interface UseTenantApplicationsOptions {
  /** 缺省用进程级共享 SessionStore（App 层单例）；测试注入内存缝。 */
  store?: SessionStore;
  /** 缺省现配生成 TenantApplicationsApi；测试注入 fake（seams 缝级 mock）。 */
  seams?: TenantApplicationsSeams;
}

function defaultSeams(): TenantApplicationsSeams {
  // fail-fast（T2/T4 形状）：bootstrap 未跑就现配 API 会静默打到空 basePath，宁可早炸
  const config = currentConfig();
  if (!config) {
    throw new Error(
      "currentConfig() 缺失：先 bootstrap(baseURL) 再发请求（禁默认值兜底，suite-hard-rules §1）",
    );
  }
  return { apps: new TenantApplicationsApi(config) };
}

export function useTenantApplications(options?: UseTenantApplicationsOptions): {
  applications: TenantApplication[];
  phase: TenantApplicationsPhase;
  error?: string;
  load(): Promise<boolean>;
  subscribe(clientId: string, expireTime?: Date): Promise<boolean>;
  update(clientId: string, status?: number, expireTime?: Date): Promise<boolean>;
  remove(clientId: string): Promise<boolean>;
} {
  // store 一经首渲染钉死（useState initializer 只跑一次），options 走 ref 免闭包陈旧
  const [store] = useState(() => options?.store ?? sharedSessionStore(CLIENT_ID));
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const seamsOf = () => optionsRef.current?.seams ?? defaultSeams();

  const [applications, setApplications] = useState<TenantApplication[]>([]);
  const [phase, setPhase] = useState<TenantApplicationsPhase>("idle");
  const [error, setError] = useState<string | undefined>(undefined);

  // 租户作用域真源 = 会话快照 currentTenantId，动作时刻现读（不缓存渲染时值）
  const tenantIdOf = () => store.snapshot()?.currentTenantId;
  const noTenantFail = (action: string) => {
    setError(`未选择租户，${action}`);
    setPhase("failed");
  };

  const replaceRow = useCallback((row: TenantApplication) => {
    // 路径寻址键是 clientId（字符串，非 UUID），不按 id 替换
    setApplications((prev) => prev.map((a) => (a.clientId === row.clientId ? row : a)));
  }, []);

  // @impl M00.F05.I01 — 订阅应用列表
  const load = useCallback(async (): Promise<boolean> => {
    const tenantId = tenantIdOf();
    if (!tenantId) {
      noTenantFail("无法加载订阅应用");
      return false;
    }
    const seams = seamsOf();
    setPhase("busy");
    try {
      const res: TenantApplicationsListTenantApplications200Response =
        await seams.apps.tenantApplicationsListTenantApplications({ tenantId });
      setApplications(res.items);
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

  // @impl M00.F05.I02 — 订阅应用（成功原位追加，不重拉列表）
  const subscribe = useCallback(
    async (clientId: string, expireTime?: Date): Promise<boolean> => {
      const tenantId = tenantIdOf();
      if (!tenantId) {
        noTenantFail("无法订阅应用");
        return false;
      }
      const request: SubscribeTenantApplicationRequest = { clientId };
      if (expireTime !== undefined) request.expireTime = expireTime;
      const seams = seamsOf();
      setPhase("busy");
      try {
        const created = await seams.apps.tenantApplicationsSubscribeTenantApplication({
          tenantId,
          subscribeTenantApplicationRequest: request,
        });
        setApplications((prev) => [...prev, created]);
        setError(undefined);
        setPhase("idle");
        return true;
      } catch (e) {
        // 未知 clientId 404 / 重复订阅 400 裸 SQL 泄漏红字如实呈现，不猜语义
        setError(errorMessage(e));
        setPhase("failed");
        return false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // @impl M00.F05.I03 — 更新订阅（PATCH partial：undefined 字段不进请求体，
  // expireTime 不传=不改；成功响应体按 clientId 原位替换）
  const update = useCallback(
    async (clientId: string, status?: number, expireTime?: Date): Promise<boolean> => {
      const tenantId = tenantIdOf();
      if (!tenantId) {
        noTenantFail("无法更新应用订阅");
        return false;
      }
      // PATCH partial：status/expireTime undefined 不进请求体。status 省略的
      // wire 可移植性未实证（springboot 生成 DTO status 带 @NotNull，无 status
      // 的 PATCH 会 400；CT I76 只实证过 expireTime 省略）——页面接线约定始终
      // 传当前 status，省略路径仅为 hook 能力。按 partial 构造后窄化：键缺席
      // 而非 undefined 占位，序列化与缝级测试都干净
      const request = {} as UpdateTenantApplicationRequest;
      if (status !== undefined) request.status = status;
      if (expireTime !== undefined) request.expireTime = expireTime;
      const seams = seamsOf();
      setPhase("busy");
      try {
        const updated = await seams.apps.tenantApplicationsUpdateTenantApplication({
          tenantId,
          clientId,
          updateTenantApplicationRequest: request,
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

  // @impl M00.F05.I04 — 移除订阅（DELETE 204 → 本地按 clientId 移除，不删应用本体）
  const remove = useCallback(
    async (clientId: string): Promise<boolean> => {
      const tenantId = tenantIdOf();
      if (!tenantId) {
        noTenantFail("无法移除应用订阅");
        return false;
      }
      const seams = seamsOf();
      setPhase("busy");
      try {
        await seams.apps.tenantApplicationsRemoveTenantApplication({
          tenantId,
          clientId,
        });
        setApplications((prev) => prev.filter((a) => a.clientId !== clientId));
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

  return { applications, phase, error, load, subscribe, update, remove };
}

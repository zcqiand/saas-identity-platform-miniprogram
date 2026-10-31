import { useCallback, useRef, useState } from "react";
import type {
  AdminTenantsListTenants200Response,
  CreateTenantRequest,
  Tenant,
  UpdateTenantRequest,
} from "../generated";
import { AdminTenantsApi } from "../generated/apis/AdminTenantsApi";
import { currentConfig } from "./api-client";
import { errorMessage } from "./error-message";

/**
 * useAdminTenants——admin 租户管理面（knife3 Task 2，M00.F01.I01-I05），本家族
 * admin-surface hooks 的形状基准：
 * - 动作统一 `phase: "idle" | "busy" | "failed"` 三态 + `error?: string`，
 *   返回 `Promise<boolean>`（get 例外，契约要本体：成功 Tenant / 失败 undefined）
 * - 错误文案统一走 errorMessage（knife3 Task 1 公共提取件）
 * - create 成功原位追加不重拉 listTenants（随 swift）；update 原位替换；
 *   remove 原位移除（`delete` 是保留字，动作名 remove）
 * - TenantStatus 口径是字符串 "active" | "suspended"（与 OAuth 侧 membership
 *   的 Int 口径不同，页面页脚文案需带提醒）
 *
 * mock 纪律：seams 只注入生成 API 方法面（Pick<AdminTenantsApi,…>），测试传
 * fake；不注入时每次动作按调用时刻 currentConfig() 现配生成实例。currentConfig
 * 缺失即 throw（fail-fast，禁默认值兜底，suite-hard-rules §1）——seamsOf 在
 * try 外调用，配置缺失的炸不落 error 态而是直接抛给调用方。
 */

// 再出口消费面类型（页面只认 hook 模块，不必各自摸生成物）
export type {
  AdminTenantsListTenants200Response,
  CreateTenantRequest,
  Tenant,
  UpdateTenantRequest,
} from "../generated";

export interface AdminTenantsSeams {
  adminTenants: Pick<
    AdminTenantsApi,
    | "adminTenantsListTenants"
    | "adminTenantsCreateTenant"
    | "adminTenantsGetTenant"
    | "adminTenantsUpdateTenant"
    | "adminTenantsDeleteTenant"
  >;
}

export type AdminSurfacePhase = "idle" | "busy" | "failed";

export interface UseAdminTenantsOptions {
  /** 缺省现配生成 AdminTenantsApi；测试注入 fake（seams 缝级 mock）。 */
  seams?: AdminTenantsSeams;
}

function defaultSeams(): AdminTenantsSeams {
  // fail-fast（照 use-auth defaultSeams 形状）：bootstrap 未跑就现配 API 会
  // 静默打到空 basePath，宁可早炸
  const config = currentConfig();
  if (!config) {
    throw new Error(
      "currentConfig() 缺失：先 bootstrap(baseURL) 再发请求（禁默认值兜底，suite-hard-rules §1）",
    );
  }
  return { adminTenants: new AdminTenantsApi(config) };
}

export function useAdminTenants(options?: UseAdminTenantsOptions): {
  tenants: Tenant[];
  phase: AdminSurfacePhase;
  error?: string;
  load(): Promise<boolean>;
  get(id: string): Promise<Tenant | undefined>;
  create(request: CreateTenantRequest): Promise<boolean>;
  update(id: string, request: UpdateTenantRequest): Promise<boolean>;
  remove(id: string): Promise<boolean>;
} {
  // options 走 ref 免闭包陈旧（use-auth 同款）
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const seamsOf = () => optionsRef.current?.seams ?? defaultSeams();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [phase, setPhase] = useState<AdminSurfacePhase>("idle");
  const [error, setError] = useState<string | undefined>(undefined);

  const load = useCallback(async (): Promise<boolean> => {
    const api = seamsOf().adminTenants;
    setPhase("busy");
    try {
      const res: AdminTenantsListTenants200Response = await api.adminTenantsListTenants();
      setTenants(res.items);
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

  const get = useCallback(async (id: string): Promise<Tenant | undefined> => {
    const api = seamsOf().adminTenants;
    setPhase("busy");
    try {
      const tenant = await api.adminTenantsGetTenant({ id });
      setError(undefined);
      setPhase("idle");
      return tenant;
    } catch (e) {
      setError(errorMessage(e));
      setPhase("failed");
      return undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = useCallback(async (request: CreateTenantRequest): Promise<boolean> => {
    const api = seamsOf().adminTenants;
    setPhase("busy");
    try {
      const created = await api.adminTenantsCreateTenant({
        createTenantRequest: request,
      });
      // 成功原位追加，不重拉 listTenants（随 swift）
      setTenants((prev) => [...prev, created]);
      setError(undefined);
      setPhase("idle");
      return true;
    } catch (e) {
      setError(errorMessage(e));
      setPhase("failed");
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = useCallback(
    async (id: string, request: UpdateTenantRequest): Promise<boolean> => {
      const api = seamsOf().adminTenants;
      setPhase("busy");
      try {
        const updated = await api.adminTenantsUpdateTenant({
          id,
          updateTenantRequest: request,
        });
        // 成功按 id 原位替换
        setTenants((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
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

  const remove = useCallback(async (id: string): Promise<boolean> => {
    const api = seamsOf().adminTenants;
    setPhase("busy");
    try {
      await api.adminTenantsDeleteTenant({ id });
      // 成功按 id 原位移除（delete 是保留字，动作名 remove）
      setTenants((prev) => prev.filter((t) => t.id !== id));
      setError(undefined);
      setPhase("idle");
      return true;
    } catch (e) {
      setError(errorMessage(e));
      setPhase("failed");
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { tenants, phase, error, load, get, create, update, remove };
}

import { useCallback, useRef, useState } from "react";
import type {
  AdminClientsListClients200Response,
  CreateOAuthClientRequest,
  OAuthClient,
  OAuthClientPublicInfo,
  UpdateOAuthClientRequest,
} from "../generated";
import { AdminClientsApi } from "../generated/apis/AdminClientsApi";
import { ClientsApi } from "../generated/apis/ClientsApi";
import { currentConfig } from "./api-client";
import { errorMessage } from "./error-message";

/**
 * useAdminClients——admin 应用（OAuth client）管理面（knife3 Task 10，
 * M04.F01.I01-I06 + M04.F02.I01），照 use-admin-tenants（T2）形状基准：
 * - 动作统一 `phase: "idle" | "busy" | "failed"` 三态 + `error?: string`，
 *   返回 `Promise<boolean>`（get/publicInfo 例外，契约要本体：成功本体 /
 *   失败 undefined）
 * - 错误文案统一走 errorMessage（knife3 Task 1 公共提取件）
 * - **非 tenant 作用域**：platform-admin 面，无 store/session 选项——与
 *   use-members/use-roles/use-tenant-applications 的租户 fail-fast 不同形，
 *   没有「未选择租户」前置
 * - load 不传分页全量（随 swift）；create 成功原位追加不重拉 listClients；
 *   update/setStatus 按 clientId 原位替换；remove 按 clientId 原位移除
 *   （`delete` 是保留字，动作名 remove）
 * - create 的 grantTypes/redirectUris 等全部由页面表单传入，hook 不兜底
 *   任何默认值（生成的 CreateOAuthClientRequest 必填键面即页面义务，
 *   suite-hard-rules §1 同源纪律）
 * - I03 契约：密钥仅回指纹不返明文——展示层不期待 secret 字段；I05 删除
 *   级联吊销该 client 名下全部 access/refresh token（后端语义，hook 只发
 *   DELETE）；status 口径 Int：1=启用 0=停用（M04.F02.I01）
 *
 * mock 纪律：seams 只注入生成 API 方法面（Pick<AdminClientsApi,…> +
 * Pick<ClientsApi,…>），测试传 fake；不注入时每次动作按调用时刻
 * currentConfig() 现配生成实例。currentConfig 缺失即 throw（fail-fast，
 * 禁默认值兜底，suite-hard-rules §1）——seamsOf 在 try 外调用，配置缺失
 * 的炸不落 error 态而是直接抛给调用方。
 */

// 再出口消费面类型（页面只认 hook 模块，不必各自摸生成物）
export type {
  AdminClientsListClients200Response,
  CreateOAuthClientRequest,
  OAuthClient,
  OAuthClientPublicInfo,
  UpdateOAuthClientRequest,
} from "../generated";

export interface AdminClientsSeams {
  clients: Pick<
    AdminClientsApi,
    | "adminClientsListClients"
    | "adminClientsGetClient"
    | "adminClientsCreateClient"
    | "adminClientsUpdateClient"
    | "adminClientsDeleteClient"
    | "adminClientsSetClientStatus"
  >;
  publicClients: Pick<ClientsApi, "clientsGetClient">;
}

export type AdminSurfacePhase = "idle" | "busy" | "failed";

export interface UseAdminClientsOptions {
  /** 缺省现配生成 AdminClientsApi/ClientsApi；测试注入 fake（seams 缝级 mock）。 */
  seams?: AdminClientsSeams;
}

function defaultSeams(): AdminClientsSeams {
  // fail-fast（照 use-admin-tenants defaultSeams 形状）：bootstrap 未跑就现配
  // API 会静默打到空 basePath，宁可早炸
  const config = currentConfig();
  if (!config) {
    throw new Error(
      "currentConfig() 缺失：先 bootstrap(baseURL) 再发请求（禁默认值兜底，suite-hard-rules §1）",
    );
  }
  return { clients: new AdminClientsApi(config), publicClients: new ClientsApi(config) };
}

export function useAdminClients(options?: UseAdminClientsOptions): {
  clients: OAuthClient[];
  phase: AdminSurfacePhase;
  error?: string;
  load(): Promise<boolean>;
  get(clientId: string): Promise<OAuthClient | undefined>;
  create(request: CreateOAuthClientRequest): Promise<boolean>;
  update(clientId: string, request: UpdateOAuthClientRequest): Promise<boolean>;
  remove(clientId: string): Promise<boolean>;
  setStatus(clientId: string, status: number): Promise<boolean>;
  publicInfo(clientId: string): Promise<OAuthClientPublicInfo | undefined>;
} {
  // options 走 ref 免闭包陈旧（use-auth 同款）
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const seamsOf = () => optionsRef.current?.seams ?? defaultSeams();

  const [clients, setClients] = useState<OAuthClient[]>([]);
  const [phase, setPhase] = useState<AdminSurfacePhase>("idle");
  const [error, setError] = useState<string | undefined>(undefined);

  const load = useCallback(async (): Promise<boolean> => {
    const api = seamsOf().clients;
    setPhase("busy");
    try {
      // 全量：不传 page/pageSize（随 swift），生成 API 缺省 {}
      const res: AdminClientsListClients200Response = await api.adminClientsListClients();
      setClients(res.items);
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

  const get = useCallback(async (clientId: string): Promise<OAuthClient | undefined> => {
    const api = seamsOf().clients;
    setPhase("busy");
    try {
      const found = await api.adminClientsGetClient({ clientId });
      setError(undefined);
      setPhase("idle");
      return found;
    } catch (e) {
      setError(errorMessage(e));
      setPhase("failed");
      return undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = useCallback(
    async (request: CreateOAuthClientRequest): Promise<boolean> => {
      const api = seamsOf().clients;
      setPhase("busy");
      try {
        // 捕获体原样透传：grantTypes 等全部由页面传，hook 不兜底默认值
        const created = await api.adminClientsCreateClient({
          createOAuthClientRequest: request,
        });
        // 成功原位追加，不重拉 listClients（随 swift）
        setClients((prev) => [...prev, created]);
        setError(undefined);
        setPhase("idle");
        return true;
      } catch (e) {
        setError(errorMessage(e));
        setPhase("failed");
        return false;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [],
  );

  const update = useCallback(
    async (clientId: string, request: UpdateOAuthClientRequest): Promise<boolean> => {
      const api = seamsOf().clients;
      setPhase("busy");
      try {
        // PATCH partial：捕获体原样透传，未传键不注入
        const updated = await api.adminClientsUpdateClient({
          clientId,
          updateOAuthClientRequest: request,
        });
        // 成功按 clientId 原位替换
        setClients((prev) =>
          prev.map((c) => (c.clientId === updated.clientId ? updated : c)),
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

  const remove = useCallback(async (clientId: string): Promise<boolean> => {
    const api = seamsOf().clients;
    setPhase("busy");
    try {
      // I05：后端级联吊销该 client 名下全部 token，hook 只发 DELETE；
      // clientId 字符串寻址非 UUID，参数原样透传
      await api.adminClientsDeleteClient({ clientId });
      // 成功按 clientId 原位移除（delete 是保留字，动作名 remove）
      setClients((prev) => prev.filter((c) => c.clientId !== clientId));
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

  const setStatus = useCallback(
    async (clientId: string, status: number): Promise<boolean> => {
      const api = seamsOf().clients;
      setPhase("busy");
      try {
        // M04.F02.I01：status Int 原样透传（1=启用 0=停用），hook 不换算
        const toggled = await api.adminClientsSetClientStatus({
          clientId,
          adminClientsSetClientStatusRequest: { status },
        });
        // 成功按 clientId 原位替换
        setClients((prev) =>
          prev.map((c) => (c.clientId === toggled.clientId ? toggled : c)),
        );
        setError(undefined);
        setPhase("idle");
        return true;
      } catch (e) {
        setError(errorMessage(e));
        setPhase("failed");
        return false;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [],
  );

  const publicInfo = useCallback(
    async (clientId: string): Promise<OAuthClientPublicInfo | undefined> => {
      const api = seamsOf().publicClients;
      setPhase("busy");
      try {
        // I06：公开端点匿名可读（ClientsApi.clientsGetClient）
        const info = await api.clientsGetClient({ clientId });
        setError(undefined);
        setPhase("idle");
        return info;
      } catch (e) {
        setError(errorMessage(e));
        setPhase("failed");
        return undefined;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [],
  );

  return {
    clients,
    phase,
    error,
    load,
    get,
    create,
    update,
    remove,
    setStatus,
    publicInfo,
  };
}

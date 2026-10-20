import { useCallback, useMemo, useRef, useState } from "react";
import type {
  CreateSysMenuRequest,
  SysMenu,
  UpdateSysMenuRequest,
} from "../generated";
import { ClientMenusApi } from "../generated/apis/ClientMenusApi";
import { CLIENT_ID } from "../config/client";
import { currentConfig } from "./api-client";
import { errorMessage } from "./error-message";
import type { SessionStore } from "./session-store";
import { sharedSessionStore } from "./use-auth";
import { buildMenuTree } from "./menu-tree";
import type { MenuNode } from "./menu-tree";

/**
 * useMenus——swift MenusViewModel 六动作（knife4 Task 4，M04.F04 菜单管理
 * 切片），照 use-oauth（T2）/use-admin-clients（knife3 T10）形状基准：
 * - 动作统一 `phase: "idle" | "busy" | "failed"` 三态 + `error?: string`，
 *   返回 `Promise<boolean>`；错误文案统一走 errorMessage；busy 期再入动作
 *   直接返回 false（busyRef 守卫，不发请求不覆盖错误态）
 * - wire 形状（生成物 ClientMenusApi 实读）：list 返回裸 `Array<SysMenu>`
 *   （无包装）、create/update/move 返回 `SysMenu`、reorder 返回
 *   `Array<SysMenu>`（契约形状是空数组，hook 不消费响应体）、delete 返回 void
 * - 动作语义（镜像 swift MenusViewModel）：load 后置 clientId/menus，tree 由
 *   buildMenuTree 派生（useMemo）；create 原位追加不重拉 list；update/move
 *   按 id 原位替换（move 返回体带新 parentId，树随重派生）；reorder 本地重排
 *   sortOrder=index+1 不消费空响应；remove 按 id 移除（孤儿子菜单由组树自动
 *   挂根——正好渲染「删除后子菜单挂根」语义）
 * - clientId 入参寻址（swift 是构造期状态、这里逐动作显式传）：动作前 guard
 *   与当前已加载 clientId 一致——未加载拒（「no client selected」随 swift
 *   原文）、换 client 未重载拒（「client 已切换，请重新加载」）
 * - move 的 `parentId: string | null`：null 传 seam 时省键（移到根）
 *
 * mock 纪律：seams 只注入生成 API 方法面（Pick<ClientMenusApi,…>），测试传
 * fake；不注入时每次动作按调用时刻 currentConfig() 现配生成实例。currentConfig
 * 缺失即 throw（fail-fast，禁默认值兜底，suite-hard-rules §1）——seamsOf 在
 * try 外调用，配置缺失的炸不落 error 态而是直接抛给调用方。
 */

// 再出口消费面类型（页面只认 hook 模块，不必各自摸生成物）
export type { CreateSysMenuRequest, SysMenu, UpdateSysMenuRequest } from "../generated";
export type { MenuNode } from "./menu-tree";
export { MENU_ROOT_PARENT_ID } from "./menu-tree";

export interface MenusSeams {
  menus: Pick<
    ClientMenusApi,
    | "clientMenusListSysMenus"
    | "clientMenusCreateSysMenu"
    | "clientMenusUpdateSysMenu"
    | "clientMenusMoveSysMenu"
    | "clientMenusReorderSysMenus"
    | "clientMenusDeleteSysMenu"
  >;
}

export type MenusPhase = "idle" | "busy" | "failed";

export interface UseMenusOptions {
  /** 缺省用进程级共享 SessionStore（App 层单例）；测试注入内存缝。 */
  store?: SessionStore;
  /** 缺省现配生成 ClientMenusApi；测试注入 fake（seams 缝级 mock）。 */
  seams?: MenusSeams;
}

function defaultSeams(): MenusSeams {
  // fail-fast（T2/knife3 T10 形状）：bootstrap 未跑就现配 API 会静默打到空 basePath，宁可早炸
  const config = currentConfig();
  if (!config) {
    throw new Error(
      "currentConfig() 缺失：先 bootstrap(baseURL) 再发请求（禁默认值兜底，suite-hard-rules §1）",
    );
  }
  return { menus: new ClientMenusApi(config) };
}

export function useMenus(options?: UseMenusOptions): {
  phase: MenusPhase;
  error?: string;
  clientId: string | null;
  menus: SysMenu[];
  tree: MenuNode[];
  load(clientId: string): Promise<boolean>;
  create(clientId: string, request: CreateSysMenuRequest): Promise<boolean>;
  update(clientId: string, menuId: string, request: UpdateSysMenuRequest): Promise<boolean>;
  move(clientId: string, menuId: string, parentId: string | null): Promise<boolean>;
  reorder(clientId: string, menuId: string, orderedMenuIds: string[]): Promise<boolean>;
  remove(clientId: string, menuId: string): Promise<boolean>;
} {
  // store 一经首渲染钉死（useState initializer 只跑一次），options 走 ref 免闭包陈旧。
  // 菜单是 platform-admin 面（无租户作用域），hook 动作无 store 消费面——注入位
  // 随 hook 构造准绳钉死（照 use-oauth/use-members），鉴权由生成 API config 承接
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [store] = useState(() => options?.store ?? sharedSessionStore(CLIENT_ID));
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const seamsOf = () => optionsRef.current?.seams ?? defaultSeams();

  const [clientId, setClientId] = useState<string | null>(null);
  const [menus, setMenus] = useState<SysMenu[]>([]);
  const [phase, setPhase] = useState<MenusPhase>("idle");
  const [error, setError] = useState<string | undefined>(undefined);

  // busy 期再入守卫：ref 而非 phase 态（setState 异步，同 tick 连发拦不住）
  const busyRef = useRef(false);

  // tree 由 menus 派生（孤儿挂根 / 排序全在 buildMenuTree）
  const tree = useMemo(() => buildMenuTree(menus), [menus]);

  /** 动作前 clientId 一致性 guard：未加载拒 / 换 client 未重载拒。 */
  const guardClient = useCallback(
    (requested: string): boolean => {
      if (clientId === null) {
        setError("no client selected");
        setPhase("failed");
        return false;
      }
      if (requested !== clientId) {
        setError("client 已切换，请重新加载");
        setPhase("failed");
        return false;
      }
      return true;
    },
    [clientId],
  );

  const load = useCallback(
    async (requested: string): Promise<boolean> => {
      if (busyRef.current) return false;
      // clientId 空 → 拒（随 swift「no client selected」原文）
      if (!requested) {
        setError("no client selected");
        setPhase("failed");
        return false;
      }
      const api = seamsOf().menus;
      busyRef.current = true;
      setPhase("busy");
      try {
        // wire 裸数组：Array<SysMenu> 原样落 state（无包装解包）
        const list = await api.clientMenusListSysMenus({ clientId: requested });
        setClientId(requested);
        setMenus(list);
        setError(undefined);
        setPhase("idle");
        return true;
      } catch (e) {
        // 失败旧列表保留（不兜底清空），clientId 不动
        setError(errorMessage(e));
        setPhase("failed");
        return false;
      } finally {
        busyRef.current = false;
      }
    },
    [],
  );

  const create = useCallback(
    async (requested: string, request: CreateSysMenuRequest): Promise<boolean> => {
      if (busyRef.current) return false;
      if (!guardClient(requested)) return false;
      const api = seamsOf().menus;
      busyRef.current = true;
      setPhase("busy");
      try {
        // 捕获体原样透传：title/type 等全部由页面传，hook 不兜底默认值
        const created = await api.clientMenusCreateSysMenu({
          clientId: requested,
          createSysMenuRequest: request,
        });
        // 成功原位追加，不重拉 list（随 swift）
        setMenus((prev) => [...prev, created]);
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
    },
    [guardClient],
  );

  const update = useCallback(
    async (requested: string, menuId: string, request: UpdateSysMenuRequest): Promise<boolean> => {
      if (busyRef.current) return false;
      if (!guardClient(requested)) return false;
      const api = seamsOf().menus;
      busyRef.current = true;
      setPhase("busy");
      try {
        // PATCH partial：捕获体原样透传，未传键不注入
        const updated = await api.clientMenusUpdateSysMenu({
          clientId: requested,
          menuId,
          updateSysMenuRequest: request,
        });
        // 成功按 id 原位替换
        setMenus((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
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
    },
    [guardClient],
  );

  const move = useCallback(
    async (requested: string, menuId: string, parentId: string | null): Promise<boolean> => {
      if (busyRef.current) return false;
      if (!guardClient(requested)) return false;
      const api = seamsOf().menus;
      busyRef.current = true;
      setPhase("busy");
      try {
        // null = 移到根：请求体省键（非 null 值）
        const moved = await api.clientMenusMoveSysMenu({
          clientId: requested,
          menuId,
          clientMenusMoveSysMenuRequest: parentId === null ? {} : { parentId },
        });
        // 返回体带新 parentId：按 id 原位替换，树随重派生
        setMenus((prev) => prev.map((m) => (m.id === moved.id ? moved : m)));
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
    },
    [guardClient],
  );

  const reorder = useCallback(
    async (requested: string, menuId: string, orderedMenuIds: string[]): Promise<boolean> => {
      if (busyRef.current) return false;
      if (!guardClient(requested)) return false;
      const api = seamsOf().menus;
      busyRef.current = true;
      setPhase("busy");
      try {
        // 契约形状：服务端返回空数组——响应体不消费
        await api.clientMenusReorderSysMenus({
          clientId: requested,
          menuId,
          reorderSysMenuRequest: { orderedMenuIds },
        });
        // 本地重排该段：sortOrder = index + 1（不重拉 list）
        setMenus((prev) =>
          prev.map((m) => {
            const index = orderedMenuIds.indexOf(m.id);
            return index === -1 ? m : { ...m, sortOrder: index + 1 };
          }),
        );
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
    },
    [guardClient],
  );

  const remove = useCallback(
    async (requested: string, menuId: string): Promise<boolean> => {
      if (busyRef.current) return false;
      if (!guardClient(requested)) return false;
      const api = seamsOf().menus;
      busyRef.current = true;
      setPhase("busy");
      try {
        await api.clientMenusDeleteSysMenu({ clientId: requested, menuId });
        // 成功按 id 原位移除；孤儿子菜单由 buildMenuTree 自动挂根
        setMenus((prev) => prev.filter((m) => m.id !== menuId));
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
    },
    [guardClient],
  );

  return { phase, error, clientId, menus, tree, load, create, update, move, reorder, remove };
}

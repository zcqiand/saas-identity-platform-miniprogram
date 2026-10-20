import { useCallback, useRef, useState } from "react";
import type { EffectiveMenuNode } from "../generated/models/EffectiveMenuNode";
import { MeApi } from "../generated/apis/MeApi";
import { CLIENT_ID } from "../config/client";
import { currentConfig } from "./api-client";
import { errorMessage } from "./error-message";
import type { SessionStore } from "./session-store";
import { sharedSessionStore } from "./use-auth";

/**
 * useMyMenus——当前用户有效菜单（knife4 Task 6，M04.F04.I08），照
 * use-menus（T4）/use-admin-clients（knife3 T10）形状基准：
 * - 动作统一 `phase: "idle" | "busy" | "failed"` 三态 + `error?: string`，
 *   返回 `Promise<boolean>`；错误文案统一走 errorMessage；busy 期再入 load
 *   直接返回 false（busyRef 守卫，不发请求不覆盖错误态）
 * - wire 形状（生成物 MeApi.ts 实读）：meGetMyMenus(requestParameters = {})
 *   返回 `{ [key: string]: Array<EffectiveMenuNode> }`（按 clientId 分组的
 *   嵌套树映射）；clientId 可选——runtime `!= null` 才进 query，load 省参时
 *   传 `{}` 不携带 clientId 键（不兜底 CLIENT_ID，调用方决定口径）
 * - **两套口径铁律**（刀 4 Review Focus 第 5 条后半）：EffectiveMenuNode
 *   已是嵌套树（children 自带），nodes 直接承接响应体——禁过 buildMenuTree
 *   （menu-tree.ts 零值 UUID 根桶口径只适用于 admin 平铺列表，两套口径
 *   不可混用）
 * - 失败旧 nodes 保留（不兜底清空），errorMessage 落 error 态
 *
 * mock 纪律：seams 只注入生成 API 方法面（Pick<MeApi,…>），测试传 fake；
 * 不注入时每次动作按调用时刻 currentConfig() 现配生成实例。currentConfig
 * 缺失即 throw（fail-fast，禁默认值兜底，suite-hard-rules §1）——seamsOf 在
 * try 外调用，配置缺失的炸不落 error 态而是直接抛给调用方。
 */

// 再出口消费面类型（页面只认 hook 模块，不必各自摸生成物）
export type { EffectiveMenuNode } from "../generated/models/EffectiveMenuNode";

export interface MyMenusSeams {
  me: Pick<MeApi, "meGetMyMenus">;
}

export type MyMenusPhase = "idle" | "busy" | "failed";

export interface UseMyMenusOptions {
  /** 缺省用进程级共享 SessionStore（App 层单例）；测试注入内存缝。 */
  store?: SessionStore;
  /** 缺省现配生成 MeApi；测试注入 fake（seams 缝级 mock）。 */
  seams?: MyMenusSeams;
}

function defaultSeams(): MyMenusSeams {
  // fail-fast（T2/knife3 T10 形状）：bootstrap 未跑就现配 API 会静默打到空 basePath，宁可早炸
  const config = currentConfig();
  if (!config) {
    throw new Error(
      "currentConfig() 缺失：先 bootstrap(baseURL) 再发请求（禁默认值兜底，suite-hard-rules §1）",
    );
  }
  return { me: new MeApi(config) };
}

export function useMyMenus(options?: UseMyMenusOptions): {
  phase: MyMenusPhase;
  error?: string;
  nodes: Record<string, EffectiveMenuNode[]> | null;
  load(clientId?: string): Promise<boolean>;
} {
  // store 一经首渲染钉死（useState initializer 只跑一次），options 走 ref 免闭包陈旧。
  // 菜单是登录用户面（鉴权由生成 API config 承接），hook 动作无 store 消费面——
  // 注入位随 hook 构造准绳钉死（照 use-menus/use-oauth）
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [store] = useState(() => options?.store ?? sharedSessionStore(CLIENT_ID));
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const seamsOf = () => optionsRef.current?.seams ?? defaultSeams();

  const [nodes, setNodes] = useState<Record<string, EffectiveMenuNode[]> | null>(null);
  const [phase, setPhase] = useState<MyMenusPhase>("idle");
  const [error, setError] = useState<string | undefined>(undefined);

  // busy 期再入守卫：ref 而非 phase 态（setState 异步，同 tick 连发拦不住）
  const busyRef = useRef(false);

  const load = useCallback(async (clientId?: string): Promise<boolean> => {
    if (busyRef.current) return false;
    const api = seamsOf().me;
    busyRef.current = true;
    setPhase("busy");
    try {
      // 省参传 {} 不携带 clientId 键（生成物 runtime != null 才进 query）；
      // 嵌套树响应体原样落 state（两套口径铁律：禁过 buildMenuTree）
      const res = await api.meGetMyMenus(clientId === undefined ? {} : { clientId });
      setNodes(res);
      setError(undefined);
      setPhase("idle");
      return true;
    } catch (e) {
      // 失败旧 nodes 保留（不兜底清空）
      setError(errorMessage(e));
      setPhase("failed");
      return false;
    } finally {
      busyRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { phase, error, nodes, load };
}

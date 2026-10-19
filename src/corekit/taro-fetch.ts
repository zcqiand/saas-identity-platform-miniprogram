import Taro from "@tarojs/taro";

import { installWeappGlobals } from "./weapp-globals-shim";

// appservice（DevTools 2.02 实测 + 真机同形态）缺 Headers/Response/URLSearchParams，
// 桥与生成 runtime.ts:176 都会撞 ReferenceError——请求还没出模拟器就死。
// 模块加载即补装（早于任何请求），只补缺失（jsdom/node 自带时零影响）。
// 垫层形状与消费点清单一一对应，见 weapp-globals-shim.ts 头注。
installWeappGlobals(globalThis);

/**
 * 唯一的 Taro.request 出口：把生成物（typescript-fetch）期望的 fetch 形状
 * 桥接到小程序传输层。组件与页面禁止直接调 Taro.request（本仓 CLAUDE.md §2）。
 *
 * - `init.method ?? "GET"`；生成物 body 是 JSON 字符串，这里反序列化回对象交 Taro
 *   （Taro 自行按 header 序列化），非 JSON 字符串原样透传
 * - Taro 的 `statusCode`/`data`/`header` 还原成标准 `Response`，
 *   非 2xx 由 Response.ok=false 表达，抛错语义留在生成物 BaseAPI 手里
 * - 401 桥层统一拦截（D3，swift APIGlue.run:25-30 同构）：先触发 onUnauthorized
 *   再照常返回 Response——rethrow 语义留在生成物 BaseAPI（ResponseError）。含登录
 *   在内所有调用一视同仁（密码错 401 也触发回调，无害，随 swift）；页面禁各自处理 401
 */

/** 401 拦截缝：App 层注册（清会话回登录页）；本层只识别 401，不感知 SessionStore。 */
let onUnauthorized: (() => void) | undefined;

export function setOnUnauthorized(cb: () => void): void {
  onUnauthorized = cb;
}

export async function taroFetch(url: string, init: RequestInit): Promise<Response> {
  const method = (init.method ?? "GET") as keyof Taro.request.Method;

  let data: Taro.request.Option["data"] | undefined;
  if (typeof init.body === "string") {
    try {
      // 边界注记（knife1 挂账 minor）：JSON 字面量标量文本体（如 `"x"`）parse 后
      // 是裸 primitive，Taro 会不带引号原样发出——当前契约无此操作，仅记不设防
      data = JSON.parse(init.body) as unknown;
    } catch {
      // 非 JSON 字符串体（如 form-urlencoded）不强行解析，原样透传
      data = init.body;
    }
  }

  const res = await Taro.request({
    url,
    method,
    header: normalizeHeaders(init.headers),
    data,
  });

  // 204/205/304 是 null-body 状态：Response 构造器带 body 即 TypeError（生成物
  // VoidApiResponse 路径，如 sessionsLogout 的 204），必须传 null
  const body = isNullBodyStatus(res.statusCode)
    ? null
    : typeof res.data === "string"
      ? res.data
      : JSON.stringify(res.data);
  const response = new Response(body, {
    status: res.statusCode,
    headers: res.header ?? {},
  });
  if (res.statusCode === 401) {
    onUnauthorized?.();
  }
  return response;
}

const NULL_BODY_STATUSES = new Set([204, 205, 304]);

function isNullBodyStatus(status: number): boolean {
  return NULL_BODY_STATUSES.has(status);
}

function normalizeHeaders(
  headers: HeadersInit | undefined,
): Record<string, string> | undefined {
  if (!headers) return undefined;
  if (headers instanceof Headers) {
    const record: Record<string, string> = {};
    headers.forEach((value, key) => {
      record[key] = value;
    });
    return record;
  }
  if (Array.isArray(headers)) return Object.fromEntries(headers);
  return { ...headers };
}

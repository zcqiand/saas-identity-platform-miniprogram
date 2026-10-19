import Taro from "@tarojs/taro";

/**
 * 唯一的 Taro.request 出口：把生成物（typescript-fetch）期望的 fetch 形状
 * 桥接到小程序传输层。组件与页面禁止直接调 Taro.request（本仓 CLAUDE.md §2）。
 *
 * - `init.method ?? "GET"`；生成物 body 是 JSON 字符串，这里反序列化回对象交 Taro
 *   （Taro 自行按 header 序列化），非 JSON 字符串原样透传
 * - Taro 的 `statusCode`/`data`/`header` 还原成标准 `Response`，
 *   非 2xx 由 Response.ok=false 表达，抛错语义留在生成物 BaseAPI 手里
 */
export async function taroFetch(url: string, init: RequestInit): Promise<Response> {
  const method = (init.method ?? "GET") as keyof Taro.request.Method;

  let data: Taro.request.Option["data"] | undefined;
  if (typeof init.body === "string") {
    try {
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

  const body = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
  return new Response(body, { status: res.statusCode, headers: res.header ?? {} });
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

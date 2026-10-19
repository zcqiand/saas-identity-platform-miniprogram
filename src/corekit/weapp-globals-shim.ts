/**
 * weapp appservice 全局量垫层（knife2 T5 live 定案）。
 *
 * DevTools 2.02 appservice 与真机同形态：没有 Headers / Response / URLSearchParams
 * 这三个 DOM 网络全局量。消费点只有三处——
 * - 桥 taro-fetch.ts:72 `headers instanceof Headers`（本仓）
 * - 桥 taro-fetch.ts `new Response(...)`（本仓）
 * - 生成 runtime.ts:176 裸 `body instanceof URLSearchParams`（生成物，禁手改）
 *
 * Blob / FormData 生成端自带 typeof 守卫，无消费点，不垫。垫「够用即可」：
 * 请求期唯一序列化形状是 JSON 文本，Blob/arrayBuffer 契约无此端点，明确抛错。
 * installWeappGlobals(target) 只补缺失（node/jsdom/DevTools 某版本自带时不劣化），
 * 入口在 taro-fetch.ts 模块加载时对 globalThis 安装（早于任何请求）。
 */

/** 垫层覆盖的全局量名集合（与消费点清单一一对应，别扩）。 */
export type WeappGlobalNames = "Headers" | "Response" | "URLSearchParams";

type HeadersInitShim = Record<string, string> | Array<[string, string]>;

/** 最小 Headers：get/has/set/append/delete/forEach/entries，键小写归一。 */
export class WeappHeaders {
  private readonly map = new Map<string, string>();

  constructor(init?: HeadersInitShim) {
    if (!init) return;
    const pairs = Array.isArray(init) ? init : Object.entries(init);
    for (const [key, value] of pairs) this.append(key, value);
  }

  append(key: string, value: string): void {
    const k = key.toLowerCase();
    const prev = this.map.get(k);
    this.map.set(k, prev === undefined ? value : `${prev}, ${value}`);
  }

  set(key: string, value: string): void {
    this.map.set(key.toLowerCase(), value);
  }

  get(key: string): string | null {
    return this.map.get(key.toLowerCase()) ?? null;
  }

  has(key: string): boolean {
    return this.map.has(key.toLowerCase());
  }

  delete(key: string): void {
    this.map.delete(key.toLowerCase());
  }

  forEach(
    cb: (value: string, key: string, headers: WeappHeaders) => void,
    thisArg?: unknown,
  ): void {
    this.map.forEach((value, key) =>
      cb.call(thisArg, value, key, this),
    );
  }

  entries(): IterableIterator<[string, string]> {
    return this.map.entries();
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.map.entries();
  }
}

/** Response 构造 init 形状（桥只传 status/headers）。 */
interface ResponseInitShim {
  status?: number;
  headers?: HeadersInitShim;
}

/**
 * 最小 Response：JSON 文本契约够用。生成端消费 status（ResponseError 判定）、
 * json()/text()（JSON/Text/Body API），blob/arrayBuffer 契约无端点，抛错即 fail-fast。
 * 204/205/304 桥传 null body（同标准 Response 语义），text() 给空串。
 */
export class WeappResponse {
  readonly status: number;
  readonly ok: boolean;
  readonly statusText = "";
  readonly headers: WeappHeaders;

  constructor(body: string | null, init?: ResponseInitShim) {
    this.status = init?.status ?? 200;
    this.ok = this.status >= 200 && this.status < 300;
    this.headers = new WeappHeaders(init?.headers);
    this.bodyText = body ?? "";
  }

  private readonly bodyText: string;

  text(): Promise<string> {
    return Promise.resolve(this.bodyText);
  }

  json(): Promise<unknown> {
    return Promise.resolve(
      this.bodyText === "" ? null : (JSON.parse(this.bodyText) as unknown),
    );
  }

  blob(): Promise<never> {
    return Promise.reject(
      new Error("weapp shim: blob 不支持（当前契约无 blob 端点）"),
    );
  }

  arrayBuffer(): Promise<never> {
    return Promise.reject(
      new Error("weapp shim: arrayBuffer 不支持（当前契约无二进制端点）"),
    );
  }
}

/** 哑类：生成 runtime.ts:176 只做 instanceof 判型，桥从不传它，够用即抛空壳。 */
export class WeappURLSearchParams {}

/** 垫层装完后的全局量形状（测试与调用方据此收窄）。 */
interface WeappGlobals {
  Headers: typeof WeappHeaders;
  Response: typeof WeappResponse;
  URLSearchParams: typeof WeappURLSearchParams;
}

/**
 * 把三个全局量装到 target 上，只补缺失。appservice 顶层对象与浏览器 globalThis
 * 不同源，因此 target 由调用方给（taro-fetch.ts 传 globalThis；测试传裸对象）。
 */
export function installWeappGlobals(target: {
  Headers?: unknown;
  Response?: unknown;
  URLSearchParams?: unknown;
}): asserts target is WeappGlobals {
  if (target.Headers === undefined) target.Headers = WeappHeaders;
  if (target.Response === undefined) target.Response = WeappResponse;
  if (target.URLSearchParams === undefined) {
    target.URLSearchParams = WeappURLSearchParams;
  }
}

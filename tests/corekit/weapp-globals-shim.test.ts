/**
 * weapp appservice 全局量垫层（knife2 T5 live 定案：DevTools 2.02 appservice 无
 * Headers/Response/URLSearchParams，桥与生成 runtime 撞 ReferenceError）。
 * jsdom/node 测试环境自带这些全局量，所以垫层目标一律是裸对象，不污染真实全局。
 */
import { describe, expect, it } from "vitest";
import { installWeappGlobals } from "../../src/corekit/weapp-globals-shim";

/**
 * 造一个全空目标（模拟 appservice 顶层无这三个全局量）。
 * 值类型用 unknown 袋：与 asserts 收窄后的构造器类型不相交，避免 never 归并。
 */
type BareBag = {
  Headers?: unknown;
  Response?: unknown;
  URLSearchParams?: unknown;
};
function bareTarget(): BareBag {
  return {};
}

describe("installWeappGlobals", () => {
  it("在空目标上装齐三个全局量", () => {
    const target = bareTarget();
    installWeappGlobals(target);
    expect(target.Headers).toBeDefined();
    expect(target.Response).toBeDefined();
    expect(target.URLSearchParams).toBeDefined();
  });

  it("已有全局量不覆盖（node/jsdom 不被垫层劣化）", () => {
    const target = bareTarget() as Record<string, unknown>;
    const realHeaders = globalThis.Headers;
    target.Headers = realHeaders;
    installWeappGlobals(target);
    expect(target.Headers).toBe(realHeaders);
  });

  describe("Headers 形状", () => {
    it("构造 / get / has / set 大小写不敏感", () => {
      const target = bareTarget();
      installWeappGlobals(target);
      const h = new target.Headers!({ "Content-Type": "application/json" });
      expect(h.get("content-type")).toBe("application/json");
      expect(h.has("CONTENT-TYPE")).toBe(true);
      h.set("X-Test", "1");
      expect(h.get("x-test")).toBe("1");
      expect(h.get("missing")).toBeNull();
    });

    it("forEach 遍历（normalizeHeaders 消费路径）", () => {
      const target = bareTarget();
      installWeappGlobals(target);
      const h = new target.Headers!({ a: "1", b: "2" });
      const seen: Array<[string, string]> = [];
      h.forEach((v: string, k: string) => seen.push([k, v]));
      expect(seen).toContainEqual(["a", "1"]);
      expect(seen).toContainEqual(["b", "2"]);
    });
  });

  describe("Response 形状", () => {
    it("2xx：ok=true，text/json 可读", async () => {
      const target = bareTarget();
      installWeappGlobals(target);
      const res = new target.Response!('{"ok":true}', { status: 200 });
      expect(res.status).toBe(200);
      expect(res.ok).toBe(true);
      expect(await res.text()).toBe('{"ok":true}');
      expect(await res.json()).toEqual({ ok: true });
    });

    it("401：ok=false（生成端 ResponseError 判定吃 status）", async () => {
      const target = bareTarget();
      installWeappGlobals(target);
      const res = new target.Response!(null, { status: 401 });
      expect(res.status).toBe(401);
      expect(res.ok).toBe(false);
      expect(await res.text()).toBe("");
    });

    it("headers 进构造并按 Headers 形状可读", () => {
      const target = bareTarget();
      installWeappGlobals(target);
      const res = new target.Response!(null, {
        status: 204,
        headers: { "x-request-id": "r1" },
      });
      expect(res.status).toBe(204);
      expect(res.headers.get("x-request-id")).toBe("r1");
    });
  });

  describe("URLSearchParams 哑类", () => {
    it("instanceof 判型可用（生成 runtime.ts:176 裸 instanceof，禁手改）", () => {
      const target = bareTarget();
      installWeappGlobals(target);
      const Ctor = target.URLSearchParams!;
      expect(new Ctor() instanceof Ctor).toBe(true);
      expect({} instanceof Ctor).toBe(false);
    });
  });
});

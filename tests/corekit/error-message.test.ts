/**
 * errorMessage 提取件（knife3 Task 1）——基建件测试，不挂功能 ID。
 * 口径随 swift message(of:) :141-146 + knife2 FetchError cause 透传定案：
 * ResponseError → 「请求失败（HTTP <status>）」；有 cause → `${String(error)} <- ${String(cause)}`；
 * 其余 → String(error)。
 */
import { describe, expect, it } from "vitest";
import { ResponseError } from "../../src/generated/runtime";
import { errorMessage } from "../../src/corekit/error-message";

describe("errorMessage", () => {
  it("ResponseError 落 HTTP 状态码文案", () => {
    const response = new Response(null, { status: 403 }); // node/undici Response，形状够用
    expect(errorMessage(new ResponseError(response, "Response returned an error"))).toBe(
      "请求失败（HTTP 403）",
    );
  });
  it("带 cause 的错误透传底层 errMsg（knife2 FetchError 定案形态，duck-typing 不必真 FetchError）", () => {
    const e = Object.assign(
      new Error(
        "The request failed and the interceptors did not return an alternative response",
      ),
      { cause: new Error("request:fail socket time out") },
    );
    expect(errorMessage(e)).toContain("request:fail socket time out");
    expect(errorMessage(e)).toContain(" <- ");
  });
  it("普通 Error 落 String(error)", () => {
    expect(errorMessage(new Error("boom"))).toBe("Error: boom");
  });
});

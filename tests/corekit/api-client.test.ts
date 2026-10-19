import { describe, expect, it } from "vitest";
import { bootstrap, currentConfig } from "../../src/corekit/api-client";

describe("api-client bootstrap", () => {
  it("throws on empty baseURL — 禁 env 默认值兜底（suite-hard-rules §1）", () => {
    expect(() => bootstrap("", "tok")).toThrow(/baseURL/i);
  });

  it("throws on blank token — 照 swift missingToken 语义", () => {
    expect(() => bootstrap("http://localhost:5104", "   ")).toThrow(/token/i);
  });

  it("stores Bearer config retrievable via currentConfig", () => {
    bootstrap("http://localhost:5104", "tok");
    expect(new Headers(currentConfig()?.headers).get("Authorization")).toBe("Bearer tok");
  });

  it("bootstrap(baseURL) 单参：无 Authorization 头（D5 仅 baseURL 路径，login 前发请求）", () => {
    bootstrap("http://localhost:5104");
    expect(new Headers(currentConfig()?.headers).get("Authorization")).toBeNull();
    expect(currentConfig()?.basePath).toBe("http://localhost:5104");
  });

  it("bootstrap(baseURL, undefined) 显式缺席：无 Authorization 头（token 可选）", () => {
    bootstrap("http://localhost:5104", undefined);
    expect(new Headers(currentConfig()?.headers).get("Authorization")).toBeNull();
  });

  it("bootstrap(baseURL, '  ') 已登录口径空 token 仍然 throw（既有 fail-fast 语义保留）", () => {
    expect(() => bootstrap("http://localhost:5104", "   ")).toThrow(/token/i);
  });
});

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
});

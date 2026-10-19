import { afterEach, describe, expect, it, vi } from "vitest";
import { apiBaseUrl } from "../src/config/app-config";

describe("apiBaseUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the configured base url", () => {
    vi.stubEnv("TARO_APP_API_BASE_URL", "http://localhost:5104");
    expect(apiBaseUrl()).toBe("http://localhost:5104");
  });

  it("throws when TARO_APP_API_BASE_URL is missing（fail-fast，禁默认值兜底）", () => {
    vi.stubEnv("TARO_APP_API_BASE_URL", "");
    expect(() => apiBaseUrl()).toThrow(/TARO_APP_API_BASE_URL/);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const request = vi.hoisted(() => vi.fn());

vi.mock("@tarojs/taro", () => ({ default: { request }, request }));

import { taroFetch } from "../../src/corekit/taro-fetch";

describe("taroFetch bridge", () => {
  beforeEach(() => request.mockReset());

  it("maps GET with Authorization header into Taro.request", async () => {
    request.mockResolvedValue({ statusCode: 200, data: { ok: 1 }, header: {} });
    const res = await taroFetch("http://localhost:5104/me", {
      method: "GET",
      headers: { Authorization: "Bearer tok" },
    });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "http://localhost:5104/me",
        method: "GET",
        header: { Authorization: "Bearer tok" },
      }),
    );
    expect(await res.json()).toEqual({ ok: 1 });
  });

  it("maps non-2xx statusCode to Response with ok:false", async () => {
    request.mockResolvedValue({ statusCode: 401, data: "unauthorized", header: {} });
    const res = await taroFetch("http://localhost:5104/me", { method: "GET" });
    expect(res.ok).toBe(false);
    expect(res.status).toBe(401);
  });
});

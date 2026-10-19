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

  it("maps 204 to null-body Response (ok:true, empty body readable)", async () => {
    // 204/205/304 带 body 时 Response 构造器直接 TypeError——生成物 VoidApiResponse 路径钉子
    request.mockResolvedValue({ statusCode: 204, data: "", header: {} });
    const res = await taroFetch("http://localhost:5104/auth/logout", { method: "POST" });
    expect(res.ok).toBe(true);
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
  });

  it("deserializes string JSON body into Taro data object (serialization contract)", async () => {
    request.mockResolvedValue({ statusCode: 200, data: { ok: 1 }, header: {} });
    await taroFetch("http://localhost:5104/auth/login", {
      method: "POST",
      body: JSON.stringify({ a: 1 }),
    });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        data: { a: 1 },
      }),
    );
  });
});

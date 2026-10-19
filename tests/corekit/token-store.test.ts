import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => new Map<string, string>());

const setStorageSync = vi.hoisted(() => vi.fn());
const getStorageSync = vi.hoisted(() => vi.fn());
const removeStorageSync = vi.hoisted(() => vi.fn());

vi.mock("@tarojs/taro", () => ({
  default: { setStorageSync, getStorageSync, removeStorageSync },
}));

import {
  createInMemoryTokenStore,
  createTaroTokenStore,
} from "../../src/corekit/token-store";

describe("createInMemoryTokenStore（测试缝 fake，随 swift InMemoryTokenStore）", () => {
  it("set/get/clear 全套：getToken/getRefreshToken 独立存取", () => {
    const store = createInMemoryTokenStore();
    expect(store.getToken()).toBeUndefined();
    expect(store.getRefreshToken()).toBeUndefined();

    store.setToken("tok");
    store.setRefreshToken("ref");
    expect(store.getToken()).toBe("tok");
    expect(store.getRefreshToken()).toBe("ref");

    store.clear();
    expect(store.getToken()).toBeUndefined();
    expect(store.getRefreshToken()).toBeUndefined();
  });

  it("clear 后可再 set（fake 可复用）", () => {
    const store = createInMemoryTokenStore();
    store.setToken("a");
    store.clear();
    store.setToken("b");
    expect(store.getToken()).toBe("b");
  });
});

describe("createTaroTokenStore（Taro storage 复刻 Keychain 语义）", () => {
  beforeEach(() => {
    storage.clear();
    setStorageSync.mockReset();
    getStorageSync.mockReset();
    removeStorageSync.mockReset();
    getStorageSync.mockImplementation((key: string) => storage.get(key) ?? "");
    setStorageSync.mockImplementation((key: string, value: string) => {
      storage.set(key, value);
    });
    removeStorageSync.mockImplementation((key: string) => {
      storage.delete(key);
    });
  });

  it("setToken/setRefreshToken 落 keys corekit.token/corekit.refreshToken（D1 与 swift 同名）", () => {
    const store = createTaroTokenStore();
    store.setToken("tok");
    store.setRefreshToken("ref");
    expect(storage.get("corekit.token")).toBe("tok");
    expect(storage.get("corekit.refreshToken")).toBe("ref");
    expect(setStorageSync).toHaveBeenCalledWith("corekit.token", "tok");
    expect(setStorageSync).toHaveBeenCalledWith("corekit.refreshToken", "ref");
  });

  it("get 无值返 undefined（Taro 缺 key 返空串，桥接为 undefined）", () => {
    const store = createTaroTokenStore();
    expect(store.getToken()).toBeUndefined();
    expect(store.getRefreshToken()).toBeUndefined();
  });

  it("clear 移除两 key", () => {
    const store = createTaroTokenStore();
    store.setToken("tok");
    store.setRefreshToken("ref");
    store.clear();
    expect(storage.has("corekit.token")).toBe(false);
    expect(storage.has("corekit.refreshToken")).toBe(false);
    expect(removeStorageSync).toHaveBeenCalledWith("corekit.token");
    expect(removeStorageSync).toHaveBeenCalledWith("corekit.refreshToken");
  });
});

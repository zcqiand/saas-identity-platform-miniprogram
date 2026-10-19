import Taro from "@tarojs/taro";

/**
 * 会话密钥存储缝，随 swift 仓 TokenStoring/InMemoryTokenStore（REQ-2026-001 T-2 同构）：
 * token/refreshToken 属会话密钥，具体实现由绑定层给——App 层绑 Taro storage
 * （createTaroTokenStore，跨端 key 名与 swift Keychain 同名，D1），测试注入内存 fake
 * （createInMemoryTokenStore），单测不碰真 storage。
 */

export interface TokenStore {
  getToken(): string | undefined;
  getRefreshToken(): string | undefined;
  setToken(v: string): void;
  setRefreshToken(v: string): void;
  clear(): void;
}

export const TOKEN_KEY = "corekit.token";
export const REFRESH_TOKEN_KEY = "corekit.refreshToken";

/** 测试缝 fake：进程内字典，随 swift InMemoryTokenStore。生产代码禁用。 */
export function createInMemoryTokenStore(): TokenStore {
  const storage = new Map<string, string>();
  return {
    getToken: () => storage.get(TOKEN_KEY),
    getRefreshToken: () => storage.get(REFRESH_TOKEN_KEY),
    setToken: (v) => {
      storage.set(TOKEN_KEY, v);
    },
    setRefreshToken: (v) => {
      storage.set(REFRESH_TOKEN_KEY, v);
    },
    clear: () => {
      storage.delete(TOKEN_KEY);
      storage.delete(REFRESH_TOKEN_KEY);
    },
  };
}

/** Taro storage 实现，语义随 swift KeychainTokenStore（get 无值返 undefined）。 */
export function createTaroTokenStore(): TokenStore {
  return {
    getToken: () => readKey(TOKEN_KEY),
    getRefreshToken: () => readKey(REFRESH_TOKEN_KEY),
    setToken: (v) => Taro.setStorageSync(TOKEN_KEY, v),
    setRefreshToken: (v) => Taro.setStorageSync(REFRESH_TOKEN_KEY, v),
    clear: () => {
      Taro.removeStorageSync(TOKEN_KEY);
      Taro.removeStorageSync(REFRESH_TOKEN_KEY);
    },
  };
}

function readKey(key: string): string | undefined {
  // Taro getStorageSync 对缺 key 返空串（非 undefined），桥接回 Keychain 语义
  const value = Taro.getStorageSync(key);
  return typeof value === "string" && value ? value : undefined;
}

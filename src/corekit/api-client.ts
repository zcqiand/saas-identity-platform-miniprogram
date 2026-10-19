import { Configuration, type FetchAPI } from "../generated/runtime";
import { taroFetch } from "./taro-fetch";

/**
 * 生成物客户端的全局配置入口，语义照 swift 仓 APIClient.bootstrap（missingToken 抛错）。
 * 空 baseURL / 空白 token 一律 fail-fast——禁止默认值兜底（suite-hard-rules §1）。
 */

let config: Configuration | undefined;

export function bootstrap(baseURL: string, token: string): void {
  const trimmedBaseURL = baseURL.trim();
  if (!trimmedBaseURL) {
    throw new Error("baseURL 不能为空。禁止默认值兜底（suite-hard-rules §1）。");
  }

  const trimmedToken = token.trim();
  if (!trimmedToken) {
    throw new Error("token 不能为空（照 swift APIClient.bootstrap missingToken 语义）。");
  }

  // 生成物只会以 string URL 调 fetchApi（BaseAPI.createFetchParams），桥接层签名按此收窄
  const fetchApi = ((input: string | URL, init?: RequestInit) =>
    taroFetch(input.toString(), init ?? {})) satisfies FetchAPI;

  config = new Configuration({
    basePath: trimmedBaseURL,
    fetchApi,
    headers: { Authorization: `Bearer ${trimmedToken}` },
  });
}

export function currentConfig(): Configuration | undefined {
  return config;
}

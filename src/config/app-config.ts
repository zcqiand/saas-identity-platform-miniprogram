/**
 * 后端 API 基址（Taro build 期注入 TARO_APP_API_BASE_URL）。
 * 缺失即抛错——禁止默认值兜底（suite-hard-rules §1，ADR-0044 同源纪律）。
 * dev 值见 .env.example；Phase 1 接线时按 multi-repo-family.md §6 URL 表核对。
 */
export function apiBaseUrl(): string {
  const url = process.env.TARO_APP_API_BASE_URL;

  if (!url) {
    throw new Error(
      "TARO_APP_API_BASE_URL 未设置。禁止默认值兜底（suite-hard-rules §1）；dev 值见 .env.example。",
    );
  }

  return url;
}

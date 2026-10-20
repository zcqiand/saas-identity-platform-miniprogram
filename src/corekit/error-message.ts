import { ResponseError } from "../generated/runtime";

/**
 * errorMessage——swift message(of:) :141-146 同构（knife3 Task 1 自 use-auth.ts
 * 上移为公共提取件，后续 admin-surface hooks 全消费此函数）：
 * ResponseError → 「请求失败（HTTP <status>）」；带 cause 的错误（knife2
 * FetchError 定案形态）透传底层原始错误文案（duck-typing，不必真 FetchError）；
 * 其余落 String(error)。
 */
export function errorMessage(error: unknown): string {
  if (error instanceof ResponseError) {
    return `请求失败（HTTP ${error.response.status}）`;
  }
  const cause = (error as { cause?: unknown }).cause;
  const causeText = cause ? String(cause) : "";
  return causeText ? `${String(error)} <- ${causeText}` : String(error);
}

import { expect } from "vitest";
import { fnTest } from "./fn";

// Harness fnTest → FnReporter → .state/trace.json 的最小贯通测试
// （ktor FnAnnotationSmokeTest / laravel HarnessFnSmokeTest 同源）。
// 零 ID 调用：只为走通链路；挂假 ID 会在 L5 悬空（tree 里无此 ID）。
fnTest([], "harness fnTest round-trips into trace", () => {
  expect(2).toBe(1 + 1);
});

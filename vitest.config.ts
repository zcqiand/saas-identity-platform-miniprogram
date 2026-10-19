import { defineConfig } from "vitest/config";
import FnReporter from "./tests/fnReporter";

export default defineConfig({
  // @tarojs/runtime 在模块顶层读这批常量（Taro 构建链靠 DefinePlugin 注入，
  // vitest 下是裸标识符会 ReferenceError）。node 环境测试统一置 false——
  // 只关 DOM 扩展开关，不影响被测逻辑。FnReporter 不动。
  define: {
    ENABLE_INNER_HTML: "false",
    ENABLE_ADJACENT_HTML: "false",
    ENABLE_CLONE_NODE: "false",
    ENABLE_CONTAINS: "false",
    ENABLE_SIZE_APIS: "false",
    ENABLE_TEMPLATE_CONTENT: "false",
    ENABLE_MUTATION_OBSERVER: "false",
  },
  test: {
    environment: "node",
    reporters: ["default", new FnReporter()],
  },
});

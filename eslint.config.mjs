import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

// 机器可判定的硬约束落在这里。判断类规则（组件测试链、API 层接线）在项目 CLAUDE.md。
export default tseslint.config(
  { ignores: ["dist", "node_modules", "coverage", "src/generated/**"] },
  ...tseslint.configs.recommended,
  {
    plugins: { react, "react-hooks": reactHooks },
    settings: { react: { version: "detect" } },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      // unused 检查从 tsc（noUnusedLocals/noUnusedParameters）移到这里：
      // typescript-fetch 生成物结构性带未用 import，过不了 noUnusedLocals，
      // 而 L1/L2 本就豁免 src/generated 的风格检查；手写代码的严格度不变。
      "@typescript-eslint/no-unused-vars": "error",
      "react/no-unstable-nested-components": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
    },
  },
  {
    // 适配器与配置文件不受组件规则约束，但仍禁 any
    files: ["tests/fnReporter.ts", "tests/fn.ts", "vitest.config.ts"],
    rules: { "react-hooks/exhaustive-deps": "off" },
  },
);

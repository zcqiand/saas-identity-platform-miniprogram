import { defineConfig } from "@tarojs/cli";

// Taro 编译配置。骨架期最小形状；weapp 构建门本期不设（spec §4.2），
// 但生成物 spike 需本地 build:weapp 跑通（生成物进 webpack 无编译炸）。
// sourceRoot/outputRoot 是 Kernel.initPaths 的必需值，缺失即 TypeError。
export default defineConfig({
  projectName: "saas-identity-platform-miniprogram",
  framework: "react",
  compiler: "webpack5",
  sourceRoot: "src",
  outputRoot: "dist",
  mini: {},
  h5: {},
});

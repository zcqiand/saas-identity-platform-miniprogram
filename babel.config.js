// Taro 编译配置（weapp 构建链用；骨架期四门不触发它，仅保持 Taro 项目形状完整）。
module.exports = {
  presets: [["taro", { framework: "react", ts: true }]],
};

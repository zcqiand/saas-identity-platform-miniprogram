# SaaS 身份平台小程序端

SaaS 身份平台小程序端（`saas-identity-platform-miniprogram`）——一句话系统定位（待补）。

本仓为《（书稿信息待补）》案例（待补）的可运行配套工程，是书稿代码块的 **source of truth**。

## 快速开始

```bash
# 前置：node + npm（依赖一律走 npmmirror）
npm install --registry=https://registry.npmmirror.com --legacy-peer-deps           # 安装依赖（Taro 4.3 钉版）
npx --no prettier --check src tests config        # L1 格式
npx --no eslint src tests config                  # L2 静态
npx --no tsc --noEmit                             # L3 类型
npx --no vitest run                               # L4 测试
npx --no taro build --type weapp                  # L4.5 weapp 构建门
npm run dev:weapp                                 # 本地开发（watch 构建微信小程序）
```

## 功能特性

按特性分点描述核心功能（见 `docs/functions/function-tree.md`）。

## 技术栈

| 技术 | 版本 |
| :--- | :--- |
| Taro / React | 4.3.0 钉版 / 18.3.1（@tarojs/* 同版本收口） |
| 工具链 | typescript ^5.7 / vitest ^4 / eslint ^9 / prettier ^3 / webpack 5.91.0 |

> 依赖版本与 `version-lock.json` 的 `version_lock` 一致，不引入 lock 外的库。

## 配套书籍及章节映射

| 章 | 主题 | 对应源文件 |
| :--- | :--- | :--- |
| （待补） | | |

## 快速链接

- [CLAUDE.md](CLAUDE.md) — 开发约定与编码规范
- [系统架构.md](docs/ARCHITECTURE.md) — 结构 / 边界 / 数据流 / 决策
- [功能规格.md](docs/functions/function-tree.md) — 功能名称、描述与验收标准
- [未来开发计划](PLAN.md) — 待办与迭代方向
- [更新日志](CHANGELOG.md) — 版本变更记录

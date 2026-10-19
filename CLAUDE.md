# CLAUDE.md — SaaS 身份平台小程序端

> 书稿配套仓 + harness 门禁仓双身份。入口，不是手册。L0 门强制上限 60 行。
> 本仓为《（书稿信息待补）》案例（待补）（SaaS 身份平台小程序端）的可运行配套工程，是书稿代码块的 **source of truth**。

## 1. 项目定位

SaaS 身份平台小程序端（`saas-identity-platform-miniprogram`，技术栈 `miniprogram`）。一句话定位见 README.md。

## 2. 铁律

- **TDD**：每个模块先写失败测试 → 跑确认失败 → 实现 → 跑确认绿 → commit
- **版本钉死**：依赖与 `version-lock.json` 的 `version_lock` 一致；不引入 lock 外的库
- **tag 即放行**：全量回归绿后打 `v<MAJOR>.<MINOR>.<PATCH>-<YYYYMMDD>`（如 `v0.3.54-20260826`）
- **mock-friendly**：安装 + 测试必须在无 Key、无 Docker、无网下全绿
- **功能清单是锚点**：改 `docs/functions/function-tree.md` 走 `/tree-change` 提案，由人批准；
  改功能与改功能清单必须同一个 commit；废弃只改状态，编号永不复用；禁止给 skip 的测试挂功能 ID

- 禁止使用 any 与 @ts-ignore（除非附 ADR 说明）
- 禁止在组件里直接 Taro.request；数据获取走 src/api/ 层
- 禁止 TARO_APP_* 等 env 键写默认值兜底（fail-fast，suite-hard-rules §1）
- 禁止绕过 shared 契约生成物手写 API 面（suite-hard-rules §4，Phase 1 起生效）
- 禁止 wx.* 原生 API 与 Taro.setStorage* 散落组件；统一走封装层与 src/store/
- npm 依赖一律走 registry.npmmirror.com

## 3. 技术栈与版本（钉死于 version-lock.json）

微信小程序（Taro 4.3.0 + React 18.3 + TypeScript + Vitest + ESLint 9 + Prettier）。npm 走 npmmirror（仓内 .npmrc legacy-peer-deps：taro peerOptional vite 与 vitest vite7 ERESOLVE）；门命令首词一律 npx（EXEC_ALLOWLIST 已含 npx/npm/node）。X11 槽不分配端口：无 dev server，四门全 CLI，weapp 构建链不入门（spec §4.2）；微信开发者工具与真 appid 属 Phase 1+。明细见 `version-lock.json` 与 README.md 技术栈表。

门禁命令见 `.harness/stack.json`。**不要改它来让门变松。**

## 4. 验收

- 在 **suite 根目录** 跑 `python scripts/gate.py -p saas-identity-platform-miniprogram`；exit 0 才算完成
- 本地命令见 README.md「快速开始」

## 5. 指向别处

- 功能清单（唯一锚点） → `docs/functions/function-tree.md`
- 需求 → 任务 → 功能影响 → `docs/requirements/`
- 流程/设计 与功能对齐 → `docs/design/`（人评审，机器只查引用）
- 决策背景 → `docs/adr/`；编码细则 → `docs/conventions/`（不进主上下文）
- 待办与迭代方向 → `PLAN.md`；版本变更 → `CHANGELOG.md`

## 6. 工作循环

0. **开工前分诊**：先过 `using-skills`，把激活 skill 的清单落成 todo。
   顺序：规格(brainstorming)→计划(writing-plans)→测试先红(red-first)→实现(executing-plans)
1. 读 `.state/session.json` 恢复上下文
2. 最小改动
3. 跑 `python scripts/gate.py -p saas-identity-platform-miniprogram`；exit 1 回到第 2 步；exit 2 停下问人
4. `/handoff` 更新 `.state/session.json`

> 家族值表与治理规则：suite docs/families/saas.md 与 docs/conventions/multi-repo-family.md §10

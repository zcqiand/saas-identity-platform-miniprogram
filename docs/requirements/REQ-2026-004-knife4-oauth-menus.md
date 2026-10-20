# REQ-2026-004 小程序刀4 OAuth + 菜单功能面——M04.F03/F04 镜像登记 + SessionStore.adoptOAuthToken

| 项 | 值 |
|---|---|
| 提出人 | Claude 机器侧规划推进（knife4 实施计划 Task 1，suite `.superpowers/sdd/2026-10-20-miniprogram-knife4-oauth-menus-alignment/task-1-brief.md`） |
| 提出日期 | 2026-10-20 |
| 优先级 | P1 |
| 状态 | 已评审 |
| 关联 ADR | ADR-0042（mirror 免批三类） |

## 1. 需求描述

knife4 照 swift 参照补齐 OAuth + 菜单功能面。Task 1 是第一块：
`SessionStore.adoptOAuthToken(token: TokenResponse)`（OAuth token 端点响应入账，
镜像 swift `SessionStore.swift:176-206`：ready 守卫 / 缺 accessToken fail-fast /
set-or-clear token 对 / 快照 currentTenantId+expiresAt / reBootstrap Bearer 重注）。

fnTest 锚点挂 **M04.F03.I02**（refresh 入账属 `/oauth/token` 端点消费面），
但本仓功能树只镜像登记过 M04.F01/F02（刀3），无 F03/F04——L5 会报悬空引用。

**本需求做两件事**（ADR-0042 mirror 免批类）：

1. **镜像登记**本仓树 M04.F03 身份认证（I01-I02）+ M04.F04 菜单管理（I01-I08）
   两 section + 模块表两 F 行；叶子行从 shared BASE 复制、剥 `.tsp:N` 锚、
   状态随本仓进度标「开发中」（仅前端交付，后端已在 shared 侧 GA）。
   M04 模块行注记更新为「knife3 已落 F01-F02、knife4 进行中 F03-F04」。
2. **交付物**：`src/corekit/session-store.ts` 新增 `adoptOAuthToken`；
   测试 `tests/corekit/session-store.test.ts` 追加四条用例，fnTest 挂 M04.F03.I02。

端点/DTO 只认 shared 契约生成物（`src/generated/`，TokenResponse）；禁手改生成物。

## 2. 验收

- `npx vitest run tests/corekit/session-store.test.ts` 全绿（含既有用例不回归）。
- `python scripts/gate.py -p saas-identity-platform-miniprogram` L5 不报 M04.F03/F04 悬空。

## 3. 刀4 T1 镜像登记⑥（2026-10-20，ADR-0042 mirror 免批通道）

1. **提案**：`.state/tree-change.json` mirror 提案 12 行变更（M04.F03 父行 +
   I01-I02 两叶子 + M04.F04 父行 + I01-I08 八叶子），`--report` 影响面全绿后
   `--apply` 自查自批生效（免批类：镜像登记）。
2. **镜像口径**：叶子行从 shared BASE 复制、去掉 `.tsp` 行号锚、状态随本仓
   进度标「开发中」（仅前端交付，后端已在 shared 侧 GA）；section 头注随
   shared 镜像（`.tsp` 锚同步剥除）。M04.F03.I02 的 fnTest 挂点在本任务
   adoptOAuthToken 用例（refresh grant 入账属 token 端点消费面）；I01 授权码
   签发本仓暂不消费、不挂 fnTest。

trace 锚点由 gate trace_cmd（`npx vitest run`，TRACE_MAP=1）产出，不手写。

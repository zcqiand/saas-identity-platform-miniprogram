# REQ-2026-003 小程序刀3 admin 面——M00.F01 租户管理页镜像登记（L5 悬空修复 + 交付登记）

| 项 | 值 |
|---|---|
| 提出人 | Claude 机器侧规划推进（knife3 实施计划，suite `docs/superpowers/plans/2026-10-20-miniprogram-knife3-admin-surface.md`） |
| 提出日期 | 2026-10-20 |
| 优先级 | P1 |
| 状态 | 已评审 |
| 关联 ADR | ADR-0042（mirror 免批三类） |

## 1. 需求描述

knife3 T3 租户管理页（`src/pages/tenants/index.tsx`）`@entry M00.F01.I01-I05`，
但本仓功能树只镜像登记过刀2 的 M01 段，无 M00——gate L5 报悬空引用。

shared SSOT（saas-identity-platform-shared `docs/functions/function-tree.md`）
M00.F01「租户维护」五子项（租户列表/创建/详情/更新/删除）状态**已上线**
（`/admin/tenants`，要求 platform_admin）。本仓 T2 hook
`src/corekit/use-admin-tenants.ts` 已按生成物 `AdminTenantsApi` 交付五个动作
（11 条 fnTest 挂 M00.F01.I01-I05），T3 页面为薄壳渲染。

**本需求做两件事**（ADR-0042 mirror 免批类）：

1. **镜像登记**本仓树 M00 模块行 + M00.F01 父行 + M00.F01.I01-I05 五叶子行，
   状态随本仓进度标「开发中」（本仓仅前端交付，后端已在 shared 侧 GA）。
   使页面 `@entry` 与 hook fnTest 引用落地。
2. **交付口径**：T3 页面元素随 swift `TenantsAdminView` 文案同构（标题「租户管理」、
   新建租户表单、行内编辑 + 状态切换、删除过 `Taro.showModal`、footer
   status 口径提醒）；逻辑覆盖在 T2 hook 测试，页面无测试义务。

端点/DTO 只认 shared 契约生成物（`src/generated/`）；页面禁直调 `Taro.request`。

## 2. 验收

- `python scripts/gate.py -p saas-identity-platform-miniprogram` exit 0
  （L5 不再报 M00 悬空）。
- `npx vitest run` 全绿（T2 hook 11 条不回归）。
- `npx taro build --type weapp` 通过。

## 3. 刀3 T4 镜像登记②（2026-10-20，ADR-0042 mirror 免批通道）

T4 `src/corekit/use-members.ts` 的 `@entry`/fnTest 锚点 M00.F02（I01-I06+I08）
与 M01.F02.I01 在本仓树无登记，L5 会报悬空。本节记 T4 的 mirror 登记：

1. **提案**：`.state/tree-change.json` mirror 提案 11 行变更（M00.F02 父行 +
   I01-I08 八叶子（I07 随 shared 保持「规划」，本仓不交付）+ M01.F02 父行 +
   I01），`--report` 影响面全绿后 `--apply` 自查自批生效
   （免批类：镜像登记；令牌绑定 sha 01f11bf09ce88c99）。
2. **镜像口径**：叶子行从 shared BASE 复制、去掉 `.tsp` 行号锚、状态随本仓
   进度标「开发中」（仅前端交付，后端已在 shared 侧 GA）；I07 保持「规划」
   原样镜像。M01.F02 段注记 REQ-2026-009 Q2（PUT 响应体 status 不可信，
   成功后 getMember 回读）。
3. **交付物**：`src/corekit/use-members.ts`（swift MembersViewModel 语义的
   hook 化：load 并发 Promise.all、assignRoles PUT+回读、invite 走 flatRow、
   update/create partial 请求体）；测试 `tests/corekit/use-members.test.ts`，
   fnTest 挂 M00.F02.I01-I06/I08 + M01.F02.I01（I03 经 refresh 动作）。

trace 锚点由 gate trace_cmd（`npx vitest run`，TRACE_MAP=1）产出，不手写。

## 4. 刀3 T6 镜像登记③（2026-10-20，ADR-0042 mirror 免批通道）

T6 `src/corekit/use-roles.ts` 的 fnTest 锚点 M00.F03（I01-I05）与 M00.F04（I02-I04）
在本仓树无登记，L5 会报悬空。本节记 T6 的 mirror 登记：

1. **提案**：`.state/tree-change.json` mirror 提案 11 行变更（M00.F03 父行 +
   I01-I05 五叶子 + M00.F04 父行 + I01-I04 四叶子），`--report` 影响面全绿后
   `--apply` 自查自批生效（免批类：镜像登记；令牌绑定 sha 6b7aa0b30b3fe70a）。
2. **镜像口径**：叶子行从 shared BASE 复制、去掉 `.tsp` 行号锚、状态随本仓
   进度标「开发中」（仅前端交付，后端已在 shared 侧 GA/开发中）；M00.F04.I01
   权限矩阵绑定随 shared 保持「已废弃」原样镜像（strikethrough 行不删号），
   本仓不交付、不进 fnTest 锚点。
3. **交付物**：`src/corekit/use-roles.ts`（swift 角色面动作的 hook 化：load
   角色列表、create/update/setStatus/remove/refresh、loadGrants 并发 grants+
   勾选清单、saveGrants PUT 全量替换+grants 原位更新、clearGrants DELETE 204
   → 本地 menuIds=[] 不发二次 GET）；测试 `tests/corekit/use-roles.test.ts`，
   fnTest 挂 M00.F03.I01-I05 + M00.F04.I02-I04（I01 已废弃不挂）。

trace 锚点由 gate trace_cmd 产出，不手写。

## 5. 刀3 T8 镜像登记④（2026-10-20，ADR-0042 mirror 免批通道）

T8 `src/corekit/use-tenant-applications.ts` 的 fnTest 锚点 M00.F05（I01-I04）
在本仓树无登记，L5 会报悬空。本节记 T8 的 mirror 登记：

1. **提案**：`.state/tree-change.json` mirror 提案 5 行变更（M00.F05 父行 +
   I01-I04 四叶子），`--report` 影响面全绿后 `--apply` 自查自批生效
   （免批类：镜像登记）。
2. **镜像口径**：叶子行从 shared BASE 复制、去掉 `.tsp` 行号锚、状态随本仓
   进度标「开发中」（仅前端交付，后端已在 shared 侧 GA）。路径 clientId 是
   字符串寻址非 UUID；update 走 PATCH partial（undefined 不进体；expireTime
   省略有 CT I76 实证，status 省略 wire 未实证——springboot DTO @NotNull，
   页面接线约定始终传 status）。
3. **交付物**：`src/corekit/use-tenant-applications.ts`（swift 订阅应用面动作
   的 hook 化：load 列表、subscribe 原位追加、update partial 原位替换、remove
   本地移除）；测试 `tests/corekit/use-tenant-applications.test.ts`，fnTest 挂
   M00.F05.I01-I04。

trace 锚点由 gate trace_cmd 产出，不手写。

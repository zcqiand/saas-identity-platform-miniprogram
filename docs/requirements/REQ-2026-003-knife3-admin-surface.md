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

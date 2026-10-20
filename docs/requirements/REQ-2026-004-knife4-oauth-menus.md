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

## 4. 刀4 T7 13 项全量对齐复核表（2026-10-20 收口）

> 范围：本仓已镜像登记的全部 13 个 F 项（M00.F01-F05 + M01.F01-F04 + M04.F01-F04），
> 逐项对照 swift 参照实现（saas-identity-platform-swift `Sources/`，行号为
> 2026-10-20 快照）与 miniprogram 交付面。miniprogram 侧测试锚点见 `.state/trace.json`
>（trace_cmd 产出）；knife3 段（M00/M01/M04.F01-F02）按各任务评审结论抽验无回归。

| ID | swift 对应（文件:行） | miniprogram 对应（文件） | 一致性结论 |
|---|---|---|---|
| M00.F01 租户维护 | APIGlue.swift:315；AdminTenantsViewModel.swift:54/70/86/103（load/create/update/delete）；TenantsAdminView.swift:11/73/159 | `src/corekit/use-admin-tenants.ts`（load/get/create/update/remove）+ `src/pages/tenants/index.tsx` | 一致：五动作同构，platform-admin 面无租户 fail-fast |
| M00.F02 租户成员 | APIGlue.swift:91；MembersViewModel.swift:94-243（load/create/update/changeStatus/remove/invite/refresh/flatRow）；MembersView.swift:11-382 | `src/corekit/use-members.ts`（:94 flatRow、:153-343 七动作）+ `src/pages/members/index.tsx` | 一致：I07 接受邀请两仓均不交付（随 shared「规划」） |
| M00.F03 租户角色 | APIGlue.swift:140；RolesViewModel.swift:90-185（load/create/update/setStatus/remove/refresh）；RolesAdminView.swift:11/117/340 | `src/corekit/use-roles.ts`（:141-290 六动作）+ `src/pages/roles/index.tsx` | 一致：status Int 1/0 口径、重名 roleCode 后端 500 红字呈现 |
| M00.F04 角色权限 | APIGlue.swift:169；RolesViewModel.swift:205-239（loadGrants/saveGrants/clearGrants）；RolesAdminView.swift:227（RoleMenuGrantsSection） | `src/corekit/use-roles.ts`（:319 loadGrants/:353 saveGrants/:385 clearGrants） | 一致：I01 权限矩阵两仓均不交付（已废弃）；PUT 全量替换 + clear 后本地 menuIds=[] |
| M00.F05 租户应用 | APIGlue.swift:195；TenantApplicationsViewModel.swift:65-123（load/subscribe/update/remove）；TenantApplicationsAdminView.swift:11/100/206 | `src/corekit/use-tenant-applications.ts`（:109-205 四动作）+ `src/pages/tenant-applications/index.tsx` | 一致：clientId 字符串寻址、update PATCH partial 永传 status（既有 open_question 保留） |
| M01.F01 用户维护 | APIGlue.swift:33；AuthViewModel.swift:84（whoami）；AccountView.swift:12（@entry M01.F01.I01） | `src/corekit/use-auth.ts`（:112 whoami）+ `src/pages/account/index.tsx` | 一致 |
| M01.F02 角色成员 | APIGlue.swift:66；MembersViewModel.swift:119（assignRoles）；MembersView.swift:123（RoleAssignView） | `src/corekit/use-members.ts`（:372 assignRoles） | 一致：roles PUT + getMember 回读（REQ-2026-009 Q2 口径） |
| M01.F03 租户成员（切换） | APIGlue.swift:54；AuthViewModel.swift:102/119（switchTenant/listTenants）；SessionStore.swift:139（adoptSwitch）；AccountView.swift:127 | `src/corekit/use-auth.ts`（:152 switchTenant/:176 listTenants）+ `src/corekit/session-store.ts`（:115 adoptSwitch） | 一致 |
| M01.F04 SSO 登录 | APIGlue.swift:33；AuthViewModel.swift:64/133（login/logout）；SessionStore.swift:104（adoptLogin）；LoginView.swift:11 | `src/corekit/use-auth.ts`（:128 login/:191 logout）+ `src/corekit/session-store.ts`（:89 adoptLogin）+ `src/corekit/token-store.ts` + `src/pages/login/index.tsx` | 一致：423 Locked 语义、登出本地清理强制 |
| M04.F01 应用维护 | APIGlue.swift:274；AdminClientsViewModel.swift:60-108（load/create/update/deleteClient）；ApplicationsView.swift:12/79/207 | `src/corekit/use-admin-clients.ts`（:103-182 load/get/create/update/remove + :224 publicInfo）+ `src/pages/admin-clients/index.tsx` | 一致：platform-admin 面；I03 密钥仅指纹；I05 删除级联吊销 |
| M04.F02 应用启用/停用 | AdminClientsViewModel.swift:125（setStatus）；ApplicationsView.swift（ClientDetailView 状态切换） | `src/corekit/use-admin-clients.ts`（:202 setStatus） | 一致：status Int 1/0 |
| M04.F03 身份认证 | APIGlue.swift:228；OAuthViewModel.swift:63/93/113（authorize/exchangeCode/refresh）；SessionStore.swift:176（adoptOAuthToken）；OAuthView.swift:11 | `src/corekit/use-oauth.ts`（:98 authorize/:142 exchangeCode/:176 refreshToken）+ `src/corekit/session-store.ts`（:143 adoptOAuthToken）+ `src/pages/oauth/index.tsx` | 一致：state 自生成回传校验 CSRF、失败/异常路径清残留 code/state、busy 再入守卫（swift 靠 disabled 等价）、免 clientSecret、adoptOAuthToken set-or-clear + reBootstrap 重注 |
| M04.F04 菜单管理 | APIGlue.swift:341；MenusViewModel.swift:72-175（load/create/update/move/reorder/deleteMenu）；MenuTree.swift:33（buildMenuTree）；MenusAdminView.swift:17/146/249 | `src/corekit/use-menus.ts`（:129-285 六动作）+ `src/corekit/menu-tree.ts`（:29 buildMenuTree）+ `src/pages/menus/index.tsx` + `src/corekit/use-my-menus.ts`（I08）+ `src/pages/account/index.tsx`（我的菜单只读区） | 一致（见分歧注①）：零值 UUID 根桶口径、(sortOrder,title) 双键排序、I08 见注② |

**分歧与裁决**

1. **（minor，非契约冲突）** 菜单管理页入口两仓同构（swift `MenusAdminView` 自
  AccountView.swift:68 NavigationLink 进入；miniprogram 同为 Account 入口进
  `pages/menus`）。页面形态差异（swift Form 分段 vs 小程序卡片/弹层）均为
  minor，端点/DTO 全部来自 shared 生成物（MenusApi/MeApi），无
  「本仓需要 ≠ shared」张力，不路由人裁。
2. **（minor，交付面超集）** M04.F04.I08 当前用户有效菜单：swift 侧未消费
  `/me/menus`（MenuTree.swift:6 明注「/me/menus 的 null 口径不在本切片」），
  miniprogram 刀4 T6 主动交付只读区（use-my-menus 直渲染 EffectiveMenuNode
  嵌套树，禁过 buildMenuTree——两套口径铁律）。端点来自 shared 生成物 MeApi，
  属本仓对 shared 契约的合法额外消费，非分叉。
3. 页面级文案差异（「换 token」vs「换 token」按钮措辞、卡片式 vs Form 分段）均为
  minor，不阻塞；无 ADR-0029 级契约不一致。

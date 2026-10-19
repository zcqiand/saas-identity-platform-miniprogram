---
name: writing-plans
description: 规格已定、要开工时使用。把功能拆成 2-5 分钟一个的微任务，每个任务绑一个 fn-ID + 它的测试。用户说"开始做""拆任务""怎么实现"时用它。
---

# Writing Plans（拆成绑 fn-ID 的微任务）

计划的价值不在「有个计划」，在**每个任务小到不会跑偏、且天生对齐 trace 契约**。
本 suite 的锚点是功能子项 ID（`M01.F01.I03`），所以这里的计划不是自由文本，
是一串**「fn-ID → 测试 → 实现」**的三元组。

## 边界

- 计划里出现的**新** fn-ID，必须先走 `alignment` 的 `/tree-change` 提案、由人批准登记，
  才能进计划开工。计划引用悬空 ID = L5 直接红。
- 计划是文档，写在 `docs/plans/PLAN-<REQ号>.md`。**写计划这一步不写实现代码。**

## 一个任务长什么样

每个任务 2-5 分钟能完成，且**自带四要素**，缺一不可：

```
### 任务 N: <一句话>
- fn-ID:     M01.F01.I03            # 对齐锚点，必须已在 function-tree
- 文件:      src/xxx.ts / tests/xxx.test.ts   # 写死路径，不留"某处"
- 测试先行:  先写 tests/xxx.test.ts，跑红（见 red-first）
- 入口:      面向用户的子项，触发元素挂 data-fn="M01.F01.I03"（见 reachability）
- 验证:      npx vitest run xxx  → 由红转绿；然后 gate -p <项目>（含 L5 可达性）
```

拆不到 2-5 分钟、或写不出确切文件路径和验证命令，说明**还没想清楚**，回去拆细。

## 流程

1. 从 REQ 的「功能影响」表取 fn-ID 清单（`alignment` 已产出）。
2. 每个 fn-ID 拆成 1-N 个上面的微任务，**按依赖排序**（被依赖的先做）。
3. 标出任务间的**串行/并行**关系——并行任务可交给 `executing-plans` 分派多个子代理。
4. 存 `docs/plans/PLAN-<REQ号>.md`，把每个任务的验证命令也写进去。
5. 交给 `executing-plans` 逐任务执行；实现前每个任务先过 `red-first`。

## 交接

- 实现 → `executing-plans`（逐任务子代理 + 两段审查）
- 每任务实现前 → `red-first`（测试先红）
- 卡住 → `systematic-debugging`

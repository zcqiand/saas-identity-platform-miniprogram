---
name: using-skills
description: 每条用户消息开工前先读这条。判断该激活哪些 skill、按什么优先级、要不要先停下问人。用户让你写代码、改需求、查 bug、加功能、重构、审查时，尤其先过这里。
---

# Using Skills（开工前分诊）

这是**调度器**。它存在的唯一理由：模型会给自己找借口绕过 skill——
「这问题很简单」「我先看看代码再说」——于是你辛苦写的约定全部空转。
所以每条消息动手之前，先在这里过一遍,不是可选项。

## 铁律

1. **先分诊，再动手。** 收到任务，先判类型 → 命中哪个 skill → 读它 → 再干。
   不要凭「感觉简单」跳过。判「不需要 skill」也是一次显式判断，不是默认。
2. **把 skill 的清单落成 todo。** 命中的 skill 里每个「必须做」的步骤，进你的 todo，
   逐条勾。别在脑子里记，会漏。
3. **多个命中就按下面的优先级串起来**，不是选一个。

## 分诊表

| 用户在干什么 | 先激活 | 然后 |
|---|---|---|
| 提新需求 / 说功能要变 | `alignment`（`/req`） | 出 REQ + 功能影响表，**不写码** |
| 需求含糊、方向没定 | `brainstorming` | 逼出规格 → 交给 `alignment` |
| 规格定了、要开工 | `writing-plans`（`/plan`） | 拆成绑 fn-ID 的微任务 |
| 计划批了、要实现 | `red-first` + `executing-plans` | 测试先红，逐任务子代理 + 两段审查 |
| 要并行做多个 / 隔离一个 feature | `using-worktrees` | 每条线一个 worktree，验证基线，收尾合并 |
| 做面向用户的功能 / 验收"用不用得了" | `reachability` | 入口挂 data-fn，L5 查用户点不点得到 |
| 动功能清单（增/改/废） | `alignment`（`/tree-change`） | 提案 → **人批准** → 才动 |
| 查 bug / 门红了不知道为啥 | `systematic-debugging`（`/debug`） | 根因优先，禁止乱试 |
| 提交前 | `code-reviewer` agent | 分级问题清单 |
| 写/改 suite 自己的 skill | `writing-skills`（operator） | 作者化 + skill-lint + eval |
| 前端界面 | 栈技能 `app-ui` / `react-perf` | 见栈技能表 |

## 优先级（多个命中时）

1. **人的批准闸**最高：碰 `function-tree.md` 一律先走 `/tree-change`，没令牌不动。
2. **规格先于计划，计划先于代码，测试先于实现。** 顺序不能倒。
   想直接写实现？回去看有没有跳过 brainstorming / plan / red-first。
3. **gate 是终局**：任何产出最后都要 `python scripts/gate.py -p <项目>` 绿。

## 边界

- 分诊是**判断**，不是套流程。快脚本、一次性查询、纯问答，判「不需要 skill」很正常——
  但那是你显式判过的结论，要能说出为什么。
- 分诊本身别喧宾夺主：命中一个就去读它、干活，别在这页上写长篇分析。

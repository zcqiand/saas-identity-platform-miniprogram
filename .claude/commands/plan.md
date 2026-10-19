---
description: 把已定规格拆成绑 fn-ID 的 2-5 分钟微任务
argument-hint: <项目名> <REQ号或规格>
allowed-tools: Read, Write, Glob, Bash(python scripts/gate.py:*)
---

用 writing-plans skill 处理：

$ARGUMENTS

1. 从 REQ 的「功能影响」表取 fn-ID 清单。新 fn-ID 必须已由我经 `/tree-change` 批准。
2. 每个 fn-ID 拆成 2-5 分钟的微任务，每个自带四要素：
   fn-ID / 写死的文件路径 / 测试先行 / 验证命令。
3. 按依赖排序，标出可并行的任务。
4. 存 `docs/plans/PLAN-<REQ号>.md`。
5. **这一步不写实现代码。** 拆不出确切路径和验证 = 还没想清，回去拆细。

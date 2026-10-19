---
description: 把一个新需求落成需求文档 + 功能影响表
argument-hint: <项目名> <需求原话>
allowed-tools: Read, Write, Edit, Glob, Bash(python scripts/gate.py:*)
---

用 alignment skill 处理：

$ARGUMENTS

1. 先把用户原话照抄进文档，再写你的理解。有出入的进「澄清记录」并**向我提问**，不要自行拍板。
2. 「功能影响」表里每个 ID 都必须能在该项目的 `docs/functions/function-tree.md` 里找到。
   新增功能先去登记（状态=规划）。
3. **不要写代码。不要改 src/。** 这一步只产出文档。
4. 收尾跑 `python scripts/gate.py -p <项目> --only L5`。

最后告诉我：新增几个功能、变更几个、删除几个，以及你有哪些没把握的地方。

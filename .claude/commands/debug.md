---
description: 系统化调试——根因之前禁止修
argument-hint: <项目名> <现象>
allowed-tools: Read, Grep, Glob, Bash
---

用 systematic-debugging skill 处理：

$ARGUMENTS

1. 复现：最小步骤稳定复现，写一个复现该 bug 的失败测试（挂对 fn-ID）。
2. 假设根因：写下一句话「因为 X 所以 Y」，找证据。**别急着改。**
3. 验证假设为真，再动手。假设错了就丢，回上一步。
4. 针对根因最小修复，失败测试转绿，`python scripts/gate.py -p <项目>` 全绿。
5. **同一 bug 修三次还红：停手，写 ADR，交给我。** 不许乱试。

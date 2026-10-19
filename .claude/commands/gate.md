---
description: 跑门禁链，按 exit code 决定下一步
argument-hint: [项目名，省略则自动选中唯一项目]
allowed-tools: Bash(python scripts/gate.py:*), Read, Edit
---

跑 `python scripts/gate.py -p $ARGUMENTS`（无参数则直接 `python scripts/gate.py`）。

- exit 0：更新该项目 `.state/session.json` 的 `last_gate_passed_at`，然后停。
- exit 1：按 stderr 的修复提示做**最小**修复，重跑。最多三轮。
- exit 2：**停下，把原始输出交给我。** 不要修改 `.harness/stack.json`。

不要为了让门变绿而修改门。

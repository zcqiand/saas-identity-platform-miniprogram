---
description: 审计一个功能 ID：它到底做了没有、测了没有、删掉会碎哪些地方
argument-hint: <功能 ID，如 M01.F01.I03>
allowed-tools: Task, Read, Bash(python scripts/checks/_alignment.py:*)
---

用 `alignment-auditor` 子代理审计 `$ARGUMENTS`。

把它的报告原样给我。不要替我加解读，不要替我决定该不该补测试。

如果它的「判断」一节里有任何一条给不出 `文件:行`，指出来——
**给不出行号的判断就是猜测**，我要知道哪些是猜的。

最后你自己补一句：这份审计里，哪一条最值得我今天就处理。

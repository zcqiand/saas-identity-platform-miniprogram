---
description: 打印功能对齐矩阵（子项 × 需求/流程/设计/测试）
argument-hint: <项目名>
allowed-tools: Bash(python scripts/checks/_alignment.py:*)
---

跑 `python scripts/checks/_alignment.py -p $ARGUMENTS --matrix`。

原样给我结果，然后只回答三个问题：

1. 「已上线」且**测试列为空**的子项？（上线速度超过验证速度的信号）
2. 「已上线」且**设计列为空**的子项？（代码先行、设计没落纸）
3. 「已上线」且**流程列为空**、又不在孤儿白名单里的子项？（可能没人要）

不要替我决定哪些该补。列出来，说明风险，等我裁量。

---
description: 查哪些面向用户的功能还没接进界面（用户点不到）
argument-hint: <项目名>
allowed-tools: Read, Bash(python scripts/gate.py:*), Bash(python scripts/checks/_alignment.py:*)
---

用 reachability skill 处理：

$ARGUMENTS

1. 跑 `python scripts/checks/_alignment.py -p <项目> --matrix`，看「入口」列。
2. 「入口」为空的面向用户子项 = 用户点不到。已上线的会让 L5 硬失败。
3. 给每个缺入口的功能，在触发它的按钮/链接/路由上挂 `data-fn="<子项ID>"`。
4. 复跑 `python scripts/gate.py -p <项目> --only L5` 确认转绿。

告诉我：几个功能缺入口、分别是什么类型、你打算把入口挂在哪。

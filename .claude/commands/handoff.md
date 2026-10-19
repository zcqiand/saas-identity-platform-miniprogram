---
description: 收工。固化跨会话状态，供下次会话冷启动
argument-hint: <项目名>
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(python scripts/gate.py:*), Read, Write
---

收工。按顺序：

1. `python scripts/gate.py --all` —— 不绿不许收工
2. `git status --short`
3. 重写 `output/<项目>/.state/session.json`：
   - `current_task` 一句话
   - `done` 本次真正完成的（门禁验证过的才算）
   - `next` 下次第一步做什么，具体到文件
   - `open_questions` 需要人决策的
   - `dont` 已经试过且失败的路径，别让下个会话再踩
4. 输出 3 行以内收工摘要

`session.json` 是写给「失忆的你自己」看的。别写客套话。

---
name: using-worktrees
description: 要并行做多个任务/功能、或想把一个 feature 隔离开做时使用。建 git worktree + 分支，验证干净基线，收尾合并/丢弃。用户说"并行""隔离开做""开个分支""这几个一起做"时用它。
---

# Using Worktrees（并行的地基）

`executing-plans` 会为并行任务派多个子代理。但**多个子代理在同一个工作树上改会互相踩**，
而且没有 per-feature 分支、没有收尾。这个 skill 补上隔离基座。

## 什么时候用

- 一个 feature 想跟主树隔离开做（不污染主树，随时可弃）。
- 计划里标了「可并行」的任务要真并行——每条并行线一个 worktree。
- **单个小改动不用**：直接在主树改、过 gate 就行，别为一行改动开 worktree。

## 流程

### 1. 建（含基线校验）
```bash
python scripts/worktree.py new <feature> [--project <p>]
```
建 `feat/<feature>` 分支 + 独立 worktree，并**验证干净基线**（gate 绿）。
基线不绿会警告——你不该在一个本来就红的树上加东西，否则分不清是谁弄红的。

### 2. 进去干活
`cd` 进 worktree，照常走 red-first → executing-plans。这一线的子代理只在这个树里改。

### 3. 收尾
```bash
python scripts/worktree.py finish <feature> --merge     # 合并前强制过一次 gate --all
python scripts/worktree.py finish <feature> --keep      # 先留着，稍后处理
python scripts/worktree.py finish <feature> --discard   # 整条线丢弃，worktree+分支一起删
```
`--merge` 会在 worktree 里先跑 `gate --all`，不绿拒绝合并。

## 边界

- worktree 是**执行隔离**，不是版本控制策略。合并冲突、分支管理仍是人的判断。
- 需要 git 仓库。suite 默认不 git init 项目——先在 suite 根 `git init` 并提交一次基线。
- 并行不是越多越好：每条并行线都要各自过两段审查 + gate，合流后再整体过一次 gate。

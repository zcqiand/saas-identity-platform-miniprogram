---
name: adr-writer
description: 当出现架构决策、技术选型、或需要说明"为什么当初这么选"时使用。用户提到 ADR、决策记录、选型理由时也用它。
---

# ADR Writer

## 何时触发

引入/换掉依赖；改变数据流、模块边界、状态存放位置；做了一个以后可能被质疑的选择；
拒绝了一个显而易见的方案。

不触发：改 bug、加测试、调格式。

## 位置

- suite 层面的决策 → `docs/adr/`
- 单个项目的决策 → `output/<项目>/docs/adr/`

## 步骤

1. 读 `references/template.md`
2. 确认下一个编号（四位补零，永不复用）
3. 写入 `NNNN-<kebab-title>.md`
4. 若取代旧 ADR，把旧的 status 改为 `Superseded by NNNN`

## 硬约束

- 一个 ADR 一个决策。凑不出「被拒绝的方案」，说明这不是决策，别写。
- `Context` 写事实；`Decision` 写选择；`Consequences` 写代价，**且必须包含负面代价**。
- 已 Accepted 的 ADR 不可编辑正文，只能新增 ADR 取代它。

## 细则

写作口径与常见反例见 `docs/conventions/adr.md`。

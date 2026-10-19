---
description: 需求含糊时，先用苏格拉底式发问逼出规格，再落 REQ
argument-hint: <项目名> <一句话想法>
allowed-tools: Read, Glob
---

用 brainstorming skill 处理：

$ARGUMENTS

1. 照抄我的原话，别急着理解。
2. 一次问 1-3 个最要命的问题：边界（不做什么）、谁在什么场景用、
   验收能不能写成「当…则…」、边缘情况、碰哪些已有 fn-ID。
3. 至少给一个「更简单的版本」，分块让我逐块确认。
4. 收敛成一页规格：目标 / 非目标 / 验收 / 影响的 fn-ID / 待定问题。
5. **不写代码、不改 src/、不动 function-tree。** 我点头后，才走 `/req`。

# agents/

只放**需要上下文隔离**的任务。按作用域分目录，由 `init_project.py` 安装到
`output/<项目>/.claude/agents/`。

```
agents/
├── common/      装进每个项目。哈希锁定，改了 L0 门会红
└── <stack>/     只装进该栈的项目。可自由编辑
```

## 三条判据，全中才建

1. 该任务会读入大量主线不需要的内容（日志、全量文件、搜索结果）
2. 该任务的产出是一份**结论**，不是一堆中间过程
3. 主线不需要看到它的推理过程

不满足 → 用 skill 或 command，别用 agent。
agent 的成本是一次完整的上下文冷启动，不要因为"看起来像个角色"就建。

## 反例：test-writer / code-writer

有人会想把"写测试"和"写实现"拆成两个 agent。**不要。**

| 判据 | code-reviewer | test-writer / code-writer |
|---|---|---|
| ① 读入大量主线不需要的内容 | ✅ diff + 相关文件 | ❌ 它读的东西主线也要读 |
| ② 产出是结论 | ✅ 分级问题清单 | ❌ **产出就是文件本身** |
| ③ 主线不需要看推理过程 | ✅ | ❌ 为什么这么设计，主线必须看到 |

更深的理由：**agent 会切断门禁回环。**

写代码的循环是 `改 → gate.py → 读 exit code → 读修复提示 → 再改`。
它依赖跨轮次的记忆：L2 上一轮报了什么、我试过哪三种改法、`.state/session.json`
的 `dont` 里写着哪些路已经走死了。

subagent 是一次冷启动的上下文，跑完就没了。你会把一个有状态的回环塞进一个无状态的盒子。
它看不到前几轮的门禁输出，第 4 次还在撞同一堵墙。

### 如果你真正想要的是「写实现的不许改测试」

那是**写权限隔离**，不是上下文隔离。agent 给不了你这个保证 ——
subagent 的 `tools:` 是工具级限制，不是路径级限制。一个能用 `Edit` 的 agent
能改 `tests/` 里的任何文件。

正确的做法是 phase lock：`.state/phase.json` 记录当前阶段，PreToolUse hook 按阶段
拒绝写入，`red → green` 的迁移需要一份**红灯证据**（入红之后测试门真的红过一次，
exit code 落进 `.state/red.json`）。

「测试真的红过」是事实，机器判得了。这比"我让一个隔离的 agent 去写"硬得多。

**本 suite 已实现 phase lock（ADR-0044，两态模型）**：

- green（默认稳态）：写实现自由；**写测试 = 自动入红**（guard hook 代写 phase.json，零仪式成本）
- red（写测试期）：写测试自由；写实现被 hook 拦截，直到 `gate.py --only L3` 真红一次
  （gate 自动落盘 `.state/red.json`），然后 `python scripts/phase.py -p <项目> --to green` 凭证据出红
- 纯重构/修旧测试等不针对新行为的改动：`--to green --force` 交互式人批（模型经 Bash 必 EOF 失败，只有人能确认）

路径映射在 `scripts/lib/phase_paths.py`（suite 固定表，项目不可自定义）；未知栈 fail-safe 放行。
细节与第一版局限见 `docs/adr/0044-phase-lock-red-evidence.md`。

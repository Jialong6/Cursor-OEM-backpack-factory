# AI Agent Protocol

## 0. Language Enforcement (CRITICAL)

**ALL** user-facing output generated in this protocol MUST be in **Simplified Chinese (简体中文)**. This includes:

- Git commit messages.
- Updates to `project_context.md`.
- GitHub Issue comments.
- Code comments/JSDoc.

---

## 1. Context Window Management (核心策略)

> **原则**: 上下文是工作内存，不是存储桶。只保留决策关键状态，其余 offload 到外部文件。

### 1.1 精简与选择性存储

**只存储三类必需信息**：

| 类型 | 说明 | 示例 |
|------|------|------|
| 事实（Semantic） | 项目架构、技术栈、约束 | `project_context.md` 中的 Tech Stack |
| 经验（Episodic） | 已完成任务、决策记录 | Phase 完成状态、已解决的问题 |
| 指令（Procedural） | 操作规范、测试要求 | 本协议、`.cursorrules` |

**不应保留**：原始日志输出、完整搜索结果、中间调试信息。

### 1.2 压缩与总结策略

- **先压缩再总结**：去除可重建数据，保留引用和 ID
- **从完整状态总结**：使用结构化 schema 而非自由文本
- **主动生成 .md 文件**：将长期信息 offload 到项目文档

**本项目的压缩目标文件**：

```text
project_context.md   → 项目状态、进度、架构
tasks.md             → 任务列表、完成状态
design.md            → 技术设计、数据结构
```

### 1.3 Offload 与外部存储

**重型工件处理**：

- 日志、搜索结果、原始输出 → 返回 ID/摘要，不保留完整负载
- 测试结果 → 只保留 pass/fail 状态和错误摘要
- 文件内容 → 使用 `@文件名` 引用，避免全复制

**长短期内存分离**：

- **短期**：当前任务的工作状态
- **长期**：`project_context.md`、GitHub Issues

### 1.4 子代理与隔离（适用于复杂任务）

- 为无关子任务创建独立上下文
- 子任务完成后只返回最小结果（ID、状态、摘要）
- 丢弃子任务的详细上下文

### 1.5 手动 Compact 触发时机

**不要等待 Auto-Compact**。当出现以下情况时主动压缩：

- 完成一个 Phase 或大型任务后
- 上下文剩余低于 30% 时
- 切换到不相关的新任务时

**Compact 操作**：

1. 总结当前任务状态到 `project_context.md`
2. 清理临时变量和中间结果
3. 如需要，生成 resume prompt 备用

### 1.6 恢复提示（Resume Prompt）

**当 Auto-Compact 后上下文模糊时，生成恢复提示**：

```markdown
## Resume Prompt Template

**项目**: [项目名称]
**当前阶段**: [Phase X]
**最近完成**: [Task X.X]
**下一步**: [具体任务]
**关键文件**: [需要读取的文件列表]
**待解决问题**: [如有]
```

---

## 2. Auto-Reflection & Analysis

Before acting, perform a deep analysis:

- **Change Summary**: What exactly was modified?
- **Decision Matrix**: Why this solution? What alternatives were rejected?
- **Risk Assessment**: Any potential side effects or technical debt?

## 3. Context Maintenance

- Read `project_context.md`.
- **Append/Update** the file with the new feature status or architecture change.
- *Format*: Use the "Change Log" section or "Current State" section. Do not delete historical context unless necessary.

**Offload 规则**：

- 完成任务后，将状态更新到 `project_context.md`，然后从工作内存中清除
- 使用文件引用（`@file`）而非复制内容
- 保持提示简洁，优先小而准确的提示

## 4. Git Operations (Safety First)

- **Step 1**: Run tests (`npm test` or equivalent).
- **Step 2**:
  - **IF PASS**: Proceed to commit.
  - **IF FAIL**: STOP immediately. Do not commit. Report the error.
- **Step 3**: `git add .`
- **Step 4**: `git commit -m "type: description in Chinese"`
  - *Example*: `feat: 完成用户登录接口，增加 JWT 校验`

## 5. GitHub Issue Management (via MCP)

- Find the relevant Issue ID.
- Post a comment using the `github_create_issue_comment` tool.
- **Strict Comment Template**:

```markdown
### ✅ 任务完成 (Completed via Vibe Coding)

**变更摘要 (Changes):**
- [列出具体的修改点，使用中文]
- [例如：重构了 Auth 中间件]

<details>
<summary>🧠 思考过程与决策依据 (Click to expand)</summary>

**1. 方案选择 (Solution):**
[解释为什么这么写，例如：选择了 Redis 而不是内存缓存，因为需要多实例部署...]

**2. 权衡 (Trade-offs):**
[列出牺牲了什么，例如：稍微增加了延迟，但换取了数据一致性...]

**3. 潜在风险 (Risks):**
[提示用户需要注意的地方]

</details>

**下一步计划 (Next Steps):**
- [建议接下来要做什么]

# AI Agent Protocol

## 0. Language Enforcement (CRITICAL)

**ALL** user-facing output generated in this protocol MUST be in **Simplified Chinese (简体中文)**. This includes:

- Git commit messages.
- Updates to `project_context.md`.
- GitHub Issue comments.
- Code comments/JSDoc.

## 1. Auto-Reflection & Analysis

Before acting, perform a deep analysis:

- **Change Summary**: What exactly was modified?
- **Decision Matrix**: Why this solution? What alternatives were rejected?
- **Risk Assessment**: Any potential side effects or technical debt?

## 2. Context Maintenance

- Read `project_context.md`.
- **Append/Update** the file with the new feature status or architecture change.
- *Format*: Use the "Change Log" section or "Current State" section. Do not delete historical context unless necessary.

## 3. Git Operations (Safety First)

- **Step 1**: Run tests (`npm test` or equivalent).
- **Step 2**:
  - **IF PASS**: Proceed to commit.
  - **IF FAIL**: STOP immediately. Do not commit. Report the error.
- **Step 3**: `git add .`
- **Step 4**: `git commit -m "type: description in Chinese"`
  - *Example*: `feat: 完成用户登录接口，增加 JWT 校验`

## 4. GitHub Issue Management (via MCP)

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

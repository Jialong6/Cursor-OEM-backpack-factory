# MCP 快速开始指南

## 已配置的 MCP 服务器

本项目已配置了四个 MCP 服务器：

1. **Filesystem MCP** - 文件系统操作
2. **Brave Search MCP** - 网络搜索功能
3. **Context7 MCP** - 文档和代码示例查询
4. **GitHub MCP** - GitHub 仓库和 Git 操作

## 快速配置步骤

### 1. Filesystem MCP

Filesystem MCP 已自动配置完成，无需额外操作。

### 2. Brave Search MCP

Brave Search MCP 已添加到配置中，但需要您提供 API Key：

#### 步骤：

1. **获取 API Key**
   - 访问：https://api.search.brave.com/
   - 注册/登录账户
   - 在 API 密钥管理页面生成新的 API 密钥

2. **配置 API Key**

   **方法一：使用脚本（推荐）**
   ```bash
   ./setup-brave-mcp.sh
   ```

   **方法二：手动编辑**
   - 打开：`~/.cursor/mcp.json`
   - 找到 `"BRAVE_API_KEY": "YOUR_BRAVE_API_KEY_HERE"`
   - 替换为您的实际 API Key

3. **重启 Cursor IDE**

### 3. Context7 MCP

Context7 MCP 已添加到配置中，但需要您提供 API Key：

#### 步骤：

1. **获取 API Key**
   - 访问：https://context7.com/dashboard
   - 注册/登录账户
   - 在仪表板中生成新的 API 密钥
   - **重要**：API 密钥只会显示一次，请妥善保存

2. **配置 API Key**

   **方法一：使用脚本（推荐）**
   ```bash
   ./setup-context7-mcp.sh
   ```

   **方法二：手动编辑**
   - 打开：`~/.cursor/mcp.json`
   - 找到 `"context7"` 配置项
   - 将 `"YOUR_CONTEXT7_API_KEY_HERE"` 替换为您的实际 API Key

3. **重启 Cursor IDE**

**注意**：需要 Node.js v18 或更高版本

### 4. GitHub MCP

GitHub MCP 已添加到配置中，但需要您提供 Personal Access Token (PAT)：

#### 步骤：

1. **获取 Personal Access Token**
   - 访问：https://github.com/settings/tokens
   - 点击 "Generate new token" -> "Generate new token (classic)"
   - 设置 Token 名称和过期时间
   - 选择所需的权限范围：
     - **repo** - 完整仓库访问（包括私有仓库）
     - **read:org** - 读取组织信息
     - **read:user** - 读取用户信息
     - **workflow** - GitHub Actions 工作流访问
   - 点击 "Generate token" 生成令牌
   - **重要**：Token 只会显示一次，请妥善保存

2. **配置 Personal Access Token**

   **方法一：使用脚本（推荐）**
   ```bash
   ./setup-github-mcp.sh
   ```

   **方法二：手动编辑**
   - 打开：`~/.cursor/mcp.json`
   - 找到 `"github"` 配置项
   - 将 `"YOUR_GITHUB_PAT_HERE"` 替换为您的实际 Personal Access Token

3. **重启 Cursor IDE**

**注意**：需要 Node.js v18 或更高版本

## 使用示例

配置完成后，重启 Cursor，然后您可以：

### Filesystem MCP
- "读取 requirements.md 文件"
- "列出项目的所有文件"
- "创建一个新的组件文件"

### Brave Search MCP
- "搜索 Next.js 14 的最新文档"
- "查找如何配置 Tailwind CSS 的最佳实践"
- "搜索 React Server Components 的使用方法"

### Context7 MCP
在提示中添加 `use context7` 指令：
- "创建一个基本的 Next.js 项目，使用应用路由。use context7"
- "如何使用 React Hook Form 和 Zod？use context7"
- "配置 next-intl 进行国际化。use context7"

### GitHub MCP
- "查看我的 GitHub 仓库列表"
- "获取某个仓库的最新提交信息"
- "创建一个新的 Issue"
- "搜索 GitHub 上的 Next.js 项目"
- "查看某个仓库的 Pull Requests"

## 配置文件位置

- **Cursor MCP 配置**: `~/.cursor/mcp.json`
- **项目配置模板**: `./mcp-config.json`

## 更多信息

详细配置说明请查看：[mcp-setup.md](./mcp-setup.md)

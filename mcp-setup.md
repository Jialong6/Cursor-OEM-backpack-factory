# MCP 配置指南

本指南将帮助您在 Cursor 中配置 MCP 服务器，包括 Filesystem、Brave Search 和 Context7。

## 配置步骤

### Filesystem MCP 配置

#### 1. 创建 Cursor MCP 配置文件

在您的用户目录下创建或编辑 MCP 配置文件：

**macOS/Linux 路径：**
```
~/.cursor/mcp.json
```

**Windows 路径：**
```
C:\Users\{您的用户名}\.cursor\mcp.json
```

#### 2. 配置文件内容

将以下内容添加到配置文件中（如果文件已存在，请将新的服务器配置添加到 `mcpServers` 对象中）：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/lijialong/CursorProject/Cursor-OEM-backpack-factory"
      ],
      "env": {}
    }
  }
}
```

**注意：** 请将路径 `/Users/lijialong/CursorProject/Cursor-OEM-backpack-factory` 替换为您实际的项目路径。

#### 3. 可选：限制访问范围

如果您想限制 filesystem MCP 只能访问特定目录，可以修改路径参数。例如：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/lijialong/CursorProject/Cursor-OEM-backpack-factory"
      ],
      "env": {},
      "allowedPaths": [
        "/Users/lijialong/CursorProject/Cursor-OEM-backpack-factory"
      ]
    }
  }
}
```

#### 4. 重启 Cursor

配置完成后，需要重启 Cursor IDE 以使配置生效。

### Brave Search MCP 配置

#### 1. 获取 Brave Search API Key

1. 访问 [Brave Search API](https://api.search.brave.com/)
2. 注册或登录账户
3. 在 API 密钥管理页面生成新的 API 密钥

#### 2. 配置 Brave Search MCP

**方法一：使用自动配置脚本（推荐）**

运行项目中的配置脚本：

```bash
./setup-brave-mcp.sh
```

脚本会提示您输入 API Key，并自动更新配置文件。

**方法二：手动配置**

在 `~/.cursor/mcp.json` 文件的 `mcpServers` 对象中添加以下配置：

```json
{
  "mcpServers": {
    "filesystem": {
      ...
    },
    "brave-search": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-brave-search"
      ],
      "env": {
        "BRAVE_API_KEY": "您的API密钥"
      }
    }
  }
}
```

**注意：** 请将 `"您的API密钥"` 替换为您在第一步获取的实际 API Key。

#### 3. 完整的配置文件示例

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/lijialong/CursorProject/Cursor-OEM-backpack-factory"
      ],
      "env": {}
    },
    "brave-search": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-brave-search"
      ],
      "env": {
        "BRAVE_API_KEY": "YOUR_BRAVE_API_KEY_HERE"
      }
    },
    "context7": {
      "command": "npx",
      "args": [
        "-y",
        "@upstash/context7-mcp",
        "--api-key",
        "YOUR_CONTEXT7_API_KEY_HERE"
      ],
      "env": {}
    }
  }
}
```

### Context7 MCP 配置

#### 1. 获取 Context7 API Key

1. 访问 [Context7 Dashboard](https://context7.com/dashboard)
2. 注册或登录账户
3. 在仪表板中生成新的 API 密钥
   - **重要**：API 密钥只会显示一次，请妥善保存

#### 2. 配置 Context7 MCP

**方法一：使用自动配置脚本（推荐）**

运行项目中的配置脚本：

```bash
./setup-context7-mcp.sh
```

脚本会提示您输入 API Key，并自动更新配置文件。

**方法二：手动配置**

在 `~/.cursor/mcp.json` 文件的 `mcpServers` 对象中添加以下配置：

```json
{
  "mcpServers": {
    "filesystem": {
      ...
    },
    "brave-search": {
      ...
    },
    "context7": {
      "command": "npx",
      "args": [
        "-y",
        "@upstash/context7-mcp",
        "--api-key",
        "您的API密钥"
      ],
      "env": {}
    }
  }
}
```

**注意：** 请将 `"您的API密钥"` 替换为您在第一步获取的实际 API Key。

#### 3. 系统要求

- Node.js 版本 v18 或更高，以获得最佳兼容性

## 验证配置

### Filesystem MCP

重启后，您可以在 Cursor 中使用 MCP 工具来：
- 读取文件
- 写入文件
- 列出目录
- 创建目录
- 删除文件/目录

### Brave Search MCP

配置完成后，您可以在 Cursor 中使用 Brave Search 进行网络搜索：
- 搜索最新的技术文档
- 查找编程问题的解决方案
- 获取实时的技术资讯

### Context7 MCP

配置完成后，您可以在 Cursor 中使用 Context7 获取最新的文档和代码示例：
- 获取特定版本的框架文档
- 查询最新的 API 使用示例
- 获取相关技术栈的最佳实践

## 使用示例

### Filesystem MCP 示例

- "读取 requirements.md 文件"
- "列出当前目录下的所有文件"
- "创建新文件 example.ts"

### Brave Search MCP 示例

- "搜索 Next.js 14 的最新特性和最佳实践"
- "查找如何解决 Tailwind CSS 响应式设计问题"
- "搜索最新的 React Hook 使用指南"

### Context7 MCP 示例

在编写提示时，添加 `use context7` 指令来使用 Context7：

- "创建一个基本的 Next.js 项目，使用应用路由。use context7"
- "如何使用 React Hook Form 和 Zod 实现表单验证？use context7"
- "配置 next-intl 进行国际化。use context7"

## 故障排除

### Filesystem MCP 问题

如果 Filesystem MCP 无法正常工作：

1. **检查配置文件路径**：确保配置文件在正确的位置且文件名正确
2. **检查 JSON 格式**：确保 JSON 格式正确，没有语法错误
3. **检查路径**：确保配置中的路径是绝对路径且存在
4. **检查权限**：确保 Cursor 有权限访问配置的目录
5. **查看日志**：在 Cursor 的开发者工具中查看 MCP 相关的错误日志

### Brave Search MCP 问题

如果 Brave Search MCP 无法正常工作：

1. **检查 API Key**：确保 API Key 正确且有效
2. **检查网络连接**：Brave Search API 可能需要稳定的网络连接
3. **检查 API 配额**：确保您的 API Key 没有超出使用限额
4. **验证配置**：确认配置文件中 `BRAVE_API_KEY` 环境变量已正确设置
5. **查看日志**：在 Cursor 的开发者工具中查看 MCP 相关的错误日志
6. **测试 API Key**：可以在终端中测试 API Key 是否有效：
   ```bash
   curl "https://api.search.brave.com/res/v1/web/search?q=test" \
     -H "X-Subscription-Token: YOUR_API_KEY"
   ```

### Context7 MCP 问题

如果 Context7 MCP 无法正常工作：

1. **检查 API Key**：确保 API Key 正确且有效
   - API Key 只会显示一次，如果遗失需要重新生成
2. **检查 Node.js 版本**：确保 Node.js 版本为 v18 或更高
   ```bash
   node --version
   ```
3. **检查网络连接**：Context7 API 需要稳定的网络连接
4. **验证配置**：确认配置文件中 API Key 已正确传递为参数
5. **查看日志**：在 Cursor 的开发者工具中查看 MCP 相关的错误日志
6. **检查包安装**：确保 `@upstash/context7-mcp` 包可以正常安装
   ```bash
   npx -y @upstash/context7-mcp --help
   ```

## 参考资料

- [Model Context Protocol 官方文档](https://modelcontextprotocol.io/)
- [Cursor MCP 文档](https://docs.cursor.com/context/model-context-protocol)
- [Context7 官方文档](https://context7.com/docs/installation)
- [Context7 Dashboard](https://context7.com/dashboard)
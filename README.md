# Better Bags Myanmar - OEM Backpack Factory Website

Better Bags Myanmar 背包 OEM 工厂独立站项目，采用单页滚动式（One-Page Scroll）海报风格设计，支持中英文国际化。

## 项目概述

本项目是一个 Next.js 14+ 应用，用于展示 Better Bags Myanmar 背包 OEM 工厂的服务和产品。网站采用现代化的响应式设计，支持中英文双语切换。

## 技术栈

- **前端框架**: Next.js 14+ (App Router)
- **样式框架**: Tailwind CSS 3.4+
- **国际化**: next-intl
- **表单处理**: React Hook Form + Zod
- **邮件服务**: Resend/SendGrid API
- **人机验证**: mCaptcha
- **部署平台**: Vercel

## 项目结构

```
/
├── app/                    # Next.js App Router 应用
├── components/             # React 组件
├── locales/               # 国际化语言文件
├── lib/                   # 工具函数和配置
├── public/                # 静态资源
└── design.md              # 设计文档

```

## 开始使用

### 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 开发模式

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
npm run build
# 或
yarn build
# 或
pnpm build
```

### 启动生产服务器

```bash
npm start
# 或
yarn start
# 或
pnpm start
```

## MCP 配置

本项目已配置了多个 Model Context Protocol (MCP) 服务器，用于增强开发体验：

- **Filesystem MCP** - 文件系统操作
- **Brave Search MCP** - 网络搜索功能
- **Context7 MCP** - 文档和代码示例查询
- **GitHub MCP** - GitHub 仓库和 Git 操作

详细配置说明请查看：
- [MCP 快速开始指南](./MCP-QUICKSTART.md)
- [MCP 详细配置文档](./mcp-setup.md)

**注意**: 配置文件 `mcp-config.json` 包含敏感 API 密钥，不会被提交到仓库。请使用 `mcp-config.json.template` 作为模板，并根据需要配置您的 API 密钥。

## 项目文档

- [需求文档](./requirements.md) - 项目需求说明
- [设计文档](./design.md) - 详细的设计和架构说明
- [任务列表](./tasks.md) - 项目任务和实现计划
- [项目上下文](./project_context.md) - 项目背景信息

## 功能特性

- ✅ 响应式设计，支持移动端和桌面端
- ✅ 中英文双语支持
- ✅ 单页滚动式海报风格设计
- ✅ 表单提交和验证
- ✅ SEO 优化
- ✅ 现代化 UI/UX 设计

## 许可证

[待定]

## 联系方式

更多信息请查看项目文档或联系项目维护者。

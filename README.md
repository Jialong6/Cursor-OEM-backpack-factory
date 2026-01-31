# Better Bags Myanmar - OEM Backpack Factory Website

Better Bags Myanmar 背包 OEM 工厂独立站，采用单页滚动式（One-Page Scroll）海报风格设计，支持中英文国际化。

## 技术栈

- **前端**: Next.js 15.1+ (App Router), React 19, TypeScript 5
- **样式**: Tailwind CSS 3.4+
- **国际化**: next-intl
- **表单**: React Hook Form + Zod
- **邮件**: Resend/SendGrid API
- **验证**: mCaptcha
- **部署**: Vercel

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 标准启动
npm run dev

# 或清理缓存后启动（推荐）
rm -rf .next && npm run dev
```

访问：
- **http://localhost:3000/en** - 英文版
- **http://localhost:3000/zh** - 中文版

### 构建生产版本

```bash
npm run build
npm start
```

### 运行测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 覆盖率报告
npm run test:coverage
```

## 当前状态（v1.0）

- **158 tests passed, 2 skipped**
- **13 个属性测试**（Property-Based Testing, fast-check）
- **22 个静态页面**
- **首页 First Load JS: 185 kB**

## 功能特性

- 响应式设计（移动端和桌面端）
- 中英文双语支持
- 单页滚动式海报风格
- 表单提交和验证（Zod）
- SEO 优化（sitemap.xml, Open Graph, hreflang）
- 无障碍设计（WCAG AA）
- 性能优化（图片懒加载、WebP/AVIF、tree-shaking）

## 第二版规划 (v2.0) - i18n-geo-routing

**计划扩展至 10 种语言**：
- 亚洲：中文(zh)、日语(ja)、韩语(ko)、泰语(th)、越南语(vi)
- 欧洲：英语(en)、德语(de)、法语(fr)、西班牙语(es)
- 中东：阿拉伯语(ar)

**核心功能**：
- 基于 IP 地理位置自动路由
- 浏览器 Accept-Language 检测
- 用户语言偏好持久化（Cookie）
- 智能回退链：用户偏好 > Geo-IP > 浏览器 > 默认(en)

详见 `requirements.md`、`design.md` 和 `tasks.md`。

## 故障排查

**快速修复**:

```bash
# 一键清理并重启
rm -rf .next && \
lsof -ti:3000,3001,3002,3003 | xargs kill -9 2>/dev/null && \
npm run dev
```

## 项目文档

- [需求文档](./requirements.md)
- [设计文档](./design.md)
- [任务列表](./tasks.md)
- [Claude 指导文档](./CLAUDE.md)

## MCP 配置

已配置多个 MCP 服务器：Filesystem, Brave Search, Context7, GitHub。详见 [MCP 快速开始指南](./MCP-QUICKSTART.md)。

## 许可证

[待定]

# Project Context: Better Bags Myanmar (One-Page OEM Website)

> **AI INSTRUCTIONS**: This file is the SOURCE OF TRUTH.
>
> 1. **Read before coding**: Always check "Current Status" and "Tech Stack".
> 2. **Update after coding**: Mark tasks as `[x]` and update "Current Project State" when a feature is done.
> 3. **Language**: Maintain documentation and commits in Simplified Chinese (简体中文).

## 1. Project Overview & Architecture

**Goal**: Build a premium, One-Page Scroll OEM factory website for "Better Bags Myanmar".
**Style**: Poster-style, Minimalist, High-end B2B.
**Core Features**: Bilingual (EN/ZH), Smooth Scroll, Contact Form (with file upload), Blog Section.

### Tech Stack (Non-Negotiable)

- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Styling**: Tailwind CSS 3.4+ (Mobile First)
- **I18n**: `next-intl` (Routing: `/[locale]/...`)
- **State/Form**: React Hook Form + Zod
- **Testing**: Vitest + `fast-check` (Property-Based Testing is MANDATORY)
- **Services**: Resend/SendGrid (Email), mCaptcha (Security)
- **Deployment**: Vercel

### Design Tokens

- **Brand Colors**:
  - Primary Cyan: `#81C3D7`
  - Primary Blue: `#416788`
  - Secondary Grey: `#5a6d7c`
  - Dark Blue: `#2f6690`
- **Typography**: Fluid sizing using `clamp()` (Body: 14px-18px).

## 2. Directory Structure

```text
/
├── app/[locale]/       # Routes (layout, page, blog)
├── components/
│   ├── layout/         # Navbar, Footer, LanguageSwitcher
│   ├── sections/       # Hero, About, Features, Services, FAQ, Contact, Blog
│   └── ui/             # Reusable atoms (Button, Card, Accordion)
├── lib/                # validations.ts, utils.ts
├── locales/            # en.json, zh.json
└── tests/              # Property-based tests (Vitest)
```

## 3. Core Correctness Properties (Must be Verified)

See design.md for full definitions. All features must pass these Property Tests.

- **Language Consistency**: Switching locale updates ALL text instantly.
- **Persistence**: Refreshing page keeps the selected language.
- **Scroll Position**: Switching language does not jump scroll position.
- **Responsive Nav**: Hamburger menu appears < 768px; Links active based on scroll position.
- **Form Safety**: Invalid data implies NO submission; Valid data implies success message.
- **A11y**: All interactive elements must be keyboard accessible and focusable.

## 4. Current Project State

**Phase**: ✅ Phase 2 已完成 → ✅ Phase 3 已完成 → ⏳ Phase 4 准备中
**Current Focus**: Phase 3 全部完成（组件开发 + 属性测试）。下一步进入 Phase 4 联系表单与 API 开发。
**Last Updated**: 2026-01-12

### Progress Summary

**已完成阶段**: Phase 0 (MCP配置) ✅ | Phase 1 (初始化) ✅ | Phase 2 (布局组件) ✅ | Phase 3 (首页区块) ✅
**当前阶段**: 准备进入 Phase 4 (联系表单与 API)
**测试状态**: 44 个测试通过（包括 Property 2, 3, 4, 6, 9）
**代码提交**: 25 个提交

**已完成需求**: 需求 1, 2, 5, 6, 7, 8, 9, 10, 13 ✅ | 需求 3 (60%), 需求 4 (50%)
**待完成需求**: 需求 11-12, 14-16 ⏳

### Recently Completed

**✅ Task 1.1: Next.js 项目初始化**

- Next.js 15.5.9 + TypeScript + App Router 项目初始化
- Tailwind CSS 3.4+ 配置完成
  - 品牌色系：Primary Cyan (#81C3D7)、Primary Blue (#416788)、Secondary Grey (#5a6d7c)、Dark Blue (#2f6690)
  - 流式字体系统：使用 clamp() 实现响应式字体尺寸（Body: 14px-18px）
- 项目目录结构创建：components/、lib/、locales/、tests/
- 开发服务器验证成功（<http://localhost:3000）>

**✅ Task 1.2: I18n 国际化配置**

- next-intl 4.7.0 安装完成
- i18n 路由配置：middleware.ts 实现自动语言检测
- 双语翻译文件：locales/en.json、locales/zh.json
- app 目录重构为 app/[locale] 结构（支持 /en、/zh 路由）
- LanguageSwitcher 语言切换器组件（零布局偏移）
- 路由前缀策略：localePrefix='always'（强制显示语言前缀）
- 验证通过：双语切换功能正常运行
- **英文翻译内容已完成**：已填充所有区块的完整英文翻译（about, banner, features, services, faq, contact, footer, nav, customization）

**✅ Task 1.3: 测试环境搭建**

- Vitest 4.0.16 测试框架安装完成
- fast-check 4.5.3 属性测试库安装完成
- @testing-library/react 16.3.1 组件测试库安装完成
- happy-dom 20.1.0 浏览器环境模拟（替代 jsdom，更轻量高效）
- vitest.config.mts 配置文件：支持 TypeScript、React、路径别名
- 测试环境设置文件：tests/setup.ts（自动清理 DOM）
- 测试脚本配置：test、test:watch、test:ui、test:coverage
- 示例测试验证通过：6 个测试全部通过（属性测试 + React 组件测试）

**✅ Task 1.4: 语言持久化属性测试**

- 创建属性测试文件：tests/properties/locale-persistence.test.ts
- 实现属性 2：语言偏好持久化往返一致性验证
- 测试覆盖：
  - localStorage 存储后读取的往返一致性（100 次迭代）
  - 多次读取的一致性验证（100 次迭代）
  - 语言切换时的正确性验证（100 次迭代）
  - 补充单元测试：中文/英文偏好、空值处理、覆盖更新
- 所有测试通过：13 个测试（包括 7 个新增的语言持久化测试）
- 验证需求 2.4：语言偏好持久化功能正确性得到保证

**✅ Task 3.1: 固定导航栏组件（Navbar）**

- 创建 Navbar 组件：components/layout/Navbar.tsx
- 实现功能：
  - 固定定位（sticky）在视口顶部，z-index: 50
  - 滚动检测：页面滚动 > 20px 时背景从透明变为半透明白色 + 毛玻璃效果
  - Intersection Observer 监听当前可见区块
  - 导航链接高亮：当前区块对应的链接自动高亮
  - 平滑滚动：点击导航链接平滑滚动到对应区块（考虑导航栏高度偏移）
  - Logo 设计：BB 渐变色方块 + "Better Bags" 文字
  - 集成 LanguageSwitcher 组件
  - 桌面端导航链接布局（移动端汉堡菜单待实现）
- 语言文件统一：zh.json 和 en.json 的导航键统一为 "nav"
- 测试页面：创建包含所有导航区块的测试页面
- 验证需求：5.1, 5.2, 3.3, 3.4

**✅ Task 3.2: 响应式汉堡菜单**

- 移动端菜单状态管理：useState + useRef
- 汉堡菜单按钮（<768px 显示）：
  - 三横线图标，打开时变为 X 形（旋转动画）
  - 响应滚动状态的颜色变化
  - 无障碍属性：aria-label, aria-expanded
- 移动端菜单抽屉：
  - 从右侧滑入/滑出动画（transform: translateX）
  - 背景遮罩：半透明黑色 + 毛玻璃效果
  - 点击遮罩关闭菜单
- 键盘导航支持：
  - ESC 键关闭菜单
  - Tab 键焦点循环（焦点陷阱）
  - 菜单打开时自动聚焦第一个链接
- 用户体验优化：
  - 菜单打开时锁定背景滚动
  - 点击菜单项后自动关闭菜单
  - 平滑动画过渡（300ms duration）
- 响应式显示：md:hidden / hidden md:flex
- 验证需求：5.4, 5.5, 5.6

**✅ Task 3.3: 页脚组件（Footer）**

- 创建 Footer 组件：components/layout/Footer.tsx
- 实现功能：
  - 公司信息展示（名称、地址、邮箱、电话）
  - 图标：位置、邮件、电话（SVG）
  - 快捷链接：7 个导航链接
  - 平滑滚动功能：点击链接平滑滚动到对应区块
  - 工作时间展示
  - 版权信息：动态年份 + 版权文字
- 响应式布局：
  - 移动端：1 列
  - 平板端：2 列
  - 桌面端：4 列（公司信息占 2 列）
- 样式设计：
  - 背景：深灰色（bg-gray-900）
  - 文字：浅灰色（text-gray-300）
  - 高亮色：Primary Cyan
  - 悬停效果：链接颜色变化
- 语言文件更新：zh.json 添加 footer 翻译
- 集成到 RootLayout：Navbar + children + Footer
- 验证需求：13.1, 13.2, 13.3, 13.4, 13.5

**✅ Property Tests: Phase 2 导航组件属性测试**

- 创建属性测试文件：tests/properties/scroll-preservation.test.tsx
- 实现属性 3：滚动位置保持
  - 测试滚动位置保存逻辑（100 次迭代）
  - 测试滚动位置恢复逻辑（100 次迭代）
  - 测试往返一致性（误差 ±10px）（100 次迭代）
  - 补充单元测试：0px、1000px、恢复清除、无保存位置等场景
- 创建属性测试文件：tests/properties/responsive-menu.test.tsx
- 实现属性 6：响应式汉堡菜单
  - 测试移动端汉堡菜单可见性（<768px）（100 次迭代）
  - 测试桌面端导航链接可见性（≥768px）（100 次迭代）
  - 补充单元测试：320px、768px、1920px 等典型断点
- 所有测试通过：26 个测试（包括 13 个新增的属性测试）
- 验证属性 3 和属性 6 的正确性得到保证

**✅ Task 5.1: HeroBanner 组件**

- 创建 HeroBanner 组件：components/sections/HeroBanner.tsx
- 实现功能：
  - 全屏设计（min-h-screen）+ 渐变背景
  - 标题、标语、三段介绍文字
  - "立即咨询" CTA 按钮（平滑滚动到联系区块）
  - 六大数据统计展示（20+年经验、150+MOQ、7-10天打样、100%质检等）
  - 向下滚动指示器（动画效果）
- 语言文件更新：zh.json 添加 banner 和 features.stats 翻译
- 集成到 app/[locale]/page.tsx
- 验证需求：6.1, 6.2, 6.3, 6.4, 6.5

**✅ Task 5.2: 导航锚点滚动属性测试**

- 创建属性测试文件：tests/properties/navigation-scroll.test.tsx
- 实现属性 4：导航锚点滚动
  - 测试点击导航链接滚动到正确位置（100 次迭代）
  - 测试滚动偏移量计算（考虑导航栏高度）（100 次迭代）
  - 测试所有导航链接都能正确滚动（100 次迭代）
  - 补充单元测试：各个导航区块（banner, about, features 等）
- IntersectionObserver 模拟：修复类构造器问题
- DOM 清理优化：每次属性测试迭代后清理 DOM
- 所有测试通过：36 个测试（包括 10 个新增的导航滚动测试）
- 验证属性 4 的正确性得到保证

**✅ Task 5.3: AboutUs 组件**

- 创建 AboutUs 组件：components/sections/AboutUs.tsx
- 实现功能：
  - 公司使命和愿景展示（带图标）
  - 六大核心价值观展示（3列网格布局）
  - 公司历史和介绍（4段描述）
  - 合作品牌展示（Anello、New Balance、Nike、Fila）
  - Organization JSON-LD 结构化数据
- 语言文件更新：zh.json 添加 about 完整翻译
- 集成到 app/[locale]/page.tsx
- 验证需求：7.1, 7.2, 7.3, 7.4, 7.5, 7.6

**✅ Task 5.4: Features 组件**

- 创建 Features 组件：components/sections/Features.tsx
- 实现功能：
  - Jay 个人介绍区块
  - 四大核心优势展示（使用对应品牌色）
    - 稳定的质量与一致性 (#81C3D7)
    - 灵活的 OEM/ODM 解决方案 (#416788)
    - 竞争力的量产价格 (#5a6d7c)
    - 便捷的地理位置 (#2f6690)
  - 八种定制选项展示（4列网格布局）
  - "立即定制" CTA 按钮（平滑滚动到联系区块）
- 语言文件优化：用户优化 zh.json 内容更专业简洁
- 集成到 app/[locale]/page.tsx
- 验证需求：8.1, 8.2, 8.3, 8.4, 8.5

**✅ Task 5.5: Services 组件**

- 创建 Services 组件：components/sections/Services.tsx
- 实现功能：
  - 六步服务流程展示：接收客户询盘、生产报价、样品开发、批量生产、质量控制、包装与运输
  - 每个步骤包含：图标、编号、标题、详细描述
  - 响应式网格布局（移动端纵向、平板端2列、桌面端3列）
  - 流程说明区块
- 翻译内容：zh.json 和 en.json 已有完整的 services 翻译
- 集成到 app/[locale]/page.tsx
- 所有测试通过：36/36
- 验证需求：9.1, 9.2, 9.3, 9.4

**✅ Task 5.6: FAQ 组件**

- 创建 Accordion UI 组件：components/ui/Accordion.tsx
  - 可重用的手风琴组件
  - 一次只展开一个项目（点击问题展开答案，自动折叠其他已展开的答案）
  - 平滑动画过渡（300ms duration）
  - 无障碍键盘支持（aria-expanded, aria-controls）
- 创建 FAQ 区块组件：components/sections/FAQ.tsx
  - 展示 5 个分类的 FAQ 内容：常规及售前、订单打样与报价、样品开发、生产进度与运输、质量控制与售后支持
  - 集成 Accordion 组件实现手风琴交互
  - 添加 FAQPage JSON-LD 结构化数据
  - 支持中英文内容切换
  - 底部添加 CTA 按钮引导联系
- 翻译内容：zh.json 和 en.json 已有完整的 faq.sections 翻译
- 集成到 app/[locale]/page.tsx
- 所有测试通过：36/36
- 验证需求：10.1, 10.2, 10.3, 10.4, 10.5

**✅ Task 5.7: FAQ 手风琴交互属性测试**

- 创建属性测试文件：tests/properties/accordion-interaction.test.tsx
- 实现属性 9：FAQ手风琴交互
  - 属性测试 1：点击任意问题后，该问题展开且只有一个问题处于展开状态（100 次迭代）
  - 属性测试 2：连续点击多个问题时，正确处理展开/折叠状态切换（100 次迭代）
  - 属性测试 3：点击已展开的问题会将其折叠，所有问题都变为折叠状态（100 次迭代）
  - 补充单元测试：基本交互、默认展开、aria-controls、空列表、单个问题切换
- 安装 @testing-library/user-event 依赖
- 测试优化：
  - 使用 beforeEach 清理 DOM
  - 使用 within(container) 避免多组件渲染冲突
  - 使用 getAllByRole('button') 精确查找按钮
- 所有测试通过：44/44
- 验证需求：10.2, 10.3
- 验证属性 9 的正确性得到保证

### Known Constraints & Rules

- **Git**: 提交消息必须使用简体中文（例如：`feat: 初始化项目结构`）
- **Tests**: 没有属性测试通过的功能不能视为"完成"
- **Performance**: 图片必须使用 `next/image` 并启用懒加载
- **MCP**: 已配置四个 MCP 服务器，可在开发过程中使用增强功能

## 5. Development Roadmap (Progress Tracking)

### Phase 0: 开发工具配置 ✅

**[x] 0.1 MCP 服务器配置**

- 配置 Filesystem MCP：支持项目目录的文件系统操作
- 配置 Brave Search MCP：支持网络搜索功能（需 API Key）
- 配置 Context7 MCP：支持文档和代码示例查询（需 API Key）
- 配置 GitHub MCP：支持 GitHub 仓库和 Git 操作（需 Personal Access Token）
- 创建自动配置脚本：`setup-mcp.sh`, `setup-brave-mcp.sh`, `setup-context7-mcp.sh`, `setup-github-mcp.sh`
- 提供配置文档：`MCP-QUICKSTART.md`, `mcp-setup.md`
- 创建配置模板文件：`mcp-config.json.template`（保护敏感 API 密钥）
- 更新 `.gitignore` 以排除包含真实 API 密钥的配置文件

**相关文件**：

- `mcp-config.json.template`：MCP 配置模板（不含敏感信息）
- `MCP-QUICKSTART.md`：快速开始指南
- `mcp-setup.md`：详细配置文档
- `setup-*.sh`：自动化配置脚本

**注意事项**：

- `mcp-config.json` 包含真实的 API 密钥，已被 `.gitignore` 排除
- 所有 MCP 配置脚本已设置为可执行
- 配置文件位置：`~/.cursor/mcp.json`

---

### Phase 1: Initialization & Infrastructure ✅

[x] 1.1 Project Setup: Next.js + TS + Tailwind (Config colors & fonts).

[x] 1.2 I18n Setup: next-intl, locales JSON structure, middleware.

[x] 1.3 Test Setup: Vitest + fast-check env.

[x] 1.4 Property Test: Language Persistence (Prop #2).

### Phase 2: Layout & Navigation ✅

[x] 3.1 Navbar: Sticky, scroll spy, smooth scroll.

[x] 3.2 Mobile Menu: Hamburger animation & logic.

[x] 3.3 Footer: Quick links & company info.

[x] 3.4 Language Switcher: Zero-layout-shift switching (已完成于 Task 1.2).

[x] Test: Hamburger logic (Prop #6), Scroll preservation (Prop #3).

### Phase 3: Home Page Sections (Static) ✅

[x] 5.1 Hero Banner: Fullscreen (100vh), CTA.

[x] 5.2 Test: Navigation anchor scrolling (Prop #4).

[x] 5.3 About Us: Mission/Values/History.

[x] 5.4 Features: 4 Core advantages + Customization list.

[x] 5.5 Services: 6-step process (Responsive layout).

[x] 5.6 FAQ: Accordion component with Schema.org.

[x] 5.7 Test: Accordion interaction (Prop #9).

**Phase 3 已完成！** 所有首页区块组件和对应的属性测试已全部实现。

**下一步**: 进入 Phase 4 联系表单与 API 开发。

### Phase 4: Contact & Dynamic Features

[ ] 7.1 Form Validation: Zod schema (validations.ts).

[ ] 7.3 Contact UI: Form layout + File upload UI.

[ ] 7.4 API Route: /api/contact handling + Email.

[ ] Test: Form integrity (Prop #10, #11).

### Phase 5: Blog & Final Polish

[ ] 9.1 Blog System: List view + Detail view + SEO.

[ ] 10.1 Integration: Final One-Page assembly.

[ ] 12.1 Polish: Fluid fonts, Responsive images, A11y checks.

[ ] 13.1 SEO: Metadata, Sitemap, OpenGraph.

---

## 6. 测试覆盖情况

### ✅ 已完成的属性测试

- [x] **Property 2**: 语言偏好持久化往返 ✅
- [x] **Property 3**: 滚动位置保持 ✅
- [x] **Property 4**: 导航锚点滚动 ✅
- [x] **Property 6**: 响应式汉堡菜单 ✅
- [x] **Property 9**: FAQ手风琴交互 ✅

### ⏳ 待完成的属性测试

- [ ] **Property 1**: 语言切换一致性
- [ ] **Property 5**: 导航激活状态同步（Phase 6）
- [ ] **Property 7**: 字体大小响应式范围（Phase 7）
- [ ] **Property 8**: 图片宽高比保持（Phase 7）
- [ ] **Property 10**: 表单验证完整性（Phase 4）
- [ ] **Property 11**: 表单提交成功处理（Phase 4）
- [ ] **Property 12**: 键盘焦点可见性（Phase 9）
- [ ] **Property 13**: 页脚链接滚动（可选）

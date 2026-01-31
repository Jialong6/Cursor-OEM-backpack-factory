# 实现计划

## 已完成阶段（v1.0）

- [x] Phase 1: 项目初始化与基础配置
  - Next.js 14+ 项目创建
  - Tailwind CSS 配置（品牌色、响应式）
  - i18n 配置（next-intl, 中英文）
  - 测试环境配置（Vitest, fast-check）

- [x] Phase 2: 检查点 - 13 tests passed

- [x] Phase 3: 布局组件开发
  - Navbar（固定导航、汉堡菜单、语言切换）
  - Footer（公司信息、快捷链接）
  - RootLayout（全局样式）

- [x] Phase 4: 检查点 - 26 tests passed

- [x] Phase 5: 首页区块组件开发
  - HeroBanner（全屏海报、统计数据、CTA）
  - AboutUs（使命、愿景、价值观、JSON-LD）
  - Features（Jay 介绍、四大优势、定制选项）
  - Services（6 个服务阶段）
  - FAQ（手风琴、JSON-LD）

- [x] Phase 6: 检查点 - 44 tests passed

- [x] Phase 7: 联系表单与 API 开发
  - 表单验证 Schema（Zod）
  - Contact 区块（询价表单、mCaptcha、文件上传）
  - API 端点（app/api/contact/route.ts）

- [x] Phase 8: 检查点 - 79 tests passed

- [x] Phase 9: 博客功能开发
  - BlogPreview（3 篇精选文章）
  - 博客列表页（6 篇文章）
  - 博客详情页（Markdown 渲染）

- [x] Phase 10: 首页整合与平滑滚动
  - 统一区块 ID 锚点
  - 全局平滑滚动（CSS scroll-behavior）
  - URL 锚点自动滚动

- [x] Phase 11: 检查点 - 84 tests passed, 2 skipped

- [x] Phase 12: 响应式与自适应优化
  - 自适应字体大小（clamp()）
  - 图片响应式加载（OptimizedImage 组件）
  - 属性测试：字体范围、图片宽高比

- [x] Phase 13: SEO 与元数据优化
  - 页面元数据（lib/metadata.ts）
  - 语义化 HTML 结构（h1 唯一性）
  - XML 站点地图（sitemap.xml, robots.txt）

- [x] Phase 14: 无障碍优化
  - 图片 alt 文本和 aria-hidden
  - 颜色对比度检查（WCAG AA）
  - 键盘导航支持（焦点样式、Skip navigation）
  - 表单 ARIA 属性

- [x] Phase 15: 性能优化
  - 资源压缩（禁用 source maps、移除 console.log）
  - 图片优化（WebP/AVIF、响应式尺寸）
  - 脚本加载优化（JSON-LD 非阻塞）

- [x] Phase 16: 最终检查点
  - **158 tests passed, 2 skipped**
  - 生产构建成功：22 个静态页面
  - 性能指标：首页 185 kB

## 已验证的属性（Property-Based Testing）

1. 语言切换一致性
2. 语言偏好持久化往返
3. 滚动位置保持
4. 导航锚点滚动
5. 导航激活状态同步
6. 响应式汉堡菜单
7. 字体大小响应式范围
8. 图片宽高比保持
9. FAQ 手风琴交互
10. 表单验证完整性
11. 表单提交成功处理
12. 键盘焦点可见性
13. 页脚链接滚动

## 第二版实现计划：国际化地理路由系统 (i18n-geo-routing)

### 概述

采用渐进式实现策略：先完成核心路由逻辑，再扩展UI组件，最后优化性能和无障碍性。

### Task 1: 扩展 i18n 配置支持10种语言 (串行 - 基础依赖) [已完成]

- [x] 1.1 更新 i18n.ts 添加新语言配置
  - 扩展 locales 数组为 ['en', 'zh', 'ja', 'de', 'nl', 'fr', 'pt', 'es', 'zh-tw', 'ru']
  - 添加 localeConfig 对象
  - 导出 Locale 类型定义
- [x] 1.2 编写属性测试 **Property 1: Locale Configuration Completeness** (19 tests)
- [x] 1.3 创建8个新语言的翻译文件骨架 + **Property 2: Translation File Structure** (69 tests)
  - locales/ja.json, de.json, nl.json, fr.json, pt.json, es.json, zh-tw.json, ru.json
  - **Checkpoint: 266 tests passed, 2 skipped**

### Task 2: 实现边缘中间件爬虫检测 (可并行)

- [ ] 2.1 创建 lib/bot-detector.ts
  - 实现 BOT_PATTERNS 常量数组
  - 实现 detectBot(userAgent: string): boolean
- [ ] 2.2 编写属性测试 **Property 4: Bot Detection Accuracy**
- [ ] 2.3 集成爬虫检测到 middleware.ts
- [ ] 2.4 编写属性测试 **Property 5: Bot Bypass Guarantee**

### Task 3: 实现 Geo-IP 路由逻辑 (可并行)

- [ ] 3.1 创建 lib/geo-router.ts
  - 实现 COUNTRY_LOCALE_MAP
  - 实现 getLocaleFromCountry()
  - 实现 getLocaleFromAcceptLanguage()
- [ ] 3.2 编写属性测试 **Property 6: Country-to-Locale Mapping Correctness**
- [ ] 3.3 集成 Geo-IP 路由到 middleware.ts
- [ ] 3.4 编写属性测试 **Property 15: Redirect Status Code Consistency**

### Task 4: 实现语言偏好 Cookie 管理 (可并行)

- [ ] 4.1 创建 lib/language-preference.ts
  - 实现 getLangPrefFromCookie()
  - 实现 setLangPrefCookie()
- [ ] 4.2 编写属性测试 **Property 14: Cookie Attribute Correctness**
- [ ] 4.3 集成 Cookie 优先级到 middleware.ts
- [ ] 4.4 编写属性测试 **Property 7: Cookie Priority Over Geo-IP**

### Task 5: Checkpoint - 核心路由逻辑验证 (串行)

- 确保所有路由相关测试通过
- 验证爬虫绕过、Geo-IP 路由、Cookie 优先级

### Task 6: 实现 Hreflang SEO 标签生成 (可并行)

- [ ] 6.1 创建 components/seo/HreflangTags.tsx
- [ ] 6.2 编写属性测试 **Property 9: Hreflang Tag Generation Correctness**
- [ ] 6.3 集成 HreflangTags 到根布局

### Task 7: 实现 JSON-LD 结构化数据 (可并行)

- [ ] 7.1 创建 components/seo/ManufacturingPlantSchema.tsx
- [ ] 7.2 编写属性测试 **Property 10: JSON-LD Schema Validity**
- [ ] 7.3 编写属性测试 **Property 11: Localized Schema Description**
- [ ] 7.4 创建 components/seo/FAQPageSchema.tsx
- [ ] 7.5 集成 Schema 组件到相关页面

### Task 8: 实现语言切换横幅组件 (可并行)

- [ ] 8.1 创建 components/i18n/LanguageBanner.tsx
- [ ] 8.2 编写属性测试 **Property 8: Language Banner Visibility Logic**
- [ ] 8.3 添加横幅翻译文本到所有语言文件
- [ ] 8.4 集成 LanguageBanner 到根布局

### Task 9: 实现语言切换器组件 (可并行)

- [ ] 9.1 创建 components/i18n/LanguageSwitcher.tsx
- [ ] 9.2 集成 LanguageSwitcher 到导航栏

### Task 10: Checkpoint - SEO 和国际化组件验证 (串行)

- 确保 Hreflang、JSON-LD、语言切换组件正常工作
- 使用 Google Rich Results Test 验证

### Task 11: 实现 Bento Grid 布局系统 (可并行)

- [ ] 11.1 创建 components/bento/BentoGrid.tsx 和 BentoCard.tsx
- [ ] 11.2 创建 components/bento/DynamicDashboard.tsx
- [ ] 11.3 创建 components/bento/TrustBadges.tsx
- [ ] 11.4 创建 components/bento/CTASection.tsx
- [ ] 11.5 重构首页使用 Bento Grid

### Task 12: 实现无障碍 UI 组件 (可并行)

- [ ] 12.1 创建 components/ui/Button.tsx (44x44px 触控区域)
- [ ] 12.2 编写属性测试 **Property 12: Touch Target Minimum Size**
- [ ] 12.3 创建 components/feedback/Toast.tsx
- [ ] 12.4 创建 components/feedback/Loading.tsx

### Task 13: 实现导航和布局组件 (可并行)

- [ ] 13.1 创建 components/layout/DesktopNav.tsx
- [ ] 13.2 创建 components/layout/MobileNav.tsx
- [ ] 13.3 创建 components/layout/Breadcrumb.tsx
- [ ] 13.4 创建 components/layout/FloatingMenu.tsx
- [ ] 13.5 创建 components/layout/ScrollIndicator.tsx
- [ ] 13.6 创建 components/layout/AnchorNav.tsx

### Task 14: 实现表单优化 (可并行)

- [ ] 14.1 优化联系表单（下拉选择、IP 预填国家）
- [ ] 14.2 添加表单验证和反馈
- [ ] 14.3 添加表单数据持久化 (sessionStorage)

### Task 15: Checkpoint - UI 组件验证 (串行)

- 确保所有 UI 组件正常工作
- 运行无障碍测试 (axe-core)

### Task 15.5: 实现次级内容展示组件 (可并行)

- [ ] 15.5.1 创建 components/ui/Carousel.tsx
- [ ] 15.5.2 创建 components/ui/Accordion.tsx
- [ ] 15.5.3 集成轮播到产品展示和客户评价区域

### Task 15.6: 实现 E-E-A-T 权威度组件 (可并行)

- [ ] 15.6.1 创建 components/content/AuthorByline.tsx
- [ ] 15.6.2 更新博客/文章页面模板
- [ ] 15.6.3 更新联系页面
- [ ] 15.6.4 更新关于页面

### Task 15.7: 实现 GEO 生成式引擎优化 (可并行)

- [ ] 15.7.1 创建 app/[locale]/glossary/page.tsx
- [ ] 15.7.2 优化信息架构为 Hub & Spoke 结构
- [ ] 15.7.3 重构 FAQ 内容为 Q&A 格式

### Task 16: 配置多语言字体 (可并行)

- [ ] 16.1 配置 Noto Sans 字体家族
- [ ] 16.2 实现按语言加载字体
- [ ] 16.3 配置字体回退栈

### Task 17: 实现响应式和动画 (可并行)

- [ ] 17.1 配置 Tailwind 响应式断点 (320px - 2560px)
- [ ] 17.2 实现 fade-in 滚动动画
- [ ] 17.3 添加 prefers-reduced-motion 支持
- [ ] 17.4 配置动画时长和缓动 (200-400ms)

### Task 18: 实现颜色和对比度系统 (可并行)

- [ ] 18.1 配置 Tailwind 颜色变量 (#1A1A1A, #FAFAFA)
- [ ] 18.2 编写属性测试 **Property 13: Color Contrast Compliance**
- [ ] 18.3 实现 Z 型视觉路径色彩权重

### Task 19: 性能优化 (串行)

- [ ] 19.1 配置图片优化 (next/image, lazy loading)
- [ ] 19.2 配置翻译文件代码分割
- [ ] 19.3 配置字体预加载

### Task 20: 最终验证和测试 (串行)

- [ ] 20.1 运行所有属性测试（15个，每个100次迭代）
- [ ] 20.2 运行无障碍审计 (WCAG 2.2 AA)
- [ ] 20.3 运行 Lighthouse 性能测试 (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- [ ] 20.4 验证 Google Rich Results Test

### Task 21: Final Checkpoint - 完整功能验证 (串行)

- 确保所有测试通过
- 验证10种语言切换正常
- 验证爬虫绕过、Geo-IP 路由、Cookie 优先级
- 验证 SEO 标签和结构化数据
- 验证无障碍合规

### 备注

- 所有任务均必须完成
- 每个任务引用特定需求以便追溯
- Checkpoint 确保增量验证
- 属性测试验证通用正确性属性（共15个）
- 翻译文件内容的实际翻译工作不在本任务范围内，仅创建结构骨架

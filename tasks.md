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

- [x] Phase 17: v2.0 Task 8/9/13/14 合并
  - 修复 8 个失败测试（responsive-menu + keyboard-focus-visibility）
  - 合并 task-13-nav-components（含 Task 9/13/14）到 main
  - 合并 task-8-language-banner 到 main，解决 11 个翻译文件冲突
  - **633 tests passed, 2 skipped**
  - 生产构建成功：Middleware 96.5 kB

- [x] Phase 18: v2.0 Task 15.5/15.6/15.7/16/17/18 合并
  - 合并 task-16-multilingual-fonts（多语言字体配置）
  - 合并 task-15.5-carousel-accordion（Carousel 轮播 + Testimonials）
  - 合并 task-15.6-eeat-authority（E-E-A-T Authority 组件）
  - 合并 task-17-responsive-animation（响应式动画）
  - Task 15.7 和 Task 18 已在 main 上直接提交
  - 解决 locales/seo/section 组件多轮冲突
  - 清理 6 个 worktree 和 6 个功能分支
  - **814 tests passed, 2 skipped**（1 flaky accordion 测试）
  - 生产构建成功：Middleware 110 kB

## 已验证的属性（Property-Based Testing）

### v1.0 属性 (13个)

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

### v2.0 属性 (新增 6+)

14. Locale 配置完整性 (Property 1) - 19 tests
15. 翻译文件结构一致性 (Property 2) - 69 tests
16. 爬虫检测准确性 (Property 4) - 27 tests
17. 国家到语言映射正确性 (Property 6)
18. Cookie 优先级高于 Geo-IP (Property 7) - 7 tests
19. Cookie 属性正确性 (Property 14) - 20 tests

### v2.0 属性 (Task 15.5~18 新增)

20. Carousel 交互属性 - carousel-interaction.test.tsx
21. 颜色对比度合规 (Property 13) - color-contrast.test.ts
22. 多语言字体配置正确性 - multilingual-fonts.test.ts

### v2.0 新增测试覆盖 (Task 8/9/13/14)

- Language Switcher 测试 - 语言切换器下拉菜单
- Language Banner 测试 - 语言横幅可见性逻辑
- DesktopNav / MobileNav 测试 - 拆分导航组件
- Breadcrumb / FloatingMenu / ScrollIndicator / AnchorNav 测试
- useNavigation hook 测试
- CountrySelect 组件测试
- useFormDraft hook 测试 - 草稿持久化
- useGeoCountry hook 测试 - Geo-IP 检测
- Geo API 端点测试
- Countries 工具库测试
- Form draft persistence 属性测试

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

### Task 2: 实现边缘中间件爬虫检测 (可并行) [已完成]

- [x] 2.1 创建 lib/bot-detector.ts
  - 实现 BOT_PATTERNS 常量数组（覆盖主流搜索引擎和社交媒体爬虫）
  - 实现 detectBot(userAgent: string): boolean
- [x] 2.2 编写属性测试 **Property 4: Bot Detection Accuracy** (27 tests)
- [x] 2.3 集成爬虫检测到 middleware.ts
  - 爬虫请求使用 botMiddleware（禁用 locale 检测，无重定向）
- [x] 2.4 编写属性测试 **Property 5: Bot Bypass Guarantee**

### Task 3: 实现 Geo-IP 路由逻辑 (可并行) [已完成]

- [x] 3.1 创建 lib/geo-router.ts (394 行)
  - 实现 COUNTRY_LOCALE_MAP（覆盖 30+ 国家）
  - 实现 AMBIGUOUS_COUNTRIES（处理比利时等多语言国家）
  - 实现 getLocaleFromCountry()
  - 实现 getLocaleFromAcceptLanguage()
  - 实现 getLocaleFromGeoIP()（完整优先级链）
  - 实现 buildRedirectUrl()
  - 实现 getLocaleFromPath()
- [x] 3.2 编写属性测试 **Property 6: Country-to-Locale Mapping Correctness**
  - geo-router-country-mapping.test.ts
- [x] 3.3 集成 Geo-IP 路由到 middleware.ts
  - 优先级: Path > Cookie > Geo-IP > Default
- [x] 3.4 编写属性测试 **Property 15: Redirect Status Code Consistency**
  - geo-router-redirect.test.ts

### Task 4: 实现语言偏好 Cookie 管理 (可并行) [已完成]

- [x] 4.1 创建 lib/language-preference.ts
  - 实现 getLangPrefFromCookie()
  - 实现 setLangPrefCookie()
  - Cookie 配置: MaxAge=1年, SameSite=Lax, Secure, Path=/
- [x] 4.2 编写属性测试 **Property 14: Cookie Attribute Correctness**
  - cookie-preference.test.ts (20 tests)
- [x] 4.3 集成 Cookie 优先级到 middleware.ts
- [x] 4.4 编写属性测试 **Property 7: Cookie Priority Over Geo-IP**
  - cookie-priority.test.ts (7 tests)
  - locale-persistence.test.ts (7 tests)

### Task 5: Checkpoint - 核心路由逻辑验证 (串行) [已完成]

- [x] 确保所有路由相关测试通过
- [x] 验证爬虫绕过、Geo-IP 路由、Cookie 优先级
- **Checkpoint: 380 tests passed, 2 skipped**
- 生产构建成功：Middleware 92.8 kB

### Task 6: 实现 Hreflang SEO 标签生成 (可并行) [已完成]

- [x] 6.1 创建 components/seo/HreflangTags.tsx
- [x] 6.2 编写属性测试 **Property 9: Hreflang Tag Generation Correctness** (9 tests)
- [x] 6.3 集成到 lib/metadata.ts 的 generateMetadata() 中

### Task 7: 实现 JSON-LD 结构化数据 (可并行) [已完成]

- [x] 7.1 创建 components/seo/ManufacturingPlantSchema.tsx
  - @type: ManufacturingBusiness（Organization 的子类型）
  - 包含: name, url, logo, description, address, geo, contactPoint, numberOfEmployees, hasOfferCatalog, hasCredential
  - 支持多语言描述（通过 useTranslations）
  - inLanguage 自动匹配当前 locale
- [x] 7.2 编写属性测试 **Property 10: JSON-LD Schema Validity** (17 tests)
  - tests/properties/jsonld-schema-validity.test.ts
  - 验证必需字段、URL/日期格式、嵌套结构
- [x] 7.3 编写属性测试 **Property 11: Localized Schema Description** (19 tests)
  - tests/properties/jsonld-localized-description.test.ts
  - 验证翻译键存在、FAQ 数量一致、inLanguage 匹配
- [x] 7.4 创建 components/seo/FAQPageSchema.tsx
  - 从 FAQ.tsx 提取的独立组件
  - 纯函数，接收 sections 生成 JSON-LD
- [x] 7.5 创建 components/seo/index.ts 统一导出
- [x] 7.6 集成 ManufacturingPlantSchema 到 app/[locale]/layout.tsx
- [x] 7.7 重构 FAQ.tsx 使用 FAQPageSchema 组件
- **新增测试: 36 tests passed**

### Task 8: 实现语言切换横幅组件 (可并行) [已完成]

- [x] 8.1 创建 components/i18n/LanguageBanner.tsx
- [x] 8.2 编写属性测试 **Property 8: Language Banner Visibility Logic**
- [x] 8.3 添加横幅翻译文本到所有语言文件（languageBanner 命名空间）
- [x] 8.4 集成 LanguageBanner 到根布局

### Task 9: 实现语言切换器组件 (可并行) [已完成]

- [x] 9.1 重构 LanguageSwitcher 为支持 10 种语言的下拉菜单
- [x] 9.2 集成 LanguageSwitcher 到导航栏

### Task 10: Checkpoint - SEO 和国际化组件验证 (串行) [已完成]

- [x] Hreflang 标签验证通过（9 tests）
- [x] JSON-LD 结构化数据验证通过（36 tests）
- [x] 语言切换组件验证通过（LanguageSwitcher + LanguageBanner）

### Task 11: 实现 Bento Grid 布局系统 (可并行) [已完成]

- [x] 11.1 创建 components/bento/BentoGrid.tsx 和 BentoCard.tsx
- [x] 11.2 创建 components/bento/DynamicDashboard.tsx
- [x] 11.3 创建 components/bento/TrustBadges.tsx
- [x] 11.4 创建 components/bento/CTASection.tsx
- [x] 11.5 创建 components/bento/BentoHero.tsx，集成到首页（?bento=true 切换）
- [x] 11.6 编写 Bento Grid 测试（11 tests）

### Task 12: 实现无障碍 UI 组件 (可并行) [已完成]

- [x] 12.1 创建 components/ui/Button.tsx (44x44px 触控区域)
- [x] 12.2 编写属性测试 **Property 12: Touch Target Minimum Size**
- [x] 12.3 创建 components/feedback/Toast.tsx
- [x] 12.4 创建 components/feedback/Loading.tsx

### Task 13: 实现导航和布局组件 (可并行) [已完成]

- [x] 13.1 创建 components/layout/DesktopNav.tsx
- [x] 13.2 创建 components/layout/MobileNav.tsx
- [x] 13.3 创建 components/layout/Breadcrumb.tsx
- [x] 13.4 创建 components/layout/FloatingMenu.tsx
- [x] 13.5 创建 components/layout/ScrollIndicator.tsx
- [x] 13.6 创建 components/layout/AnchorNav.tsx
- [x] 13.7 重构 Navbar.tsx 使用子组件（DesktopNav + MobileNav）
- [x] 13.8 提取导航 hooks 到 hooks/useNavigation.ts

### Task 14: 实现表单优化 (可并行) [已完成]

- [x] 14.1 优化联系表单（CountrySelect 下拉选择、Geo-IP 预填国家）
- [x] 14.2 添加表单验证和反馈（watch/setValue 集成）
- [x] 14.3 添加表单草稿持久化（useFormDraft hook, localStorage）
- [x] 14.4 创建 hooks/useGeoCountry.ts（Geo-IP 国家自动检测）
- [x] 14.5 创建 app/api/geo/route.ts（Geo-IP API 端点）
- [x] 14.6 创建 lib/countries.ts（国家代码数据）

### Task 15: Checkpoint - UI 组件验证 (串行) [已完成]

- [x] Task 8/9/12/13/14 全部合并到 main
- [x] 所有测试通过：**633 tests passed, 2 skipped**
- [x] 生产构建成功
- [x] worktree 和分支已清理

### Task 15.5: 实现次级内容展示组件 (可并行) [已完成]

- [x] 15.5.1 创建 components/ui/Carousel.tsx（通用轮播组件，支持自动播放、触摸滑动）
- [x] 15.5.2 创建 components/sections/Testimonials.tsx（客户评价区块）
- [x] 15.5.3 集成轮播到客户评价区域，添加 10 语言翻译键（testimonials 命名空间）
- [x] 15.5.4 编写 carousel-interaction 属性测试

### Task 15.6: 实现 E-E-A-T 权威度组件 (可并行) [已完成]

- [x] 15.6.1 创建作者档案系统（lib/authors.ts + AuthorByline 组件）
- [x] 15.6.2 创建 BlogPostingSchema JSON-LD 结构化数据
- [x] 15.6.3 创建 CertificationBadges 认证徽章组件
- [x] 15.6.4 更新 AboutUs 和 Contact 页面集成信任信号
- [x] 15.6.5 添加 10 语言翻译键（author、certifications 命名空间）

### Task 15.7: 实现 GEO 生成式引擎优化 (可并行) [已完成]

- [x] 15.7.1 创建 app/[locale]/glossary/page.tsx（行业术语词汇表）
- [x] 15.7.2 创建 GlossarySchema JSON-LD 结构化数据
- [x] 15.7.3 优化信息架构为 Hub & Spoke 内链结构（FAQ/Blog/Glossary 交叉链接）
- [x] 15.7.4 添加 10 语言翻译键（glossary 命名空间）

### Task 16: 配置多语言字体 (可并行) [已完成]

- [x] 16.1 创建 app/fonts.ts（Noto Sans 字体家族配置）
- [x] 16.2 创建 lib/font-config.ts（按语言加载字体逻辑）
- [x] 16.3 配置字体回退栈（CJK、拉丁、西里尔文）
- [x] 16.4 更新 layout.tsx 集成多语言字体
- [x] 16.5 编写 multilingual-fonts 测试（246 行）

### Task 17: 实现响应式和动画 (可并行) [已完成]

- [x] 17.1 创建 hooks/useScrollAnimation.ts（Intersection Observer 滚动动画）
- [x] 17.2 实现 fade-up 滚动淡入动画（CSS + Tailwind 扩展）
- [x] 17.3 添加 prefers-reduced-motion 支持（自动禁用动画）
- [x] 17.4 集成动画到 HeroBanner、AboutUs、FAQ、Contact、Blog 组件
- [x] 17.5 编写 responsive-animation 测试

### Task 18: 实现颜色和对比度系统 (可并行) [已完成]

- [x] 18.1 配置 Tailwind 语义颜色变量（text-deep #1A1A1A、bg-soft #FAFAFA 等）
- [x] 18.2 编写属性测试 **Property 13: Color Contrast Compliance**
- [x] 18.3 实现 Z 型视觉路径色彩权重（首屏深色标题、浅色正文交替）
- [x] 18.4 更新全部 section 组件颜色类名，符合 WCAG AA 4.5:1 对比度

### Task 19: 性能优化 (串行) [已完成]

- [x] 19.1 配置图片优化
  - next.config.ts: minimumCacheTTL 60->31536000（1年缓存）、contentDispositionType、qualities
  - OptimizedImage: 默认 quality 75->70（减小约 10-15% 文件大小）
  - optimizePackageImports 添加 next-intl
- [x] 19.2 配置翻译文件代码分割
  - 新建 lib/i18n-namespaces.ts（命名空间常量 + pickNamespaces 工具函数）
  - 验证动态导入按语言加载翻译文件正常工作
- [x] 19.3 配置字体预加载
  - Noto Sans 添加 adjustFontFallback: true（减少 CLS）
  - CJK 字体显式添加 preload: true
  - 添加 staleTimes 路由缓存（dynamic 30s、static 180s）
- **新增测试: 15 tests passed（含 1 个 property-based 测试）**
- **总计: 829+ tests passed, 2 skipped**

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
- 属性测试验证通用正确性属性（共22个）
- 翻译文件内容的实际翻译工作不在本任务范围内，仅创建结构骨架

# 需求文档

## 项目简介

Better Bags Myanmar 背包 OEM 工厂独立站，采用单页滚动式设计，支持中英文国际化。

## 技术栈

- Next.js 15.1+, React 19, TypeScript 5
- Tailwind CSS 3.4, next-intl
- Zod, Vitest, fast-check
- Resend/SendGrid, mCaptcha

## 已完成需求

### 1. 项目架构与 Tailwind CSS 配置
- 品牌色配置（#81C3D7、#416788、#5a6d7c、#2f6690）
- JIT 模式和 tree-shaking
- 自定义设计令牌

### 2. 国际化（i18n）支持
- 中英文双语切换
- 语言偏好持久化
- 保持滚动位置

### 3. 单页滚动式布局与导航
- 7 个区块垂直排列（Banner、About、Features、Services、FAQ、Contact、Blog）
- 平滑滚动动画
- 导航激活状态同步
- Sticky 导航栏

### 4. 全平台自适应字体与比例
- clamp() 函数实现字体流畅缩放
- 正文字体 14px-18px 范围
- 100vh/100svh 视口高度
- 图片宽高比保持

### 5. 固定导航栏组件
- Logo + 导航链接
- 响应式汉堡菜单（<768px）
- 语言切换按钮
- 键盘导航和焦点管理

### 6. 首页 Banner 区块
- 全屏海报效果
- 主标语和统计数据
- CTA 按钮（获取报价）

### 7. 关于我们区块
- 使命、愿景、核心价值观
- 公司历史和合作品牌
- Organization JSON-LD 结构化数据

### 8. 特色区块
- Jay 个人介绍
- 四大核心优势（灵活性、沟通、质量、价格）
- 定制选项介绍

### 9. 服务流程区块
- 6 个服务阶段步骤展示
- 响应式布局（移动端纵向、桌面端横向）

### 10. 常见问题区块
- 分类组织的 FAQ（5 个分类）
- 手风琴交互
- FAQPage JSON-LD 结构化数据

### 11. 联系我们区块
- 公司联系信息
- 完整询价表单（必填 + 可选字段）
- mCaptcha 人机验证
- 文件上传功能
- 表单验证（Zod）

### 12. 博客区块
- 博客预览（3 篇精选文章）
- 博客列表页（6 篇文章）
- 博客详情页（Markdown 渲染）
- 中英文内容切换

### 13. 页脚区块
- 公司信息、快捷链接、工作时间
- 平滑滚动到对应区块

### 14. SEO 与元数据优化
- 唯一标题标签（60 字符以内）
- Meta 描述（150 字符以内）
- Open Graph 元标签
- 语义化 HTML5 元素（header, nav, main, article, section, footer）
- 每页一个 h1 标题
- XML 站点地图（sitemap.xml）
- SEO 友好 URL
- hreflang 标签（中英文）
- robots.txt

### 15. 性能优化
- 图片延迟加载（loading="lazy"）
- WebP/AVIF 格式优化
- 响应式图片（srcset, sizes）
- CSS/JS 压缩和最小化
- Tree-shaking（移除未使用样式）
- 非关键 JS 使用 defer/async

### 16. 无障碍设计（WCAG AA）
- 图片 alt 文本
- 颜色对比度 4.5:1
- 键盘焦点指示器
- 表单标签关联（for 属性）
- ARIA 属性（aria-required, aria-invalid, aria-describedby, role="alert"）
- Tab 键导航支持
- Skip navigation 链接

## 测试状态

- **158 tests passed, 2 skipped**
- **属性测试**: 13 个属性验证（fast-check, 100 次迭代）
- **覆盖率**: 80%+
- **构建**: 22 个静态页面

## 性能指标

- 首页 First Load JS: 185 kB
- 博客列表: 138 kB
- 博客详情: 139 kB
- Lighthouse 分数目标: >90

## 第二版需求：国际化地理路由系统 (i18n-geo-routing)

### 概述

本系统旨在支持10种语言（英语、简体中文、日语、德语、荷兰语、法语、葡萄牙语、西班牙语、繁体中文、俄语），实现基于IP的智能语言路由，同时确保SEO安全性和用户体验优化。系统需要在边缘计算层实现爬虫识别与用户分流，并遵循WCAG 2.2 AA/AAA无障碍标准。

### 术语表

- **Geo_IP_Router**: 基于用户IP地址进行地理位置识别并执行语言路由的边缘计算组件
- **Bot_Detector**: 通过User-Agent嗅探识别搜索引擎爬虫的检测模块
- **Language_Preference_Manager**: 管理用户语言偏好Cookie的组件
- **Hreflang_Generator**: 生成国际化SEO标签的组件
- **Language_Banner**: 语言切换提示的非侵入式浮动横幅组件
- **Schema_Generator**: 生成JSON-LD结构化数据的组件
- **Bento_Grid**: 基于便当盒网格布局的响应式UI组件系统
- **Accessibility_Layer**: 实现WCAG无障碍标准的UI增强层
- **Edge_Middleware**: 在Cloudflare/Vercel边缘节点运行的中间件
- **Locale**: 语言区域标识符（如 en, ja, de, zh-tw）
- **x-default**: hreflang标签中表示默认/回退语言版本的特殊值
- **CTA**: Call To Action，行动号召按钮
- **E-E-A-T**: Experience, Expertise, Authoritativeness, Trustworthiness（Google质量评估标准）

### Requirement 1: 多语言支持扩展

**User Story:** As a global visitor, I want to access the website in my native language, so that I can understand the content and make informed business decisions.

**Acceptance Criteria:**
1. 系统支持10种语言: en, zh, ja, de, nl, fr, pt, es, zh-tw, ru
2. 新语言从 `/locales/{locale}.json` 加载翻译文件
3. 使用 `en` 作为默认语言 (x-default)
4. 所有页面以当前活跃语言显示 UI 文本
5. URL 结构为 `/{locale}/`（如 `/ja/`, `/de/`, `/zh-tw/`）

### Requirement 2: 爬虫识别与白名单机制

**User Story:** As a search engine crawler, I want to access all language versions of the website without being redirected, so that I can properly index all content.

**Acceptance Criteria:**
1. Bot_Detector 检查 User-Agent 头部
2. 识别爬虫模式: Googlebot, Bingbot, YandexBot, Baiduspider, DuckDuckBot, Slurp, facebookexternalhit, Twitterbot, LinkedInBot, GPTBot, ClaudeBot, PerplexityBot
3. 检测到爬虫时绕过所有 Geo-IP 重定向
4. 爬虫请求直接返回 HTTP 200
5. 记录爬虫请求用于监控

### Requirement 3: Geo-IP智能路由

**User Story:** As a human visitor, I want to be automatically directed to my language version based on my location, so that I can immediately see content in my native language.

**Acceptance Criteria:**
1. 非爬虫用户访问根 URL `/` 时根据 IP 确定国家
2. 国家到语言映射：JP→ja, DE/AT/CH→de, NL/BE→nl, FR→fr, PT/BR→pt, ES/拉美→es, TW/HK/MO→zh-tw, RU/CIS→ru, CN→zh, 其他→en
3. 使用 HTTP 302 临时重定向
4. 存在 `lang_pref` cookie 时尊重 cookie 值
5. 比利时使用 Accept-Language 区分荷兰语/法语

### Requirement 4: 语言偏好Cookie管理

**User Story:** As a returning visitor, I want my language preference to be remembered, so that I don't need to switch languages every time I visit.

**Acceptance Criteria:**
1. 用户选择语言时设置 `lang_pref` cookie
2. Cookie 过期时间 365 天
3. Cookie 属性: SameSite=Lax, Secure
4. 处理请求时先检查 cookie
5. 点击"保持语言"或"切换到英文"时设置 cookie

### Requirement 5: 非侵入式语言切换横幅

**User Story:** As a user who was auto-redirected, I want to be informed about the language switch and have the option to change it, so that I can choose my preferred language.

**Acceptance Criteria:**
1. 自动重定向到非英语语言时显示底部浮动横幅
2. 不使用模态框或全屏遮罩
3. 显示目标语言的消息
4. 提供"保持语言"和"切换到英文"按钮
5. 10秒后自动消失

### Requirement 6: Hreflang国际化SEO标签

**User Story:** As a search engine, I want to understand the relationship between different language versions of pages, so that I can serve the correct version to users in search results.

**Acceptance Criteria:**
1. 每个页面 `<head>` 注入 hreflang 标签
2. 为10种语言 + x-default 生成标签
3. 使用正确的语言代码（zh-Hans, zh-Hant 等）
4. 使用绝对 URL
5. 标签自引用

### Requirement 7: JSON-LD结构化数据

**User Story:** As an AI search engine or knowledge graph, I want to understand the business entity and its attributes, so that I can provide accurate information about the company.

**Acceptance Criteria:**
1. 首页和关于页面嵌入 ManufacturingPlant schema
2. 包含必需属性：name, url, logo, description, foundingDate, address, areaServed, knowsLanguage
3. 包含认证信息 (ISO, SA8000)
4. 包含 potentialAction 链接到联系页面
5. 描述属性随语言变化
6. Schema 通过 Google Rich Results Test

### Requirement 8: Bento Grid首屏布局

**User Story:** As a B2B buyer, I want to see all critical information on the first screen without scrolling, so that I can quickly assess if this supplier meets my needs.

**Acceptance Criteria:**
1. 遵循古腾堡图表四象限布局
2. 左上：品牌Logo和核心价值主张
3. 右上：动态数据看板
4. 左下：信任徽章
5. 右下：主CTA和聊天机器人入口
6. 1920x1080 桌面分辨率完整可见

### Requirement 9: 适老化无障碍设计

**User Story:** As a senior procurement manager (50-65+), I want the website to be easy to read and interact with, so that I can use it comfortably despite age-related vision or motor challenges.

**Acceptance Criteria:**
1. 达到 WCAG 2.2 AA 合规，目标 AAA
2. 正文字体 18pt (24px)
3. 对比度至少 4.5:1
4. 使用深灰 (#1A1A1A) 和米白 (#FAFAFA)
5. 行高至少 1.6
6. 交互元素最小 44x44 像素触控区域
7. 使用无衬线字体 (Inter, Roboto, Noto Sans)

### Requirement 10: 大热区点击与卡片拼接

**Acceptance Criteria:**
1. Bento Grid 卡片全区域可点击
2. 使用 CSS ::after 伪元素实现
3. 相邻元素合并点击区域
4. 交互元素间距至少 8px
5. 表单优先使用下拉选择
6. 按钮焦点状态最小 2px 轮廓

### Requirement 11-30: 详细需求

（包含视觉反馈、导航、表单优化、图文结合、响应式布局、GEO优化、E-E-A-T权威度、视觉路径、语言切换器、锚点导航、引导动画、悬浮菜单、边缘计算、翻译管理、性能指标、数据看板、智能客服、次级内容、多语言字体、统一交互等详细需求）

### 正确性属性（Property-Based Testing）

需验证的15个属性：
1. Locale Configuration Completeness
2. Translation File Loading Round-Trip
3. URL Structure Consistency
4. Bot Detection Accuracy
5. Bot Bypass Guarantee
6. Country-to-Locale Mapping Correctness
7. Cookie Priority Over Geo-IP
8. Language Banner Visibility Logic
9. Hreflang Tag Generation Correctness
10. JSON-LD Schema Validity
11. Localized Schema Description
12. Touch Target Minimum Size
13. Color Contrast Compliance
14. Cookie Attribute Correctness
15. Redirect Status Code Consistency

# 设计文档

## 技术架构（v1.0）

### 技术栈

- **前端**: Next.js 15.1+ (App Router), React 19, TypeScript 5
- **样式**: Tailwind CSS 3.4+
- **国际化**: next-intl
- **表单**: React Hook Form + Zod
- **邮件**: Resend/SendGrid API
- **验证**: mCaptcha
- **部署**: Vercel

### 目录结构

```
/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx          # 根布局
│   │   ├── page.tsx            # 首页（单页滚动）
│   │   └── blog/               # 博客列表和详情
│   ├── api/contact/route.ts    # 表单提交 API
│   ├── sitemap.ts              # 站点地图
│   ├── robots.ts               # robots.txt
│   └── globals.css             # 全局样式
├── components/
│   ├── layout/                 # Navbar, Footer, LanguageSwitcher
│   ├── sections/               # 7 个页面区块
│   └── ui/                     # OptimizedImage, Accordion 等
├── locales/
│   ├── zh.json                 # 中文翻译
│   └── en.json                 # 英文翻译
├── lib/
│   ├── i18n.ts                 # i18n 配置
│   ├── metadata.ts             # 元数据生成
│   ├── blog-data.ts            # 博客数据
│   └── validations.ts          # 表单验证
└── tests/                      # 158 个测试
```

## 核心组件接口

### 1. Navbar

```typescript
interface NavbarProps {
  locale: 'zh' | 'en';
}
```

功能：固定导航、汉堡菜单、语言切换、当前区块高亮

### 2. ContactForm

```typescript
interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  countryRegion: string;
  companyName: string;
  phoneNumber: string;
  subject: string;
  estimatedQuantity: 'less-100' | '100-300' | '300-1000' | 'more-1000';
  hasTechPack: 'tech-pack' | 'physical-sample' | 'idea-sketch';
  files?: FileList;
  launchDate?: string;
  specialRequests?: string;
  message: string;
  captchaToken: string;
}
```

### 3. OptimizedImage

```typescript
interface OptimizedImageProps {
  src: string;
  alt: string;
  aspectRatio?: 'WIDE' | 'STANDARD' | 'SQUARE' | 'PHOTO' | 'ULTRAWIDE';
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
}
```

## 正确性属性（Property-Based Testing）

13 个已验证的属性，涵盖：
- 语言切换和持久化
- 导航和滚动行为
- 响应式布局
- 表单验证和提交
- 键盘导航和无障碍

详见 `tests/properties/` 目录。

## 性能指标

- 首页 First Load JS: 185 kB
- 博客列表: 138 kB
- 博客详情: 139 kB
- 静态页面: 22 个
- Lighthouse 目标: >90

## 第二版设计：国际化地理路由系统 (i18n-geo-routing)

### 概述

基于 Next.js 14+ App Router 和 next-intl 构建，在 Vercel Edge 层实现爬虫识别与 Geo-IP 路由，支持10种语言的智能分发，同时确保 SEO 安全性和 WCAG 2.2 无障碍合规。

### 关键设计决策

1. **边缘中间件优先**: 所有路由决策在 Vercel Edge Middleware 完成，确保 <50ms 响应
2. **next-intl 扩展**: 基于现有 next-intl 配置扩展，保持向后兼容
3. **组件化 UI 系统**: 基于 Tailwind CSS 构建可复用的 Bento Grid 和无障碍组件
4. **渐进式增强**: 核心功能不依赖 JavaScript，动画和交互作为增强层

### 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        Vercel Edge Network                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │ Bot Detector│───▶│ Geo-IP     │───▶│ Language Preference │  │
│  │ (User-Agent)│    │ Router     │    │ Manager (Cookie)    │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
│         │                  │                      │              │
│         ▼                  ▼                      ▼              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   Edge Middleware (middleware.ts)            ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js App Router                           │
├─────────────────────────────────────────────────────────────────┤
│  app/[locale]/             # 语言路由页面                        │
│  components/               # 组件库                              │
│  ├── layout/               # 导航、页脚、面包屑                   │
│  ├── bento/                # Bento Grid 组件                     │
│  ├── i18n/                 # 语言切换器、横幅                     │
│  ├── seo/                  # Hreflang、JSON-LD 生成器            │
│  ├── ui/                   # 无障碍 UI 组件                      │
│  └── feedback/             # Toast、Loading、Error 状态          │
│  locales/                  # 10种语言翻译文件                     │
└─────────────────────────────────────────────────────────────────┘
```

### 核心组件接口

#### 1. Edge Middleware

```typescript
// middleware.ts
export const locales = ['en', 'zh', 'ja', 'de', 'nl', 'fr', 'pt', 'es', 'zh-tw', 'ru'] as const;
export type Locale = (typeof locales)[number];

const BOT_PATTERNS = [
  'Googlebot', 'Bingbot', 'YandexBot', 'Baiduspider', 'DuckDuckBot',
  'Slurp', 'facebookexternalhit', 'Twitterbot', 'LinkedInBot',
  'GPTBot', 'ClaudeBot', 'PerplexityBot'
];

const COUNTRY_LOCALE_MAP: Record<string, Locale> = {
  JP: 'ja', DE: 'de', AT: 'de', CH: 'de',
  NL: 'nl', BE: 'nl', FR: 'fr', PT: 'pt', BR: 'pt',
  ES: 'es', TW: 'zh-tw', HK: 'zh-tw', MO: 'zh-tw',
  RU: 'ru', CN: 'zh',
};
```

#### 2. i18n 配置

```typescript
// i18n.ts
export const localeConfig: Record<Locale, {
  name: string;
  nativeName: string;
  flag: string;
  hreflang: string
}> = {
  en: { name: 'English', nativeName: 'English', flag: '🇺🇸', hreflang: 'en' },
  zh: { name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳', hreflang: 'zh-Hans' },
  ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', hreflang: 'ja' },
  de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', hreflang: 'de' },
  nl: { name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', hreflang: 'nl' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷', hreflang: 'fr' },
  pt: { name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', hreflang: 'pt' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', hreflang: 'es' },
  'zh-tw': { name: 'Chinese (Traditional)', nativeName: '繁體中文', flag: '🇹🇼', hreflang: 'zh-Hant' },
  ru: { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', hreflang: 'ru' },
};
```

#### 3. BentoGrid 组件

```typescript
interface BentoCardProps {
  children: React.ReactNode;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  href?: string;
  className?: string;
}
```

#### 4. 无障碍 Button 组件

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}
// 最小触控区域 44x44px，可见焦点状态
```

### 数据模型

#### 翻译文件结构

```typescript
interface TranslationFile {
  nav: { banner: string; about: string; features: string; /* ... */ };
  banner: { line1: string; line2: string; cta: string; /* ... */ };
  languageBanner: { message: string; keep: string; switchToEnglish: string; close: string; };
  // ... 其他区块
}
```

#### Locale 配置

```typescript
interface LocaleConfig {
  name: string;           // 英文名
  nativeName: string;     // 原生语言名
  flag: string;           // Emoji 国旗
  hreflang: string;       // ISO 语言代码
  fontFamily?: string;    // 可选自定义字体
  direction: 'ltr' | 'rtl';
}
```

### 字体配置

```typescript
// app/fonts.ts
import { Inter, Noto_Sans, Noto_Sans_JP, Noto_Sans_SC, Noto_Sans_TC } from 'next/font/google';

export function getFontVariables(locale: string): string {
  const base = `${inter.variable} ${notoSans.variable}`;
  switch (locale) {
    case 'ja': return `${base} ${notoSansJP.variable}`;
    case 'zh': return `${base} ${notoSansSC.variable}`;
    case 'zh-tw': return `${base} ${notoSansTC.variable}`;
    default: return base;
  }
}
```

### 错误处理

| 错误场景 | 处理策略 |
|---------|---------|
| Geo 头部不可用 | 回退到 Accept-Language，然后默认 'en' |
| URL 中无效 locale | 302 重定向到默认语言 |
| Cookie 解析失败 | 忽略 cookie，继续 Geo-IP 路由 |
| 翻译文件缺失 | 回退到英文翻译，记录警告 |

### 正确性属性（15个）

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

### 测试策略

- **属性测试**: 最少 100 次迭代 (fast-check)
- **覆盖率目标**: 核心模块 80%
- **无障碍测试**: WCAG 2.2 AA 合规 (axe-core)
- **性能测试**: Lighthouse CI with Core Web Vitals 阈值

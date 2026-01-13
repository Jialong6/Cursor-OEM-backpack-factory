# 脚本加载最佳实践

## 当前状态

项目当前**没有外部 JavaScript 脚本**需要优化。

### 现有脚本

#### 1. JSON-LD 结构化数据脚本

**位置：**
- `components/sections/AboutUs.tsx` - Organization schema
- `components/sections/FAQ.tsx` - FAQPage schema

**状态：** ✅ 已优化
- 类型：`type="application/ld+json"`
- 实现：内联脚本
- 性能影响：**无阻塞**（JSON-LD 不是可执行 JavaScript）
- SEO：对搜索引擎爬虫友好

**不需要 defer/async：** JSON-LD 脚本本身就不会阻塞页面渲染。

## 将来添加外部脚本的指南

如果将来需要添加外部脚本（如 Google Analytics、mCaptcha、第三方服务等），请遵循以下最佳实践：

### 使用 Next.js Script 组件

Next.js 提供了优化的 `Script` 组件来处理外部脚本加载。

#### 示例 1: Google Analytics（推荐使用 afterInteractive）

```tsx
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}

        {/* Google Analytics - 需求 15.6 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GA_MEASUREMENT_ID');
          `}
        </Script>
      </body>
    </html>
  )
}
```

#### 示例 2: mCaptcha（推荐使用 lazyOnload）

```tsx
import Script from 'next/script'

export default function Contact() {
  return (
    <div>
      {/* mCaptcha - 需求 15.6 */}
      <Script
        src="https://unpkg.com/@mcaptcha/glue@0.1.0-alpha-5/dist/index.js"
        strategy="lazyOnload"
        onLoad={() => {
          console.log('mCaptcha loaded')
        }}
      />

      {/* mCaptcha widget */}
      <div className="mcaptcha__widget"></div>
    </div>
  )
}
```

#### 示例 3: 关键第三方脚本（推荐使用 beforeInteractive）

```tsx
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        {/* 关键第三方脚本 - 需求 15.6 */}
        <Script
          src="https://example.com/critical-script.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### Next.js Script 策略说明

| 策略 | 加载时机 | 使用场景 | 性能影响 |
|------|---------|---------|---------|
| `beforeInteractive` | 在页面可交互前加载 | 关键脚本（polyfills, bot detection） | **阻塞** |
| `afterInteractive` (默认) | 页面可交互后加载 | 分析脚本、广告脚本 | **非阻塞** ✅ |
| `lazyOnload` | 浏览器空闲时加载 | 聊天插件、社交媒体嵌入 | **最优** ✅ |
| `worker` | Web Worker 中加载 | CPU 密集型脚本 | **最优** ✅ |

### 性能最佳实践

1. **优先使用 `lazyOnload`**
   - 对非关键脚本使用 `lazyOnload`
   - 延迟到浏览器空闲时加载
   - 最小化对 First Contentful Paint (FCP) 的影响

2. **避免 `beforeInteractive`**
   - 只用于绝对必需的关键脚本
   - 会阻塞页面渲染

3. **使用 `afterInteractive` 作为默认选择**
   - 适合大多数第三方脚本
   - 页面可交互后立即加载
   - 不阻塞 FCP

4. **添加错误处理**
   ```tsx
   <Script
     src="https://example.com/script.js"
     strategy="afterInteractive"
     onError={(e) => {
       console.error('Script failed to load', e)
     }}
   />
   ```

5. **使用 `id` 属性避免重复加载**
   ```tsx
   <Script id="unique-script-id" strategy="afterInteractive">
     {`console.log('Inline script')`}
   </Script>
   ```

## 验证脚本加载性能

### Chrome DevTools

1. 打开 Chrome DevTools → Network 标签
2. 勾选 "Disable cache"
3. 刷新页面
4. 检查脚本加载时间和顺序

### Lighthouse

1. 打开 Chrome DevTools → Lighthouse 标签
2. 运行性能测试
3. 检查 "Eliminate render-blocking resources" 建议

### 性能指标目标

- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Total Blocking Time (TBT)**: < 200ms
- **Cumulative Layout Shift (CLS)**: < 0.1

## 参考资料

- [Next.js Script Component](https://nextjs.org/docs/app/api-reference/components/script)
- [Web Vitals](https://web.dev/vitals/)
- [Efficiently load third-party JavaScript](https://web.dev/efficiently-load-third-party-javascript/)

## 更新记录

- **2026-01-13**: 创建文档 - Task 15.2
- 当前状态：无外部脚本，JSON-LD 脚本已优化
- 为将来的脚本加载提供最佳实践指南

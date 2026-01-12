# 故障排查指南

本文档包含项目开发和运行过程中常见问题的排查和解决方案。

## 目录

- [404 错误排查](#404-错误排查)
- [常见错误对照表](#常见错误对照表)
- [快速修复命令](#快速修复命令)
- [调试技巧](#调试技巧)
- [案例研究：next-intl 404 错误修复](#案例研究next-intl-404-错误修复)

---

## 404 错误排查

### 问题现象

访问 `/en` 或 `/zh` 路由时返回 404 错误，即使代码编译成功。

### 常见原因

#### 1. `.next` 缓存问题

当你修改了以下文件后，旧缓存可能导致路由失效：
- `middleware.ts`（路由中间件）
- `next.config.ts`（配置文件）
- `i18n.ts`（国际化配置）
- `app/[locale]` 路由结构

**解决方案**：
```bash
# 删除 .next 缓存
rm -rf .next

# 重新启动开发服务器
npm run dev
```

#### 2. 端口冲突

多个开发服务器同时运行，导致访问的是旧版本的服务器。

**解决方案**：
```bash
# 清理所有占用的端口
lsof -ti:3000,3001,3002,3003 | xargs kill -9 2>/dev/null

# 重新启动
npm run dev
```

#### 3. 访问错误的 URL

❌ 错误：
- `http://localhost:3000/page`
- `http://localhost:3000/index`

✅ 正确：
- `http://localhost:3000/en` 或 `http://localhost:3000/zh`
- `http://localhost:3000/` （会自动重定向）

---

## 常见错误对照表

| 错误现象 | 可能原因 | 解决方法 |
|---------|---------|---------|
| `GET /en 404` | `.next` 缓存过期 | `rm -rf .next && npm run dev` |
| 端口被占用 | 旧服务器未关闭 | `lsof -ti:3000 \| xargs kill -9` |
| 页面空白 | 编译错误 | 查看终端错误信息 |
| 翻译缺失 | locale 文件问题 | 检查 `locales/en.json` 和 `locales/zh.json` |
| 组件报错 | 依赖未安装 | `npm install` |
| TypeScript 错误 | 类型定义问题 | `npx tsc --noEmit` 检查错误 |
| 构建失败 | 语法或配置错误 | `npm run build` 查看详细错误 |

---

## 快速修复命令

### 一键清理并重启

```bash
cd /Users/lijialong/CursorProject/Cursor-OEM-backpack-factory && \
lsof -ti:3000,3001,3002,3003 | xargs kill -9 2>/dev/null; \
rm -rf .next && \
npm run dev
```

### 检查服务器状态

```bash
# 查看哪些端口正在使用
lsof -ti:3000,3001,3002,3003

# 查看 Next.js 进程
ps aux | grep "next dev"
```

### 验证构建

```bash
# 测试构建是否成功（不会影响开发环境）
npm run build

# 应该看到路由正常生成
# Route (app)                Size  First Load JS
# ├ ● /[locale]           50.9 kB         171 kB
# ├   ├ /en
# ├   └ /zh
```

---

## 调试技巧

### 1. 查看编译日志

启动 `npm run dev` 后，观察终端输出：

```
✓ Compiled /middleware in 222ms     # 中间件编译成功
✓ Compiled /[locale] in 1195ms      # 页面编译成功
○ Compiling /[locale]/blog ...      # 按需编译
```

### 2. 检查浏览器开发者工具

按 `F12` 打开开发者工具：
- **Console**：查看 JavaScript 错误
- **Network**：查看请求状态（200 = 成功，404 = 未找到）
- **Application** → **Cookies**：查看 `NEXT_LOCALE` 设置

### 3. 测试路由

依次访问以下 URL 测试：

```bash
# 根路径（应该重定向）
curl -I http://localhost:3000/

# 英文版（应该返回 200）
curl -I http://localhost:3000/en

# 中文版（应该返回 200）
curl -I http://localhost:3000/zh

# 博客列表
curl -I http://localhost:3000/en/blog

# 不存在的路径（应该返回 404）
curl -I http://localhost:3000/nonexistent
```

### 4. 检查翻译文件

```bash
# 验证 JSON 格式是否正确
node -e "JSON.parse(require('fs').readFileSync('locales/zh.json', 'utf8')); console.log('✅ zh.json 格式正确')"

node -e "JSON.parse(require('fs').readFileSync('locales/en.json', 'utf8')); console.log('✅ en.json 格式正确')"
```

---

## 案例研究：next-intl 404 错误修复

### 问题描述

在 Next.js 15 和 `next-intl` v4.7.0 环境下，访问 `/en` 和 `/zh` 都返回 404 错误。

### 根本原因

在 `i18n.ts` 中使用了**旧版 API**：

```typescript
// ❌ 错误：使用 locale 参数（next-intl v3.21 及以下）
export default getRequestConfig(async ({ locale }) => {
  if (!locale || !locales.includes(locale as Locale)) {
    notFound();
  }
  return {
    locale,
    messages: (await import(`./locales/${locale}.json`)).default,
  };
});
```

**`next-intl` v3.22+ 和 Next.js 15** 需要使用 `requestLocale` 参数（新版 API）。

### 解决方案

#### 1. 修改 `i18n.ts`

```typescript
// ✅ 正确：使用 requestLocale 参数（next-intl v3.22+）
export default getRequestConfig(async ({ requestLocale }) => {
  // 获取请求的 locale（对应 [locale] 路由段）
  let locale = await requestLocale;

  // 如果 locale 无效，使用默认语言
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./locales/${locale}.json`)).default,
  };
});
```

#### 2. 修改 `app/[locale]/layout.tsx`

确保传入 `locale` 参数到 `getMessages()`:

```typescript
// 获取当前语言的翻译消息（传入 locale 参数）
const messages = await getMessages({ locale });
```

#### 3. 修改 `app/[locale]/page.tsx`

移除未使用的 `useTranslations()` 调用：

```typescript
// ❌ 删除这行（未使用且可能导致错误）
// const t = useTranslations();

// ✅ 只在需要时使用
export default function Home() {
  // 如果不需要翻译，就不要调用 useTranslations
  return <main>...</main>;
}
```

### 验证结果

```bash
# 英文版 - 成功！
$ curl -I http://localhost:3000/en
HTTP/1.1 200 OK

# 中文版 - 成功！
$ curl -I http://localhost:3000/zh
HTTP/1.1 200 OK

# 根路径自动重定向 - 成功！
$ curl -I http://localhost:3000/
HTTP/1.1 307 Temporary Redirect
```

### 参考文档

- [next-intl v3.22 升级指南](https://next-intl-docs.vercel.app/blog/next-intl-3-22)
- [next-intl getRequestConfig API](https://next-intl-docs.vercel.app/docs/usage/configuration)

### 修复的文件列表

1. ✅ `i18n.ts` - 使用 `requestLocale` 并 `await` 它
2. ✅ `app/[locale]/layout.tsx` - 传入 `locale` 到 `getMessages()`
3. ✅ `app/[locale]/page.tsx` - 移除未使用的 `useTranslations()`

---

## 预防措施

### 1. 每次修改配置后清理缓存

修改以下文件后，务必清理 `.next`：
- `middleware.ts`
- `next.config.ts`
- `i18n.ts`
- `app/[locale]/layout.tsx`

### 2. 使用开发脚本

创建一个快捷脚本 `dev.sh`：

```bash
#!/bin/bash
echo "🧹 清理缓存..."
rm -rf .next

echo "🔌 清理端口..."
lsof -ti:3000,3001,3002,3003 | xargs kill -9 2>/dev/null

echo "🚀 启动服务器..."
npm run dev
```

使用：
```bash
chmod +x dev.sh
./dev.sh
```

### 3. 使用 Git Hooks

在 `.git/hooks/post-checkout` 添加自动清理：

```bash
#!/bin/bash
# 切换分支后自动清理缓存
rm -rf .next
echo "✅ 已清理 .next 缓存"
```

---

## 总结

**最关键的两步：**

1. **删除 `.next` 缓存**：`rm -rf .next`
2. **重启开发服务器**：`npm run dev`

99% 的 404 问题都可以通过这两步解决。

如果仍然遇到问题：
1. 检查 `npm run build` 是否成功
2. 查看终端的错误信息
3. 确认访问的是正确的 URL（带语言前缀）
4. 检查浏览器控制台的错误
5. 参考本文档中的案例研究

---

更多问题请查看 [项目上下文文档](./project_context.md) 或提交 Issue。

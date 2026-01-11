import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

/**
 * next-intl 中间件配置
 *
 * 功能：
 * - 自动检测用户语言偏好（基于 Accept-Language 请求头）
 * - 重定向根路径到默认语言（/ -> /en）
 * - 处理语言路由（/en/*, /zh/*）
 * - 在 cookie 中保持语言选择（localePrefix: 'as-needed'）
 */
export default createMiddleware({
  // 支持的所有语言列表
  locales,

  // 默认语言（当无法检测用户偏好时使用）
  defaultLocale,

  // 路径前缀策略：'always' = 总是显示语言前缀（/en, /zh）
  localePrefix: 'always',

  // 自动检测用户浏览器语言
  localeDetection: true,
});

/**
 * 配置中间件匹配规则
 *
 * 匹配所有路径，除了：
 * - API 路由 (/api/*)
 * - Next.js 内部文件 (_next/*)
 * - 静态资源文件（图片、字体等）
 */
export const config = {
  matcher: [
    // 匹配所有路径
    '/',

    // 匹配所有带语言前缀的路径
    '/(zh|en)/:path*',

    // 排除不需要国际化的路径
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};

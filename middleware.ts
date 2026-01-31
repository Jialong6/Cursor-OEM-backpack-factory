import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { locales, defaultLocale } from './i18n';
import { detectBot } from './lib/bot-detector';

/**
 * next-intl 中间件配置（用于普通用户）
 *
 * 功能：
 * - 自动检测用户语言偏好（基于 Accept-Language 请求头）
 * - 重定向根路径到默认语言（/ -> /en）
 * - 处理语言路由（/en/*, /zh/*）
 * - 在 cookie 中保持语言选择
 */
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeDetection: true,
});

/**
 * 爬虫专用中间件配置
 *
 * 特点：
 * - 禁用 locale 检测，直接使用 defaultLocale
 * - 避免对爬虫进行不必要的重定向
 * - 确保 SEO 一致性
 */
const botMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeDetection: false, // 禁用检测，使用 defaultLocale
});

/**
 * 主中间件函数
 *
 * 处理流程：
 * 1. 检测 User-Agent 是否为爬虫
 * 2. 爬虫 -> 使用 botMiddleware（禁用 locale 检测）
 * 3. 普通用户 -> 使用 intlMiddleware（正常 locale 检测）
 */
export default function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';

  // 爬虫检测: 直接使用默认语言，跳过 locale 检测
  if (detectBot(userAgent)) {
    return botMiddleware(request);
  }

  return intlMiddleware(request);
}

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

    // 匹配所有带语言前缀的路径（10 种语言）
    '/(en|zh|ja|de|nl|fr|pt|es|zh-tw|ru)/:path*',

    // 排除不需要国际化的路径
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};

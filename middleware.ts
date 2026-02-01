import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale, isValidLocale, type Locale } from './i18n';
import {
  getLangPrefFromCookie,
  setLangPrefCookie,
} from './lib/language-preference';
import { detectBot } from './lib/bot-detector';

/**
 * next-intl 基础中间件配置（用于普通用户）
 */
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  // 禁用自动检测，我们会手动处理优先级
  localeDetection: false,
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
  localeDetection: false,
});

/**
 * 从 URL 路径中提取 locale
 * @param pathname - URL 路径
 * @returns 提取的 locale 或 null
 */
function getLocaleFromPath(pathname: string): Locale | null {
  // 移除开头的斜杠
  const path = pathname.startsWith('/') ? pathname.slice(1) : pathname;

  // 获取第一段路径
  const firstSegment = path.split('/')[0];

  // 检查是否为有效 locale
  if (isValidLocale(firstSegment)) {
    return firstSegment;
  }

  return null;
}

/**
 * 主中间件函数
 *
 * 处理流程：
 * 1. 检测 User-Agent 是否为爬虫
 * 2. 爬虫 -> 使用 botMiddleware（禁用 locale 检测，无重定向）
 * 3. 普通用户 -> 使用自定义 locale 优先级逻辑
 *
 * 语言检测优先级（普通用户）：
 * 1. URL 路径中的 locale（用户明确请求）
 * 2. Cookie 中的语言偏好（用户之前的选择）
 * 3. Accept-Language 请求头（浏览器偏好，由 next-intl 处理）
 * 4. 默认语言（en）
 */
export default function middleware(request: NextRequest): NextResponse {
  const userAgent = request.headers.get('user-agent') || '';

  // 1. 爬虫检测: 直接使用默认语言，跳过 locale 检测
  if (detectBot(userAgent)) {
    return botMiddleware(request);
  }

  // 2. 普通用户处理
  const { pathname } = request.nextUrl;

  // 3. 检查 URL 路径中是否有 locale
  const pathLocale = getLocaleFromPath(pathname);

  // 4. 读取 cookie 中的语言偏好
  const cookieLocale = getLangPrefFromCookie(request);

  // 5. 调用 next-intl 中间件处理请求
  const response = intlMiddleware(request);

  // 6. 确定最终使用的 locale
  let finalLocale: Locale;

  if (pathLocale) {
    // URL 路径中有 locale，使用它并更新 cookie
    finalLocale = pathLocale;
  } else if (cookieLocale) {
    // 没有路径 locale，但有 cookie 偏好
    finalLocale = cookieLocale;
  } else {
    // 都没有，使用默认 locale
    finalLocale = defaultLocale;
  }

  // 7. 更新 cookie（如果路径中有 locale，说明用户明确选择了语言）
  if (pathLocale) {
    setLangPrefCookie(response, finalLocale);
  } else if (!cookieLocale) {
    // 如果没有 cookie，设置默认 locale 到 cookie
    setLangPrefCookie(response, finalLocale);
  }

  return response;
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

    // 匹配所有带语言前缀的路径（所有 10 种语言）
    '/(zh|en|ja|de|nl|fr|pt|es|zh-tw|ru)/:path*',

    // 排除不需要国际化的路径
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};

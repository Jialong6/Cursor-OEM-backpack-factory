import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale, isValidLocale, type Locale } from './i18n';
import {
  getLangPrefFromCookie,
  setLangPrefCookie,
  LANG_COOKIE_NAME,
} from './lib/language-preference';

/**
 * next-intl 基础中间件配置
 */
const intlMiddleware = createMiddleware({
  // 支持的所有语言列表
  locales,

  // 默认语言（当无法检测用户偏好时使用）
  defaultLocale,

  // 路径前缀策略：'always' = 总是显示语言前缀（/en, /zh）
  localePrefix: 'always',

  // 禁用自动检测，我们会手动处理优先级
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
 * 自定义中间件
 *
 * 语言检测优先级：
 * 1. URL 路径中的 locale（用户明确请求）
 * 2. Cookie 中的语言偏好（用户之前的选择）
 * 3. Accept-Language 请求头（浏览器偏好）
 * 4. 默认语言（en）
 *
 * 功能：
 * - 自动检测用户语言偏好
 * - 重定向根路径到检测到的语言（/ -> /en 或 /zh）
 * - 处理语言路由（/en/*, /zh/*）
 * - 在 cookie 中保持语言选择
 */
export default function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // 1. 首先检查 URL 路径中是否有 locale
  const pathLocale = getLocaleFromPath(pathname);

  // 2. 读取 cookie 中的语言偏好
  const cookieLocale = getLangPrefFromCookie(request);

  // 3. 调用 next-intl 中间件处理请求
  const response = intlMiddleware(request);

  // 4. 确定最终使用的 locale
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

  // 5. 更新 cookie（如果路径中有 locale，说明用户明确选择了语言）
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

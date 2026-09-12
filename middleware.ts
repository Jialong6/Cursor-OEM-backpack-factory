import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale, type Locale } from './i18n';
import {
  getLangPrefFromCookie,
  setLangPrefCookie,
  AUTO_REDIRECT_COOKIE_NAME,
} from './lib/language-preference';
import { detectBot } from './lib/bot-detector';
import {
  buildUnauthorizedResponse,
  isAdminPath,
  isAuthorized,
  readAdminCredentials,
} from './lib/admin-auth';
import { syncGeoCountryCookie } from './lib/geo-country-cookie';
import {
  getLocaleFromPath,
  getLocaleFromGeoIP,
  buildRedirectUrl,
} from './lib/geo-router';

/**
 * next-intl middleware with full i18n-geo-routing support
 *
 * Priority chain (for regular users):
 * 1. URL path locale (e.g., /ja/about -> ja)
 * 2. Cookie preference (user's previous choice)
 * 3. Geo-IP detection (x-vercel-ip-country header)
 * 4. Accept-Language header (handled within Geo-IP)
 * 5. Default locale (en)
 *
 * Special handling:
 * - Bots: no geo/cookie detection; unprefixed paths 308 to /en,
 *   prefixed paths served via botMiddleware
 * - Human traffic also gets a client-readable `geo_cc` cookie carrying the
 *   detected country. The analytics region gates (skip third-party scripts in
 *   mainland China, show the consent banner in the EEA/UK/CH) read it without
 *   an extra request, and without forcing the statically generated layout to
 *   become dynamic. Bots skip it: crawlers never run the analytics scripts.
 */

/**
 * Base next-intl middleware for regular users
 */
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  // Disable auto detection - we handle priority manually
  localeDetection: false,
  // No Link-header hreflang: its codes (zh/zh-tw) conflict with the
  // zh-Hans/zh-Hant set in HTML + sitemap, its x-default points at
  // redirecting unprefixed paths, and it follows the request host (www).
  // hreflang source of truth = HTML head + sitemap.
  alternateLinks: false,
});

/**
 * Bot middleware configuration
 *
 * Features:
 * - Disabled locale detection
 * - No redirects for SEO consistency
 * - Always uses defaultLocale
 */
const botMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeDetection: false,
  alternateLinks: false,
});

/**
 * Get Geo-IP detected locale from request headers
 * @param request - NextRequest object
 * @returns Detected locale based on Geo-IP and Accept-Language
 */
function getGeoLocale(request: NextRequest): Locale {
  // Get country from Vercel's geo-IP header
  const countryCode = request.headers.get('x-vercel-ip-country');

  // Get Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');

  return getLocaleFromGeoIP(countryCode, acceptLanguage);
}

/**
 * Main middleware function
 *
 * Processing flow:
 * 1. Bot detection: Skip locale detection for bots
 * 2. Path locale: If URL has locale, use it
 * 3. Cookie locale: If user has preference, use it
 * 4. Geo-IP locale: Detect from country/Accept-Language
 * 5. Default locale: Fallback to 'en'
 */
export default async function middleware(
  request: NextRequest
): Promise<NextResponse> {
  // 0. 看板页:在 bot 检测之前拦下。爬虫打 /admin 也该拿 401,
  //    而且它不走 i18n —— matcher 会匹配 /admin,不早退就会被 302 到 /en/admin。
  //    不把 admin 加进 matcher 的排除组,是因为那样 middleware 根本跑不到,
  //    Basic 鉴权也就无处可挂。
  if (isAdminPath(request.nextUrl.pathname)) {
    const authorized = await isAuthorized(
      request.headers.get('authorization'),
      readAdminCredentials({
        ADMIN_USER: process.env.ADMIN_USER,
        ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
      })
    );

    if (!authorized) {
      return buildUnauthorizedResponse() as NextResponse;
    }

    return NextResponse.next();
  }

  const userAgent = request.headers.get('user-agent') || '';

  // 1. Bot detection: use botMiddleware (no locale detection)
  if (detectBot(userAgent)) {
    // Unprefixed paths are permanently at /en for crawlers (matches
    // x-default), so send 308 instead of next-intl's default 307 --
    // a temporary redirect keeps Google from consolidating the URLs.
    if (!getLocaleFromPath(request.nextUrl.pathname)) {
      return NextResponse.redirect(
        buildRedirectUrl(request.url, defaultLocale),
        308
      );
    }
    return botMiddleware(request);
  }

  // 2. Check URL path for existing locale
  const pathname = request.nextUrl.pathname;
  const pathLocale = getLocaleFromPath(pathname);

  // 3. Read cookie preference
  const cookieLocale = getLangPrefFromCookie(request);

  // 4. If path has locale, handle normally
  if (pathLocale) {
    // Call next-intl middleware
    const response = intlMiddleware(request);
    // Update cookie with path locale (user's explicit choice)
    setLangPrefCookie(response, pathLocale);
    // Expose the detected country to client scripts (analytics region gates)
    syncGeoCountryCookie(request, response);
    return response;
  }

  // 5. No path locale - determine best locale
  let targetLocale: Locale;

  if (cookieLocale) {
    // Cookie preference takes priority
    targetLocale = cookieLocale;
  } else {
    // Geo-IP detection as fallback
    targetLocale = getGeoLocale(request);
  }

  // 6. Redirect to detected locale
  const redirectUrl = buildRedirectUrl(request.url, targetLocale);
  const response = NextResponse.redirect(redirectUrl, 302);

  // Expose the detected country to client scripts (analytics region gates)
  syncGeoCountryCookie(request, response);

  // 7. Set cookie for future visits (if not already set)
  if (!cookieLocale) {
    setLangPrefCookie(response, targetLocale);

    // 8. Mark as auto-redirected for language banner (non-English only)
    if (targetLocale !== defaultLocale) {
      response.cookies.set(AUTO_REDIRECT_COOKIE_NAME, 'true', {
        path: '/',
        sameSite: 'lax',
        // Session cookie - no maxAge, expires when browser closes
      });
    }
  }

  return response;
}

/**
 * Middleware matcher configuration
 *
 * Matches all paths except:
 * - API routes (/api/*)
 * - Next.js internal files (_next/*)
 * - Static assets (images, fonts, etc.)
 */
export const config = {
  matcher: [
    // Root path
    '/',

    // All locale-prefixed paths (keep in sync with locales in i18n.ts;
    // Next.js requires this to be a statically analyzable string)
    '/(zh|en|ja|de|nl|fr|pt|es|zh-tw|ru|my|ko)/:path*',

    // All other paths except static assets and API
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};

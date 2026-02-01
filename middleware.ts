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
 * - Bots: Use botMiddleware (no locale detection, no redirect)
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
export default function middleware(request: NextRequest): NextResponse {
  const userAgent = request.headers.get('user-agent') || '';

  // 1. Bot detection: use botMiddleware (no locale detection)
  if (detectBot(userAgent)) {
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

    // All locale-prefixed paths (10 languages)
    '/(zh|en|ja|de|nl|fr|pt|es|zh-tw|ru)/:path*',

    // All other paths except static assets and API
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};

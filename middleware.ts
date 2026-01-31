import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale, type Locale } from './i18n';
import {
  getLocaleFromPath,
  getLocaleFromGeoIP,
  buildRedirectUrl,
} from './lib/geo-router';

/**
 * next-intl middleware with Geo-IP routing
 *
 * Priority chain:
 * 1. URL path locale (e.g., /ja/about -> ja)
 * 2. Cookie preference (implemented in Task 4)
 * 3. Geo-IP detection (x-vercel-ip-country header)
 * 4. Accept-Language header
 * 5. Default locale (en)
 */

// Base next-intl middleware for locale handling
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeDetection: true,
});

/**
 * Get Geo-IP detected locale
 * @param request - NextRequest object
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
 */
export default function middleware(request: NextRequest): NextResponse {
  const pathname = request.nextUrl.pathname;

  // Check if path already has a locale
  const pathLocale = getLocaleFromPath(pathname);

  if (pathLocale) {
    // Path has locale, let next-intl handle it
    return intlMiddleware(request);
  }

  // No locale in path - determine locale via Geo-IP
  const geoLocale = getGeoLocale(request);

  // Build redirect URL with detected locale
  const redirectUrl = buildRedirectUrl(request.url, geoLocale);

  // Return 302 redirect
  return NextResponse.redirect(redirectUrl, 302);
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
    '/(en|zh|ja|de|nl|fr|pt|es|zh-tw|ru)/:path*',

    // All other paths except static assets and API
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};

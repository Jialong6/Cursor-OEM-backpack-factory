import { NextRequest, NextResponse } from 'next/server';
import { locales, type Locale, isValidLocale } from '@/i18n';

/**
 * Language preference cookie management module
 *
 * This module handles reading and writing language preference cookies
 * for the i18n-geo-routing feature. Cookie takes priority over other
 * detection methods (Geo-IP, Accept-Language).
 */

/**
 * Cookie name for storing user language preference
 * Using NEXT_LOCALE as it's the standard next-intl cookie name
 */
export const LANG_COOKIE_NAME = 'NEXT_LOCALE';

/**
 * Cookie name for marking auto-redirect (for language banner)
 * This is a session cookie that indicates the user was auto-redirected
 * and should see the language confirmation banner
 */
export const AUTO_REDIRECT_COOKIE_NAME = 'lang_auto_redirect';

/**
 * Cookie max age in seconds (1 year)
 * 365 days * 24 hours * 60 minutes * 60 seconds = 31,536,000 seconds
 */
export const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

/**
 * Read language preference from request cookie
 *
 * @param request - Next.js request object
 * @returns The locale string if valid, null otherwise
 *
 * @example
 * const langPref = getLangPrefFromCookie(request);
 * if (langPref) {
 *   // Use cookie preference
 * } else {
 *   // Fall back to other detection methods
 * }
 */
export function getLangPrefFromCookie(request: NextRequest): Locale | null {
  const cookieValue = request.cookies.get(LANG_COOKIE_NAME)?.value;

  // Return null if cookie doesn't exist
  if (!cookieValue) {
    return null;
  }

  // Validate that the cookie value is a supported locale
  if (isValidLocale(cookieValue)) {
    return cookieValue;
  }

  return null;
}

/**
 * Set language preference cookie on response
 *
 * Cookie attributes:
 * - maxAge: 1 year (for long-term persistence)
 * - path: '/' (available site-wide)
 * - sameSite: 'lax' (balance security and usability)
 * - secure: true in production (HTTPS only)
 *
 * @param response - Next.js response object
 * @param locale - The locale to store in the cookie
 *
 * @example
 * const response = NextResponse.redirect(url);
 * setLangPrefCookie(response, 'zh');
 * return response;
 */
export function setLangPrefCookie(response: NextResponse, locale: string): void {
  // Only set cookie for valid locales
  if (!isValidLocale(locale)) {
    return;
  }

  response.cookies.set(LANG_COOKIE_NAME, locale, {
    maxAge: COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

/**
 * Type guard to check if a cookie value is a valid locale preference
 *
 * @param value - The cookie value to check
 * @returns true if value is a valid Locale
 */
export function isValidLangPref(value: string | undefined | null): value is Locale {
  if (!value) {
    return false;
  }
  return isValidLocale(value);
}

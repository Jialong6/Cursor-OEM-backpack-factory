import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { NextRequest, NextResponse } from 'next/server';
import {
  LANG_COOKIE_NAME,
  COOKIE_MAX_AGE,
  getLangPrefFromCookie,
  setLangPrefCookie,
  isValidLangPref,
} from '../../lib/language-preference';
import { locales, type Locale } from '../../i18n';

/**
 * Property-based tests for language preference cookie management
 *
 * Property 14: Cookie Attribute Correctness
 * - Verifies cookie name is correct
 * - Verifies maxAge is 1 year (31536000 seconds)
 * - Verifies path is '/'
 * - Verifies sameSite is 'lax'
 */

describe('Language Preference Cookie Management', () => {
  describe('Constants', () => {
    test('LANG_COOKIE_NAME should be NEXT_LOCALE', () => {
      expect(LANG_COOKIE_NAME).toBe('NEXT_LOCALE');
    });

    test('COOKIE_MAX_AGE should be 1 year in seconds', () => {
      const oneYearInSeconds = 365 * 24 * 60 * 60;
      expect(COOKIE_MAX_AGE).toBe(oneYearInSeconds);
      expect(COOKIE_MAX_AGE).toBe(31536000);
    });
  });

  describe('Property 14: Cookie Attribute Correctness', () => {
    let originalEnv: string | undefined;

    beforeEach(() => {
      originalEnv = process.env.NODE_ENV;
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    test('cookie name should always be NEXT_LOCALE', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...locales),
          (locale: Locale) => {
            const response = new NextResponse();
            setLangPrefCookie(response, locale);

            // Get the cookie that was set
            const setCookieHeader = response.headers.get('set-cookie');
            expect(setCookieHeader).toContain(`${LANG_COOKIE_NAME}=`);
          }
        ),
        { numRuns: 20 }
      );
    });

    test('cookie maxAge should be 1 year (31536000 seconds)', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...locales),
          (locale: Locale) => {
            const response = new NextResponse();
            setLangPrefCookie(response, locale);

            const setCookieHeader = response.headers.get('set-cookie');
            expect(setCookieHeader).toContain('Max-Age=31536000');
          }
        ),
        { numRuns: 20 }
      );
    });

    test('cookie path should be /', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...locales),
          (locale: Locale) => {
            const response = new NextResponse();
            setLangPrefCookie(response, locale);

            const setCookieHeader = response.headers.get('set-cookie');
            expect(setCookieHeader).toContain('Path=/');
          }
        ),
        { numRuns: 20 }
      );
    });

    test('cookie sameSite should be lax', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...locales),
          (locale: Locale) => {
            const response = new NextResponse();
            setLangPrefCookie(response, locale);

            const setCookieHeader = response.headers.get('set-cookie');
            expect(setCookieHeader?.toLowerCase()).toContain('samesite=lax');
          }
        ),
        { numRuns: 20 }
      );
    });

    test('cookie should be secure in production', () => {
      process.env.NODE_ENV = 'production';

      fc.assert(
        fc.property(
          fc.constantFrom(...locales),
          (locale: Locale) => {
            const response = new NextResponse();
            setLangPrefCookie(response, locale);

            const setCookieHeader = response.headers.get('set-cookie');
            expect(setCookieHeader?.toLowerCase()).toContain('secure');
          }
        ),
        { numRuns: 20 }
      );
    });

    test('cookie should not have secure flag in development', () => {
      process.env.NODE_ENV = 'development';

      fc.assert(
        fc.property(
          fc.constantFrom(...locales),
          (locale: Locale) => {
            const response = new NextResponse();
            setLangPrefCookie(response, locale);

            const setCookieHeader = response.headers.get('set-cookie');
            // In development, Secure flag should not be present
            // Note: checking that it's not 'secure;' or 'secure,' to avoid false positives
            const hasSecure = setCookieHeader?.toLowerCase().includes('secure;') ||
              setCookieHeader?.toLowerCase().includes('secure,') ||
              setCookieHeader?.toLowerCase().endsWith('secure');
            expect(hasSecure).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('getLangPrefFromCookie', () => {
    /**
     * Helper function to create a mock NextRequest with cookies
     */
    function createMockRequest(cookies: Record<string, string> = {}): NextRequest {
      const url = new URL('http://localhost:3000');
      const request = new NextRequest(url);

      // Add cookies to the request
      Object.entries(cookies).forEach(([name, value]) => {
        request.cookies.set(name, value);
      });

      return request;
    }

    test('should return null when no cookie exists', () => {
      const request = createMockRequest();
      expect(getLangPrefFromCookie(request)).toBeNull();
    });

    test('should return locale when valid cookie exists', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...locales),
          (locale: Locale) => {
            const request = createMockRequest({ [LANG_COOKIE_NAME]: locale });
            expect(getLangPrefFromCookie(request)).toBe(locale);
          }
        ),
        { numRuns: 20 }
      );
    });

    test('should return null for invalid locale in cookie', () => {
      const invalidLocales = ['xx', 'invalid', 'EN', 'ZH', '', 'en-US', 'zh-CN'];

      invalidLocales.forEach((invalid) => {
        const request = createMockRequest({ [LANG_COOKIE_NAME]: invalid });
        expect(getLangPrefFromCookie(request)).toBeNull();
      });
    });

    test('should return null for arbitrary invalid strings', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => !locales.includes(s as Locale)),
          (invalidLocale) => {
            const request = createMockRequest({ [LANG_COOKIE_NAME]: invalidLocale });
            expect(getLangPrefFromCookie(request)).toBeNull();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('setLangPrefCookie', () => {
    test('should set cookie for all valid locales', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...locales),
          (locale: Locale) => {
            const response = new NextResponse();
            setLangPrefCookie(response, locale);

            const setCookieHeader = response.headers.get('set-cookie');
            expect(setCookieHeader).toContain(`${LANG_COOKIE_NAME}=${locale}`);
          }
        ),
        { numRuns: 20 }
      );
    });

    test('should not set cookie for invalid locales', () => {
      const invalidLocales = ['xx', 'invalid', 'EN', 'ZH', '', 'en-US'];

      invalidLocales.forEach((invalid) => {
        const response = new NextResponse();
        setLangPrefCookie(response, invalid);

        const setCookieHeader = response.headers.get('set-cookie');
        expect(setCookieHeader).toBeNull();
      });
    });
  });

  describe('isValidLangPref', () => {
    test('should return true for valid locales', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...locales),
          (locale: Locale) => {
            expect(isValidLangPref(locale)).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });

    test('should return false for null', () => {
      expect(isValidLangPref(null)).toBe(false);
    });

    test('should return false for undefined', () => {
      expect(isValidLangPref(undefined)).toBe(false);
    });

    test('should return false for empty string', () => {
      expect(isValidLangPref('')).toBe(false);
    });

    test('should return false for invalid strings', () => {
      const invalidLocales = ['xx', 'invalid', 'EN', 'ZH', 'en-US', 'zh-CN'];

      invalidLocales.forEach((invalid) => {
        expect(isValidLangPref(invalid)).toBe(false);
      });
    });
  });

  describe('Round-trip consistency', () => {
    /**
     * Property: For any valid locale, setting a cookie and reading it back
     * should return the same locale
     */
    test('setting and reading cookie should return same locale', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...locales),
          (locale: Locale) => {
            // This tests the conceptual round-trip
            // In real middleware, cookie would be set on response and read from next request
            const response = new NextResponse();
            setLangPrefCookie(response, locale);

            // Verify the cookie value in the response header
            const setCookieHeader = response.headers.get('set-cookie');
            expect(setCookieHeader).toContain(`${LANG_COOKIE_NAME}=${locale}`);
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});

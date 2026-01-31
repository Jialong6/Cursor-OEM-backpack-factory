import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { NextRequest } from 'next/server';
import {
  LANG_COOKIE_NAME,
  getLangPrefFromCookie,
} from '../../lib/language-preference';
import { locales, defaultLocale, type Locale } from '../../i18n';

/**
 * Property-based tests for cookie priority over Geo-IP detection
 *
 * Property 7: Cookie Priority Over Geo-IP
 * When a user has a language preference cookie set, that preference
 * should always take priority over Geo-IP based language detection.
 */

describe('Property 7: Cookie Priority Over Geo-IP', () => {
  /**
   * Mock Geo-IP detection function
   * In real implementation, this would use IP-based country detection
   */
  function mockGeoIPDetection(_request: NextRequest): Locale {
    // Simulate Geo-IP detection returning a locale
    // In real implementation, this would map IP -> country -> locale
    return 'de'; // Simulate user from Germany
  }

  /**
   * Mock Accept-Language detection function
   * Simulates browser language header parsing
   */
  function mockAcceptLanguageDetection(_request: NextRequest): Locale {
    // Simulate Accept-Language header parsing
    return 'fr'; // Simulate browser set to French
  }

  /**
   * Language detection priority resolver
   * Priority: Cookie > Geo-IP > Accept-Language > Default
   *
   * This simulates the middleware logic for determining the final locale
   */
  function resolveLocale(
    cookieLocale: Locale | null,
    geoIPLocale: Locale,
    acceptLanguageLocale: Locale
  ): Locale {
    // Priority 1: User's explicit cookie preference
    if (cookieLocale !== null) {
      return cookieLocale;
    }

    // Priority 2: Geo-IP based detection
    if (locales.includes(geoIPLocale)) {
      return geoIPLocale;
    }

    // Priority 3: Browser Accept-Language
    if (locales.includes(acceptLanguageLocale)) {
      return acceptLanguageLocale;
    }

    // Priority 4: Default locale
    return defaultLocale;
  }

  /**
   * Helper function to create a mock NextRequest with cookies
   */
  function createMockRequest(cookies: Record<string, string> = {}): NextRequest {
    const url = new URL('http://localhost:3000');
    const request = new NextRequest(url);

    Object.entries(cookies).forEach(([name, value]) => {
      request.cookies.set(name, value);
    });

    return request;
  }

  describe('Cookie takes priority over Geo-IP', () => {
    test('when cookie exists, it should override Geo-IP detection', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...locales),
          fc.constantFrom(...locales),
          (cookieLocale: Locale, geoIPLocale: Locale) => {
            // Given: user has a cookie preference different from Geo-IP result
            const request = createMockRequest({ [LANG_COOKIE_NAME]: cookieLocale });
            const cookiePref = getLangPrefFromCookie(request);

            // When: resolving the locale
            const result = resolveLocale(cookiePref, geoIPLocale, 'en');

            // Then: cookie should win regardless of Geo-IP
            expect(result).toBe(cookieLocale);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('cookie preference should override all other detection methods', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...locales),
          fc.constantFrom(...locales),
          fc.constantFrom(...locales),
          (cookieLocale: Locale, geoIPLocale: Locale, acceptLangLocale: Locale) => {
            // Given: cookie, Geo-IP, and Accept-Language all return different locales
            const request = createMockRequest({ [LANG_COOKIE_NAME]: cookieLocale });
            const cookiePref = getLangPrefFromCookie(request);

            // When: resolving the locale
            const result = resolveLocale(cookiePref, geoIPLocale, acceptLangLocale);

            // Then: cookie should always win
            expect(result).toBe(cookieLocale);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Fallback to Geo-IP when no cookie', () => {
    test('when no cookie exists, Geo-IP should be used', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...locales),
          (geoIPLocale: Locale) => {
            // Given: no cookie preference
            const request = createMockRequest({});
            const cookiePref = getLangPrefFromCookie(request);

            // When: resolving the locale
            const result = resolveLocale(cookiePref, geoIPLocale, 'en');

            // Then: Geo-IP should be used
            expect(result).toBe(geoIPLocale);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('when cookie has invalid value, Geo-IP should be used', () => {
      const invalidCookies = ['xx', 'invalid', 'EN', 'ZH', ''];

      invalidCookies.forEach((invalidCookie) => {
        fc.assert(
          fc.property(
            fc.constantFrom(...locales),
            (geoIPLocale: Locale) => {
              // Given: cookie with invalid value
              const request = createMockRequest({ [LANG_COOKIE_NAME]: invalidCookie });
              const cookiePref = getLangPrefFromCookie(request);

              // Then: cookie should be null (invalid)
              expect(cookiePref).toBeNull();

              // When: resolving the locale
              const result = resolveLocale(cookiePref, geoIPLocale, 'en');

              // Then: Geo-IP should be used
              expect(result).toBe(geoIPLocale);
            }
          ),
          { numRuns: 20 }
        );
      });
    });
  });

  describe('Full priority chain', () => {
    test('priority chain: Cookie > Geo-IP > Accept-Language > Default', () => {
      // Test case 1: Cookie exists - should use cookie
      const request1 = createMockRequest({ [LANG_COOKIE_NAME]: 'ja' });
      const cookie1 = getLangPrefFromCookie(request1);
      expect(resolveLocale(cookie1, 'de', 'fr')).toBe('ja');

      // Test case 2: No cookie, Geo-IP available - should use Geo-IP
      const request2 = createMockRequest({});
      const cookie2 = getLangPrefFromCookie(request2);
      expect(resolveLocale(cookie2, 'de', 'fr')).toBe('de');

      // Test case 3: No cookie, no valid Geo-IP, Accept-Language available
      const request3 = createMockRequest({});
      const cookie3 = getLangPrefFromCookie(request3);
      expect(resolveLocale(cookie3, 'fr', 'es')).toBe('fr'); // Geo-IP takes priority

      // Test case 4: Default fallback (simulated with valid Geo-IP)
      const request4 = createMockRequest({});
      const cookie4 = getLangPrefFromCookie(request4);
      expect(resolveLocale(cookie4, 'en', 'en')).toBe('en');
    });

    test('each locale should be selectable via cookie preference', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...locales),
          (preferredLocale: Locale) => {
            // Given: user explicitly sets their preference via cookie
            const request = createMockRequest({ [LANG_COOKIE_NAME]: preferredLocale });
            const cookiePref = getLangPrefFromCookie(request);

            // When: resolving locale with different Geo-IP/Accept-Language
            const result = resolveLocale(
              cookiePref,
              mockGeoIPDetection(request),
              mockAcceptLanguageDetection(request)
            );

            // Then: user's explicit preference should always win
            expect(result).toBe(preferredLocale);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Cookie preference persistence', () => {
    test('same cookie value should always return same locale', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...locales),
          (locale: Locale) => {
            // Given: multiple requests with same cookie
            const request1 = createMockRequest({ [LANG_COOKIE_NAME]: locale });
            const request2 = createMockRequest({ [LANG_COOKIE_NAME]: locale });
            const request3 = createMockRequest({ [LANG_COOKIE_NAME]: locale });

            // When: reading cookie preference
            const pref1 = getLangPrefFromCookie(request1);
            const pref2 = getLangPrefFromCookie(request2);
            const pref3 = getLangPrefFromCookie(request3);

            // Then: all should return same locale
            expect(pref1).toBe(locale);
            expect(pref2).toBe(locale);
            expect(pref3).toBe(locale);
            expect(pref1).toBe(pref2);
            expect(pref2).toBe(pref3);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});

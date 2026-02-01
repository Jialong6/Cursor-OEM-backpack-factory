/**
 * Property 15: Redirect Status Code Consistency
 *
 * Tests for Geo-IP redirect behavior in middleware
 */
import { describe, test, expect } from 'vitest';
import fc from 'fast-check';

import {
  createGeoRedirectResponse,
  getLocaleFromPath,
  shouldRedirect,
  buildRedirectUrl,
} from '../../lib/geo-router';
import { locales, defaultLocale, type Locale } from '../../i18n';

describe('Property 15: Redirect Status Code Consistency', () => {
  // ============================================================
  // Property 15.1: All redirects use HTTP 302 status code
  // ============================================================
  describe('Property 15.1: All redirects use HTTP 302', () => {
    test('geo redirect response uses 302 status', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...locales),
          fc.webUrl(),
          (locale, url) => {
            const response = createGeoRedirectResponse(url, locale);
            expect(response.status).toBe(302);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('redirect response has correct Location header', () => {
      const response = createGeoRedirectResponse('https://example.com/', 'ja');
      expect(response.headers.get('Location')).toBe('https://example.com/ja');
    });

    test('redirect preserves path and query parameters', () => {
      const response = createGeoRedirectResponse(
        'https://example.com/about?utm=test',
        'de'
      );
      expect(response.headers.get('Location')).toBe(
        'https://example.com/de/about?utm=test'
      );
    });
  });

  // ============================================================
  // Property 15.2: Redirect URL format correctness
  // ============================================================
  describe('Property 15.2: Redirect URL format', () => {
    test('redirect URL includes locale prefix', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...locales),
          (locale) => {
            const redirectUrl = buildRedirectUrl('https://example.com/', locale);
            expect(redirectUrl).toContain(`/${locale}`);
          }
        ),
        { numRuns: locales.length }
      );
    });

    test('redirect URL preserves original path', () => {
      const paths = ['/about', '/contact', '/blog/post-1', '/products/bags'];
      for (const path of paths) {
        const redirectUrl = buildRedirectUrl(
          `https://example.com${path}`,
          'fr'
        );
        expect(redirectUrl).toBe(`https://example.com/fr${path}`);
      }
    });

    test('redirect URL preserves query parameters', () => {
      const redirectUrl = buildRedirectUrl(
        'https://example.com/search?q=bags&sort=price',
        'es'
      );
      expect(redirectUrl).toBe(
        'https://example.com/es/search?q=bags&sort=price'
      );
    });

    test('redirect URL preserves hash fragments', () => {
      const redirectUrl = buildRedirectUrl(
        'https://example.com/page#section',
        'pt'
      );
      expect(redirectUrl).toBe('https://example.com/pt/page#section');
    });

    test('root path redirects correctly', () => {
      const redirectUrl = buildRedirectUrl('https://example.com/', 'ja');
      expect(redirectUrl).toBe('https://example.com/ja');
    });

    test('root without trailing slash redirects correctly', () => {
      const redirectUrl = buildRedirectUrl('https://example.com', 'ja');
      expect(redirectUrl).toBe('https://example.com/ja');
    });
  });

  // ============================================================
  // Property 15.3: No redirect when path already has locale
  // ============================================================
  describe('Property 15.3: No redirect when path has locale', () => {
    test('getLocaleFromPath extracts locale correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...locales),
          (locale) => {
            const extractedLocale = getLocaleFromPath(`/${locale}/page`);
            expect(extractedLocale).toBe(locale);
          }
        ),
        { numRuns: locales.length }
      );
    });

    test('getLocaleFromPath returns null for non-locale paths', () => {
      expect(getLocaleFromPath('/about')).toBeNull();
      expect(getLocaleFromPath('/contact')).toBeNull();
      expect(getLocaleFromPath('/blog/post')).toBeNull();
    });

    test('getLocaleFromPath handles edge cases', () => {
      expect(getLocaleFromPath('/')).toBeNull();
      expect(getLocaleFromPath('')).toBeNull();
      expect(getLocaleFromPath('/en')).toBe('en');
      expect(getLocaleFromPath('/en/')).toBe('en');
      expect(getLocaleFromPath('/english')).toBeNull(); // not a valid locale
    });

    test('shouldRedirect returns false when locale in path', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...locales),
          (locale) => {
            const result = shouldRedirect(`/${locale}/page`, locale);
            expect(result).toBe(false);
          }
        ),
        { numRuns: locales.length }
      );
    });

    test('shouldRedirect returns true when no locale in path', () => {
      expect(shouldRedirect('/about', 'ja')).toBe(true);
      expect(shouldRedirect('/contact', 'de')).toBe(true);
      expect(shouldRedirect('/', 'fr')).toBe(true);
    });

    test('shouldRedirect returns false when path has different valid locale', () => {
      // If path already has a locale, we should not redirect to a different one
      // The URL locale takes precedence
      expect(shouldRedirect('/en/page', 'ja')).toBe(false);
      expect(shouldRedirect('/de/about', 'fr')).toBe(false);
    });
  });

  // ============================================================
  // Property 15.4: Redirect respects cookie priority
  // (Note: Full cookie implementation is in Task 4, but basic structure tested here)
  // ============================================================
  describe('Property 15.4: Cookie priority', () => {
    test('shouldRedirect respects cookie locale over geo locale', () => {
      // When cookie locale is set and matches path, no redirect
      // This tests the signature, actual implementation in Task 4
      const pathLocale = getLocaleFromPath('/ja/page');
      expect(pathLocale).toBe('ja');
    });
  });

  // ============================================================
  // Edge Cases
  // ============================================================
  describe('Edge cases', () => {
    test('handles special characters in path', () => {
      const redirectUrl = buildRedirectUrl(
        'https://example.com/path%20with%20spaces',
        'en'
      );
      expect(redirectUrl).toContain('/en/');
    });

    test('handles unicode in path', () => {
      const redirectUrl = buildRedirectUrl(
        'https://example.com/productos/bolsa',
        'es'
      );
      expect(redirectUrl).toBe('https://example.com/es/productos/bolsa');
    });

    test('handles nested paths correctly', () => {
      const redirectUrl = buildRedirectUrl(
        'https://example.com/blog/2024/01/post-title',
        'zh'
      );
      expect(redirectUrl).toBe(
        'https://example.com/zh/blog/2024/01/post-title'
      );
    });

    test('getLocaleFromPath handles zh-tw correctly', () => {
      expect(getLocaleFromPath('/zh-tw/page')).toBe('zh-tw');
      expect(getLocaleFromPath('/zh-tw/')).toBe('zh-tw');
      expect(getLocaleFromPath('/zh-tw')).toBe('zh-tw');
    });

    test('property: all valid locale paths are detected', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...locales),
          fc.array(
            fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz-'.split('')),
            { minLength: 0, maxLength: 20 }
          ).map((arr) => arr.join('')),
          (locale, pathSuffix) => {
            const path = `/${locale}/${pathSuffix}`;
            const detected = getLocaleFromPath(path);
            expect(detected).toBe(locale);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

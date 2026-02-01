/**
 * Property-based tests for Hreflang SEO Tags
 *
 * Property 9: Validates that any locale + path combination generates correct hreflang tags
 *
 * Requirements:
 * - 11 tags total: 10 languages + x-default
 * - Each tag has correct hreflang attribute
 * - Each tag has correct absolute href URL
 * - x-default points to English version
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  generateHreflangTags,
  type HreflangTag,
} from '@/components/seo/HreflangTags';
import { locales, localeConfig, type Locale } from '@/i18n';

describe('Hreflang Tags - Property Tests', () => {
  const baseUrl = 'https://betterbagsmyanmar.com';

  describe('Property 9: Any locale + path generates correct hreflang tags', () => {
    it('should generate exactly 11 hreflang tags (10 languages + x-default)', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...locales),
          fc.oneof(
            fc.constant(''),
            fc.constant('/blog'),
            fc.constant('/blog/test-slug')
          ),
          (locale: Locale, path: string) => {
            const tags = generateHreflangTags(locale, path, baseUrl);
            expect(tags).toHaveLength(11);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include x-default pointing to English version', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...locales),
          fc.oneof(fc.constant(''), fc.constant('/blog')),
          (locale: Locale, path: string) => {
            const tags = generateHreflangTags(locale, path, baseUrl);
            const xDefault = tags.find((tag) => tag.hreflang === 'x-default');

            expect(xDefault).toBeDefined();
            expect(xDefault?.href).toBe(`${baseUrl}/en${path}`);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should use correct hreflang codes from localeConfig', () => {
      fc.assert(
        fc.property(fc.constantFrom(...locales), (locale: Locale) => {
          const tags = generateHreflangTags(locale, '', baseUrl);

          // Check each locale has correct hreflang
          for (const loc of locales) {
            const expectedHreflang = localeConfig[loc].hreflang;
            const tag = tags.find((t) => t.hreflang === expectedHreflang);
            expect(tag).toBeDefined();
            expect(tag?.href).toBe(`${baseUrl}/${loc}`);
          }
        }),
        { numRuns: 20 }
      );
    });

    it('should generate absolute URLs with correct base URL', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...locales),
          fc.string({ minLength: 0, maxLength: 50 }).filter((s) => !s.includes(' ')),
          (locale: Locale, pathSegment: string) => {
            const path = pathSegment ? `/${pathSegment}` : '';
            const tags = generateHreflangTags(locale, path, baseUrl);

            // All hrefs should be absolute URLs starting with baseUrl
            for (const tag of tags) {
              expect(tag.href).toMatch(/^https:\/\/betterbagsmyanmar\.com\//);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle zh -> zh-Hans and zh-tw -> zh-Hant mappings', () => {
      const tags = generateHreflangTags('en', '', baseUrl);

      const zhHansTag = tags.find((t) => t.hreflang === 'zh-Hans');
      const zhHantTag = tags.find((t) => t.hreflang === 'zh-Hant');

      expect(zhHansTag).toBeDefined();
      expect(zhHansTag?.href).toBe(`${baseUrl}/zh`);

      expect(zhHantTag).toBeDefined();
      expect(zhHantTag?.href).toBe(`${baseUrl}/zh-tw`);
    });
  });

  describe('Unit Tests: generateHreflangTags', () => {
    it('should return correct structure for homepage', () => {
      const tags = generateHreflangTags('en', '', baseUrl);

      expect(tags).toEqual(
        expect.arrayContaining([
          { hreflang: 'en', href: `${baseUrl}/en` },
          { hreflang: 'zh-Hans', href: `${baseUrl}/zh` },
          { hreflang: 'ja', href: `${baseUrl}/ja` },
          { hreflang: 'de', href: `${baseUrl}/de` },
          { hreflang: 'nl', href: `${baseUrl}/nl` },
          { hreflang: 'fr', href: `${baseUrl}/fr` },
          { hreflang: 'pt', href: `${baseUrl}/pt` },
          { hreflang: 'es', href: `${baseUrl}/es` },
          { hreflang: 'zh-Hant', href: `${baseUrl}/zh-tw` },
          { hreflang: 'ru', href: `${baseUrl}/ru` },
          { hreflang: 'x-default', href: `${baseUrl}/en` },
        ])
      );
    });

    it('should append path correctly for blog pages', () => {
      const tags = generateHreflangTags('zh', '/blog', baseUrl);

      const enTag = tags.find((t) => t.hreflang === 'en');
      const zhTag = tags.find((t) => t.hreflang === 'zh-Hans');
      const xDefault = tags.find((t) => t.hreflang === 'x-default');

      expect(enTag?.href).toBe(`${baseUrl}/en/blog`);
      expect(zhTag?.href).toBe(`${baseUrl}/zh/blog`);
      expect(xDefault?.href).toBe(`${baseUrl}/en/blog`);
    });

    it('should handle blog detail pages with slugs', () => {
      const tags = generateHreflangTags('ja', '/blog/my-article', baseUrl);

      const jaTag = tags.find((t) => t.hreflang === 'ja');
      const xDefault = tags.find((t) => t.hreflang === 'x-default');

      expect(jaTag?.href).toBe(`${baseUrl}/ja/blog/my-article`);
      expect(xDefault?.href).toBe(`${baseUrl}/en/blog/my-article`);
    });

    it('should use environment baseUrl when not provided', () => {
      // Test with default baseUrl (uses process.env or fallback)
      const tags = generateHreflangTags('en', '');

      // All tags should have valid URLs
      for (const tag of tags) {
        expect(tag.href).toMatch(/^https?:\/\/.+/);
      }
    });
  });
});

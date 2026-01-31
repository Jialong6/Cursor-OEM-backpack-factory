import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import {
  locales,
  defaultLocale,
  localeConfig,
  isValidLocale,
  getLocaleConfig,
  type Locale,
  type LocaleConfigItem,
} from '../../i18n';

/**
 * Property-based tests for i18n locale configuration completeness
 *
 * These tests verify that all 10 supported locales have complete
 * configuration metadata for the v2 i18n-geo-routing feature.
 */

describe('Locale Configuration Completeness', () => {
  // Expected locales for v2
  const expectedLocales = ['en', 'zh', 'ja', 'de', 'nl', 'fr', 'pt', 'es', 'zh-tw', 'ru'] as const;

  describe('Unit Tests', () => {
    test('should support exactly 10 locales', () => {
      expect(locales).toHaveLength(10);
    });

    test('should have all expected locales', () => {
      expectedLocales.forEach((locale) => {
        expect(locales).toContain(locale);
      });
    });

    test('should have en as default locale', () => {
      expect(defaultLocale).toBe('en');
    });

    test('should have zh-tw with correct hreflang', () => {
      const config = getLocaleConfig('zh-tw');
      expect(config).toBeDefined();
      expect(config?.hreflang).toBe('zh-Hant');
    });

    test('should have zh with correct hreflang', () => {
      const config = getLocaleConfig('zh');
      expect(config).toBeDefined();
      expect(config?.hreflang).toBe('zh-Hans');
    });
  });

  describe('Property 1.1: Every locale has complete config entry', () => {
    test('each locale in locales array has all required config fields', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...locales),
          (locale: Locale) => {
            const config = localeConfig[locale];
            expect(config).toBeDefined();
            expect(typeof config.name).toBe('string');
            expect(config.name.length).toBeGreaterThan(0);
            expect(typeof config.nativeName).toBe('string');
            expect(config.nativeName.length).toBeGreaterThan(0);
            expect(typeof config.flag).toBe('string');
            expect(config.flag.length).toBeGreaterThan(0);
            expect(typeof config.hreflang).toBe('string');
            expect(config.hreflang.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 1.2: localeConfig keys match locales array (bijection)', () => {
    test('localeConfig has exactly the same keys as locales array', () => {
      const configKeys = Object.keys(localeConfig).sort();
      const localesSorted = [...locales].sort();
      expect(configKeys).toEqual(localesSorted);
    });

    test('no extra keys in localeConfig', () => {
      Object.keys(localeConfig).forEach((key) => {
        expect(locales).toContain(key);
      });
    });

    test('no missing keys in localeConfig', () => {
      locales.forEach((locale) => {
        expect(localeConfig).toHaveProperty(locale);
      });
    });
  });

  describe('Property 1.3: isValidLocale returns true for valid locales', () => {
    test('isValidLocale returns true for all locales in array', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...locales),
          (locale: Locale) => {
            expect(isValidLocale(locale)).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 1.4: isValidLocale returns false for invalid locales', () => {
    test('isValidLocale returns false for random strings', () => {
      const invalidLocales = ['xx', 'invalid', 'EN', 'ZH', 'english', 'chinese', '', '  ', 'en-US', 'zh-CN'];

      invalidLocales.forEach((invalid) => {
        expect(isValidLocale(invalid)).toBe(false);
      });
    });

    test('isValidLocale returns false for arbitrary strings', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => !locales.includes(s as Locale)),
          (invalidLocale) => {
            expect(isValidLocale(invalidLocale)).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 1.5: hreflang codes follow ISO format', () => {
    test('all hreflang codes match ISO pattern', () => {
      // ISO 639-1 (2 letters) or ISO 639-1 + script (e.g., zh-Hans, zh-Hant)
      const hreflangPattern = /^[a-z]{2}(-[A-Z][a-z]{3})?$/;

      fc.assert(
        fc.property(
          fc.constantFrom(...locales),
          (locale: Locale) => {
            const config = localeConfig[locale];
            expect(config.hreflang).toMatch(hreflangPattern);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 1.6: getLocaleConfig returns config for valid locales', () => {
    test('getLocaleConfig returns defined config for all valid locales', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...locales),
          (locale: Locale) => {
            const config = getLocaleConfig(locale);
            expect(config).toBeDefined();
            expect(config).toEqual(localeConfig[locale]);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 1.7: getLocaleConfig returns undefined for invalid locales', () => {
    test('getLocaleConfig returns undefined for invalid strings', () => {
      const invalidLocales = ['xx', 'invalid', 'EN', 'ZH', '', 'en-US'];

      invalidLocales.forEach((invalid) => {
        expect(getLocaleConfig(invalid)).toBeUndefined();
      });
    });

    test('getLocaleConfig returns undefined for arbitrary invalid strings', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => !locales.includes(s as Locale)),
          (invalidLocale) => {
            expect(getLocaleConfig(invalidLocale)).toBeUndefined();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Locale Config Content Validation', () => {
    test('English names are unique', () => {
      const names = Object.values(localeConfig).map((c) => c.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    test('Native names are unique', () => {
      const nativeNames = Object.values(localeConfig).map((c) => c.nativeName);
      const uniqueNativeNames = new Set(nativeNames);
      expect(uniqueNativeNames.size).toBe(nativeNames.length);
    });

    test('Flags are unique', () => {
      const flags = Object.values(localeConfig).map((c) => c.flag);
      const uniqueFlags = new Set(flags);
      expect(uniqueFlags.size).toBe(flags.length);
    });
  });
});

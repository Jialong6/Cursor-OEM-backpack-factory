/**
 * Property-based tests for translation file structure
 * Ensures all locale files exist and have consistent structure
 */
import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { locales, type Locale } from '../../i18n';

const LOCALES_DIR = path.join(process.cwd(), 'locales');

/**
 * Helper: Load translation file for a locale
 */
function loadTranslationFile(locale: Locale): Record<string, unknown> | null {
  const filePath = path.join(LOCALES_DIR, `${locale}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Helper: Get all keys from an object recursively (dot notation)
 */
function getAllKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];

  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      // Recurse into nested objects
      keys.push(...getAllKeys(value as Record<string, unknown>, fullKey));
    } else {
      // Leaf node (string, number, array, null)
      keys.push(fullKey);
    }
  }

  return keys.sort();
}

/**
 * Helper: Check if value is a non-empty string (leaf node)
 */
function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Helper: Get value at dot-notation path
 */
function getValueAtPath(
  obj: Record<string, unknown>,
  path: string
): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

describe('Translation File Structure Properties', () => {
  // Reference structure from English (primary language)
  const enTranslations = loadTranslationFile('en');

  describe('Property 2.1: All translation files exist', () => {
    test.each(locales)('locale "%s" has a translation file', (locale) => {
      const filePath = path.join(LOCALES_DIR, `${locale}.json`);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  describe('Property 2.2: All translation files are valid JSON', () => {
    test.each(locales)('locale "%s" contains valid JSON', (locale) => {
      const translations = loadTranslationFile(locale);
      expect(translations).not.toBeNull();
      expect(typeof translations).toBe('object');
    });
  });

  describe('Property 2.3: All translation files have same top-level keys', () => {
    test('reference (en.json) exists and has top-level keys', () => {
      expect(enTranslations).not.toBeNull();
      const topLevelKeys = Object.keys(enTranslations!);
      expect(topLevelKeys.length).toBeGreaterThan(0);
    });

    test.each(locales.filter((l) => l !== 'en'))(
      'locale "%s" has same top-level keys as en',
      (locale) => {
        const translations = loadTranslationFile(locale);
        expect(translations).not.toBeNull();

        const enKeys = Object.keys(enTranslations!).sort();
        const localeKeys = Object.keys(translations!).sort();

        expect(localeKeys).toEqual(enKeys);
      }
    );
  });

  describe('Property 2.4: All translation files have same nested structure', () => {
    test.each(locales.filter((l) => l !== 'en'))(
      'locale "%s" has same nested keys as en',
      (locale) => {
        const translations = loadTranslationFile(locale);
        expect(translations).not.toBeNull();

        const enKeys = getAllKeys(enTranslations!);
        const localeKeys = getAllKeys(translations!);

        expect(localeKeys).toEqual(enKeys);
      }
    );
  });

  describe('Property 2.5: All leaf values are non-empty strings or valid arrays', () => {
    test.each(locales)('locale "%s" has valid leaf values', (locale) => {
      const translations = loadTranslationFile(locale);
      expect(translations).not.toBeNull();

      const allKeys = getAllKeys(translations!);

      for (const key of allKeys) {
        const value = getValueAtPath(translations!, key);

        // Allow strings, numbers, and arrays
        const isValid =
          isNonEmptyString(value) ||
          typeof value === 'number' ||
          Array.isArray(value);

        expect(
          isValid,
          `Key "${key}" in ${locale}.json should be a non-empty string, number, or array, got: ${typeof value}`
        ).toBe(true);
      }
    });
  });

  describe('Property 2.6: No extra keys in translation files', () => {
    test.each(locales.filter((l) => l !== 'en'))(
      'locale "%s" has no extra keys beyond en',
      (locale) => {
        const translations = loadTranslationFile(locale);
        expect(translations).not.toBeNull();

        const enKeys = new Set(getAllKeys(enTranslations!));
        const localeKeys = getAllKeys(translations!);

        const extraKeys = localeKeys.filter((key) => !enKeys.has(key));
        expect(
          extraKeys,
          `Locale ${locale} has extra keys: ${extraKeys.join(', ')}`
        ).toHaveLength(0);
      }
    );
  });

  describe('Property 2.7: No missing keys in translation files', () => {
    test.each(locales.filter((l) => l !== 'en'))(
      'locale "%s" has no missing keys compared to en',
      (locale) => {
        const translations = loadTranslationFile(locale);
        expect(translations).not.toBeNull();

        const enKeys = getAllKeys(enTranslations!);
        const localeKeySet = new Set(getAllKeys(translations!));

        const missingKeys = enKeys.filter((key) => !localeKeySet.has(key));
        expect(
          missingKeys,
          `Locale ${locale} is missing keys: ${missingKeys.join(', ')}`
        ).toHaveLength(0);
      }
    );
  });
});

describe('Translation File Unit Tests', () => {
  test('en.json has expected top-level sections', () => {
    const translations = loadTranslationFile('en');
    expect(translations).not.toBeNull();

    const expectedSections = [
      'bento',
      'nav',
      'banner',
      'about',
      'features',
      'customization',
      'services',
      'faq',
      'contact',
      'footer',
      'blog',
      'blogList',
      'blogDetail',
      'language',
    ];

    const actualSections = Object.keys(translations!).sort();
    expect(actualSections).toEqual(expectedSections.sort());
  });

  test('exactly 10 translation files exist', () => {
    let count = 0;
    for (const locale of locales) {
      const filePath = path.join(LOCALES_DIR, `${locale}.json`);
      if (fs.existsSync(filePath)) {
        count++;
      }
    }
    expect(count).toBe(10);
  });
});

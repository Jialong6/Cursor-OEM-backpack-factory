/**
 * Property-based tests for toCalLocale (site locale → Cal.com UI locale)
 *
 * Cal.com 预约界面支持约 36 种语言(zh-CN/zh-TW/ja/ko/de/nl/fr/pt/es/ru 等),
 * 不支持缅甸语。映射用于 my 页面的英文提示条,并为未来 embed 强制语言参数预留。
 */
import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { locales, type Locale } from '../../i18n';
import { toCalLocale, CAL_SUPPORTED_LOCALES } from '../../lib/cal-tour';

describe('Property: toCalLocale mapping', () => {
  test('returns null if and only if locale is "my" (Burmese unsupported by Cal.com)', () => {
    fc.assert(
      fc.property(fc.constantFrom(...locales), (locale: Locale) => {
        const result = toCalLocale(locale);
        if (locale === 'my') {
          expect(result).toBeNull();
        } else {
          expect(result).not.toBeNull();
        }
      }),
      { numRuns: 100 }
    );
  });

  test('non-null results are always valid Cal.com locale codes', () => {
    fc.assert(
      fc.property(fc.constantFrom(...locales), (locale: Locale) => {
        const result = toCalLocale(locale);
        if (result !== null) {
          expect(CAL_SUPPORTED_LOCALES).toContain(result);
        }
      }),
      { numRuns: 100 }
    );
  });

  test('is deterministic (same input always yields same output)', () => {
    fc.assert(
      fc.property(fc.constantFrom(...locales), (locale: Locale) => {
        expect(toCalLocale(locale)).toBe(toCalLocale(locale));
      }),
      { numRuns: 100 }
    );
  });

  test('maps Chinese variants to region-qualified codes', () => {
    expect(toCalLocale('zh')).toBe('zh-CN');
    expect(toCalLocale('zh-tw')).toBe('zh-TW');
  });

  test('passes through locales that Cal.com supports natively', () => {
    expect(toCalLocale('en')).toBe('en');
    expect(toCalLocale('ja')).toBe('ja');
    expect(toCalLocale('ko')).toBe('ko');
    expect(toCalLocale('ru')).toBe('ru');
  });
});

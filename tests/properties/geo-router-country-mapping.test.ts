/**
 * Property 6: Country-to-Locale Mapping Correctness
 *
 * Tests for Geo-IP based language routing logic
 */
import { describe, test, expect } from 'vitest';
import fc from 'fast-check';

import {
  COUNTRY_LOCALE_MAP,
  AMBIGUOUS_COUNTRIES,
  getLocaleFromCountry,
  isAmbiguousCountry,
  getAmbiguousCountryLocales,
  parseAcceptLanguage,
  matchLanguageToLocale,
  getLocaleFromAcceptLanguage,
  resolveAmbiguousCountry,
  getLocaleFromGeoIP,
} from '../../lib/geo-router';
import { locales, type Locale } from '../../i18n';

describe('Property 6: Country-to-Locale Mapping Correctness', () => {
  // ============================================================
  // Property 6.1: All mapped country codes return valid locales
  // ============================================================
  describe('Property 6.1: Mapped countries return valid locales', () => {
    test('all countries in COUNTRY_LOCALE_MAP return valid locales', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(COUNTRY_LOCALE_MAP)),
          (countryCode) => {
            const locale = getLocaleFromCountry(countryCode);
            expect(locale).not.toBeNull();
            expect(locales).toContain(locale);
          }
        ),
        { numRuns: Object.keys(COUNTRY_LOCALE_MAP).length }
      );
    });

    test('specific country mappings are correct', () => {
      // Direct mappings per design doc
      const expectedMappings: [string, Locale][] = [
        ['JP', 'ja'],
        ['DE', 'de'],
        ['AT', 'de'],
        ['CH', 'de'],
        ['NL', 'nl'],
        ['FR', 'fr'],
        ['PT', 'pt'],
        ['BR', 'pt'],
        ['ES', 'es'],
        ['MX', 'es'],
        ['AR', 'es'],
        ['CO', 'es'],
        ['CL', 'es'],
        ['PE', 'es'],
        ['VE', 'es'],
        ['TW', 'zh-tw'],
        ['HK', 'zh-tw'],
        ['MO', 'zh-tw'],
        ['RU', 'ru'],
        ['BY', 'ru'],
        ['KZ', 'ru'],
        ['UA', 'ru'],
        ['CN', 'zh'],
      ];

      for (const [country, expectedLocale] of expectedMappings) {
        expect(getLocaleFromCountry(country)).toBe(expectedLocale);
      }
    });
  });

  // ============================================================
  // Property 6.2: Country code case insensitivity
  // ============================================================
  describe('Property 6.2: Country code case insensitivity', () => {
    test('country codes are case-insensitive', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(COUNTRY_LOCALE_MAP)),
          (countryCode) => {
            const upperResult = getLocaleFromCountry(countryCode.toUpperCase());
            const lowerResult = getLocaleFromCountry(countryCode.toLowerCase());
            const mixedResult = getLocaleFromCountry(
              countryCode[0].toLowerCase() + countryCode.slice(1).toUpperCase()
            );

            expect(upperResult).toBe(lowerResult);
            expect(lowerResult).toBe(mixedResult);
          }
        ),
        { numRuns: Object.keys(COUNTRY_LOCALE_MAP).length }
      );
    });

    test('jp, JP, Jp all return ja', () => {
      expect(getLocaleFromCountry('jp')).toBe('ja');
      expect(getLocaleFromCountry('JP')).toBe('ja');
      expect(getLocaleFromCountry('Jp')).toBe('ja');
      expect(getLocaleFromCountry('jP')).toBe('ja');
    });
  });

  // ============================================================
  // Property 6.3: Unmapped country codes return null
  // ============================================================
  describe('Property 6.3: Unmapped countries return null', () => {
    test('random unmapped country codes return null', () => {
      // Generate random 2-letter strings that are not in our map
      const mappedCodes = new Set(
        Object.keys(COUNTRY_LOCALE_MAP).map((c) => c.toUpperCase())
      );
      const ambiguousCodes = new Set(
        Object.keys(AMBIGUOUS_COUNTRIES).map((c) => c.toUpperCase())
      );

      fc.assert(
        fc.property(
          fc.tuple(
            fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')),
            fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''))
          ).map(([a, b]) => a + b),
          (countryCode) => {
            const upper = countryCode.toUpperCase();
            if (!mappedCodes.has(upper) && !ambiguousCodes.has(upper)) {
              expect(getLocaleFromCountry(countryCode)).toBeNull();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('known unmapped countries return null', () => {
      // Countries not in our supported locale list
      const unmappedCountries = ['AF', 'ZW', 'NG', 'IN', 'PK', 'BD', 'ID'];
      for (const country of unmappedCountries) {
        expect(getLocaleFromCountry(country)).toBeNull();
      }
    });
  });

  // ============================================================
  // Property 6.4: Ambiguous countries need Accept-Language disambiguation
  // ============================================================
  describe('Property 6.4: Ambiguous country disambiguation', () => {
    test('Belgium is marked as ambiguous', () => {
      expect(isAmbiguousCountry('BE')).toBe(true);
      expect(isAmbiguousCountry('be')).toBe(true);
    });

    test('Belgium returns nl and fr as possible locales', () => {
      const locales = getAmbiguousCountryLocales('BE');
      expect(locales).toContain('nl');
      expect(locales).toContain('fr');
      expect(locales.length).toBe(2);
    });

    test('Belgium resolves to nl with Dutch Accept-Language', () => {
      expect(resolveAmbiguousCountry('BE', 'nl,en;q=0.9')).toBe('nl');
      expect(resolveAmbiguousCountry('BE', 'nl-BE,nl;q=0.9')).toBe('nl');
    });

    test('Belgium resolves to fr with French Accept-Language', () => {
      expect(resolveAmbiguousCountry('BE', 'fr,en;q=0.9')).toBe('fr');
      expect(resolveAmbiguousCountry('BE', 'fr-BE,fr;q=0.9')).toBe('fr');
    });

    test('Belgium defaults to first option when no matching Accept-Language', () => {
      const defaultLocale = resolveAmbiguousCountry('BE', 'en,es;q=0.9');
      const ambiguousLocales = getAmbiguousCountryLocales('BE');
      expect(ambiguousLocales).toContain(defaultLocale);
    });

    test('non-ambiguous countries are not marked as ambiguous', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(COUNTRY_LOCALE_MAP)),
          (countryCode) => {
            expect(isAmbiguousCountry(countryCode)).toBe(false);
          }
        ),
        { numRuns: Object.keys(COUNTRY_LOCALE_MAP).length }
      );
    });
  });

  // ============================================================
  // Property 6.5: Edge case handling
  // ============================================================
  describe('Property 6.5: Edge cases', () => {
    test('empty string returns null', () => {
      expect(getLocaleFromCountry('')).toBeNull();
    });

    test('single character returns null', () => {
      fc.assert(
        fc.property(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')), (char) => {
          expect(getLocaleFromCountry(char)).toBeNull();
        }),
        { numRuns: 26 }
      );
    });

    test('strings longer than 2 characters return null', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 10 }),
          (str) => {
            expect(getLocaleFromCountry(str)).toBeNull();
          }
        ),
        { numRuns: 50 }
      );
    });

    test('whitespace is handled correctly', () => {
      expect(getLocaleFromCountry(' JP')).toBeNull();
      expect(getLocaleFromCountry('JP ')).toBeNull();
      expect(getLocaleFromCountry(' JP ')).toBeNull();
    });
  });
});

// ============================================================
// Accept-Language Header Parsing Tests
// ============================================================
describe('Accept-Language Header Parsing', () => {
  describe('parseAcceptLanguage', () => {
    test('parses simple language code', () => {
      const result = parseAcceptLanguage('en');
      expect(result).toEqual([{ code: 'en', quality: 1 }]);
    });

    test('parses multiple languages with quality values', () => {
      const result = parseAcceptLanguage('en,fr;q=0.9,de;q=0.8');
      expect(result).toEqual([
        { code: 'en', quality: 1 },
        { code: 'fr', quality: 0.9 },
        { code: 'de', quality: 0.8 },
      ]);
    });

    test('parses language with region code', () => {
      const result = parseAcceptLanguage('en-US,en;q=0.9');
      expect(result).toEqual([
        { code: 'en-US', quality: 1 },
        { code: 'en', quality: 0.9 },
      ]);
    });

    test('sorts by quality descending', () => {
      const result = parseAcceptLanguage('de;q=0.5,en;q=0.9,fr;q=0.7');
      expect(result[0].code).toBe('en');
      expect(result[1].code).toBe('fr');
      expect(result[2].code).toBe('de');
    });

    test('handles empty string', () => {
      expect(parseAcceptLanguage('')).toEqual([]);
    });

    test('handles whitespace', () => {
      const result = parseAcceptLanguage(' en , fr ; q=0.9 ');
      expect(result.length).toBe(2);
      expect(result[0].code).toBe('en');
      expect(result[1].code).toBe('fr');
    });

    test('handles invalid quality values gracefully', () => {
      const result = parseAcceptLanguage('en;q=invalid,fr;q=0.9');
      // Invalid quality should default to 0 or be filtered
      expect(result.some((r) => r.code === 'fr')).toBe(true);
    });
  });

  describe('matchLanguageToLocale', () => {
    test('exact match returns locale', () => {
      expect(matchLanguageToLocale('en')).toBe('en');
      expect(matchLanguageToLocale('ja')).toBe('ja');
      expect(matchLanguageToLocale('zh')).toBe('zh');
    });

    test('language-region matches base language', () => {
      expect(matchLanguageToLocale('en-US')).toBe('en');
      expect(matchLanguageToLocale('en-GB')).toBe('en');
      expect(matchLanguageToLocale('de-DE')).toBe('de');
      expect(matchLanguageToLocale('de-AT')).toBe('de');
    });

    test('zh-TW matches zh-tw locale', () => {
      expect(matchLanguageToLocale('zh-TW')).toBe('zh-tw');
      expect(matchLanguageToLocale('zh-Hant')).toBe('zh-tw');
    });

    test('zh-CN matches zh locale', () => {
      expect(matchLanguageToLocale('zh-CN')).toBe('zh');
      expect(matchLanguageToLocale('zh-Hans')).toBe('zh');
    });

    test('unsupported language returns null', () => {
      expect(matchLanguageToLocale('ko')).toBeNull();
      expect(matchLanguageToLocale('ar')).toBeNull();
      expect(matchLanguageToLocale('hi')).toBeNull();
    });
  });

  describe('getLocaleFromAcceptLanguage', () => {
    test('returns first matching locale', () => {
      expect(getLocaleFromAcceptLanguage('ja,en;q=0.9')).toBe('ja');
      expect(getLocaleFromAcceptLanguage('fr-FR,en;q=0.9')).toBe('fr');
    });

    test('skips unsupported languages', () => {
      expect(getLocaleFromAcceptLanguage('ko,ar,ja;q=0.8')).toBe('ja');
    });

    test('returns null when no match', () => {
      expect(getLocaleFromAcceptLanguage('ko,ar,hi')).toBeNull();
    });

    test('handles empty header', () => {
      expect(getLocaleFromAcceptLanguage('')).toBeNull();
    });
  });
});

// ============================================================
// Full Geo-IP Routing Tests
// ============================================================
describe('Full Geo-IP Routing: getLocaleFromGeoIP', () => {
  test('returns locale for mapped country', () => {
    expect(getLocaleFromGeoIP('JP', null)).toBe('ja');
    expect(getLocaleFromGeoIP('DE', null)).toBe('de');
    expect(getLocaleFromGeoIP('CN', null)).toBe('zh');
  });

  test('falls back to Accept-Language when country is null', () => {
    expect(getLocaleFromGeoIP(null, 'ja,en;q=0.9')).toBe('ja');
    expect(getLocaleFromGeoIP(null, 'fr-FR,en;q=0.9')).toBe('fr');
  });

  test('falls back to Accept-Language when country is unmapped', () => {
    expect(getLocaleFromGeoIP('XX', 'de,en;q=0.9')).toBe('de');
  });

  test('returns en as default when no detection works', () => {
    expect(getLocaleFromGeoIP(null, null)).toBe('en');
    expect(getLocaleFromGeoIP(null, '')).toBe('en');
    expect(getLocaleFromGeoIP('XX', 'ko,ar')).toBe('en');
  });

  test('handles ambiguous country with Accept-Language', () => {
    expect(getLocaleFromGeoIP('BE', 'nl,en;q=0.9')).toBe('nl');
    expect(getLocaleFromGeoIP('BE', 'fr,en;q=0.9')).toBe('fr');
  });

  test('country code is case-insensitive in full routing', () => {
    expect(getLocaleFromGeoIP('jp', null)).toBe('ja');
    expect(getLocaleFromGeoIP('Jp', null)).toBe('ja');
  });

  test('property: getLocaleFromGeoIP always returns a valid locale', () => {
    fc.assert(
      fc.property(
        fc.option(fc.string({ minLength: 0, maxLength: 5 }), { nil: null }),
        fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: null }),
        (countryCode, acceptLanguage) => {
          const result = getLocaleFromGeoIP(countryCode, acceptLanguage);
          expect(locales).toContain(result);
        }
      ),
      { numRuns: 200 }
    );
  });
});

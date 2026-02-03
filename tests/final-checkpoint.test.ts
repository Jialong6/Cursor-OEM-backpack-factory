/**
 * Task 21: Final Checkpoint - Comprehensive System Verification
 *
 * Integration-level tests verifying all core subsystems work together.
 * Validates Task 1-20 features: 10 languages, geo-routing, bot detection,
 * SEO structured data, and system invariants.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

import {
  locales,
  defaultLocale,
  localeConfig,
  isValidLocale,
  type Locale,
} from '@/i18n';

import { detectBot } from '@/lib/bot-detector';

import {
  getLocaleFromGeoIP,
  getLocaleFromCountry,
  getLocaleFromPath,
  shouldRedirect,
  COUNTRY_LOCALE_MAP,
} from '@/lib/geo-router';

import { LANG_COOKIE_NAME } from '@/lib/language-preference';

import { generateHreflangTags } from '@/components/seo/HreflangTags';
import { FACTORY_INFO } from '@/components/seo/ManufacturingPlantSchema';

// ---------------------------------------------------------------------------
// Checkpoint 1: 10 Language System Completeness
// ---------------------------------------------------------------------------

describe('Checkpoint 1: 10 Language System Completeness', () => {
  const localesDir = path.resolve(__dirname, '../locales');

  it('should have exactly 10 supported locales', () => {
    expect(locales).toHaveLength(10);
  });

  it('each locale should have a corresponding translation file', () => {
    for (const locale of locales) {
      const filePath = path.join(localesDir, `${locale}.json`);
      expect(fs.existsSync(filePath), `Missing translation file: ${locale}.json`).toBe(true);
    }
  });

  it('translation file count should match locales count exactly', () => {
    const jsonFiles = fs.readdirSync(localesDir).filter((f) => f.endsWith('.json'));
    expect(jsonFiles).toHaveLength(locales.length);
  });

  it('Property: every locale config has name, nativeName, flag, hreflang as non-empty strings', () => {
    fc.assert(
      fc.property(fc.constantFrom(...locales), (locale) => {
        const config = localeConfig[locale];
        expect(config.name).toBeTruthy();
        expect(config.nativeName).toBeTruthy();
        expect(config.flag).toBeTruthy();
        expect(config.hreflang).toBeTruthy();
        expect(typeof config.name).toBe('string');
        expect(typeof config.nativeName).toBe('string');
        expect(typeof config.flag).toBe('string');
        expect(typeof config.hreflang).toBe('string');
      }),
      { numRuns: locales.length }
    );
  });

  it('Property: any two locales share the same top-level translation keys', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...locales),
        fc.constantFrom(...locales),
        (localeA, localeB) => {
          const fileA = JSON.parse(
            fs.readFileSync(path.join(localesDir, `${localeA}.json`), 'utf-8')
          );
          const fileB = JSON.parse(
            fs.readFileSync(path.join(localesDir, `${localeB}.json`), 'utf-8')
          );
          const keysA = Object.keys(fileA).sort();
          const keysB = Object.keys(fileB).sort();
          expect(keysA).toEqual(keysB);
        }
      ),
      { numRuns: 30 }
    );
  });

  it('all hreflang values should be unique', () => {
    const hreflangs = locales.map((l) => localeConfig[l].hreflang);
    const uniqueHreflangs = new Set(hreflangs);
    expect(uniqueHreflangs.size).toBe(hreflangs.length);
  });

  it('zh and zh-tw should have distinct hreflang codes (zh-Hans vs zh-Hant)', () => {
    expect(localeConfig['zh'].hreflang).toBe('zh-Hans');
    expect(localeConfig['zh-tw'].hreflang).toBe('zh-Hant');
    expect(localeConfig['zh'].hreflang).not.toBe(localeConfig['zh-tw'].hreflang);
  });
});

// ---------------------------------------------------------------------------
// Checkpoint 2: Language Detection Priority Chain
// ---------------------------------------------------------------------------

describe('Checkpoint 2: Language Detection Priority Chain', () => {
  it('Property: COUNTRY_LOCALE_MAP entries always return valid locales', () => {
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

  it('Property: Geo-IP with no cookie, mapped country returns correct locale', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(COUNTRY_LOCALE_MAP)),
        (countryCode) => {
          const expected = COUNTRY_LOCALE_MAP[countryCode];
          const result = getLocaleFromGeoIP(countryCode, null);
          expect(result).toBe(expected);
        }
      ),
      { numRuns: Object.keys(COUNTRY_LOCALE_MAP).length }
    );
  });

  it('should fallback to defaultLocale when no cookie, no geo-ip, no accept-language', () => {
    const result = getLocaleFromGeoIP(null, null);
    expect(result).toBe(defaultLocale);
  });

  it('should fallback to defaultLocale with empty strings', () => {
    const result = getLocaleFromGeoIP('', '');
    expect(result).toBe(defaultLocale);
  });

  it('should use Accept-Language when country code is unknown', () => {
    const result = getLocaleFromGeoIP('XX', 'ja;q=0.9, en;q=0.8');
    expect(result).toBe('ja');
  });

  it('should prefer direct country mapping over Accept-Language', () => {
    // JP maps to ja, but Accept-Language says de
    const result = getLocaleFromGeoIP('JP', 'de;q=1.0');
    expect(result).toBe('ja');
  });

  it('LANG_COOKIE_NAME should be NEXT_LOCALE', () => {
    expect(LANG_COOKIE_NAME).toBe('NEXT_LOCALE');
  });

  it('full 4-level priority chain: cookie > geo-ip > accept-language > default', () => {
    // Level 4: No info -> default
    expect(getLocaleFromGeoIP(null, null)).toBe('en');

    // Level 3: Accept-Language only
    expect(getLocaleFromGeoIP(null, 'fr')).toBe('fr');

    // Level 2: Geo-IP overrides Accept-Language
    expect(getLocaleFromGeoIP('JP', 'fr')).toBe('ja');

    // Level 1 (Cookie): tested via language-preference module
    // Cookie takes priority at middleware level (not in getLocaleFromGeoIP)
  });
});

// ---------------------------------------------------------------------------
// Checkpoint 3: Bot Bypass & Geo-IP Routing Integration
// ---------------------------------------------------------------------------

describe('Checkpoint 3: Bot Bypass & Geo-IP Routing Integration', () => {
  const knownBots = [
    'Googlebot/2.1 (+http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; Bingbot/2.0)',
    'Baiduspider/2.0',
    'Mozilla/5.0 (compatible; YandexBot/3.0)',
    'DuckDuckBot/1.0',
    'facebookexternalhit/1.1',
    'Twitterbot/1.0',
    'LinkedInBot/1.0',
  ];

  const normalBrowsers = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/17.2',
    'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15',
  ];

  it('Property: known bot UAs are always detected', () => {
    fc.assert(
      fc.property(fc.constantFrom(...knownBots), (ua) => {
        expect(detectBot(ua)).toBe(true);
      }),
      { numRuns: knownBots.length }
    );
  });

  it('Property: normal browser UAs are never detected as bots', () => {
    fc.assert(
      fc.property(fc.constantFrom(...normalBrowsers), (ua) => {
        expect(detectBot(ua)).toBe(false);
      }),
      { numRuns: normalBrowsers.length }
    );
  });

  it('integration: bots should be detected before geo-ip routing applies', () => {
    // Simulate middleware logic: if bot detected, skip redirect
    for (const botUA of knownBots) {
      const isBot = detectBot(botUA);
      expect(isBot).toBe(true);
      // When isBot is true, middleware should NOT call getLocaleFromGeoIP
      // This is verified by the middleware logic, here we validate the contract
    }
  });

  it('Property: paths with existing locale prefix should not trigger redirect', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...locales),
        fc.constantFrom(...locales),
        (pathLocale, detectedLocale) => {
          const pathname = `/${pathLocale}/some-page`;
          expect(shouldRedirect(pathname, detectedLocale)).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property: getLocaleFromPath correctly extracts locale from any locale prefix', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...locales),
        fc.constantFrom('', '/page', '/blog/post', '/about'),
        (locale, suffix) => {
          const pathname = `/${locale}${suffix}`;
          expect(getLocaleFromPath(pathname)).toBe(locale);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('getLocaleFromPath returns null for root path', () => {
    expect(getLocaleFromPath('/')).toBeNull();
  });

  it('getLocaleFromPath returns null for unknown prefix', () => {
    expect(getLocaleFromPath('/unknown/page')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Checkpoint 4: SEO Structured Data Completeness
// ---------------------------------------------------------------------------

describe('Checkpoint 4: SEO Structured Data Completeness', () => {
  const baseUrl = 'https://betterbagsmyanmar.com';

  it('Property: any locale generates exactly 11 hreflang tags (10 locales + x-default)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...locales),
        fc.constantFrom('', '/blog', '/blog/test-slug'),
        (locale: Locale, pagePath: string) => {
          const tags = generateHreflangTags(locale, pagePath, baseUrl);
          expect(tags).toHaveLength(11);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('x-default always points to English version', () => {
    for (const locale of locales) {
      const tags = generateHreflangTags(locale, '', baseUrl);
      const xDefault = tags.find((t) => t.hreflang === 'x-default');
      expect(xDefault).toBeDefined();
      expect(xDefault!.href).toContain('/en');
    }
  });

  it('Property: hreflang tags contain all locale hreflang codes plus x-default', () => {
    fc.assert(
      fc.property(fc.constantFrom(...locales), (locale: Locale) => {
        const tags = generateHreflangTags(locale, '', baseUrl);
        const hreflangs = tags.map((t) => t.hreflang);

        // All locale hreflangs present
        for (const l of locales) {
          expect(hreflangs).toContain(localeConfig[l].hreflang);
        }
        // x-default present
        expect(hreflangs).toContain('x-default');
      }),
      { numRuns: locales.length }
    );
  });

  it('FACTORY_INFO contains Google required fields for ManufacturingBusiness', () => {
    // Required: name, url, address
    expect(FACTORY_INFO.name).toBeTruthy();
    expect(FACTORY_INFO.url).toBeTruthy();
    expect(FACTORY_INFO.address).toBeDefined();
    expect(FACTORY_INFO.address.streetAddress).toBeTruthy();
    expect(FACTORY_INFO.address.addressLocality).toBeTruthy();
    expect(FACTORY_INFO.address.addressCountry).toBeTruthy();

    // Recommended: geo, telephone, email
    expect(FACTORY_INFO.geo).toBeDefined();
    expect(FACTORY_INFO.geo.latitude).toBeTypeOf('number');
    expect(FACTORY_INFO.geo.longitude).toBeTypeOf('number');
    expect(FACTORY_INFO.telephone).toBeTruthy();
    expect(FACTORY_INFO.email).toBeTruthy();

    // Additional: logo, foundingDate, credentials
    expect(FACTORY_INFO.logo).toBeTruthy();
    expect(FACTORY_INFO.foundingDate).toBeTruthy();
    expect(FACTORY_INFO.credentials).toBeInstanceOf(Array);
    expect(FACTORY_INFO.credentials.length).toBeGreaterThan(0);
  });

  it('FACTORY_INFO URL uses https scheme', () => {
    expect(FACTORY_INFO.url).toMatch(/^https:\/\//);
  });

  it('FACTORY_INFO address country is Myanmar (MM)', () => {
    expect(FACTORY_INFO.address.addressCountry).toBe('MM');
  });
});

// ---------------------------------------------------------------------------
// Checkpoint 5: System-Level Invariants
// ---------------------------------------------------------------------------

describe('Checkpoint 5: System-Level Invariants', () => {
  it('defaultLocale is en', () => {
    expect(defaultLocale).toBe('en');
  });

  it('locales has exactly 10 entries', () => {
    expect(locales).toHaveLength(10);
  });

  it('Property: isValidLocale returns true iff value is in locales', () => {
    fc.assert(
      fc.property(fc.constantFrom(...locales), (locale) => {
        expect(isValidLocale(locale)).toBe(true);
      }),
      { numRuns: locales.length }
    );
  });

  it('Property: isValidLocale returns false for arbitrary non-locale strings', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }).filter(
          (s) => !(locales as readonly string[]).includes(s)
        ),
        (value) => {
          expect(isValidLocale(value)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: detectBot is a deterministic pure function', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 200 }), (ua) => {
        const result1 = detectBot(ua);
        const result2 = detectBot(ua);
        expect(result1).toBe(result2);
        expect(typeof result1).toBe('boolean');
      }),
      { numRuns: 100 }
    );
  });

  it('defaultLocale is included in locales array', () => {
    expect(locales).toContain(defaultLocale);
  });

  it('all locales are lowercase or hyphenated lowercase', () => {
    for (const locale of locales) {
      expect(locale).toMatch(/^[a-z]+(-[a-z]+)?$/);
    }
  });
});

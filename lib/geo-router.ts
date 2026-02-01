/**
 * Geo-IP Router
 *
 * Core routing logic for IP-based language detection
 * Maps country codes to supported locales with fallback chain
 */
import { locales, defaultLocale, type Locale } from '../i18n';

/**
 * Direct country to locale mapping
 * Based on primary language of each country
 */
export const COUNTRY_LOCALE_MAP: Record<string, Locale> = {
  // Japanese
  JP: 'ja',

  // German-speaking countries
  DE: 'de',
  AT: 'de',
  CH: 'de',

  // Dutch
  NL: 'nl',

  // French
  FR: 'fr',

  // Portuguese-speaking countries
  PT: 'pt',
  BR: 'pt',

  // Spanish-speaking countries
  ES: 'es',
  MX: 'es',
  AR: 'es',
  CO: 'es',
  CL: 'es',
  PE: 'es',
  VE: 'es',

  // Traditional Chinese regions
  TW: 'zh-tw',
  HK: 'zh-tw',
  MO: 'zh-tw',

  // Russian-speaking countries
  RU: 'ru',
  BY: 'ru',
  KZ: 'ru',
  UA: 'ru',

  // Simplified Chinese
  CN: 'zh',
};

/**
 * Ambiguous countries that require Accept-Language for disambiguation
 * Key: country code, Value: array of possible locales
 */
export const AMBIGUOUS_COUNTRIES: Record<string, Locale[]> = {
  // Belgium: Dutch in Flanders, French in Wallonia
  BE: ['nl', 'fr'],
};

/**
 * Get locale from country code (direct mapping only)
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Locale if mapped, null otherwise
 */
export function getLocaleFromCountry(countryCode: string): Locale | null {
  // Validate input
  if (!countryCode || countryCode.length !== 2) {
    return null;
  }

  // Check for whitespace
  if (countryCode.trim() !== countryCode) {
    return null;
  }

  const normalized = countryCode.toUpperCase();
  return COUNTRY_LOCALE_MAP[normalized] ?? null;
}

/**
 * Check if a country is ambiguous (needs Accept-Language disambiguation)
 * @param countryCode - ISO 3166-1 alpha-2 country code
 */
export function isAmbiguousCountry(countryCode: string): boolean {
  if (!countryCode || countryCode.length !== 2) {
    return false;
  }
  const normalized = countryCode.toUpperCase();
  return normalized in AMBIGUOUS_COUNTRIES;
}

/**
 * Get possible locales for an ambiguous country
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Array of possible locales, empty if not ambiguous
 */
export function getAmbiguousCountryLocales(countryCode: string): Locale[] {
  if (!countryCode || countryCode.length !== 2) {
    return [];
  }
  const normalized = countryCode.toUpperCase();
  return AMBIGUOUS_COUNTRIES[normalized] ?? [];
}

/**
 * Parsed Accept-Language entry
 */
interface AcceptLanguageEntry {
  code: string;
  quality: number;
}

/**
 * Parse Accept-Language header into sorted array of language preferences
 * @param header - Accept-Language header value
 * @returns Array of {code, quality} sorted by quality descending
 */
export function parseAcceptLanguage(header: string): AcceptLanguageEntry[] {
  if (!header || !header.trim()) {
    return [];
  }

  const entries: AcceptLanguageEntry[] = [];

  const parts = header.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const [langPart, qualityPart] = trimmed.split(';');
    const code = langPart.trim();
    if (!code) continue;

    let quality = 1;
    if (qualityPart) {
      const match = qualityPart.trim().match(/^q=([0-9.]+)$/);
      if (match) {
        const parsed = parseFloat(match[1]);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          quality = parsed;
        } else {
          // Invalid quality value - set to 0 (lowest priority)
          quality = 0;
        }
      }
    }

    entries.push({ code, quality });
  }

  // Sort by quality descending
  entries.sort((a, b) => b.quality - a.quality);

  return entries;
}

/**
 * Language code to locale mapping for Accept-Language matching
 */
const LANGUAGE_LOCALE_MAP: Record<string, Locale> = {
  // Base languages
  en: 'en',
  zh: 'zh',
  ja: 'ja',
  de: 'de',
  nl: 'nl',
  fr: 'fr',
  pt: 'pt',
  es: 'es',
  ru: 'ru',

  // Traditional Chinese variants
  'zh-tw': 'zh-tw',
  'zh-hant': 'zh-tw',
  'zh-hk': 'zh-tw',
  'zh-mo': 'zh-tw',

  // Simplified Chinese variants
  'zh-cn': 'zh',
  'zh-hans': 'zh',
  'zh-sg': 'zh',
};

/**
 * Match a language code to a supported locale
 * @param langCode - Language code from Accept-Language (e.g., 'en', 'en-US', 'zh-TW')
 * @returns Matched locale or null
 */
export function matchLanguageToLocale(langCode: string): Locale | null {
  if (!langCode) return null;

  const normalized = langCode.toLowerCase();

  // Try exact match first
  if (LANGUAGE_LOCALE_MAP[normalized]) {
    return LANGUAGE_LOCALE_MAP[normalized];
  }

  // Try base language (e.g., 'en-US' -> 'en')
  const baseLang = normalized.split('-')[0];
  if (LANGUAGE_LOCALE_MAP[baseLang]) {
    return LANGUAGE_LOCALE_MAP[baseLang];
  }

  return null;
}

/**
 * Get locale from Accept-Language header
 * @param header - Accept-Language header value
 * @returns First matching locale or null
 */
export function getLocaleFromAcceptLanguage(header: string): Locale | null {
  const entries = parseAcceptLanguage(header);

  for (const entry of entries) {
    const locale = matchLanguageToLocale(entry.code);
    if (locale) {
      return locale;
    }
  }

  return null;
}

/**
 * Resolve locale for an ambiguous country using Accept-Language
 * @param countryCode - Ambiguous country code
 * @param acceptLanguage - Accept-Language header value
 * @returns Resolved locale
 */
export function resolveAmbiguousCountry(
  countryCode: string,
  acceptLanguage: string
): Locale {
  const possibleLocales = getAmbiguousCountryLocales(countryCode);
  if (possibleLocales.length === 0) {
    return defaultLocale;
  }

  // Parse Accept-Language and find first match in possible locales
  const entries = parseAcceptLanguage(acceptLanguage);
  for (const entry of entries) {
    const matchedLocale = matchLanguageToLocale(entry.code);
    if (matchedLocale && possibleLocales.includes(matchedLocale)) {
      return matchedLocale;
    }
  }

  // Default to first possible locale
  return possibleLocales[0];
}

/**
 * Main Geo-IP routing function
 * Determines locale based on country code and Accept-Language
 *
 * Priority:
 * 1. Direct country mapping (if country code is provided and mapped)
 * 2. Ambiguous country resolution (if country needs disambiguation)
 * 3. Accept-Language fallback
 * 4. Default locale (en)
 *
 * @param countryCode - Country code from Geo-IP (e.g., x-vercel-ip-country header)
 * @param acceptLanguage - Accept-Language header value
 * @returns Resolved locale
 */
export function getLocaleFromGeoIP(
  countryCode: string | null,
  acceptLanguage: string | null
): Locale {
  // Normalize country code
  const normalizedCountry = countryCode?.trim().toUpperCase() || null;

  // Try direct country mapping
  if (normalizedCountry) {
    // Check if ambiguous country
    if (isAmbiguousCountry(normalizedCountry)) {
      return resolveAmbiguousCountry(normalizedCountry, acceptLanguage || '');
    }

    // Try direct mapping
    const directLocale = getLocaleFromCountry(normalizedCountry);
    if (directLocale) {
      return directLocale;
    }
  }

  // Fall back to Accept-Language
  if (acceptLanguage) {
    const langLocale = getLocaleFromAcceptLanguage(acceptLanguage);
    if (langLocale) {
      return langLocale;
    }
  }

  // Ultimate fallback
  return defaultLocale;
}

// ============================================================
// Redirect utilities (for middleware integration)
// ============================================================

/**
 * Extract locale from URL path
 * @param pathname - URL pathname (e.g., '/ja/about', '/en', '/')
 * @returns Locale if found in path, null otherwise
 */
export function getLocaleFromPath(pathname: string): Locale | null {
  if (!pathname) return null;

  // Remove leading slash and get first segment
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const firstSegment = segments[0].toLowerCase();

  // Check if it's a valid locale
  if (locales.includes(firstSegment as Locale)) {
    return firstSegment as Locale;
  }

  return null;
}

/**
 * Check if a redirect is needed
 * @param pathname - Current URL pathname
 * @param detectedLocale - Locale detected from Geo-IP or Accept-Language
 * @returns true if redirect is needed
 */
export function shouldRedirect(
  pathname: string,
  detectedLocale: Locale
): boolean {
  const pathLocale = getLocaleFromPath(pathname);

  // If path already has a valid locale, don't redirect
  if (pathLocale !== null) {
    return false;
  }

  // Path doesn't have a locale, redirect is needed
  return true;
}

/**
 * Build redirect URL with locale prefix
 * @param originalUrl - Original URL (full URL string)
 * @param locale - Target locale
 * @returns New URL with locale prefix
 */
export function buildRedirectUrl(originalUrl: string, locale: Locale): string {
  const url = new URL(originalUrl);

  // Get pathname without trailing slash for consistent handling
  let pathname = url.pathname;

  // Handle root path
  if (pathname === '/' || pathname === '') {
    pathname = '';
  }

  // Build new URL with locale prefix
  url.pathname = `/${locale}${pathname}`;

  return url.toString();
}

/**
 * Create a redirect response with 302 status
 * @param originalUrl - Original URL (full URL string)
 * @param locale - Target locale
 * @returns Response object with 302 redirect
 */
export function createGeoRedirectResponse(
  originalUrl: string,
  locale: Locale
): Response {
  const redirectUrl = buildRedirectUrl(originalUrl, locale);

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectUrl,
    },
  });
}

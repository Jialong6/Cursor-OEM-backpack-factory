import { getRequestConfig } from 'next-intl/server';

/**
 * Locale configuration item interface
 * Contains metadata for each supported language
 */
export interface LocaleConfigItem {
  /** English name of the language */
  name: string;
  /** Native name of the language */
  nativeName: string;
  /** Emoji flag for UI display */
  flag: string;
  /** ISO hreflang code for SEO (ISO 639-1 or ISO 639-1 + script) */
  hreflang: string;
}

/**
 * Supported locales list (v2: 10 languages)
 */
export const locales = [
  'en',
  'zh',
  'ja',
  'de',
  'nl',
  'fr',
  'pt',
  'es',
  'zh-tw',
  'ru',
] as const;

/**
 * Default locale
 */
export const defaultLocale = 'en' as const;

/**
 * Locale type definition
 */
export type Locale = (typeof locales)[number];

/**
 * Complete locale configuration with metadata for all supported languages
 */
export const localeConfig: Record<Locale, LocaleConfigItem> = {
  en: {
    name: 'English',
    nativeName: 'English',
    flag: '\u{1F1FA}\u{1F1F8}',
    hreflang: 'en',
  },
  zh: {
    name: 'Chinese (Simplified)',
    nativeName: '\u4E2D\u6587\u7B80\u4F53',
    flag: '\u{1F1E8}\u{1F1F3}',
    hreflang: 'zh-Hans',
  },
  ja: {
    name: 'Japanese',
    nativeName: '\u65E5\u672C\u8A9E',
    flag: '\u{1F1EF}\u{1F1F5}',
    hreflang: 'ja',
  },
  de: {
    name: 'German',
    nativeName: 'Deutsch',
    flag: '\u{1F1E9}\u{1F1EA}',
    hreflang: 'de',
  },
  nl: {
    name: 'Dutch',
    nativeName: 'Nederlands',
    flag: '\u{1F1F3}\u{1F1F1}',
    hreflang: 'nl',
  },
  fr: {
    name: 'French',
    nativeName: 'Fran\u00E7ais',
    flag: '\u{1F1EB}\u{1F1F7}',
    hreflang: 'fr',
  },
  pt: {
    name: 'Portuguese',
    nativeName: 'Portugu\u00EAs',
    flag: '\u{1F1F5}\u{1F1F9}',
    hreflang: 'pt',
  },
  es: {
    name: 'Spanish',
    nativeName: 'Espa\u00F1ol',
    flag: '\u{1F1EA}\u{1F1F8}',
    hreflang: 'es',
  },
  'zh-tw': {
    name: 'Chinese (Traditional)',
    nativeName: '\u4E2D\u6587\u7E41\u9AD4',
    flag: '\u{1F1F9}\u{1F1FC}',
    hreflang: 'zh-Hant',
  },
  ru: {
    name: 'Russian',
    nativeName: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439',
    flag: '\u{1F1F7}\u{1F1FA}',
    hreflang: 'ru',
  },
};

/**
 * Type guard to check if a value is a valid locale
 * @param value - The value to check
 * @returns true if value is a valid Locale
 */
export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

/**
 * Get locale configuration for a given locale string
 * @param locale - The locale string to look up
 * @returns LocaleConfigItem if valid locale, undefined otherwise
 */
export function getLocaleConfig(locale: string): LocaleConfigItem | undefined {
  if (isValidLocale(locale)) {
    return localeConfig[locale];
  }
  return undefined;
}

/**
 * next-intl configuration
 * Loads translation files based on request locale
 */
export default getRequestConfig(async ({ requestLocale }) => {
  // Get requested locale (corresponds to [locale] route segment)
  let locale = await requestLocale;

  // Use default locale if invalid
  if (!locale || !isValidLocale(locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./locales/${locale}.json`)).default,
  };
});

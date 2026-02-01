/**
 * Hreflang SEO Tags Component
 *
 * Generates hreflang link tags for multilingual SEO optimization.
 * Supports 10 languages + x-default for search engine localization.
 *
 * Requirements:
 * - Generate hreflang tags for all 10 supported locales
 * - Include x-default pointing to English version
 * - Use correct ISO hreflang codes (zh -> zh-Hans, zh-tw -> zh-Hant)
 * - Generate absolute URLs
 */

import { locales, localeConfig, type Locale } from '@/i18n';

/**
 * Base URL for generating absolute URLs
 */
const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || 'https://betterbagsmyanmar.com';

/**
 * Hreflang tag data structure
 */
export interface HreflangTag {
  /** ISO hreflang code (e.g., 'en', 'zh-Hans', 'x-default') */
  hreflang: string;
  /** Absolute URL for this language version */
  href: string;
}

/**
 * Generates hreflang tags for a given page
 *
 * @param currentLocale - The current page locale
 * @param path - The page path without locale prefix (e.g., '', '/blog', '/blog/slug')
 * @param baseUrl - Base URL for generating absolute URLs (defaults to env or fallback)
 * @returns Array of HreflangTag objects
 *
 * @example
 * // Homepage
 * generateHreflangTags('en', '')
 * // Returns 11 tags: 10 languages + x-default
 *
 * @example
 * // Blog page
 * generateHreflangTags('zh', '/blog')
 * // Returns tags with /blog appended to each URL
 */
export function generateHreflangTags(
  currentLocale: Locale,
  path: string,
  baseUrl: string = DEFAULT_BASE_URL
): HreflangTag[] {
  const tags: HreflangTag[] = [];

  // Generate tags for each supported locale
  for (const locale of locales) {
    const config = localeConfig[locale];
    tags.push({
      hreflang: config.hreflang,
      href: `${baseUrl}/${locale}${path}`,
    });
  }

  // Add x-default pointing to English version
  tags.push({
    hreflang: 'x-default',
    href: `${baseUrl}/en${path}`,
  });

  return tags;
}

/**
 * Props for HreflangTags component
 */
export interface HreflangTagsProps {
  /** Current page locale */
  locale: Locale;
  /** Page path without locale prefix */
  path?: string;
}

/**
 * HreflangTags Component
 *
 * Renders hreflang link tags in the document head for SEO.
 * Should be used in layout.tsx or page.tsx files.
 *
 * @example
 * // In app/[locale]/layout.tsx
 * <HreflangTags locale={locale} path="" />
 *
 * @example
 * // In app/[locale]/blog/page.tsx
 * <HreflangTags locale={locale} path="/blog" />
 */
export default function HreflangTags({
  locale,
  path = '',
}: HreflangTagsProps): React.ReactElement {
  const tags = generateHreflangTags(locale, path);

  return (
    <>
      {tags.map((tag) => (
        <link
          key={tag.hreflang}
          rel="alternate"
          hrefLang={tag.hreflang}
          href={tag.href}
        />
      ))}
    </>
  );
}

/**
 * Generates hreflang metadata for Next.js Metadata API
 *
 * This function returns an object compatible with Next.js alternates.languages
 * for use in generateMetadata functions.
 *
 * @param path - The page path without locale prefix
 * @param baseUrl - Base URL for generating absolute URLs
 * @returns Object with language codes as keys and URLs as values
 *
 * @example
 * // In generateMetadata function
 * export async function generateMetadata({ params }) {
 *   return {
 *     alternates: {
 *       languages: generateHreflangMetadata('/blog'),
 *     },
 *   };
 * }
 */
export function generateHreflangMetadata(
  path: string = '',
  baseUrl: string = DEFAULT_BASE_URL
): Record<string, string> {
  const languages: Record<string, string> = {};

  for (const locale of locales) {
    const config = localeConfig[locale];
    languages[config.hreflang] = `${baseUrl}/${locale}${path}`;
  }

  // Add x-default
  languages['x-default'] = `${baseUrl}/en${path}`;

  return languages;
}

/**
 * Dynamic sitemap.xml generation
 *
 * Features:
 * - Lists all public pages (homepage, glossary, blog list, blog posts)
 * - Supports all locales in i18n.ts with hreflang alternates
 * - hreflang codes use the canonical BCP 47 form from localeConfig
 *   (zh -> zh-Hans, zh-tw -> zh-Hant), plus x-default -> /en
 * - Includes last modified dates, priority, and change frequency
 */

import { MetadataRoute } from 'next';
import { getAllBlogPosts, type BlogPost } from '@/lib/blog-data';
import { BASE_URL } from '@/lib/metadata';
import { locales, localeConfig, defaultLocale } from '@/i18n';
import {
  HOME_DATE_MODIFIED,
  GLOSSARY_DATE_MODIFIED,
  FACT_SHEET_DATE_MODIFIED,
  VIRTUAL_TOUR_DATE_MODIFIED,
} from '@/lib/content-dates';

/**
 * Generate language alternates for a given path across all locales
 */
function generateAlternates(path: string): Record<string, string> {
  const alternates: Record<string, string> = {};
  for (const locale of locales) {
    alternates[localeConfig[locale].hreflang] = `${BASE_URL}/${locale}${path}`;
  }
  alternates['x-default'] = `${BASE_URL}/${defaultLocale}${path}`;
  return alternates;
}

/**
 * Generate sitemap entries for a path across all locales
 */
function generateLocalizedEntries(
  path: string,
  lastModified: Date,
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never',
  priority: number
): MetadataRoute.Sitemap {
  const alternates = generateAlternates(path);

  return locales.map((locale) => ({
    url: `${BASE_URL}/${locale}${path}`,
    lastModified,
    changeFrequency,
    priority,
    alternates: {
      languages: alternates,
    },
  }));
}

/**
 * Real last-modified date of a blog post (falls back to publish date)
 */
function postLastModified(post: BlogPost): Date {
  return new Date(post.dateModified ?? post.date);
}

export default function sitemap(): MetadataRoute.Sitemap {
  // lastmod uses real content dates from lib/content-dates instead of
  // new Date(): a build-time timestamp would mark every page as "changed"
  // on each deployment and erode crawl trust.

  // Homepage (all locales)
  const homepages = generateLocalizedEntries('', new Date(HOME_DATE_MODIFIED), 'daily', 1.0);

  // Glossary page (all locales)
  const glossaryPages = generateLocalizedEntries('/glossary', new Date(GLOSSARY_DATE_MODIFIED), 'weekly', 0.8);

  // Fact Sheet page (GEO / AI-search optimized, all locales)
  const factSheetPages = generateLocalizedEntries('/fact-sheet', new Date(FACT_SHEET_DATE_MODIFIED), 'monthly', 0.8);

  // Virtual Factory Tour booking page (all locales)
  const virtualTourPages = generateLocalizedEntries('/virtual-factory-tour', new Date(VIRTUAL_TOUR_DATE_MODIFIED), 'monthly', 0.8);

  // Blog list page (all locales): newest modification date across posts
  const posts = getAllBlogPosts();
  const blogListDate = posts.length
    ? new Date(Math.max(...posts.map((post) => postLastModified(post).getTime())))
    : new Date(HOME_DATE_MODIFIED);
  const blogPages = generateLocalizedEntries('/blog', blogListDate, 'daily', 0.9);

  // Blog post pages (all locales per post)
  const blogPosts: MetadataRoute.Sitemap = posts.flatMap((post) =>
    generateLocalizedEntries(`/blog/${post.slug}`, postLastModified(post), 'weekly', 0.8)
  );

  return [...homepages, ...glossaryPages, ...factSheetPages, ...virtualTourPages, ...blogPages, ...blogPosts];
}

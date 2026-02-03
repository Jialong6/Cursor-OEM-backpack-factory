/**
 * Dynamic sitemap.xml generation
 *
 * Features:
 * - Lists all public pages (homepage, glossary, blog list, blog posts)
 * - Supports all 10 languages with hreflang alternates
 * - Includes last modified dates, priority, and change frequency
 */

import { MetadataRoute } from 'next';
import { getAllBlogPosts } from '@/lib/blog-data';
import { BASE_URL } from '@/lib/metadata';
import { locales } from '@/i18n';

/**
 * Generate language alternates for a given path across all locales
 */
function generateAlternates(path: string): Record<string, string> {
  const alternates: Record<string, string> = {};
  for (const locale of locales) {
    alternates[locale] = `${BASE_URL}/${locale}${path}`;
  }
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

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date();

  // Homepage (all 10 languages)
  const homepages = generateLocalizedEntries('', currentDate, 'daily', 1.0);

  // Glossary page (all 10 languages)
  const glossaryPages = generateLocalizedEntries('/glossary', currentDate, 'weekly', 0.8);

  // Blog list page (all 10 languages)
  const blogPages = generateLocalizedEntries('/blog', currentDate, 'daily', 0.9);

  // Blog post pages (all 10 languages per post)
  const posts = getAllBlogPosts();
  const blogPosts: MetadataRoute.Sitemap = posts.flatMap((post) => {
    const postDate = new Date(post.date);
    return generateLocalizedEntries(`/blog/${post.slug}`, postDate, 'weekly', 0.8);
  });

  return [...homepages, ...glossaryPages, ...blogPages, ...blogPosts];
}

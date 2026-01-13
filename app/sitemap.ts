/**
 * 动态生成 sitemap.xml
 *
 * 功能：
 * - 列出所有公开页面（首页、博客列表、博客文章）
 * - 支持多语言（中英文）
 * - 包含最后修改日期
 * - 设置优先级和更新频率
 *
 * 验证需求：14.6, 14.7
 */

import { MetadataRoute } from 'next';
import { getAllBlogPosts } from '@/lib/blog-data';
import { BASE_URL } from '@/lib/metadata';

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date();

  // 首页（中英文）
  const homepages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/en`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: {
        languages: {
          en: `${BASE_URL}/en`,
          zh: `${BASE_URL}/zh`,
        },
      },
    },
    {
      url: `${BASE_URL}/zh`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: {
        languages: {
          en: `${BASE_URL}/en`,
          zh: `${BASE_URL}/zh`,
        },
      },
    },
  ];

  // 博客列表页（中英文）
  const blogPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/en/blog`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: {
        languages: {
          en: `${BASE_URL}/en/blog`,
          zh: `${BASE_URL}/zh/blog`,
        },
      },
    },
    {
      url: `${BASE_URL}/zh/blog`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: {
        languages: {
          en: `${BASE_URL}/en/blog`,
          zh: `${BASE_URL}/zh/blog`,
        },
      },
    },
  ];

  // 博客文章页（中英文）
  const posts = getAllBlogPosts();
  const blogPosts: MetadataRoute.Sitemap = posts.flatMap((post) => {
    // 将日期字符串转换为 Date 对象
    const postDate = new Date(post.date);

    return [
      {
        url: `${BASE_URL}/en/blog/${post.slug}`,
        lastModified: postDate,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
        alternates: {
          languages: {
            en: `${BASE_URL}/en/blog/${post.slug}`,
            zh: `${BASE_URL}/zh/blog/${post.slug}`,
          },
        },
      },
      {
        url: `${BASE_URL}/zh/blog/${post.slug}`,
        lastModified: postDate,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
        alternates: {
          languages: {
            en: `${BASE_URL}/en/blog/${post.slug}`,
            zh: `${BASE_URL}/zh/blog/${post.slug}`,
          },
        },
      },
    ];
  });

  return [...homepages, ...blogPages, ...blogPosts];
}

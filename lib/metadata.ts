/**
 * SEO 元数据配置
 *
 * 功能：
 * - 为每个页面配置唯一的标题和描述
 * - 配置 Open Graph 元标签
 * - 配置 hreflang 标签
 * - 支持中英文内容
 *
 * 验证需求：14.1, 14.2, 14.3, 14.8
 */

import type { Metadata } from 'next';

/**
 * 网站基础 URL
 * 生产环境应该从环境变量读取
 */
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://betterbagsmyanmar.com';

/**
 * 默认 OG 图片
 */
export const DEFAULT_OG_IMAGE = '/images/og-image.jpg';

/**
 * 页面元数据配置
 */
interface PageMetadata {
  title: string;
  description: string;
}

/**
 * 首页元数据
 */
export const homeMetadata = {
  en: {
    title: 'Better Bags Myanmar - Premium OEM Backpack Factory',
    description: 'Top-tier custom backpack manufacturer in Myanmar. 20+ years experience, 800+ employees, serving global brands with sustainable production.',
  },
  zh: {
    title: 'Better Bags 缅甸 - 高端背包OEM工厂',
    description: '缅甸顶级定制背包制造商。20+年经验，800+专业员工，为全球品牌提供可持续生产服务。',
  },
} as const;

/**
 * 博客列表页元数据
 */
export const blogListMetadata = {
  en: {
    title: 'Blog - Better Bags Myanmar | Industry Insights',
    description: 'Explore backpack manufacturing insights, industry trends, and sustainability practices from Better Bags Myanmar.',
  },
  zh: {
    title: '博客 - Better Bags 缅甸 | 行业洞察',
    description: '探索来自 Better Bags 缅甸的背包制造洞察、行业趋势和可持续发展实践。',
  },
} as const;

/**
 * 生成首页元数据
 *
 * @param locale 当前语言
 * @returns Metadata 对象
 */
export function generateHomeMetadata(locale: 'en' | 'zh'): Metadata {
  const meta = homeMetadata[locale];
  const alternateLocale = locale === 'en' ? 'zh' : 'en';

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `${BASE_URL}/${locale}`,
      siteName: 'Better Bags Myanmar',
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: meta.title,
        },
      ],
      locale: locale === 'en' ? 'en_US' : 'zh_CN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: [DEFAULT_OG_IMAGE],
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        'en': `${BASE_URL}/en`,
        'zh': `${BASE_URL}/zh`,
        'x-default': `${BASE_URL}/en`,
      },
    },
  };
}

/**
 * 生成博客列表页元数据
 *
 * @param locale 当前语言
 * @returns Metadata 对象
 */
export function generateBlogListMetadata(locale: 'en' | 'zh'): Metadata {
  const meta = blogListMetadata[locale];

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `${BASE_URL}/${locale}/blog`,
      siteName: 'Better Bags Myanmar',
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: meta.title,
        },
      ],
      locale: locale === 'en' ? 'en_US' : 'zh_CN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: [DEFAULT_OG_IMAGE],
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}/blog`,
      languages: {
        'en': `${BASE_URL}/en/blog`,
        'zh': `${BASE_URL}/zh/blog`,
        'x-default': `${BASE_URL}/en/blog`,
      },
    },
  };
}

/**
 * 生成博客详情页元数据
 *
 * @param locale 当前语言
 * @param slug 文章 slug
 * @param title 文章标题
 * @param description 文章摘要
 * @param image 文章图片 URL（可选）
 * @param publishedTime 发布时间（可选）
 * @returns Metadata 对象
 */
export function generateBlogDetailMetadata(
  locale: 'en' | 'zh',
  slug: string,
  title: string,
  description: string,
  image?: string,
  publishedTime?: string
): Metadata {
  const ogImage = image || DEFAULT_OG_IMAGE;
  const suffix = ' | Better Bags Myanmar';
  const ellipsisSuffix = '... | Better Bags';

  // 确保标题不超过 60 字符（需求 14.1）
  // 如果 "标题 | Better Bags Myanmar" 超过 60 字符，则截断标题并使用 "... | Better Bags"
  let trimmedTitle: string;
  const fullTitle = `${title}${suffix}`;

  if (fullTitle.length > 60) {
    // 计算可用于标题的最大字符数：60 - ellipsisSuffix.length
    const maxTitleLength = 60 - ellipsisSuffix.length;
    trimmedTitle = `${title.substring(0, maxTitleLength)}${ellipsisSuffix}`;
  } else {
    trimmedTitle = fullTitle;
  }

  // 确保描述不超过 150 字符（需求 14.2）
  const trimmedDescription = description.length > 150 ? `${description.substring(0, 147)}...` : description;

  return {
    title: trimmedTitle,
    description: trimmedDescription,
    openGraph: {
      title: trimmedTitle,
      description: trimmedDescription,
      url: `${BASE_URL}/${locale}/blog/${slug}`,
      siteName: 'Better Bags Myanmar',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: locale === 'en' ? 'en_US' : 'zh_CN',
      type: 'article',
      ...(publishedTime && {
        publishedTime,
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: trimmedTitle,
      description: trimmedDescription,
      images: [ogImage],
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}/blog/${slug}`,
      languages: {
        'en': `${BASE_URL}/en/blog/${slug}`,
        'zh': `${BASE_URL}/zh/blog/${slug}`,
        'x-default': `${BASE_URL}/en/blog/${slug}`,
      },
    },
  };
}

/**
 * 生成通用元数据
 * 用于其他页面的元数据配置
 *
 * @param locale 当前语言
 * @param title 页面标题
 * @param description 页面描述
 * @param path 页面路径（相对于 locale，如 '/about'）
 * @param image OG 图片 URL（可选）
 * @returns Metadata 对象
 */
export function generateGenericMetadata(
  locale: 'en' | 'zh',
  title: string,
  description: string,
  path: string = '',
  image?: string
): Metadata {
  const ogImage = image || DEFAULT_OG_IMAGE;
  const fullPath = path ? `/${locale}${path}` : `/${locale}`;

  // 确保标题不超过 60 字符
  const trimmedTitle = title.length > 60 ? `${title.substring(0, 57)}...` : title;

  // 确保描述不超过 150 字符
  const trimmedDescription = description.length > 150 ? `${description.substring(0, 147)}...` : description;

  return {
    title: trimmedTitle,
    description: trimmedDescription,
    openGraph: {
      title: trimmedTitle,
      description: trimmedDescription,
      url: `${BASE_URL}${fullPath}`,
      siteName: 'Better Bags Myanmar',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: locale === 'en' ? 'en_US' : 'zh_CN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: trimmedTitle,
      description: trimmedDescription,
      images: [ogImage],
    },
    alternates: {
      canonical: `${BASE_URL}${fullPath}`,
      languages: {
        'en': `${BASE_URL}/en${path}`,
        'zh': `${BASE_URL}/zh${path}`,
        'x-default': `${BASE_URL}/en${path}`,
      },
    },
  };
}

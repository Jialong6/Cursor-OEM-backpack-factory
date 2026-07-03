/**
 * 博客文章数据入口
 *
 * 数据本身按文章拆分在 lib/blog-posts/ 下，每篇一个文件。
 * 这里聚合并暴露查询 helper，保持外部 `@/lib/blog-data` 的 import 路径不变。
 */

import { BLOG_POSTS } from './blog-posts';
import type { BlogPost } from './blog-posts/types';
import { FALLBACK_CHAIN } from './blog-utils';
import type { Locale } from '@/i18n';

export { BLOG_POSTS } from './blog-posts';
export type { BlogPost } from './blog-posts/types';

/**
 * 根据 slug 获取博客文章
 */
export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

/**
 * 获取所有博客文章（按日期降序排列）
 */
export function getAllBlogPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * 获取精选博客文章（用于首页展示）
 */
export function getFeaturedBlogPosts(count: number = 3): BlogPost[] {
  return getAllBlogPosts().slice(0, count);
}

/**
 * 按 locale 异步加载文章正文(服务端专用)
 *
 * 正文按语言拆分为独立模块,经动态 import 按需加载;
 * 加载顺序:当前 locale → FALLBACK_CHAIN → en → zh。
 * SSG 构建时每个 locale 页面只打包对应语言一份正文。
 */
export async function getBlogPostContent(
  slug: string,
  locale: string
): Promise<string | undefined> {
  const post = getBlogPostBySlug(slug);
  if (!post) return undefined;

  const chain: Locale[] = [
    locale as Locale,
    ...(FALLBACK_CHAIN[locale as Locale] ?? []),
    'en',
    'zh',
  ];

  for (const lang of chain) {
    const load = post.contentLoaders[lang];
    if (load) {
      return (await load()).default;
    }
  }
  return undefined;
}

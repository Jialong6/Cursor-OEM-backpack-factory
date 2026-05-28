/**
 * 博客文章数据入口
 *
 * 数据本身按文章拆分在 lib/blog-posts/ 下，每篇一个文件。
 * 这里聚合并暴露查询 helper，保持外部 `@/lib/blog-data` 的 import 路径不变。
 */

import { BLOG_POSTS } from './blog-posts';
import type { BlogPost } from './blog-posts/types';

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

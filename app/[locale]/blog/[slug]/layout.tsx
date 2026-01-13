import type { Metadata } from 'next';
import { getBlogPostBySlug, getAllBlogPosts } from '@/lib/blog-data';
import { generateBlogDetailMetadata, BASE_URL } from '@/lib/metadata';

/**
 * 博客详情页 Layout
 *
 * 功能：
 * - 为博客详情页配置动态 SEO 元数据
 * - 根据文章内容生成唯一的标题和描述
 * - 包含 Open Graph 和 hreflang 标签
 * - 支持中英文内容
 *
 * 验证需求：14.1, 14.2, 14.3, 14.8
 */

/**
 * 生成博客详情页元数据
 *
 * 需求 14.1: 唯一标题标签（60字符以内）
 * 需求 14.2: meta描述（150字符以内）
 * 需求 14.3: Open Graph元标签
 * 需求 14.8: hreflang标签
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;

  // 获取文章数据
  const post = getBlogPostBySlug(slug);

  // 如果文章不存在，返回默认元数据
  if (!post) {
    return {
      title: 'Blog Post Not Found | Better Bags Myanmar',
      description: 'The requested blog post could not be found.',
    };
  }

  // 获取当前语言的标题和摘要
  const lang = locale as 'en' | 'zh';
  const title = post.title[lang];
  const description = post.excerpt[lang];

  // 构建图片 URL（如果是相对路径，转换为绝对路径）
  const imageUrl = post.thumbnail.startsWith('http')
    ? post.thumbnail
    : `${BASE_URL}${post.thumbnail}`;

  return generateBlogDetailMetadata(
    lang,
    slug,
    title,
    description,
    imageUrl,
    post.date
  );
}

/**
 * 生成静态路由参数
 * 为所有博客文章生成静态页面
 */
export async function generateStaticParams() {
  const posts = getAllBlogPosts();

  // 为每个文章生成 en 和 zh 两个版本
  return posts.flatMap((post) => [
    { locale: 'en', slug: post.slug },
    { locale: 'zh', slug: post.slug },
  ]);
}

/**
 * 博客详情页布局组件
 */
export default function BlogDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

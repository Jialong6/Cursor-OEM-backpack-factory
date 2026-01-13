import type { Metadata } from 'next';
import { generateBlogListMetadata } from '@/lib/metadata';

/**
 * 博客列表页 Layout
 *
 * 功能：
 * - 为博客列表页配置 SEO 元数据
 * - 支持中英文内容
 * - 包含 Open Graph 和 hreflang 标签
 *
 * 验证需求：14.1, 14.2, 14.3, 14.8
 */

/**
 * 生成博客列表页元数据
 *
 * 需求 14.1: 唯一标题标签（60字符以内）
 * 需求 14.2: meta描述（150字符以内）
 * 需求 14.3: Open Graph元标签
 * 需求 14.8: hreflang标签
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateBlogListMetadata(locale as 'en' | 'zh');
}

/**
 * 博客列表页布局组件
 */
export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { locales, type Locale } from '@/i18n';
import { generateBlogListMetadata } from '@/lib/metadata';

/**
 * 博客列表页 Layout
 *
 * 功能：
 * - 为博客列表页配置 SEO 元数据（文案取自 locales JSON 的 metadata.blogList，全语言覆盖）
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
  const validLocale = (locales.includes(locale as any) ? locale : 'en') as Locale;
  const t = await getTranslations({ locale: validLocale, namespace: 'metadata.blogList' });
  return generateBlogListMetadata(validLocale, {
    title: t('title'),
    description: t('description'),
  });
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

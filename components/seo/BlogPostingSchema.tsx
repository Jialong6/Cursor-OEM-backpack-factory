'use client';

import type { AuthorProfile } from '@/lib/author-data';
import { FACTORY_INFO } from './ManufacturingPlantSchema';

/**
 * BlogPostingSchema 组件属性
 */
interface BlogPostingSchemaProps {
  readonly headline: string;
  readonly description: string;
  readonly image: string;
  readonly datePublished: string;
  readonly author: AuthorProfile;
  readonly locale: string;
}

/**
 * BlogPosting JSON-LD 结构化数据组件
 *
 * 生成符合 Schema.org BlogPosting 规范的 JSON-LD 数据，
 * 用于增强博客文章在搜索引擎中的展示效果（E-E-A-T 信号）。
 *
 * 包含：
 * - 文章标题、描述、图片
 * - 作者信息（Person 类型，含 jobTitle 和 description）
 * - 发布者信息（复用 FACTORY_INFO 中的 Organization 数据）
 * - 语言标记
 *
 * 安全说明：
 * - JSON-LD 内容来自可信来源（组件 props 和 FACTORY_INFO 常量）
 * - 所有值通过 JSON.stringify 安全序列化，无 XSS 风险
 * - 此模式与 ManufacturingPlantSchema.tsx 保持一致
 */
export default function BlogPostingSchema({
  headline,
  description,
  image,
  datePublished,
  author,
  locale,
}: BlogPostingSchemaProps) {
  const imageUrl = image.startsWith('http')
    ? image
    : `${FACTORY_INFO.url}${image}`;

  // 安全：所有数据来自可信来源（FACTORY_INFO 常量和翻译文件），
  // JSON.stringify 确保输出安全，与 ManufacturingPlantSchema 模式一致
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline,
    description,
    image: imageUrl,
    datePublished,
    author: {
      '@type': 'Person',
      name: author.name.en,
      jobTitle: author.role.en,
      description: author.bio.en,
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${FACTORY_INFO.url}/#organization`,
      name: FACTORY_INFO.name,
      logo: {
        '@type': 'ImageObject',
        url: FACTORY_INFO.logo,
      },
    },
    inLanguage: locale,
  };

  // 与 ManufacturingPlantSchema.tsx 相同的安全 JSON-LD 渲染模式
  // 内容来自可信常量，经 JSON.stringify 序列化，不存在注入风险
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd),
      }}
    />
  );
}

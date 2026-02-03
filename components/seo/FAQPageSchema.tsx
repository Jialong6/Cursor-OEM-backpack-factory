/**
 * FAQ 分类结构
 */
export interface FAQSection {
  title: string;
  items: Array<{
    q: string;
    a: string;
  }>;
}

/**
 * FAQPageSchema 组件属性
 */
interface FAQPageSchemaProps {
  /**
   * FAQ section array with titles and Q&A items
   */
  sections: FAQSection[];
  /**
   * Base URL for generating @id and url fields (defaults to env variable)
   */
  baseUrl?: string;
}

/**
 * FAQPage JSON-LD 结构化数据组件
 *
 * 生成符合 Schema.org FAQPage 规范的 JSON-LD 数据，
 * 用于增强 SEO 和 Google 搜索结果的 FAQ Rich Snippets 展示。
 *
 * 功能：
 * - 将多个 FAQ sections 扁平化为 Question 列表
 * - 每个问题包含 Question 和 Answer 结构
 * - 纯函数组件，无副作用
 *
 * 安全说明：
 * - JSON-LD 内容来自可信来源（翻译文件中的 FAQ 数据）
 * - 不接受用户输入，无 XSS 风险
 * - JSON.stringify 会自动转义特殊字符
 *
 * 验证需求：10.5 (FAQPage JSON-LD)
 *
 * @example
 * ```tsx
 * const sections = [
 *   {
 *     title: 'General',
 *     items: [
 *       { q: 'What is your MOQ?', a: 'Our MOQ is 150 pieces.' }
 *     ]
 *   }
 * ];
 *
 * <FAQPageSchema sections={sections} />
 * ```
 */
export default function FAQPageSchema({ sections, baseUrl }: FAQPageSchemaProps) {
  const resolvedBaseUrl = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'https://betterbagsmyanmar.com';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: sections.flatMap((section, sIndex) =>
      section.items.map((item, iIndex) => ({
        '@type': 'Question',
        '@id': `${resolvedBaseUrl}/#faq-${sIndex}-${iIndex}`,
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
          url: `${resolvedBaseUrl}/#faq`,
        },
      }))
    ),
  };

  // 安全：JSON.stringify 将对象序列化为有效的 JSON 字符串
  // 来源是可信的翻译文件数据（locales/zh.json 和 locales/en.json）
  // JSON-LD script 标签是标准的 SEO 实践
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd),
      }}
    />
  );
}

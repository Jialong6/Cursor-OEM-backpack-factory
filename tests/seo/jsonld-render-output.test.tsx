/**
 * JSON-LD 渲染输出验证测试
 *
 * 渲染实际的 SEO 组件并验证生成的 <script type="application/ld+json"> 输出：
 * - JSON 可解析
 * - 结构正确（@context, @type 存在）
 * - 字段值与预期一致
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string) => `translated:${key}`;
    t.raw = () => [];
    return t;
  },
  useLocale: () => 'en',
}));

import FAQPageSchema from '@/components/seo/FAQPageSchema';
import BlogPostingSchema from '@/components/seo/BlogPostingSchema';
import GlossarySchema from '@/components/seo/GlossarySchema';

/**
 * 从渲染结果中提取 JSON-LD script 标签内容
 */
function extractJsonLd(container: HTMLElement): unknown[] {
  const scripts = container.querySelectorAll('script[type="application/ld+json"]');
  return Array.from(scripts).map((script) => {
    const text = script.textContent || script.innerHTML;
    return JSON.parse(text);
  });
}

describe('JSON-LD 渲染输出验证', () => {
  describe('FAQPageSchema 组件', () => {
    it('应渲染 script[type="application/ld+json"] 标签', () => {
      const sections = [
        {
          title: 'General',
          items: [{ q: 'What is MOQ?', a: '150 pieces.' }],
        },
      ];

      const { container } = render(<FAQPageSchema sections={sections} />);
      const scripts = container.querySelectorAll('script[type="application/ld+json"]');

      expect(scripts.length).toBe(1);
    });

    it('渲染的 JSON 应可解析且结构正确', () => {
      const sections = [
        {
          title: 'General',
          items: [
            { q: 'What is your MOQ?', a: '150 pieces minimum.' },
            { q: 'Lead time?', a: '30-45 days.' },
          ],
        },
      ];

      const { container } = render(<FAQPageSchema sections={sections} />);
      const jsonLdArray = extractJsonLd(container);

      expect(jsonLdArray.length).toBe(1);

      const faqSchema = jsonLdArray[0] as Record<string, unknown>;
      expect(faqSchema['@context']).toBe('https://schema.org');
      expect(faqSchema['@type']).toBe('FAQPage');
      expect(Array.isArray(faqSchema.mainEntity)).toBe(true);

      const mainEntity = faqSchema.mainEntity as Array<Record<string, unknown>>;
      expect(mainEntity.length).toBe(2);
      expect(mainEntity[0]['@type']).toBe('Question');
      expect(mainEntity[0].name).toBe('What is your MOQ?');

      const answer = mainEntity[0].acceptedAnswer as Record<string, unknown>;
      expect(answer['@type']).toBe('Answer');
      expect(answer.text).toBe('150 pieces minimum.');
    });

    it('多个 section 的 items 应正确扁平化', () => {
      const sections = [
        { title: 'Section 1', items: [{ q: 'Q1', a: 'A1' }] },
        { title: 'Section 2', items: [{ q: 'Q2', a: 'A2' }, { q: 'Q3', a: 'A3' }] },
      ];

      const { container } = render(<FAQPageSchema sections={sections} />);
      const jsonLdArray = extractJsonLd(container);
      const faqSchema = jsonLdArray[0] as Record<string, unknown>;
      const mainEntity = faqSchema.mainEntity as Array<Record<string, unknown>>;

      expect(mainEntity.length).toBe(3);
    });

    it('空 sections 应渲染空 mainEntity', () => {
      const { container } = render(<FAQPageSchema sections={[]} />);
      const jsonLdArray = extractJsonLd(container);
      const faqSchema = jsonLdArray[0] as Record<string, unknown>;

      expect((faqSchema.mainEntity as unknown[]).length).toBe(0);
    });

    it('baseUrl 应正确嵌入 @id 和 url', () => {
      const customBase = 'https://custom.example.com';
      const sections = [
        { title: 'T', items: [{ q: 'Q', a: 'A' }] },
      ];

      const { container } = render(
        <FAQPageSchema sections={sections} baseUrl={customBase} />
      );
      const jsonLdArray = extractJsonLd(container);
      const faqSchema = jsonLdArray[0] as Record<string, unknown>;
      const mainEntity = faqSchema.mainEntity as Array<Record<string, unknown>>;

      const question = mainEntity[0];
      expect((question['@id'] as string)).toContain(customBase);

      const answer = question.acceptedAnswer as Record<string, unknown>;
      expect((answer.url as string)).toContain(customBase);
    });
  });

  describe('BlogPostingSchema 组件', () => {
    const defaultAuthor = {
      id: 'test-author',
      name: { en: 'Jay Li', zh: 'Jay Li' },
      role: { en: 'CEO', zh: 'CEO' },
      bio: { en: 'Expert in manufacturing', zh: '制造专家' },
      credentials: ['MBA'],
      avatar: '/images/author.jpg',
    };

    it('应渲染 BlogPosting JSON-LD', () => {
      const { container } = render(
        <BlogPostingSchema
          headline="Test Blog Post Title"
          description="Test description"
          image="/images/blog/test.jpg"
          datePublished="2024-06-15"
          author={defaultAuthor}
          locale="en"
        />
      );

      const jsonLdArray = extractJsonLd(container);
      expect(jsonLdArray.length).toBe(1);

      const schema = jsonLdArray[0] as Record<string, unknown>;
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('BlogPosting');
      expect(schema.headline).toBe('Test Blog Post Title');
      expect(schema.datePublished).toBe('2024-06-15');
      expect(schema.inLanguage).toBe('en');
    });

    it('author 应包含 Person 类型信息', () => {
      const { container } = render(
        <BlogPostingSchema
          headline="Test"
          description="Desc"
          image="/img.jpg"
          datePublished="2024-01-01"
          author={defaultAuthor}
          locale="en"
        />
      );

      const jsonLdArray = extractJsonLd(container);
      const schema = jsonLdArray[0] as Record<string, unknown>;
      const author = schema.author as Record<string, unknown>;

      expect(author['@type']).toBe('Person');
      expect(author.name).toBe('Jay Li');
      expect(author.jobTitle).toBe('CEO');
    });

    it('publisher 应包含 Organization 和 logo', () => {
      const { container } = render(
        <BlogPostingSchema
          headline="Test"
          description="Desc"
          image="/img.jpg"
          datePublished="2024-01-01"
          author={defaultAuthor}
          locale="en"
        />
      );

      const jsonLdArray = extractJsonLd(container);
      const schema = jsonLdArray[0] as Record<string, unknown>;
      const publisher = schema.publisher as Record<string, unknown>;

      expect(publisher['@type']).toBe('Organization');
      expect(publisher.name).toBeDefined();

      const logo = publisher.logo as Record<string, unknown>;
      expect(logo['@type']).toBe('ImageObject');
      expect(logo.url).toBeDefined();
    });

    it('相对路径 image 应拼接为完整 URL', () => {
      const { container } = render(
        <BlogPostingSchema
          headline="Test"
          description="Desc"
          image="/images/blog/post.jpg"
          datePublished="2024-01-01"
          author={defaultAuthor}
          locale="en"
        />
      );

      const jsonLdArray = extractJsonLd(container);
      const schema = jsonLdArray[0] as Record<string, unknown>;

      expect((schema.image as string)).toMatch(/^https?:\/\//);
    });
  });

  describe('GlossarySchema 组件', () => {
    it('应渲染 DefinedTermSet JSON-LD', () => {
      const terms = [
        { term: 'OEM', definition: 'Original Equipment Manufacturer' },
        { term: 'MOQ', definition: 'Minimum Order Quantity' },
      ];

      const { container } = render(
        <GlossarySchema terms={terms} locale="en" />
      );

      const jsonLdArray = extractJsonLd(container);
      expect(jsonLdArray.length).toBe(1);

      const schema = jsonLdArray[0] as Record<string, unknown>;
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('DefinedTermSet');
      expect(schema.inLanguage).toBe('en');
    });

    it('definedTerm 应正确映射术语和定义', () => {
      const terms = [
        { term: 'OEM', definition: 'Original Equipment Manufacturer' },
      ];

      const { container } = render(
        <GlossarySchema terms={terms} locale="en" />
      );

      const jsonLdArray = extractJsonLd(container);
      const schema = jsonLdArray[0] as Record<string, unknown>;
      const definedTerms = schema.definedTerm as Array<Record<string, unknown>>;

      expect(definedTerms.length).toBe(1);
      expect(definedTerms[0]['@type']).toBe('DefinedTerm');
      expect(definedTerms[0].name).toBe('OEM');
      expect(definedTerms[0].description).toBe('Original Equipment Manufacturer');
    });
  });

  describe('JSON-LD 安全性', () => {
    it('特殊字符在 JSON-LD 输出中应被安全处理', () => {
      const sections = [
        {
          title: 'Test',
          items: [
            {
              q: 'Is "quoting" & ampersand safe?',
              a: 'Yes, JSON.stringify handles "special" chars properly.',
            },
          ],
        },
      ];

      const { container } = render(<FAQPageSchema sections={sections} />);
      const scripts = container.querySelectorAll('script[type="application/ld+json"]');
      const rawContent = scripts[0].textContent || '';

      // 确保 JSON 可正常解析（不会因特殊字符损坏）
      expect(() => JSON.parse(rawContent)).not.toThrow();

      // 解析后内容保持原值
      const parsed = JSON.parse(rawContent);
      const mainEntity = parsed.mainEntity as Array<Record<string, unknown>>;
      expect(mainEntity[0].name).toContain('"quoting"');
      expect(mainEntity[0].name).toContain('&');
    });
  });
});

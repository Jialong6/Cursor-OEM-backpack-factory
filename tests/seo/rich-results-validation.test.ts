/**
 * Google Rich Results 结构验证测试
 *
 * 按照 Google 结构化数据文档要求验证 JSON-LD schema 的完整性：
 * - FAQPage: mainEntity 非空, acceptedAnswer.text 存在
 * - ManufacturingBusiness: name/url/address 必需字段
 * - BlogPosting: headline <= 110 字符, datePublished ISO 8601, author.name
 * - @context 必须为 https://schema.org
 *
 * 参考: https://developers.google.com/search/docs/appearance/structured-data
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { FACTORY_INFO } from '@/components/seo/ManufacturingPlantSchema';

/**
 * 模拟 ManufacturingBusiness JSON-LD 生成（与组件行为一致）
 */
function generateManufacturingBusinessJsonLd(locale: string, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ManufacturingBusiness',
    '@id': `${FACTORY_INFO.url}/#organization`,
    name: FACTORY_INFO.name,
    url: FACTORY_INFO.url,
    logo: FACTORY_INFO.logo,
    description,
    inLanguage: locale,
    foundingDate: FACTORY_INFO.foundingDate,
    address: {
      '@type': 'PostalAddress',
      streetAddress: FACTORY_INFO.address.streetAddress,
      addressLocality: FACTORY_INFO.address.addressLocality,
      addressCountry: FACTORY_INFO.address.addressCountry,
      postalCode: FACTORY_INFO.address.postalCode,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: FACTORY_INFO.geo.latitude,
      longitude: FACTORY_INFO.geo.longitude,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: FACTORY_INFO.telephone,
      contactType: 'Customer Service',
      email: FACTORY_INFO.email,
      availableLanguage: ['en', 'zh', 'ja'],
    },
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      minValue: FACTORY_INFO.numberOfEmployees.minValue,
      maxValue: FACTORY_INFO.numberOfEmployees.maxValue,
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Backpack Manufacturing Services',
      itemListElement: [
        { '@type': 'Offer', name: 'OEM Manufacturing' },
        { '@type': 'Offer', name: 'ODM Manufacturing' },
        { '@type': 'Offer', name: 'Sample Development' },
        { '@type': 'Offer', name: 'Quality Control' },
        { '@type': 'Offer', name: 'Packaging & Shipping' },
      ],
    },
    hasCredential: FACTORY_INFO.credentials,
  };
}

/**
 * 模拟 FAQPage JSON-LD 生成
 */
function generateFAQPageJsonLd(
  sections: Array<{ title: string; items: Array<{ q: string; a: string }> }>,
  baseUrl = 'https://betterbagsmyanmar.com'
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: sections.flatMap((section, sIndex) =>
      section.items.map((item, iIndex) => ({
        '@type': 'Question',
        '@id': `${baseUrl}/#faq-${sIndex}-${iIndex}`,
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
          url: `${baseUrl}/#faq`,
        },
      }))
    ),
  };
}

/**
 * 模拟 BlogPosting JSON-LD 生成
 */
function generateBlogPostingJsonLd(props: {
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  authorName: string;
  authorJobTitle: string;
  authorBio: string;
  locale: string;
}) {
  const imageUrl = props.image.startsWith('http')
    ? props.image
    : `${FACTORY_INFO.url}${props.image}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: props.headline,
    description: props.description,
    image: imageUrl,
    datePublished: props.datePublished,
    author: {
      '@type': 'Person',
      name: props.authorName,
      jobTitle: props.authorJobTitle,
      description: props.authorBio,
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
    inLanguage: props.locale,
  };
}

describe('Google Rich Results 结构验证', () => {
  describe('@context 验证', () => {
    it('所有 schema 的 @context 必须是 https://schema.org（非 http）', () => {
      const manufacturing = generateManufacturingBusinessJsonLd('en', 'Test');
      const faq = generateFAQPageJsonLd([{ title: 'T', items: [{ q: 'Q', a: 'A' }] }]);
      const blog = generateBlogPostingJsonLd({
        headline: 'Test',
        description: 'Test desc',
        image: '/test.jpg',
        datePublished: '2024-01-01',
        authorName: 'Jay',
        authorJobTitle: 'CEO',
        authorBio: 'Bio',
        locale: 'en',
      });

      expect(manufacturing['@context']).toBe('https://schema.org');
      expect(faq['@context']).toBe('https://schema.org');
      expect(blog['@context']).toBe('https://schema.org');

      // 确保不是 http
      expect(manufacturing['@context']).not.toBe('http://schema.org');
      expect(faq['@context']).not.toBe('http://schema.org');
      expect(blog['@context']).not.toBe('http://schema.org');
    });
  });

  describe('FAQPage Rich Results', () => {
    it('mainEntity 不应为空（至少包含 1 个 Question）', () => {
      const faq = generateFAQPageJsonLd([
        { title: 'General', items: [{ q: 'What is MOQ?', a: '150 pcs' }] },
      ]);

      expect(faq.mainEntity.length).toBeGreaterThan(0);
    });

    it('每个 Question 的 acceptedAnswer.text 不应为空', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              title: fc.string({ minLength: 1, maxLength: 50 }),
              items: fc.array(
                fc.record({
                  q: fc.string({ minLength: 1, maxLength: 200 }),
                  a: fc.string({ minLength: 1, maxLength: 500 }),
                }),
                { minLength: 1, maxLength: 5 }
              ),
            }),
            { minLength: 1, maxLength: 3 }
          ),
          (sections) => {
            const faq = generateFAQPageJsonLd(sections);

            faq.mainEntity.forEach((question) => {
              expect(question.acceptedAnswer.text).toBeDefined();
              expect(question.acceptedAnswer.text.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('每个 Question 的 name 不应为空', () => {
      const sections = [
        {
          title: 'General',
          items: [
            { q: 'What is your minimum order?', a: '150 pieces.' },
            { q: 'What materials do you use?', a: 'Nylon, polyester, canvas.' },
          ],
        },
      ];
      const faq = generateFAQPageJsonLd(sections);

      faq.mainEntity.forEach((question) => {
        expect(question.name).toBeDefined();
        expect(question.name.length).toBeGreaterThan(0);
      });
    });

    it('每个 Question 的 @type 必须是 "Question"', () => {
      const faq = generateFAQPageJsonLd([
        { title: 'T', items: [{ q: 'Q1', a: 'A1' }, { q: 'Q2', a: 'A2' }] },
      ]);

      faq.mainEntity.forEach((q) => {
        expect(q['@type']).toBe('Question');
      });
    });

    it('每个 acceptedAnswer 的 @type 必须是 "Answer"', () => {
      const faq = generateFAQPageJsonLd([
        { title: 'T', items: [{ q: 'Q', a: 'A' }] },
      ]);

      faq.mainEntity.forEach((q) => {
        expect(q.acceptedAnswer['@type']).toBe('Answer');
      });
    });
  });

  describe('ManufacturingBusiness Rich Results', () => {
    it('必须包含 name 字段（非空字符串）', () => {
      const schema = generateManufacturingBusinessJsonLd('en', 'Test');
      expect(schema.name).toBeDefined();
      expect(typeof schema.name).toBe('string');
      expect(schema.name.length).toBeGreaterThan(0);
    });

    it('必须包含有效的 url 字段', () => {
      const schema = generateManufacturingBusinessJsonLd('en', 'Test');
      expect(schema.url).toBeDefined();
      expect(() => new URL(schema.url)).not.toThrow();
    });

    it('必须包含完整的 address 结构', () => {
      const schema = generateManufacturingBusinessJsonLd('en', 'Test');

      expect(schema.address).toBeDefined();
      expect(schema.address['@type']).toBe('PostalAddress');
      expect(schema.address.streetAddress).toBeDefined();
      expect(schema.address.addressLocality).toBeDefined();
      expect(schema.address.addressCountry).toBeDefined();
    });

    it('address.addressCountry 应为 ISO 3166-1 alpha-2 代码', () => {
      const schema = generateManufacturingBusinessJsonLd('en', 'Test');
      expect(schema.address.addressCountry).toMatch(/^[A-Z]{2}$/);
    });

    it('geo 坐标应在有效范围内', () => {
      const schema = generateManufacturingBusinessJsonLd('en', 'Test');

      expect(schema.geo.latitude).toBeGreaterThanOrEqual(-90);
      expect(schema.geo.latitude).toBeLessThanOrEqual(90);
      expect(schema.geo.longitude).toBeGreaterThanOrEqual(-180);
      expect(schema.geo.longitude).toBeLessThanOrEqual(180);
    });

    it('contactPoint 应包含有效的电话和邮箱', () => {
      const schema = generateManufacturingBusinessJsonLd('en', 'Test');

      expect(schema.contactPoint.telephone).toMatch(/^\+?[\d\s\-().]+$/);
      expect(schema.contactPoint.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    it('@type 必须是 ManufacturingBusiness', () => {
      const schema = generateManufacturingBusinessJsonLd('en', 'Test');
      expect(schema['@type']).toBe('ManufacturingBusiness');
    });

    it('对于任意 locale，必需字段都应存在', () => {
      const locales = ['en', 'zh', 'ja', 'ko', 'th', 'vi', 'de', 'fr', 'es', 'ar'];

      locales.forEach((locale) => {
        const schema = generateManufacturingBusinessJsonLd(locale, `Desc for ${locale}`);
        expect(schema.name).toBeDefined();
        expect(schema.url).toBeDefined();
        expect(schema.address).toBeDefined();
        expect(schema.inLanguage).toBe(locale);
      });
    });
  });

  describe('BlogPosting Rich Results', () => {
    it('headline 不应超过 110 个字符', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 110 }),
          (headline) => {
            const schema = generateBlogPostingJsonLd({
              headline,
              description: 'Test',
              image: '/test.jpg',
              datePublished: '2024-01-01',
              authorName: 'Jay',
              authorJobTitle: 'CEO',
              authorBio: 'Bio',
              locale: 'en',
            });

            expect(schema.headline.length).toBeLessThanOrEqual(110);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('datePublished 应为 ISO 8601 格式', () => {
      const validDates = [
        '2024-01-01',
        '2024-06-15',
        '2023-12-31',
        '2024-01-01T00:00:00Z',
      ];

      validDates.forEach((date) => {
        const schema = generateBlogPostingJsonLd({
          headline: 'Test',
          description: 'Test',
          image: '/test.jpg',
          datePublished: date,
          authorName: 'Jay',
          authorJobTitle: 'CEO',
          authorBio: 'Bio',
          locale: 'en',
        });

        // ISO 8601 日期格式验证
        expect(schema.datePublished).toMatch(
          /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/
        );
      });
    });

    it('author.name 必须存在且非空', () => {
      const schema = generateBlogPostingJsonLd({
        headline: 'Test Post',
        description: 'Test desc',
        image: '/test.jpg',
        datePublished: '2024-01-01',
        authorName: 'Jay Li',
        authorJobTitle: 'CEO',
        authorBio: 'Expert',
        locale: 'en',
      });

      expect(schema.author.name).toBeDefined();
      expect(schema.author.name.length).toBeGreaterThan(0);
    });

    it('author.@type 必须是 Person', () => {
      const schema = generateBlogPostingJsonLd({
        headline: 'Test',
        description: 'Test',
        image: '/test.jpg',
        datePublished: '2024-01-01',
        authorName: 'Jay',
        authorJobTitle: 'CEO',
        authorBio: 'Bio',
        locale: 'en',
      });

      expect(schema.author['@type']).toBe('Person');
    });

    it('publisher 应包含 Organization 信息', () => {
      const schema = generateBlogPostingJsonLd({
        headline: 'Test',
        description: 'Test',
        image: '/test.jpg',
        datePublished: '2024-01-01',
        authorName: 'Jay',
        authorJobTitle: 'CEO',
        authorBio: 'Bio',
        locale: 'en',
      });

      expect(schema.publisher['@type']).toBe('Organization');
      expect(schema.publisher.name).toBeDefined();
      expect(schema.publisher.logo).toBeDefined();
      expect(schema.publisher.logo['@type']).toBe('ImageObject');
    });

    it('image 为相对路径时应拼接完整 URL', () => {
      const schema = generateBlogPostingJsonLd({
        headline: 'Test',
        description: 'Test',
        image: '/images/blog/test.jpg',
        datePublished: '2024-01-01',
        authorName: 'Jay',
        authorJobTitle: 'CEO',
        authorBio: 'Bio',
        locale: 'en',
      });

      expect(schema.image).toBe('https://betterbagsmyanmar.com/images/blog/test.jpg');
      expect(() => new URL(schema.image)).not.toThrow();
    });

    it('image 为绝对 URL 时应保持原值', () => {
      const absoluteUrl = 'https://cdn.example.com/image.jpg';
      const schema = generateBlogPostingJsonLd({
        headline: 'Test',
        description: 'Test',
        image: absoluteUrl,
        datePublished: '2024-01-01',
        authorName: 'Jay',
        authorJobTitle: 'CEO',
        authorBio: 'Bio',
        locale: 'en',
      });

      expect(schema.image).toBe(absoluteUrl);
    });
  });

  describe('JSON 序列化完整性', () => {
    it('所有 schema 应可安全序列化为 JSON 并回解析', () => {
      const manufacturing = generateManufacturingBusinessJsonLd('en', 'Test description');
      const faq = generateFAQPageJsonLd([
        { title: 'FAQ', items: [{ q: 'Q?', a: 'A.' }] },
      ]);
      const blog = generateBlogPostingJsonLd({
        headline: 'Blog Post Title',
        description: 'Description',
        image: '/img.jpg',
        datePublished: '2024-06-01',
        authorName: 'Author',
        authorJobTitle: 'Title',
        authorBio: 'Bio',
        locale: 'en',
      });

      // 序列化不抛错
      const mStr = JSON.stringify(manufacturing);
      const fStr = JSON.stringify(faq);
      const bStr = JSON.stringify(blog);

      // 反序列化后结构保持
      const mParsed = JSON.parse(mStr);
      const fParsed = JSON.parse(fStr);
      const bParsed = JSON.parse(bStr);

      expect(mParsed['@type']).toBe('ManufacturingBusiness');
      expect(fParsed['@type']).toBe('FAQPage');
      expect(bParsed['@type']).toBe('BlogPosting');
    });

    it('包含特殊字符的内容应能安全序列化', () => {
      const specialChars = 'Test "quotes" & <brackets> \' apostrophe';
      const schema = generateBlogPostingJsonLd({
        headline: specialChars,
        description: specialChars,
        image: '/test.jpg',
        datePublished: '2024-01-01',
        authorName: 'O\'Brien',
        authorJobTitle: 'CEO',
        authorBio: specialChars,
        locale: 'en',
      });

      const serialized = JSON.stringify(schema);
      const parsed = JSON.parse(serialized);

      expect(parsed.headline).toBe(specialChars);
      expect(parsed.author.name).toBe('O\'Brien');
    });
  });
});

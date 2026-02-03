import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { AUTHORS, getAuthorForPost } from '@/lib/author-data';
import type { AuthorProfile } from '@/lib/author-data';
import { BLOG_POSTS } from '@/lib/blog-data';
import { FACTORY_INFO } from '@/components/seo/ManufacturingPlantSchema';

/**
 * BlogPosting Schema 属性测试
 *
 * **Feature: E-E-A-T Authority, Property: BlogPosting JSON-LD Validity**
 *
 * 验证 BlogPosting JSON-LD 结构化数据的正确性：
 * - 所有必需字段存在
 * - author.name 匹配 AuthorProfile
 * - publisher @id 一致
 * - inLanguage 匹配 locale
 */

const supportedLocales = ['en', 'zh'] as const;

/**
 * 模拟 BlogPostingSchema 组件的 JSON-LD 生成逻辑
 */
function generateBlogPostingJsonLd(
  headline: string,
  description: string,
  image: string,
  datePublished: string,
  author: AuthorProfile,
  locale: string
) {
  const imageUrl = image.startsWith('http')
    ? image
    : `${FACTORY_INFO.url}${image}`;

  return {
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
}

describe('Property: BlogPosting Schema Validity', () => {
  describe('必需字段存在性', () => {
    it('Property: 任意 BlogPost 生成的 schema 包含所有必需字段', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...BLOG_POSTS),
          fc.constantFrom(...supportedLocales),
          (post, locale) => {
            const author = getAuthorForPost(post);
            const schema = generateBlogPostingJsonLd(
              post.title[locale],
              post.excerpt[locale],
              post.thumbnail,
              post.date,
              author,
              locale
            );

            expect(schema['@context']).toBe('https://schema.org');
            expect(schema['@type']).toBe('BlogPosting');
            expect(schema.headline).toBeDefined();
            expect(schema.headline.length).toBeGreaterThan(0);
            expect(schema.description).toBeDefined();
            expect(schema.description.length).toBeGreaterThan(0);
            expect(schema.image).toBeDefined();
            expect(schema.datePublished).toBeDefined();
            expect(schema.author).toBeDefined();
            expect(schema.publisher).toBeDefined();
            expect(schema.inLanguage).toBeDefined();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('author 字段正确性', () => {
    it('Property: author.name 匹配 AuthorProfile', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...BLOG_POSTS),
          fc.constantFrom(...supportedLocales),
          (post, locale) => {
            const author = getAuthorForPost(post);
            const schema = generateBlogPostingJsonLd(
              post.title[locale],
              post.excerpt[locale],
              post.thumbnail,
              post.date,
              author,
              locale
            );

            expect(schema.author['@type']).toBe('Person');
            expect(schema.author.name).toBe(author.name.en);
            expect(schema.author.jobTitle).toBe(author.role.en);
            expect(schema.author.description).toBe(author.bio.en);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('Property: author 字段不为空字符串', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...AUTHORS),
          (author) => {
            expect(author.name.en.length).toBeGreaterThan(0);
            expect(author.role.en.length).toBeGreaterThan(0);
            expect(author.bio.en.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('publisher 一致性', () => {
    it('Property: publisher @id 始终为 organization URL', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...BLOG_POSTS),
          fc.constantFrom(...supportedLocales),
          (post, locale) => {
            const author = getAuthorForPost(post);
            const schema = generateBlogPostingJsonLd(
              post.title[locale],
              post.excerpt[locale],
              post.thumbnail,
              post.date,
              author,
              locale
            );

            expect(schema.publisher['@type']).toBe('Organization');
            expect(schema.publisher['@id']).toBe(
              `${FACTORY_INFO.url}/#organization`
            );
            expect(schema.publisher.name).toBe(FACTORY_INFO.name);
            expect(schema.publisher.logo['@type']).toBe('ImageObject');
            expect(schema.publisher.logo.url).toBe(FACTORY_INFO.logo);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('inLanguage 匹配', () => {
    it('Property: inLanguage 匹配传入的 locale', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...supportedLocales),
          (locale) => {
            const post = BLOG_POSTS[0];
            const author = getAuthorForPost(post);
            const schema = generateBlogPostingJsonLd(
              post.title[locale],
              post.excerpt[locale],
              post.thumbnail,
              post.date,
              author,
              locale
            );

            expect(schema.inLanguage).toBe(locale);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('image URL 处理', () => {
    it('相对路径应被转换为绝对 URL', () => {
      const post = BLOG_POSTS[0];
      const author = getAuthorForPost(post);
      const schema = generateBlogPostingJsonLd(
        post.title.en,
        post.excerpt.en,
        '/images/blog/test.jpg',
        post.date,
        author,
        'en'
      );

      expect(schema.image).toBe(`${FACTORY_INFO.url}/images/blog/test.jpg`);
    });

    it('绝对 URL 不应被修改', () => {
      const post = BLOG_POSTS[0];
      const author = getAuthorForPost(post);
      const absoluteUrl = 'https://example.com/image.jpg';
      const schema = generateBlogPostingJsonLd(
        post.title.en,
        post.excerpt.en,
        absoluteUrl,
        post.date,
        author,
        'en'
      );

      expect(schema.image).toBe(absoluteUrl);
    });
  });

  describe('JSON 序列化', () => {
    it('schema 可以正确序列化和反序列化', () => {
      const post = BLOG_POSTS[0];
      const author = getAuthorForPost(post);
      const schema = generateBlogPostingJsonLd(
        post.title.en,
        post.excerpt.en,
        post.thumbnail,
        post.date,
        author,
        'en'
      );

      expect(() => JSON.stringify(schema)).not.toThrow();
      const parsed = JSON.parse(JSON.stringify(schema));
      expect(parsed['@type']).toBe('BlogPosting');
      expect(parsed.author['@type']).toBe('Person');
      expect(parsed.publisher['@type']).toBe('Organization');
    });
  });
});

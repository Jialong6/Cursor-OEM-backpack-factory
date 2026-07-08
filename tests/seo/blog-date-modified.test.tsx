/**
 * BlogPosting dateModified —— 内容新鲜度信号验证
 *
 * dateModified 是搜索引擎与 AI 引擎判断内容新鲜度的关键字段。
 * 约定:
 * - BlogPost 数据每篇必须带 dateModified(ISO 日期),且不早于发布日期
 * - BlogPostingSchema 输出 dateModified;未传入时回退 datePublished
 *   (Google 允许两者相等,但字段必须存在以保证信号完整)
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string) => `translated:${key}`;
    t.raw = () => [];
    return t;
  },
  useLocale: () => 'en',
}));

import BlogPostingSchema from '@/components/seo/BlogPostingSchema';
import { BLOG_POSTS } from '@/lib/blog-data';

const testAuthor = {
  id: 'test-author',
  name: { en: 'Jay Li', zh: 'Jay Li' },
  role: { en: 'CEO', zh: 'CEO' },
  bio: { en: 'Expert', zh: '专家' },
  credentials: ['MBA'],
  avatar: '/images/author.jpg',
};

function extractJsonLd(container: HTMLElement): Record<string, unknown> {
  const script = container.querySelector('script[type="application/ld+json"]');
  return JSON.parse(script?.textContent || '{}');
}

describe('BlogPosting dateModified', () => {
  it('传入 dateModified 时应原样输出', () => {
    const { container } = render(
      <BlogPostingSchema
        headline="Test"
        description="Desc"
        image="/img.jpg"
        datePublished="2026-05-10"
        dateModified="2026-06-20"
        author={testAuthor}
        locale="en"
      />
    );
    const jsonLd = extractJsonLd(container);

    expect(jsonLd.dateModified).toBe('2026-06-20');
    expect(jsonLd.datePublished).toBe('2026-05-10');
  });

  it('未传入 dateModified 时应回退为 datePublished', () => {
    const { container } = render(
      <BlogPostingSchema
        headline="Test"
        description="Desc"
        image="/img.jpg"
        datePublished="2026-05-10"
        author={testAuthor}
        locale="en"
      />
    );
    const jsonLd = extractJsonLd(container);

    expect(jsonLd.dateModified).toBe('2026-05-10');
  });
});

describe('博客数据 dateModified 完整性', () => {
  it('每篇文章都应有 dateModified 字段', () => {
    for (const post of BLOG_POSTS) {
      expect(
        post.dateModified,
        `文章 ${post.slug} 缺少 dateModified`
      ).toBeDefined();
    }
  });

  it('dateModified 不应早于发布日期,且为合法 ISO 日期', () => {
    for (const post of BLOG_POSTS) {
      const modified = new Date(post.dateModified as string);
      const published = new Date(post.date);

      expect(Number.isNaN(modified.getTime()), `${post.slug} dateModified 非法`).toBe(false);
      expect(
        modified.getTime(),
        `${post.slug} 的 dateModified 早于发布日期`
      ).toBeGreaterThanOrEqual(published.getTime());
    }
  });
});

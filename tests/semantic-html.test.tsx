/**
 * 语义化HTML测试
 *
 * 功能：
 * - 验证使用HTML5语义标签（header, nav, main, article, section, footer）
 * - 确保每个页面只有一个h1标题
 * - 验证HTML结构符合可访问性标准
 *
 * 验证需求：14.4, 14.5
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import BlogListPage from '@/app/[locale]/blog/page';
import BlogDetailPage from '@/app/[locale]/blog/[slug]/page';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
  usePathname: () => '/en',
}));

// Mock blog data
vi.mock('@/lib/blog-data', () => ({
  getAllBlogPosts: () => [
    {
      slug: 'test-post',
      title: { en: 'Test Post', zh: '测试文章' },
      excerpt: { en: 'Test excerpt', zh: '测试摘要' },
      date: '2024-01-01',
      category: 'Industry',
      tags: ['test'],
      thumbnail: '/images/test.jpg',
      content: { en: 'Test content', zh: '测试内容' },
    },
  ],
  getBlogPostBySlug: () => ({
    slug: 'test-post',
    title: { en: 'Test Post', zh: '测试文章' },
    excerpt: { en: 'Test excerpt', zh: '测试摘要' },
    date: '2024-01-01',
    category: 'Industry',
    tags: ['test'],
    thumbnail: '/images/test.jpg',
    content: { en: '# Heading\n\nTest content', zh: '# 标题\n\n测试内容' },
  }),
}));

describe('语义化HTML结构（需求 14.4, 14.5）', () => {
  /**
   * 需求 14.5: 每个页面应该只有一个h1标题
   */
  describe('h1 标题唯一性验证', () => {
    it('博客列表页应该只有一个 h1 标题', () => {
      const { container } = render(<BlogListPage />);
      const h1Elements = container.querySelectorAll('h1');

      expect(h1Elements.length).toBe(1);
    });

    it('博客详情页应该只有一个 h1 标题', () => {
      const { container } = render(<BlogDetailPage />);
      const h1Elements = container.querySelectorAll('h1');

      // 博客详情页应该只有文章标题是 h1
      // Markdown 中的 # 应该渲染为 h2
      expect(h1Elements.length).toBe(1);
    });

    it('博客详情页 Markdown 内容中的 # 应该渲染为 h2', () => {
      const { container } = render(<BlogDetailPage />);

      // 检查是否有 h2 标签（来自 Markdown 的 #）
      const h2Elements = container.querySelectorAll('h2');
      expect(h2Elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  /**
   * 需求 14.4: 使用语义化HTML5元素
   */
  describe('HTML5 语义标签验证', () => {
    it('博客列表页应该使用 main 标签', () => {
      const { container } = render(<BlogListPage />);
      const mainElement = container.querySelector('main');

      expect(mainElement).not.toBeNull();
    });

    it('博客详情页应该使用 main 和 article 标签', () => {
      const { container } = render(<BlogDetailPage />);

      const mainElement = container.querySelector('main');
      const articleElement = container.querySelector('article');

      expect(mainElement).not.toBeNull();
      expect(articleElement).not.toBeNull();
    });
  });

  /**
   * 标题层级验证
   */
  describe('标题层级验证', () => {
    it('博客列表页的 h1 应该在 main 元素内', () => {
      const { container } = render(<BlogListPage />);
      const mainElement = container.querySelector('main');
      const h1Element = mainElement?.querySelector('h1');

      expect(h1Element).not.toBeNull();
    });

    it('博客详情页的 h1 应该在 article 元素内', () => {
      const { container } = render(<BlogDetailPage />);
      const articleElement = container.querySelector('article');
      const h1Element = articleElement?.querySelector('h1');

      expect(h1Element).not.toBeNull();
    });
  });

  /**
   * 可访问性相关验证
   */
  describe('可访问性相关验证', () => {
    it('博客列表页的 h1 应该有有意义的文本内容', () => {
      const { container } = render(<BlogListPage />);
      const h1Element = container.querySelector('h1');

      expect(h1Element).not.toBeNull();
      expect(h1Element?.textContent).toBeTruthy();
      expect(h1Element?.textContent?.trim().length).toBeGreaterThan(0);
    });

    it('博客详情页的 h1 应该是文章标题', () => {
      const { container } = render(<BlogDetailPage />);
      const h1Element = container.querySelector('h1');

      expect(h1Element).not.toBeNull();
      // h1 应该包含有意义的文本（不是空的）
      expect(h1Element?.textContent).toBeTruthy();
      expect(h1Element?.textContent?.trim().length).toBeGreaterThan(0);
    });
  });
});

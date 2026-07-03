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

// Mock next-intl (client hooks)
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock next-intl/server (BlogDetailPage 已 server 化,用 getTranslations)
vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
  usePathname: () => '/en',
}));

// Mock blog data(正文改为 getBlogPostContent 异步加载)
vi.mock('@/lib/blog-data', () => ({
  getAllBlogPosts: () => [
    {
      slug: 'test-post',
      title: { ja: 'テスト', en: 'Test Post', zh: '测试文章' },
      excerpt: { ja: 'テスト', en: 'Test excerpt', zh: '测试摘要' },
      date: '2024-01-01',
      category: { ja: '業界', en: 'Industry', zh: '行业' },
      tags: { ja: ['テスト'], en: ['test'], zh: ['测试'] },
      thumbnail: '/images/test.jpg',
    },
  ],
  getBlogPostBySlug: () => ({
    slug: 'test-post',
    title: { ja: 'テスト', en: 'Test Post', zh: '测试文章' },
    excerpt: { ja: 'テスト', en: 'Test excerpt', zh: '测试摘要' },
    date: '2024-01-01',
    category: { ja: '業界', en: 'Industry', zh: '行业' },
    tags: { ja: ['テスト'], en: ['test'], zh: ['测试'] },
    thumbnail: '/images/test.jpg',
  }),
  getBlogPostContent: async () => '# Heading\n\nTest content',
}));

/** 渲染 async server 组件的辅助:先 await 组件函数,再交给 RTL */
async function renderBlogDetailPage() {
  const element = await BlogDetailPage({
    params: Promise.resolve({ locale: 'en', slug: 'test-post' }),
  });
  return render(element);
}

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

    it('博客详情页应该只有一个 h1 标题', async () => {
      const { container } = await renderBlogDetailPage();
      const h1Elements = container.querySelectorAll('h1');

      // 博客详情页应该只有文章标题是 h1
      // Markdown 中的 # 应该渲染为 h2
      expect(h1Elements.length).toBe(1);
    });

    it('博客详情页 Markdown 内容中的 # 应该渲染为 h2', async () => {
      const { container } = await renderBlogDetailPage();

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

    it('博客详情页应该使用 main 和 article 标签', async () => {
      const { container } = await renderBlogDetailPage();

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

    it('博客详情页的 h1 应该在 article 元素内', async () => {
      const { container } = await renderBlogDetailPage();
      const articleElement = container.querySelector('article');
      const h1Element = articleElement?.querySelector('h1');

      // articleElement 缺失时 h1Element 为 undefined,显式断言两者都存在
      expect(articleElement).not.toBeNull();
      expect(h1Element ?? null).not.toBeNull();
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

    it('博客详情页的 h1 应该是文章标题', async () => {
      const { container } = await renderBlogDetailPage();
      const h1Element = container.querySelector('h1');

      expect(h1Element).not.toBeNull();
      // h1 应该包含有意义的文本（不是空的）
      expect(h1Element?.textContent).toBeTruthy();
      expect(h1Element?.textContent?.trim().length).toBeGreaterThan(0);
    });
  });
});

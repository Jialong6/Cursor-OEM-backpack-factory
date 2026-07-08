/**
 * 本地化 404 页验证
 *
 * 约定:
 * - 12 语 locale JSON 均含 notFound 命名空间(title/description/backHome/viewBlog)
 * - app/[locale]/not-found.tsx 渲染本地化文案,并提供返回首页与博客的内链
 * - app/[locale]/[...rest]/page.tsx catch-all 触发 notFound()(next-intl 标准方案)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'fs';
import { join } from 'path';
import { locales } from '@/i18n';

// Mock next-intl:not-found 页为 client 组件,使用 useTranslations/useLocale
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string) => `translated:${key}`;
    t.raw = () => [];
    return t;
  },
  useLocale: () => 'en',
}));

import NotFoundPage from '@/app/[locale]/not-found';

const REQUIRED_KEYS = ['title', 'description', 'backHome', 'viewBlog'] as const;

describe('12 语 notFound 翻译完整性', () => {
  it.each(locales)('%s.json 应含 notFound 命名空间全部 key 且非空', (locale) => {
    const raw = readFileSync(
      join(process.cwd(), 'locales', `${locale}.json`),
      'utf-8'
    );
    const messages = JSON.parse(raw) as Record<string, Record<string, string>>;

    expect(messages.notFound, `${locale}.json 缺少 notFound 命名空间`).toBeDefined();
    for (const key of REQUIRED_KEYS) {
      const value = messages.notFound[key];
      expect(value, `${locale}.json notFound.${key} 缺失`).toBeDefined();
      expect(value.length, `${locale}.json notFound.${key} 为空`).toBeGreaterThan(0);
    }
  });
});

describe('not-found 页面组件', () => {
  it('应渲染本地化标题与描述', () => {
    render(<NotFoundPage />);

    expect(screen.getByText('translated:title')).toBeInTheDocument();
    expect(screen.getByText('translated:description')).toBeInTheDocument();
  });

  it('应包含返回首页与博客的内链(带 locale 前缀)', () => {
    render(<NotFoundPage />);

    const homeLink = screen.getByRole('link', { name: 'translated:backHome' });
    const blogLink = screen.getByRole('link', { name: 'translated:viewBlog' });

    expect(homeLink.getAttribute('href')).toBe('/en');
    expect(blogLink.getAttribute('href')).toBe('/en/blog');
  });

  it('应使用语义化 main 标签', () => {
    render(<NotFoundPage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});

describe('catch-all 路由触发 notFound', () => {
  it('app/[locale]/[...rest]/page.tsx 应存在且调用 notFound()', async () => {
    const mod = await import('@/app/[locale]/[...rest]/page');
    // notFound() 抛出 NEXT_HTTP_ERROR_FALLBACK(Next 内部错误),调用即抛
    expect(() => mod.default()).toThrow();
  });
});

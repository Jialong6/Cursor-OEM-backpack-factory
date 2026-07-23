/**
 * Footer「Blogs」页面链接测试
 *
 * 背景:footer.links 里 Blogs 曾指向 #blogs 锚点,但首页 Blog 区块 id 是
 * blog——锚点从未生效(点击无反应),且 /blog 列表页因此缺少全站内链
 * (GSC 报 /en/blog「Google 选择的规范网页与用户指定的不同」)。
 * 修复:改为 /blog 页面链接,Footer 对非 # 链接自动拼 /{locale} 前缀。
 *
 * 使用真实 locale JSON 渲染真实 Footer,锁死 12 语的前缀拼接行为。
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import fs from 'fs';
import path from 'path';
import Footer from '@/components/layout/Footer';
import { locales, type Locale } from '@/i18n';

// Footer 子树(含后续语言区块)依赖 usePathname;按当前渲染 locale 可变
let mockPathname = '/en';
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

const LOCALES_DIR = path.join(process.cwd(), 'locales');

function loadMessages(locale: Locale) {
  return JSON.parse(
    fs.readFileSync(path.join(LOCALES_DIR, `${locale}.json`), 'utf-8')
  );
}

function renderFooter(locale: Locale) {
  mockPathname = `/${locale}`;
  return render(
    <NextIntlClientProvider locale={locale} messages={loadMessages(locale)}>
      <Footer />
    </NextIntlClientProvider>
  );
}

describe('Footer Blogs 链接指向 /blog 列表页', () => {
  it('en Footer 应渲染 /en/blog 链接,文案取自 footer.links', () => {
    const messages = loadMessages('en');
    const blogEntry = (
      messages.footer.links as Array<{ name: string; href: string }>
    ).find((link) => link.href === '/blog');

    const { container } = renderFooter('en');
    const anchor = container.querySelector('a[href="/en/blog"]');

    expect(blogEntry, 'en.json footer.links 缺少 /blog 项').toBeDefined();
    expect(anchor).not.toBeNull();
    expect(anchor!.textContent).toBe(blogEntry!.name);
  });

  it('任何 locale 的 Footer 都不应再出现坏锚点 #blogs', () => {
    for (const locale of locales) {
      const { container, unmount } = renderFooter(locale);
      expect(
        container.querySelector('a[href="#blogs"]'),
        `${locale}: Footer 仍渲染 #blogs 坏锚点`
      ).toBeNull();
      unmount();
    }
  });

  it.each(locales)('%s Footer 应渲染带 locale 前缀的 /blog 链接', (locale) => {
    const { container, unmount } = renderFooter(locale);
    expect(
      container.querySelector(`a[href="/${locale}/blog"]`),
      `${locale}: 缺少 /${locale}/blog 页脚链接`
    ).not.toBeNull();
    unmount();
  });
});

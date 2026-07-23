/**
 * FooterLanguageLinks —— 页脚跨语言链接区块测试
 *
 * 背景(GSC 47 个「已发现-尚未编入索引」多为非英语页):语言切换器是
 * isOpen 条件挂载的 JS 下拉,SSR HTML 无任何跨语言 <a>,全站内链
 * locale-sticky,爬虫无法从页面发现其他语言版本。
 * 本区块必须在静态 HTML 里就输出 12 个真实链接,指向当前页的对应
 * 语言版,与 head 中的 hreflang 互证。
 */

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import fc from 'fast-check';
import fs from 'fs';
import path from 'path';
import FooterLanguageLinks from '@/components/layout/FooterLanguageLinks';
import { buildLocaleHref } from '@/lib/locale-links';
import { LANG_COOKIE_NAME } from '@/lib/lang-cookie-client';
import { locales, localeConfig, type Locale } from '@/i18n';

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

function withIntl(locale: Locale, ui: React.ReactElement) {
  return (
    <NextIntlClientProvider locale={locale} messages={loadMessages(locale)}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('SSR 可爬性(核心 SEO 断言)', () => {
  it('静态 HTML 无需任何交互即含全部 12 个语言链接', () => {
    mockPathname = '/en/blog';
    const markup = renderToStaticMarkup(withIntl('en', <FooterLanguageLinks />));

    for (const target of locales) {
      expect(
        markup,
        `静态 HTML 缺少 /${target}/blog 链接`
      ).toContain(`href="/${target}/blog"`);
    }
  });
});

describe('链接正确性', () => {
  it('属性:任意当前 locale × 子路径,12 个链接 href/lang/hreflang 正确', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...locales),
        fc.constantFrom('', '/blog', '/glossary', '/fact-sheet'),
        (current: Locale, subPath: string) => {
          mockPathname = `/${current}${subPath}`;
          const { container, unmount } = render(
            withIntl(current, <FooterLanguageLinks />)
          );

          const anchors = container.querySelectorAll('a');
          expect(anchors).toHaveLength(locales.length);

          for (const target of locales) {
            const expectedHref = buildLocaleHref(mockPathname, current, target);
            const anchor = container.querySelector(`a[href="${expectedHref}"]`);
            expect(anchor, `${current}${subPath}: 缺少 ${expectedHref}`).not.toBeNull();
            expect(anchor!.getAttribute('hreflang')).toBe(localeConfig[target].hreflang);
            expect(anchor!.getAttribute('lang')).toBe(localeConfig[target].hreflang);
            expect(anchor!.textContent).toBe(localeConfig[target].nativeName);
          }

          unmount();
        }
      ),
      { numRuns: 48 }
    );
  });

  it('当前语言项带 aria-current,其余不带', () => {
    mockPathname = '/de/blog';
    const { container } = render(withIntl('de', <FooterLanguageLinks />));

    const current = container.querySelector('a[aria-current="true"]');
    expect(current).not.toBeNull();
    expect(current!.getAttribute('href')).toBe('/de/blog');
    expect(container.querySelectorAll('a[aria-current="true"]')).toHaveLength(1);
  });
});

describe('语言偏好 cookie', () => {
  it('点击语言链接写入 NEXT_LOCALE cookie', () => {
    mockPathname = '/en';
    document.cookie = `${LANG_COOKIE_NAME}=; path=/; max-age=0`;

    const { container } = render(withIntl('en', <FooterLanguageLinks />));
    const anchor = container.querySelector('a[href="/ja"]');
    expect(anchor).not.toBeNull();

    fireEvent.click(anchor!);
    expect(document.cookie).toContain(`${LANG_COOKIE_NAME}=ja`);
  });
});

describe('footer.languages 文案', () => {
  it('12 语 JSON 均含非空 footer.languages 标题', () => {
    for (const locale of locales) {
      const messages = loadMessages(locale);
      const languages = messages.footer?.languages;
      expect(
        typeof languages === 'string' && languages.trim().length > 0,
        `${locale}.json 缺少 footer.languages`
      ).toBe(true);
    }
  });

  it('区块以 nav 语义暴露且 aria-label 取自 footer.languages', () => {
    mockPathname = '/en';
    const messages = loadMessages('en');
    const { container } = render(withIntl('en', <FooterLanguageLinks />));

    const nav = container.querySelector('nav');
    expect(nav).not.toBeNull();
    expect(nav!.getAttribute('aria-label')).toBe(messages.footer.languages);
  });
});

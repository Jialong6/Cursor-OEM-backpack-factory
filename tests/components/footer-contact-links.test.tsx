/**
 * 页脚的联系入口与快捷链接
 *
 * 背景(埋点数据):三天 18 次页面浏览里,只有 2 次滚到过 contact 区 ——
 * 而全站的 tel: / mailto: / wa.me 此前只存在于那一屏。页脚是每页都在的,
 * 却把电话和邮箱写成了纯文本 <span>,手机上点不了。
 *
 * 同时页脚的锚点链接有两个指向并不存在的 id(#home / #process),
 * 而 handleLinkClick 对 # 开头的 href 一律 preventDefault,找不到元素就
 * 静默什么都不做 —— 于是在 /blog、/glossary、/fact-sheet 上,
 * 页脚的「联系我们」是个完全没有反应的死链。
 *
 * 用真实 locale JSON 渲染真实 Footer,12 语一起锁。
 */
import { describe, it, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import fs from 'fs';
import path from 'path';
import Footer from '@/components/layout/Footer';
import { locales, type Locale } from '@/i18n';

let mockPathname = '/en';
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock('@/lib/analytics/beacon', () => ({
  track: vi.fn(),
  trackDwell: vi.fn(),
  flush: vi.fn(),
  resetPageView: vi.fn(),
  getPageViewId: () => 'pv-test',
}));

const LOCALES_DIR = path.join(process.cwd(), 'locales');

function loadMessages(locale: Locale) {
  return JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, `${locale}.json`), 'utf-8'));
}

function renderFooter(locale: Locale = 'en') {
  mockPathname = `/${locale}`;
  return render(
    <NextIntlClientProvider locale={locale} messages={loadMessages(locale)}>
      <Footer />
    </NextIntlClientProvider>
  );
}

/**
 * 首页上真实存在的板块 id
 *
 * 直接从 section 组件里扫出来,而不是手写一份常量 —— 手写的那份迟早
 * 和组件走散,而这个测试存在的意义正是抓住那种走散。
 */
function realSectionIds(): ReadonlySet<string> {
  const dir = path.join(process.cwd(), 'components', 'sections');
  const ids = new Set<string>();

  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.tsx')) continue;
    const source = fs.readFileSync(path.join(dir, file), 'utf-8');
    for (const match of source.matchAll(/\bid="([a-zA-Z][\w-]*)"/g)) {
      ids.add(match[1]);
    }
  }

  return ids;
}

beforeEach(() => {
  mockPathname = '/en';
  vi.stubGlobal('scrollTo', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('可点的联系方式', () => {
  it.each(locales)('%s 的页脚电话是可拨的 tel: 链接', (locale) => {
    const { container } = renderFooter(locale as Locale);
    const phone = loadMessages(locale as Locale).footer.companyInfo.phone as string;

    const link = container.querySelector('a[href^="tel:"]');

    expect(link).not.toBeNull();
    // tel: 里不能留空格、括号、点号,否则部分拨号盘直接拒绝
    expect(link?.getAttribute('href')).toBe(`tel:${phone.replace(/[^\d+]/g, '')}`);
  });

  it.each(locales)('%s 的页脚邮箱是可点的 mailto: 链接', (locale) => {
    const { container } = renderFooter(locale as Locale);
    const email = loadMessages(locale as Locale).footer.companyInfo.email as string;

    expect(container.querySelector('a[href^="mailto:"]')?.getAttribute('href')).toBe(
      `mailto:${email}`
    );
  });

  test('两个联系链接都带埋点标签,而且标签里没有号码本身', () => {
    const { container } = renderFooter();

    for (const selector of ['a[href^="tel:"]', 'a[href^="mailto:"]']) {
      const label = container.querySelector(selector)?.getAttribute('data-analytics-label');

      expect(label).toBeTruthy();
      expect(label).not.toMatch(/\d{4}/);
      expect(label).not.toContain('@');
    }
  });
});

describe('快捷链接不能是死链', () => {
  const sectionIds = realSectionIds();

  it.each(locales)('%s 的页脚锚点都指向真实存在的板块', (locale) => {
    const links = loadMessages(locale as Locale).footer.links as Array<{ href: string }>;
    const anchors = links.map((l) => l.href).filter((href) => href.startsWith('#'));

    expect(anchors.length).toBeGreaterThan(0);

    for (const href of anchors) {
      expect(sectionIds).toContain(href.slice(1));
    }
  });

  it('12 语的链接条目一一对应,不能有谁多一条少一条', () => {
    const shape = (locale: Locale) =>
      (loadMessages(locale).footer.links as Array<{ href: string }>).map((l) => l.href);
    const reference = shape('en');

    for (const locale of locales) {
      expect(shape(locale as Locale)).toEqual(reference);
    }
  });
});

describe('子页面上的锚点链接', () => {
  /**
   * 这条是本次真正要修的行为:/blog 上没有 #contact 这个元素,
   * 旧实现 preventDefault 之后就什么都不做,点了毫无反应。
   */
  test('当前页没有该板块时,跳回首页对应锚点而不是静默失效', () => {
    // 只劫持 href 的写入,其余字段保持真实 —— next/image 会读
    // window.location 去解析图片 URL,整个换掉会让它抛 Invalid URL
    const navigated: string[] = [];
    const original = Object.getOwnPropertyDescriptor(window, 'location');
    const real = window.location;

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: new Proxy(real, {
        get: (target, key) => (key === 'href' ? 'http://localhost/en/blog' : Reflect.get(target, key)),
        set: (_target, key, value) => {
          if (key === 'href') {
            navigated.push(String(value));
            return true;
          }
          return true;
        },
      }),
    });

    try {
      mockPathname = '/en/blog';
      render(
        <NextIntlClientProvider locale="en" messages={loadMessages('en')}>
          <Footer />
        </NextIntlClientProvider>
      );

      fireEvent.click(screen.getByRole('link', { name: 'Contact Us' }));
    } finally {
      if (original) {
        Object.defineProperty(window, 'location', original);
      }
    }

    expect(navigated).toEqual(['/en#contact']);
  });

  test('板块就在当前页时平滑滚动,并扣掉导航栏高度', () => {
    const scrollTo = vi.fn();
    vi.stubGlobal('scrollTo', scrollTo);

    const { container } = renderFooter();
    const section = document.createElement('section');
    section.id = 'contact';
    container.appendChild(section);
    Object.defineProperty(section, 'offsetTop', { value: 4_000, configurable: true });

    fireEvent.click(screen.getByRole('link', { name: 'Contact Us' }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 4_000 - 80, behavior: 'smooth' });
  });
});

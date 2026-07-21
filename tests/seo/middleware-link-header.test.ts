/**
 * middleware —— hreflang Link header 关闭与爬虫重定向语义验证
 *
 * 背景(GSC「网页会自动重定向」/「重复网页」根因):
 * - next-intl 默认在每个响应输出 HTTP Link header 版 hreflang,其语言代码
 *   用路由前缀(zh/zh-tw),与 HTML head 及 sitemap 的 zh-Hans/zh-Hant 冲突;
 *   x-default 指向会重定向的无前缀路径;且跟随请求 host(www 域下整套变 www)。
 *   关闭后 hreflang 唯一信源 = HTML + sitemap(两者一致)。
 * - 爬虫访问无前缀路径此前为 307 临时重定向,Google 不合并权重;
 *   localePrefix:'always' 下无前缀 -> /en 对爬虫是永久事实,应为 308。
 * - 普通用户无前缀路径保持 302:目标因 cookie/geo 而异,必须临时。
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { NextRequest } from 'next/server';
import middleware from '@/middleware';
import { locales, type Locale } from '@/i18n';

const GOOGLEBOT_UA =
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const CHROME_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const PAGE_PATHS = ['', '/blog', '/fact-sheet', '/glossary', '/virtual-factory-tour'];

function request(path: string, userAgent: string): NextRequest {
  return new NextRequest(`https://betterbagsmm.com${path}`, {
    headers: { 'user-agent': userAgent },
  });
}

describe('middleware 不再输出 hreflang Link header', () => {
  it('属性:任意 locale × 任意页面路径,爬虫请求带前缀 URL 响应无 Link header', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...locales),
        fc.constantFrom(...PAGE_PATHS),
        (locale: Locale, path: string) => {
          const response = middleware(request(`/${locale}${path}`, GOOGLEBOT_UA));
          expect(response.headers.get('link')).toBeNull();
        }
      ),
      { numRuns: 60 }
    );
  });

  it('属性:任意 locale × 任意页面路径,普通用户请求带前缀 URL 响应无 Link header', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...locales),
        fc.constantFrom(...PAGE_PATHS),
        (locale: Locale, path: string) => {
          const response = middleware(request(`/${locale}${path}`, CHROME_UA));
          expect(response.headers.get('link')).toBeNull();
        }
      ),
      { numRuns: 60 }
    );
  });
});

describe('爬虫无前缀路径 308 永久重定向', () => {
  it('属性:任意无前缀页面路径,爬虫请求 308 到 /en 前缀版', () => {
    fc.assert(
      fc.property(fc.constantFrom(...PAGE_PATHS), (path: string) => {
        const response = middleware(request(path || '/', GOOGLEBOT_UA));
        expect(response.status).toBe(308);
        expect(response.headers.get('location')).toBe(
          `https://betterbagsmm.com/en${path}`
        );
      }),
      { numRuns: 20 }
    );
  });

  it('爬虫请求根路径 / 应 308 到 /en', () => {
    const response = middleware(request('/', GOOGLEBOT_UA));
    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe('https://betterbagsmm.com/en');
  });
});

describe('普通用户重定向语义保持不变(回归保护)', () => {
  it('无 cookie 无 geo 的用户请求 / 应 302 临时重定向(目标因人而异)', () => {
    const response = middleware(request('/', CHROME_UA));
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://betterbagsmm.com/en');
  });

  it('用户请求带前缀 URL 正常放行(非重定向)', () => {
    const response = middleware(request('/zh/blog', CHROME_UA));
    expect(response.status).toBeLessThan(300);
  });
});

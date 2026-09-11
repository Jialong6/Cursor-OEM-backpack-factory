/**
 * middleware —— geo_cc 国家码 cookie 写入
 *
 * 中间件本来就已经为地理路由读过 x-vercel-ip-country。顺手把它写成一个
 * 客户端可读的 cookie,分析脚本的两条地区门禁(中国跳过加载、EEA 弹同意条)
 * 就都不必再发请求、也不必打破 app/[locale]/layout.tsx 的静态生成。
 */
import { describe, test, expect } from 'vitest';
import { NextRequest } from 'next/server';
import middleware from '@/middleware';
import { GEO_COUNTRY_COOKIE } from '@/lib/analytics-config';

const CHROME_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const GOOGLEBOT_UA =
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

function visit(
  path: string,
  country?: string,
  userAgent: string = CHROME_UA
): NextRequest {
  const headers: Record<string, string> = { 'user-agent': userAgent };

  if (country) {
    headers['x-vercel-ip-country'] = country;
  }

  return new NextRequest(`https://betterbagsmm.com${path}`, { headers });
}

describe('geo_cc on locale-prefixed paths', () => {
  test('is written when the geo header is present', () => {
    const response = middleware(visit('/en', 'DE'));
    expect(response.cookies.get(GEO_COUNTRY_COOKIE)?.value).toBe('DE');
  });

  test('is readable by client scripts', () => {
    const response = middleware(visit('/en', 'DE'));
    expect(response.cookies.get(GEO_COUNTRY_COOKIE)?.httpOnly).toBeFalsy();
  });

  test('is written for mainland China so the China gate can act on it', () => {
    const response = middleware(visit('/zh', 'CN'));
    expect(response.cookies.get(GEO_COUNTRY_COOKIE)?.value).toBe('CN');
  });

  test('is not written when no geo header is present', () => {
    const response = middleware(visit('/en'));
    expect(response.cookies.get(GEO_COUNTRY_COOKIE)).toBeUndefined();
  });

  test('is written on inner pages too', () => {
    const response = middleware(visit('/en/blog', 'FR'));
    expect(response.cookies.get(GEO_COUNTRY_COOKIE)?.value).toBe('FR');
  });
});

describe('geo_cc on the unprefixed redirect path', () => {
  test('rides along with the locale redirect', () => {
    const response = middleware(visit('/', 'NL'));
    expect(response.status).toBe(302);
    expect(response.cookies.get(GEO_COUNTRY_COOKIE)?.value).toBe('NL');
  });
});

describe('geo_cc and crawlers', () => {
  test('is not written for bots, which never run the analytics scripts', () => {
    const response = middleware(visit('/en', 'DE', GOOGLEBOT_UA));
    expect(response.cookies.get(GEO_COUNTRY_COOKIE)).toBeUndefined();
  });
});

describe('geo_cc does not disturb existing behaviour', () => {
  test('the language preference cookie is still set', () => {
    const response = middleware(visit('/de', 'DE'));
    expect(response.cookies.get('NEXT_LOCALE')?.value).toBe('de');
  });

  test('bots still get a 308 to the default locale', () => {
    const response = middleware(visit('/', 'DE', GOOGLEBOT_UA));
    expect(response.status).toBe(308);
  });
});

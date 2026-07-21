/**
 * lib/redirects —— next.config redirects 规则验证
 *
 * 背景(GSC「重复网页」/「未找到 404」根因):
 * - www 子域整站 200 未归一到 apex,形成重复站点(实测 www.betterbagsmm.com/en 返回 200)
 * - 2026-05-28 博客改版删除 6 个旧 slug,曾被收录 4.5 个月,无 301 直接 404
 *
 * 验证:
 * - www 规则形状:has host 精确匹配、destination 指向 apex、permanent(308)
 * - APEX_ORIGIN 与 lib/metadata BASE_URL 防漂移
 * - 旧 slug 恰 6 个,与现存文章 slug 无交集(防未来误伤)
 * - 用 Next 真实匹配器(getPathMatch)锁死路由匹配行为:
 *   任意 locale × 旧 slug 命中且 locale 捕获完整(zh-tw 不被 zh 截断);
 *   现存文章 slug 不命中;无前缀变体单跳 /en/blog
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
// Next 内部 API(15.x 路径稳定);若升级 Next 后挪位,退化为字符串断言即可
import { getPathMatch } from 'next/dist/shared/lib/router/utils/path-match';
import {
  APEX_ORIGIN,
  REMOVED_BLOG_SLUGS,
  wwwToApexRedirect,
  removedBlogSlugRedirects,
  buildRedirects,
} from '@/lib/redirects';
import { BASE_URL } from '@/lib/metadata';
import { getAllBlogPosts } from '@/lib/blog-data';
import { locales, type Locale } from '@/i18n';

describe('www -> apex 归一规则', () => {
  it('buildRedirects 首条为 www 规则(先归一 host 再谈路径)', () => {
    expect(buildRedirects()[0]).toBe(wwwToApexRedirect);
  });

  it('www 规则形状:has host 精确匹配、destination 指向 apex、永久重定向', () => {
    expect(wwwToApexRedirect.source).toBe('/:path*');
    expect(wwwToApexRedirect.has).toEqual([
      { type: 'host', value: 'www\\.betterbagsmm\\.com' },
    ]);
    expect(wwwToApexRedirect.destination).toBe(`${APEX_ORIGIN}/:path*`);
    expect(wwwToApexRedirect.permanent).toBe(true);
  });

  it('APEX_ORIGIN 与 lib/metadata 的 BASE_URL 一致(防漂移)', () => {
    expect(APEX_ORIGIN).toBe(BASE_URL);
  });
});

describe('旧博客 slug 重定向规则', () => {
  const [prefixedRule, unprefixedRule] = removedBlogSlugRedirects;

  it('恰 6 个旧 slug,且与现存文章 slug 无交集', () => {
    expect(REMOVED_BLOG_SLUGS.length).toBe(6);
    const currentSlugs = new Set(getAllBlogPosts().map((post) => post.slug));
    for (const slug of REMOVED_BLOG_SLUGS) {
      expect(currentSlugs.has(slug), `${slug} 与现存文章冲突`).toBe(false);
    }
  });

  it('全部规则均为永久重定向', () => {
    for (const rule of buildRedirects()) {
      expect(rule.permanent).toBe(true);
    }
  });

  it('属性:任意 locale × 旧 slug 命中带前缀规则,locale 捕获完整(zh-tw 不被 zh 截断)', () => {
    const matcher = getPathMatch(prefixedRule.source);
    fc.assert(
      fc.property(
        fc.constantFrom(...locales),
        fc.constantFrom(...REMOVED_BLOG_SLUGS),
        (locale: Locale, slug: string) => {
          const params = matcher(`/${locale}/blog/${slug}`);
          expect(params).not.toBe(false);
          expect((params as Record<string, string>).locale).toBe(locale);
          expect((params as Record<string, string>).slug).toBe(slug);
        }
      ),
      { numRuns: 72 }
    );
    expect(prefixedRule.destination).toBe('/:locale/blog');
  });

  it('属性:现存文章 slug 不命中任何旧 slug 规则', () => {
    const prefixedMatcher = getPathMatch(prefixedRule.source);
    const unprefixedMatcher = getPathMatch(unprefixedRule.source);
    fc.assert(
      fc.property(
        fc.constantFrom(...locales),
        fc.constantFrom(...getAllBlogPosts().map((post) => post.slug)),
        (locale: Locale, slug: string) => {
          expect(prefixedMatcher(`/${locale}/blog/${slug}`)).toBe(false);
          expect(unprefixedMatcher(`/blog/${slug}`)).toBe(false);
        }
      ),
      { numRuns: 36 }
    );
  });

  it('无前缀变体命中并单跳 /en/blog(避免 308+302 两跳链)', () => {
    const matcher = getPathMatch(unprefixedRule.source);
    for (const slug of REMOVED_BLOG_SLUGS) {
      expect(matcher(`/blog/${slug}`)).not.toBe(false);
    }
    expect(unprefixedRule.destination).toBe('/en/blog');
  });
});

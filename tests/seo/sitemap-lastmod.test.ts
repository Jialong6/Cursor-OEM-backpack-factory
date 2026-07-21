/**
 * sitemap.xml —— lastModified 真实化验证
 *
 * 背景:此前 5 类静态页面的 lastModified 用 new Date(),每次部署全站
 * lastmod 集体刷新为构建时刻,与内容是否真实变更无关,损耗 Google 抓取信任
 * (GSC「已抓取-尚未编入索引」的诱因之一)。
 *
 * 验证:
 * - 确定性:系统时间移动 30 天,两次 sitemap() 输出深等(锁死 new Date() 回归)
 * - 各静态页面条目 lastModified 等于 lib/content-dates 对应常量
 * - 博客文章条目 = post.dateModified ?? post.date
 * - 博客列表条目 = 全部文章的最新修改日
 * - 守卫:所有条目日期合法且不在未来
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import sitemap from '@/app/sitemap';
import { BASE_URL } from '@/lib/metadata';
import { getAllBlogPosts } from '@/lib/blog-data';
import {
  HOME_DATE_MODIFIED,
  GLOSSARY_DATE_MODIFIED,
  FACT_SHEET_DATE_MODIFIED,
  VIRTUAL_TOUR_DATE_MODIFIED,
} from '@/lib/content-dates';
import { locales } from '@/i18n';

function entriesEndingWith(suffix: string) {
  return sitemap().filter((entry) => entry.url.endsWith(suffix));
}

function toTime(lastModified: string | Date | undefined): number {
  expect(lastModified).toBeDefined();
  return new Date(lastModified as string | Date).getTime();
}

describe('sitemap lastModified 确定性', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('系统时间移动 30 天,两次 sitemap() 输出应完全一致', () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date('2026-07-21T00:00:00.000Z'));
    const first = sitemap();

    vi.setSystemTime(new Date('2026-08-20T00:00:00.000Z'));
    const second = sitemap();

    expect(second).toEqual(first);
  });
});

describe('sitemap 各类条目 lastModified 取值', () => {
  it('首页条目等于 HOME_DATE_MODIFIED', () => {
    const homepages = sitemap().filter((entry) =>
      locales.some((locale) => entry.url === `${BASE_URL}/${locale}`)
    );
    expect(homepages.length).toBe(locales.length);
    for (const entry of homepages) {
      expect(toTime(entry.lastModified)).toBe(new Date(HOME_DATE_MODIFIED).getTime());
    }
  });

  it('glossary 条目等于 GLOSSARY_DATE_MODIFIED', () => {
    for (const entry of entriesEndingWith('/glossary')) {
      expect(toTime(entry.lastModified)).toBe(new Date(GLOSSARY_DATE_MODIFIED).getTime());
    }
  });

  it('fact-sheet 条目等于 FACT_SHEET_DATE_MODIFIED', () => {
    for (const entry of entriesEndingWith('/fact-sheet')) {
      expect(toTime(entry.lastModified)).toBe(new Date(FACT_SHEET_DATE_MODIFIED).getTime());
    }
  });

  it('virtual-factory-tour 条目等于 VIRTUAL_TOUR_DATE_MODIFIED', () => {
    for (const entry of entriesEndingWith('/virtual-factory-tour')) {
      expect(toTime(entry.lastModified)).toBe(new Date(VIRTUAL_TOUR_DATE_MODIFIED).getTime());
    }
  });

  it('博客文章条目等于 post.dateModified ?? post.date', () => {
    for (const post of getAllBlogPosts()) {
      const expected = new Date(post.dateModified ?? post.date).getTime();
      const postEntries = entriesEndingWith(`/blog/${post.slug}`);
      expect(postEntries.length).toBe(locales.length);
      for (const entry of postEntries) {
        expect(toTime(entry.lastModified)).toBe(expected);
      }
    }
  });

  it('博客列表条目等于全部文章的最新修改日', () => {
    const expected = Math.max(
      ...getAllBlogPosts().map((post) =>
        new Date(post.dateModified ?? post.date).getTime()
      )
    );
    const blogListEntries = entriesEndingWith('/blog');
    expect(blogListEntries.length).toBe(locales.length);
    for (const entry of blogListEntries) {
      expect(toTime(entry.lastModified)).toBe(expected);
    }
  });

  it('守卫:所有条目日期合法且不在未来', () => {
    for (const entry of sitemap()) {
      const time = toTime(entry.lastModified);
      expect(Number.isNaN(time), `${entry.url} 日期非法`).toBe(false);
      expect(time, `${entry.url} 是未来日期`).toBeLessThanOrEqual(Date.now());
    }
  });
});

/**
 * sitemap.xml —— Fact Sheet 条目验证
 *
 * 验证 /fact-sheet 已按全语言并入 sitemap:
 * - 以 /fact-sheet 结尾的条目恰 12 个(每语言一条)
 * - 每条 alternates.languages 恰 13 键(12 hreflang + x-default)
 * - x-default 指向 en 版本;含 zh-Hans / zh-Hant
 * - changeFrequency = monthly,priority = 0.8
 */

import { describe, it, expect } from 'vitest';
import sitemap from '@/app/sitemap';
import { BASE_URL } from '@/lib/metadata';
import { locales } from '@/i18n';

const entries = sitemap();
const factSheetEntries = entries.filter((entry) =>
  entry.url.endsWith('/fact-sheet')
);

describe('sitemap Fact Sheet 条目', () => {
  it('以 /fact-sheet 结尾的条目应恰为 12 个', () => {
    expect(factSheetEntries.length).toBe(locales.length);
    expect(factSheetEntries.length).toBe(12);
  });

  it('每语言各有一条对应 URL', () => {
    for (const locale of locales) {
      const match = factSheetEntries.find(
        (entry) => entry.url === `${BASE_URL}/${locale}/fact-sheet`
      );
      expect(match, `缺少 ${locale} 的 fact-sheet 条目`).toBeDefined();
    }
  });

  it('每条 changeFrequency 为 monthly、priority 为 0.8', () => {
    for (const entry of factSheetEntries) {
      expect(entry.changeFrequency).toBe('monthly');
      expect(entry.priority).toBe(0.8);
    }
  });

  it('每条 alternates.languages 应有 13 键,含 x-default / zh-Hans / zh-Hant', () => {
    for (const entry of factSheetEntries) {
      const languages = entry.alternates?.languages as Record<string, string>;
      expect(languages).toBeDefined();

      const keys = Object.keys(languages);
      expect(keys.length).toBe(13);

      expect(languages['x-default']).toBe(`${BASE_URL}/en/fact-sheet`);
      expect(languages['zh-Hans']).toBe(`${BASE_URL}/zh/fact-sheet`);
      expect(languages['zh-Hant']).toBe(`${BASE_URL}/zh-tw/fact-sheet`);
      expect(languages.en).toBe(`${BASE_URL}/en/fact-sheet`);
    }
  });
});

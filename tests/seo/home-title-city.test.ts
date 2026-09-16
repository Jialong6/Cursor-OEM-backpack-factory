/**
 * 首页标题里的城市名
 *
 * 背景(docs/seo/serp-audit-2026-08-01.md 的第 3 条建议):
 * Bing 上搜 "backpack factory yangon" 这家排第 1,Google 上却完全没有
 * 这个信号 —— 首页 title 里一个城市名都没有,只有国名。
 *
 * 「品类词 + 地名」是这个站已经被实测证明有效的模式(七个语种的
 * 「品类词 + Myanmar」都排第 1~2),只是此前只用到了国这一层。
 * 城市这一层对本地化搜索与地图结果都是实打实的信号,而且它正好是
 * 用户已经在 Google Business Profile 上注册的那个地址。
 *
 * 各语言用自己的写法(ヤンゴン / 양곤 / 仰光 / Янгон / ရန်ကုန်):
 * 买家是用自己的语言搜的,拉丁转写对 CJK 市场没有用。
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { locales, type Locale } from '@/i18n';

/** 各语言里「仰光」的本地写法 */
const CITY: Record<string, string> = {
  en: 'Yangon',
  de: 'Yangon',
  nl: 'Yangon',
  fr: 'Yangon',
  pt: 'Yangon',
  es: 'Yangon',
  ja: 'ヤンゴン',
  ko: '양곤',
  zh: '仰光',
  'zh-tw': '仰光',
  ru: 'Янгон',
  my: 'ရန်ကုန်',
};

function title(locale: Locale): string {
  const file = path.join(process.cwd(), 'locales', `${locale}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf-8')).metadata.home.title;
}

describe('首页 title', () => {
  it.each(locales)('%s 的标题带上城市名', (locale) => {
    expect(title(locale as Locale)).toContain(CITY[locale]);
  });

  it.each(locales)('%s 的标题仍带品牌词 —— 城市名不能把品牌挤掉', (locale) => {
    expect(title(locale as Locale)).toContain('Better Bags');
  });

  it.each(locales)('%s 的标题仍在 60 字符以内(Google 的截断线)', (locale) => {
    expect(title(locale as Locale).length).toBeLessThanOrEqual(60);
  });

  it('12 个语种覆盖齐,没有漏配城市名的语言', () => {
    expect(Object.keys(CITY).sort()).toEqual([...locales].sort());
  });
});

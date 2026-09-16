/**
 * Organization schema alternateName —— 品牌词的几种写法归到同一个实体
 *
 * 背景(docs/seo/serp-audit-2026-08-01.md):Google 上搜 "Better Bags Myanmar",
 * 五个地区的前 20 名里都没有官网 —— 位置被 Better Burma(慈善机构)、
 * Better Corporate、竞品 Orient Bag 占着。听说过这家厂的人搜不到它,
 * 这是纯漏斗损失,而且发生在漏斗最上面。
 *
 * alternateName 告诉搜索引擎「Better Bags」「BetterBags Myanmar」
 * 和注册全名 "Better Bags Myanmar Company Limited" 是同一个实体。
 * 这不保证排名,但它是能从代码这一侧做掉的那部分。
 *
 * 真正的大头在站外(sameAs 里那几个权威档案),那部分等档案开出来再补。
 */
import { describe, it, test, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string) => `translated:${key}`;
    t.raw = () => [];
    return t;
  },
  useLocale: () => 'en',
}));

import ManufacturingPlantSchema from '@/components/seo/ManufacturingPlantSchema';
import { FACTORY_INFO } from '@/lib/factory-info';

function jsonLd(): Record<string, unknown> {
  const { container } = render(<ManufacturingPlantSchema />);
  const script = container.querySelector('script[type="application/ld+json"]');
  return JSON.parse(script?.textContent || '{}');
}

describe('alternateName', () => {
  test('FACTORY_INFO 暴露别名数组', () => {
    expect(Array.isArray(FACTORY_INFO.alternateName)).toBe(true);
    expect(FACTORY_INFO.alternateName.length).toBeGreaterThan(0);
  });

  test('别名里含常见的简写与无空格写法', () => {
    expect(FACTORY_INFO.alternateName).toContain('Better Bags');
    expect(FACTORY_INFO.alternateName).toContain('Better Bags Myanmar');
    expect(FACTORY_INFO.alternateName).toContain('BetterBags Myanmar');
  });

  test('别名里不重复注册全名 —— 那是 name,不是 alternateName', () => {
    expect(FACTORY_INFO.alternateName).not.toContain(FACTORY_INFO.name);
  });

  it('别名互不重复', () => {
    expect(new Set(FACTORY_INFO.alternateName).size).toBe(FACTORY_INFO.alternateName.length);
  });

  test('渲染出的 JSON-LD 带上 alternateName', () => {
    expect(jsonLd().alternateName).toEqual(FACTORY_INFO.alternateName);
  });

  test('name 仍然是注册全名,别名不能把它顶掉', () => {
    expect(jsonLd().name).toBe('Better Bags Myanmar Company Limited');
  });
});

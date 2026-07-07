/**
 * FactSheetSchema JSON-LD 渲染输出验证
 *
 * 克隆 jsonld-render-output.test.tsx 的 next-intl mock 头(带 t.raw),
 * 渲染 FactSheetSchema 并验证生成的 <script type="application/ld+json"> 输出:
 * - 恰好 1 个 ld+json script 且可解析
 * - @type === 'AboutPage'
 * - mainEntity['@id'] 与根布局 Organization @id 逐字节一致
 * - dateModified 形如 YYYY-MM-DD 且以 2026-07 开头
 * - url 含 /en/fact-sheet
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

// Mock next-intl(与 jsonld-render-output.test.tsx 同款,带 t.raw)
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string) => `translated:${key}`;
    t.raw = () => [];
    return t;
  },
  useLocale: () => 'en',
}));

import FactSheetSchema, {
  FACT_SHEET_DATE_MODIFIED,
} from '@/components/seo/FactSheetSchema';

/** 从渲染结果中提取 JSON-LD script 标签内容 */
function extractJsonLd(container: HTMLElement): unknown[] {
  const scripts = container.querySelectorAll(
    'script[type="application/ld+json"]'
  );
  return Array.from(scripts).map((script) => {
    const text = script.textContent || script.innerHTML;
    return JSON.parse(text);
  });
}

describe('FactSheetSchema JSON-LD 渲染输出', () => {
  it('应渲染恰好 1 个 ld+json script', () => {
    const { container } = render(<FactSheetSchema locale="en" />);
    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    expect(scripts.length).toBe(1);
  });

  it('渲染的 JSON 应可解析且 @type 为 AboutPage', () => {
    const { container } = render(<FactSheetSchema locale="en" />);
    const jsonLdArray = extractJsonLd(container);

    expect(jsonLdArray.length).toBe(1);

    const schema = jsonLdArray[0] as Record<string, unknown>;
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('AboutPage');
  });

  it('mainEntity @id 应与 Organization 全局 @id 一致', () => {
    const { container } = render(<FactSheetSchema locale="en" />);
    const schema = extractJsonLd(container)[0] as Record<string, unknown>;
    const mainEntity = schema.mainEntity as Record<string, unknown>;

    expect(mainEntity['@id']).toBe('https://betterbagsmm.com/#organization');
  });

  it('dateModified 应形如 YYYY-MM-DD 且以 2026-07 开头', () => {
    const { container } = render(<FactSheetSchema locale="en" />);
    const schema = extractJsonLd(container)[0] as Record<string, unknown>;

    expect(schema.dateModified as string).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(schema.dateModified as string).toMatch(/^2026-07/);
    // 导出的常量与渲染值一致
    expect(schema.dateModified).toBe(FACT_SHEET_DATE_MODIFIED);
  });

  it('url 应包含 /en/fact-sheet', () => {
    const { container } = render(<FactSheetSchema locale="en" />);
    const schema = extractJsonLd(container)[0] as Record<string, unknown>;

    expect(schema.url as string).toContain('/en/fact-sheet');
  });

  it('inLanguage 应匹配传入的 locale', () => {
    const { container } = render(<FactSheetSchema locale="ja" />);
    const schema = extractJsonLd(container)[0] as Record<string, unknown>;

    expect(schema.inLanguage).toBe('ja');
    expect(schema.url as string).toContain('/ja/fact-sheet');
  });

  it('导出的 FACT_SHEET_DATE_MODIFIED 应为 2026-07-01', () => {
    expect(FACT_SHEET_DATE_MODIFIED).toBe('2026-07-01');
  });
});

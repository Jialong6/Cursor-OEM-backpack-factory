/**
 * Organization schema sameAs —— 实体消歧链接验证
 *
 * sameAs 把网站 Organization 实体与站外权威档案(LinkedIn 等)关联,
 * 是搜索引擎与 AI 引擎确认"这是同一家公司"的关键信号(GEO 实体对齐)。
 *
 * 验证:
 * - FACTORY_INFO 暴露 sameAs 数组(含 LinkedIn 公司页)
 * - ManufacturingPlantSchema 渲染输出的 JSON-LD 含 sameAs
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

// Mock next-intl(模式与 jsonld-render-output.test.tsx 一致)
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

const LINKEDIN_URL = 'https://www.linkedin.com/company/better-bags-myanmar/';
const GOOGLE_MAPS_URL =
  'https://www.google.com/maps/place/Better+Bags+Myanmar/@16.9304653,96.0619768,17z/';

/**
 * 从渲染结果中提取 JSON-LD script 内容
 */
function extractJsonLd(container: HTMLElement): Record<string, unknown> {
  const script = container.querySelector('script[type="application/ld+json"]');
  return JSON.parse(script?.textContent || '{}');
}

describe('Organization schema sameAs', () => {
  it('FACTORY_INFO 应包含 sameAs 数组且含 LinkedIn 公司页与 Google 商家档案', () => {
    expect(Array.isArray(FACTORY_INFO.sameAs)).toBe(true);
    expect(FACTORY_INFO.sameAs).toContain(LINKEDIN_URL);
    expect(FACTORY_INFO.sameAs).toContain(GOOGLE_MAPS_URL);
  });

  it('渲染的 JSON-LD 应输出 sameAs 字段', () => {
    const { container } = render(<ManufacturingPlantSchema />);
    const jsonLd = extractJsonLd(container);

    expect(Array.isArray(jsonLd.sameAs)).toBe(true);
    expect(jsonLd.sameAs as string[]).toContain(LINKEDIN_URL);
  });

  it('sameAs 中的每个条目都应是合法的 https URL', () => {
    for (const url of FACTORY_INFO.sameAs) {
      expect(url).toMatch(/^https:\/\//);
      expect(() => new URL(url)).not.toThrow();
    }
  });
});

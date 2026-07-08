/**
 * BreadcrumbSchema —— BreadcrumbList JSON-LD 验证
 *
 * 面包屑结构化数据帮助搜索引擎理解页面层级,并在搜索结果中
 * 展示路径导航。规范要点(Google Rich Results):
 * - @type: BreadcrumbList + itemListElement 数组
 * - 每项为 ListItem,position 从 1 递增
 * - 最后一项(当前页)可省略 item URL
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import { FACTORY_INFO } from '@/components/seo/ManufacturingPlantSchema';

const BASE_URL = FACTORY_INFO.url;

/**
 * 从渲染结果中提取 JSON-LD script 内容
 */
function extractJsonLd(container: HTMLElement): Record<string, unknown> {
  const script = container.querySelector('script[type="application/ld+json"]');
  return JSON.parse(script?.textContent || '{}');
}

describe('BreadcrumbSchema BreadcrumbList JSON-LD', () => {
  const items = [
    { name: 'Home', path: '/en' },
    { name: 'Blog', path: '/en/blog' },
    { name: 'Article Title' },
  ];

  it('应渲染 BreadcrumbList 类型的 JSON-LD', () => {
    const { container } = render(<BreadcrumbSchema items={items} />);
    const jsonLd = extractJsonLd(container);

    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@type']).toBe('BreadcrumbList');
  });

  it('itemListElement 应为 ListItem 数组且 position 从 1 递增', () => {
    const { container } = render(<BreadcrumbSchema items={items} />);
    const jsonLd = extractJsonLd(container);
    const list = jsonLd.itemListElement as Array<Record<string, unknown>>;

    expect(list.length).toBe(3);
    list.forEach((entry, index) => {
      expect(entry['@type']).toBe('ListItem');
      expect(entry.position).toBe(index + 1);
      expect(entry.name).toBe(items[index].name);
    });
  });

  it('有 path 的项应拼接 BASE_URL 为完整 item URL', () => {
    const { container } = render(<BreadcrumbSchema items={items} />);
    const jsonLd = extractJsonLd(container);
    const list = jsonLd.itemListElement as Array<Record<string, unknown>>;

    expect(list[0].item).toBe(`${BASE_URL}/en`);
    expect(list[1].item).toBe(`${BASE_URL}/en/blog`);
  });

  it('最后一项(当前页)应省略 item 字段', () => {
    const { container } = render(<BreadcrumbSchema items={items} />);
    const jsonLd = extractJsonLd(container);
    const list = jsonLd.itemListElement as Array<Record<string, unknown>>;

    expect(list[2].item).toBeUndefined();
  });

  it('特殊字符应被 JSON 安全序列化', () => {
    const { container } = render(
      <BreadcrumbSchema
        items={[
          { name: 'Home', path: '/en' },
          { name: 'Q&A "quoted" title' },
        ]}
      />
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(() => JSON.parse(script?.textContent || '')).not.toThrow();
  });
});

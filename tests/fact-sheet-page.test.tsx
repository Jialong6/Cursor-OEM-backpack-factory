/**
 * Fact Sheet 页面测试
 *
 * 块 1:纯展示组件 FactSheet —— 用 en.json 数据直灌 props,零 mock,
 *       验证语义结构(单 h1、单 dl、19 组 dt/dd、intro/lastUpdated 可见)。
 * 块 2:server 页 FactSheetPage —— mock next-intl/server(必须带 t.raw,
 *       裸 mock 不足以支撑 t.raw('facts')),await 组件后 render,
 *       验证 h1 + AboutPage JSON-LD + 19 行事实。
 */

import { describe, it, expect, vi } from 'vitest';
import { render, within } from '@testing-library/react';
import fs from 'fs';
import path from 'path';

// 直读 en.json 的 factSheet 作为测试数据源(与运行时同一份文案)
const enJson = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'locales', 'en.json'), 'utf-8')
);
const enFactSheet = enJson.factSheet as {
  title: string;
  intro: string;
  lastUpdated: string;
  facts: ReadonlyArray<{ label: string; value: string }>;
};

// ============ 块 2 所需 mock:next-intl/server(带 t.raw) ============
// 照 tests/seo/jsonld-render-output.test.tsx 的 t.raw 模式;
// getTranslations 按 namespace 返回:factSheet -> 真实文案 + facts 数组
vi.mock('next-intl/server', () => ({
  // page.tsx 引入 @/i18n(locale 校验),i18n.ts 模块顶层调用 getRequestConfig,须一并 mock
  getRequestConfig: (fn: unknown) => fn,
  getTranslations: async ({ namespace }: { namespace?: string } = {}) => {
    if (namespace === 'metadata.factSheet') {
      const t = (key: string) =>
        (enJson.metadata.factSheet as Record<string, string>)[key] ?? key;
      return t;
    }
    // 默认按 factSheet namespace 提供数据
    const t = (key: string) => {
      const value = (enFactSheet as Record<string, unknown>)[key];
      return typeof value === 'string' ? value : key;
    };
    (t as unknown as { raw: (key: string) => unknown }).raw = (key: string) =>
      (enFactSheet as Record<string, unknown>)[key];
    return t;
  },
}));

// FactSheetSchema 是 'use client' 组件(useLocale 无关紧要),mock next-intl 以避免 provider 依赖
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string) => key;
    t.raw = () => [];
    return t;
  },
  useLocale: () => 'en',
}));

import FactSheet from '@/components/sections/FactSheet';
import FactSheetPage from '@/app/[locale]/fact-sheet/page';

describe('FactSheet 展示组件(块 1)', () => {
  function renderFactSheet() {
    return render(
      <FactSheet
        title={enFactSheet.title}
        intro={enFactSheet.intro}
        lastUpdated={enFactSheet.lastUpdated}
        facts={enFactSheet.facts}
      />
    );
  }

  it('应只有一个 h1 且文本为 en 标题', () => {
    const { container } = renderFactSheet();
    const h1s = container.querySelectorAll('h1');
    expect(h1s.length).toBe(1);
    expect(h1s[0].textContent).toBe(enFactSheet.title);
  });

  it('应使用 main 语义标签', () => {
    const { container } = renderFactSheet();
    expect(container.querySelector('main')).not.toBeNull();
  });

  it('应恰好一个 dl,含 19 组 dt/dd', () => {
    const { container } = renderFactSheet();
    const dls = container.querySelectorAll('dl');
    expect(dls.length).toBe(1);

    const dts = container.querySelectorAll('dl dt');
    const dds = container.querySelectorAll('dl dd');
    expect(dts.length).toBe(19);
    expect(dds.length).toBe(19);
  });

  it('每组 dt/dd 文本应与对应 fact 一致', () => {
    const { container } = renderFactSheet();
    const dts = Array.from(container.querySelectorAll('dl dt'));
    const dds = Array.from(container.querySelectorAll('dl dd'));

    enFactSheet.facts.forEach((fact, i) => {
      expect(dts[i].textContent).toBe(fact.label);
      expect(dds[i].textContent).toBe(fact.value);
    });
  });

  it('intro 与 lastUpdated 文本应可见', () => {
    const { container } = renderFactSheet();
    const text = container.textContent ?? '';
    expect(text).toContain(enFactSheet.intro);
    expect(text).toContain(enFactSheet.lastUpdated);
  });

  it('关键事实 AQL 2.5 应出现在渲染 HTML 中(SSR 直出,无 JS 依赖)', () => {
    const { container } = renderFactSheet();
    expect(container.textContent ?? '').toContain('AQL 2.5');
  });
});

describe('FactSheetPage server 页(块 2)', () => {
  /** await async server 组件后交给 RTL */
  async function renderPage() {
    const element = await FactSheetPage({
      params: Promise.resolve({ locale: 'en' }),
    });
    return render(element);
  }

  it('应渲染唯一 h1(en 标题)', async () => {
    const { container } = await renderPage();
    const h1s = container.querySelectorAll('h1');
    expect(h1s.length).toBe(1);
    expect(h1s[0].textContent).toBe(enFactSheet.title);
  });

  it('应输出 AboutPage JSON-LD', async () => {
    const { container } = await renderPage();
    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    // 页面含 AboutPage + BreadcrumbList 两段 JSON-LD
    expect(scripts.length).toBe(2);

    const schemas = Array.from(scripts).map(
      (s) => JSON.parse(s.textContent || '') as Record<string, unknown>
    );
    const schema = schemas.find((s) => s['@type'] === 'AboutPage');
    expect(schema, '缺少 AboutPage JSON-LD').toBeDefined();
    const mainEntity = schema!.mainEntity as Record<string, unknown>;
    expect(mainEntity['@id']).toBe('https://betterbagsmm.com/#organization');

    const breadcrumb = schemas.find((s) => s['@type'] === 'BreadcrumbList');
    expect(breadcrumb, '缺少 BreadcrumbList JSON-LD').toBeDefined();
  });

  it('应渲染 19 组 dt/dd', async () => {
    const { container } = await renderPage();
    const dl = container.querySelector('dl');
    expect(dl).not.toBeNull();

    const dts = within(dl as HTMLElement).getAllByRole('term');
    const dds = within(dl as HTMLElement).getAllByRole('definition');
    expect(dts.length).toBe(19);
    expect(dds.length).toBe(19);
  });

  it('关键事实(邮箱、AQL 2.5)应在 SSR HTML 中直出', async () => {
    const { container } = await renderPage();
    const text = container.textContent ?? '';
    expect(text).toContain('jay@betterbagsmm.com');
    expect(text).toContain('AQL 2.5');
  });
});

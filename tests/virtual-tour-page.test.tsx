/**
 * 虚拟看厂落地页测试
 *
 * 块 1:纯展示组件 VirtualTour —— 用 en.json 数据直灌 props,零 mock,
 *       验证语义结构(单 h1、4 张 whatYouSee 卡、3 步流程、5 组详情
 *       dt/dd、bookingSlot 插槽渲染)。
 * 块 2:server 页 VirtualFactoryTourPage —— mock next-intl/server(带
 *       支持点路径的 t.raw),await 组件后 render,验证 h1 + 恰好两段
 *       JSON-LD(Service 的 provider.@id 对齐 Organization + BreadcrumbList)。
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import fs from 'fs';
import path from 'path';

// 直读 en.json 的 virtualTour 作为测试数据源(与运行时同一份文案)
const enJson = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'locales', 'en.json'), 'utf-8')
);
const enTour = enJson.virtualTour as {
  title: string;
  subtitle: string;
  intro: string;
  highlights: ReadonlyArray<string>;
  whatYouSee: {
    title: string;
    items: ReadonlyArray<{ title: string; desc: string }>;
  };
  howItWorks: {
    title: string;
    steps: ReadonlyArray<{ title: string; desc: string }>;
  };
  details: {
    title: string;
    items: ReadonlyArray<{ label: string; value: string }>;
  };
  booking: { title: string; languageNote: string };
};

/** 按点路径取值('whatYouSee.items' 之类的嵌套 raw key) */
function getPath(obj: Record<string, unknown>, key: string): unknown {
  return key
    .split('.')
    .reduce<unknown>(
      (cur, part) =>
        cur && typeof cur === 'object'
          ? (cur as Record<string, unknown>)[part]
          : undefined,
      obj
    );
}

// ============ 块 2 所需 mock:next-intl/server(t + 点路径 t.raw) ============
vi.mock('next-intl/server', () => ({
  // page.tsx 引入 @/i18n(locale 校验),i18n.ts 模块顶层调用 getRequestConfig,须一并 mock
  getRequestConfig: (fn: unknown) => fn,
  getTranslations: async ({ namespace }: { namespace?: string } = {}) => {
    const source: Record<string, unknown> =
      namespace === 'metadata.virtualTour'
        ? (enJson.metadata.virtualTour as Record<string, unknown>)
        : namespace === 'nav'
          ? (enJson.nav as Record<string, unknown>)
          : (enJson.virtualTour as Record<string, unknown>);
    const t = (key: string) => {
      const value = getPath(source, key);
      return typeof value === 'string' ? value : key;
    };
    (t as unknown as { raw: (key: string) => unknown }).raw = (key: string) =>
      getPath(source, key);
    return t;
  },
}));

// 页面组合的 'use client' 组件(VirtualTourSchema/BreadcrumbSchema/CalTourEmbed)
// 依赖 next-intl hooks,统一 mock 以避免 provider
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string) => key;
    t.raw = () => [];
    return t;
  },
  useLocale: () => 'en',
}));

// CalTourEmbed 引入 @calcom/embed-react:mock 掉,零网络零 iframe
vi.mock('@calcom/embed-react', () => ({
  default: ({ calLink }: { calLink: string }) => (
    <div data-testid="cal-inline" data-cal-link={calLink} />
  ),
  getCalApi: vi.fn(async () => vi.fn()),
}));

import VirtualTour from '@/components/sections/VirtualTour';
import VirtualFactoryTourPage from '@/app/[locale]/virtual-factory-tour/page';

describe('VirtualTour 展示组件(块 1)', () => {
  function renderTour() {
    return render(
      <VirtualTour
        title={enTour.title}
        subtitle={enTour.subtitle}
        intro={enTour.intro}
        highlights={enTour.highlights}
        whatYouSeeTitle={enTour.whatYouSee.title}
        whatYouSeeItems={enTour.whatYouSee.items}
        howItWorksTitle={enTour.howItWorks.title}
        howItWorksSteps={enTour.howItWorks.steps}
        detailsTitle={enTour.details.title}
        detailsItems={enTour.details.items}
        bookingTitle={enTour.booking.title}
        bookingSlot={<div data-testid="booking-slot" />}
      />
    );
  }

  it('应只有一个 h1 且文本为 en 标题', () => {
    const { container } = renderTour();
    const h1s = container.querySelectorAll('h1');
    expect(h1s.length).toBe(1);
    expect(h1s[0].textContent).toBe(enTour.title);
  });

  it('应使用 main 语义标签,且亮点徽章逐条可见', () => {
    const { container } = renderTour();
    expect(container.querySelector('main')).not.toBeNull();
    const text = container.textContent ?? '';
    enTour.highlights.forEach((highlight) => {
      expect(text).toContain(highlight);
    });
  });

  it('应渲染 4 张 whatYouSee 卡与 3 步 howItWorks', () => {
    const { container } = renderTour();
    const text = container.textContent ?? '';

    expect(enTour.whatYouSee.items.length).toBe(4);
    enTour.whatYouSee.items.forEach((item) => {
      expect(text).toContain(item.title);
      expect(text).toContain(item.desc);
    });

    expect(enTour.howItWorks.steps.length).toBe(3);
    const stepItems = container.querySelectorAll('ol > li');
    expect(stepItems.length).toBe(3);
  });

  it('应渲染 5 组详情 dt/dd 且文本一致', () => {
    const { container } = renderTour();
    const dts = Array.from(container.querySelectorAll('dl dt'));
    const dds = Array.from(container.querySelectorAll('dl dd'));
    expect(dts.length).toBe(5);
    expect(dds.length).toBe(5);

    enTour.details.items.forEach((item, i) => {
      expect(dts[i].textContent).toBe(item.label);
      expect(dds[i].textContent).toBe(item.value);
    });
  });

  it('应渲染 bookingSlot 插槽内容', () => {
    const { queryByTestId } = renderTour();
    expect(queryByTestId('booking-slot')).not.toBeNull();
  });
});

describe('VirtualFactoryTourPage server 页(块 2)', () => {
  /** await async server 组件后交给 RTL */
  async function renderPage() {
    const element = await VirtualFactoryTourPage({
      params: Promise.resolve({ locale: 'en' }),
    });
    return render(element);
  }

  it('应渲染唯一 h1(en 标题)', async () => {
    const { container } = await renderPage();
    const h1s = container.querySelectorAll('h1');
    expect(h1s.length).toBe(1);
    expect(h1s[0].textContent).toBe(enTour.title);
  });

  it('应输出恰好两段 JSON-LD:Service(provider 对齐 Organization)+ BreadcrumbList', async () => {
    const { container } = await renderPage();
    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    expect(scripts.length).toBe(2);

    const schemas = Array.from(scripts).map(
      (s) => JSON.parse(s.textContent || '') as Record<string, unknown>
    );

    const service = schemas.find((s) => s['@type'] === 'Service');
    expect(service, '缺少 Service JSON-LD').toBeDefined();
    const provider = service!.provider as Record<string, unknown>;
    expect(provider['@id']).toBe('https://betterbagsmm.com/#organization');
    expect(service!.isAccessibleForFree).toBe(true);
    expect(service!.url).toBe(
      'https://betterbagsmm.com/en/virtual-factory-tour'
    );

    const hours = service!.hoursAvailable as Record<string, unknown>;
    expect(hours.opens).toBe('07:30');
    expect(hours.closes).toBe('17:00');
    expect(hours.dayOfWeek).toHaveLength(6);

    const breadcrumb = schemas.find((s) => s['@type'] === 'BreadcrumbList');
    expect(breadcrumb, '缺少 BreadcrumbList JSON-LD').toBeDefined();
  });

  it('落地页文案(60 分钟/Zoom)应在 SSR HTML 中直出', async () => {
    const { container } = await renderPage();
    const text = container.textContent ?? '';
    expect(text).toContain('60 minutes');
    expect(text).toContain('Zoom');
  });
});

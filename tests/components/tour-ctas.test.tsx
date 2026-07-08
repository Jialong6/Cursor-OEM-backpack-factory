/**
 * 虚拟看厂 CTA 接入测试
 *
 * 验证四处入口均指向 /{locale}/virtual-factory-tour:
 * - HeroBanner 次级按钮(banner.secondaryCta)
 * - Bento CTASection 文字链接(bento.cta.tourLink)
 * - Contact 左栏预约卡(contact.tour.*)
 * - FAQ cta 区第三个交叉链接(faq.cta.tourLink)
 * - footer.links 数据:12 语均含 /virtual-factory-tour 项(Footer 组件
 *   对非 # 链接自动加 locale 前缀,无需渲染)
 *
 * 使用真实 en.json 作为 messages,文案断言与线上数据一致。
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import fs from 'fs';
import path from 'path';
import HeroBanner from '@/components/sections/HeroBanner';
import { CTASection } from '@/components/bento/CTASection';
import Contact from '@/components/sections/Contact';
import FAQ from '@/components/sections/FAQ';
import { locales } from '@/i18n';

// Contact 的重子组件与本测试无关,mock 掉(QuoteFormFields 依赖 Provider)
vi.mock('@/components/quote/QuoteFormFields', () => ({
  default: () => <div data-testid="quote-form" />,
}));
vi.mock('@/components/content/TrustSignals', () => ({
  default: () => <div data-testid="trust-signals" />,
}));
vi.mock('@/components/content/FactoryMapEmbed', () => ({
  default: () => <div data-testid="factory-map" />,
}));

const LOCALES_DIR = path.join(process.cwd(), 'locales');

const messages = JSON.parse(
  fs.readFileSync(path.join(LOCALES_DIR, 'en.json'), 'utf-8')
);

const TOUR_HREF = '/en/virtual-factory-tour';

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('虚拟看厂 CTA 接入', () => {
  it('HeroBanner 应渲染指向 tour 页的次级 CTA', () => {
    const { container } = renderWithIntl(<HeroBanner />);
    const link = container.querySelector(`a[href="${TOUR_HREF}"]`);

    expect(link).not.toBeNull();
    expect(link!.textContent).toBe(messages.banner.secondaryCta);
  });

  it('Bento CTASection 应渲染指向 tour 页的文字链接', () => {
    const { container } = renderWithIntl(<CTASection />);
    const link = container.querySelector(`a[href="${TOUR_HREF}"]`);

    expect(link).not.toBeNull();
    expect(link!.textContent).toBe(messages.bento.cta.tourLink);
  });

  it('Contact 左栏应渲染预约看厂卡且按钮指向 tour 页', () => {
    const { container } = renderWithIntl(<Contact />);
    const text = container.textContent ?? '';

    expect(text).toContain(messages.contact.tour.title);
    expect(text).toContain(messages.contact.tour.desc);

    const link = container.querySelector(`a[href="${TOUR_HREF}"]`);
    expect(link).not.toBeNull();
    expect(link!.textContent).toBe(messages.contact.tour.cta);
  });

  it('FAQ cta 区应渲染指向 tour 页的交叉链接', () => {
    const { container } = renderWithIntl(<FAQ />);
    const link = container.querySelector(`a[href="${TOUR_HREF}"]`);

    expect(link).not.toBeNull();
    expect(link!.textContent).toBe(messages.faq.cta.tourLink);
  });

  it('12 语 footer.links 均应含 /virtual-factory-tour 项且名称非空', () => {
    for (const locale of locales) {
      const raw = JSON.parse(
        fs.readFileSync(path.join(LOCALES_DIR, `${locale}.json`), 'utf-8')
      ) as {
        footer: { links: ReadonlyArray<{ name: string; href: string }> };
      };

      const tourLink = raw.footer.links.find(
        (link) => link.href === '/virtual-factory-tour'
      );
      expect(tourLink, `${locale}.json footer.links 缺少 tour 项`).toBeDefined();
      expect(tourLink!.name.trim().length).toBeGreaterThan(0);
    }
  });
});

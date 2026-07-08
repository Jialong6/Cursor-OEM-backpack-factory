import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import fc from 'fast-check';
import CalTourEmbed from '@/components/booking/CalTourEmbed';
import { locales } from '@/i18n';

/**
 * CalTourEmbed 行为矩阵测试
 *
 * - 正常 locale + 已配置链接:渲染 Cal.com embed + 备选联系行
 * - zh:不加载 embed(大陆可达性),渲染 WhatsApp/邮件/表单替代卡
 * - my:embed + "预约表单可能显示为英文"提示条(Cal.com 不支持缅文)
 * - 未配置 NEXT_PUBLIC_CAL_LINK:渲染替代卡(防御,不显示坏 embed)
 *
 * Mock @calcom/embed-react:零网络、零 iframe。
 */
vi.mock('@calcom/embed-react', () => ({
  default: ({ calLink, namespace }: { calLink: string; namespace?: string }) => (
    <div
      data-testid="cal-inline"
      data-cal-link={calLink}
      data-namespace={namespace}
    />
  ),
  getCalApi: vi.fn(async () => vi.fn()),
}));

const messages = {
  virtualTour: {
    booking: {
      languageNote: 'The booking form may appear in English.',
    },
    fallback: {
      title: 'Book your tour via WhatsApp or email',
      desc: 'Message us your preferred time and we will confirm within 24 hours.',
      emailSubject: 'Virtual Factory Tour Booking Request',
      messageTemplate: 'Hello, I would like to book a tour. Preferred time: ',
      whatsappCta: 'WhatsApp us',
      emailCta: 'Email us',
      contactCta: 'Use the contact form',
    },
    alternative: {
      text: 'Prefer email or WhatsApp?',
      linkText: 'Contact us instead',
    },
  },
  contact: {
    whatsapp: { value: '+95 9 123 456 789' },
    email: { value: 'jay@betterbagsmm.com' },
  },
};

const TEST_CAL_LINK = 'better-bags/virtual-factory-tour';

function renderWithLocale(locale: string) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <CalTourEmbed />
    </NextIntlClientProvider>
  );
}

describe('CalTourEmbed', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_CAL_LINK', TEST_CAL_LINK);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    cleanup();
  });

  it('renders the Cal.com embed with the configured cal link for en', () => {
    const { container, queryByTestId } = renderWithLocale('en');
    const embed = queryByTestId('cal-inline');

    expect(embed).not.toBeNull();
    expect(embed!.getAttribute('data-cal-link')).toBe(TEST_CAL_LINK);
    // 备选联系行(兜底 embed 加载失败的访客)
    expect(container.textContent).toContain(
      messages.virtualTour.alternative.text
    );
  });

  it('renders the fallback contact card instead of the embed for zh', () => {
    const { container, queryByTestId } = renderWithLocale('zh');

    expect(queryByTestId('cal-inline')).toBeNull();
    expect(container.textContent).toContain(
      messages.virtualTour.fallback.title
    );

    // WhatsApp 链接:wa.me 号码部分必须是纯数字(旧实现残留 + 与点号,
    // "+1 814.880.1463" 会生成无效链接),并带预填消息
    const whatsappLink = container.querySelector('a[href^="https://wa.me/"]');
    expect(whatsappLink).not.toBeNull();
    expect(whatsappLink!.getAttribute('href')).toBe(
      `https://wa.me/959123456789?text=${encodeURIComponent(
        messages.virtualTour.fallback.messageTemplate
      )}`
    );

    // mailto 链接:带预填主题与正文
    const mailtoLink = container.querySelector(
      'a[href^="mailto:jay@betterbagsmm.com"]'
    );
    expect(mailtoLink).not.toBeNull();
    expect(mailtoLink!.getAttribute('href')).toBe(
      `mailto:jay@betterbagsmm.com?subject=${encodeURIComponent(
        messages.virtualTour.fallback.emailSubject
      )}&body=${encodeURIComponent(
        messages.virtualTour.fallback.messageTemplate
      )}`
    );

    // 联系表单链接(带 locale 前缀)
    const contactLink = container.querySelector('a[href="/zh#contact"]');
    expect(contactLink).not.toBeNull();

    // 明文兜底:号码与邮箱直接可见(跳转失败也能手动联系)
    expect(container.textContent).toContain('+95 9 123 456 789');
    expect(container.textContent).toContain('jay@betterbagsmm.com');
  });

  it('shows the English-form language note for my (Burmese unsupported by Cal.com)', () => {
    const { container, queryByTestId } = renderWithLocale('my');

    expect(queryByTestId('cal-inline')).not.toBeNull();
    expect(container.textContent).toContain(
      messages.virtualTour.booking.languageNote
    );
  });

  it('does not show the language note for locales Cal.com supports', () => {
    const { container } = renderWithLocale('ja');
    expect(container.textContent).not.toContain(
      messages.virtualTour.booking.languageNote
    );
  });

  it('renders the fallback card when NEXT_PUBLIC_CAL_LINK is not configured', () => {
    vi.stubEnv('NEXT_PUBLIC_CAL_LINK', '');
    const { container, queryByTestId } = renderWithLocale('en');

    expect(queryByTestId('cal-inline')).toBeNull();
    expect(container.textContent).toContain(
      messages.virtualTour.fallback.title
    );
  });

  it('Property: every locale except zh renders the embed; zh always gets the fallback card', () => {
    fc.assert(
      fc.property(fc.constantFrom(...locales), (locale) => {
        cleanup();
        const { container, queryByTestId } = renderWithLocale(locale);
        const embed = queryByTestId('cal-inline');

        if (locale === 'zh') {
          expect(embed).toBeNull();
          expect(container.textContent).toContain(
            messages.virtualTour.fallback.title
          );
        } else {
          expect(embed).not.toBeNull();
          expect(embed!.getAttribute('data-cal-link')).toBe(TEST_CAL_LINK);
        }
      }),
      { numRuns: 100 }
    );
  });
});

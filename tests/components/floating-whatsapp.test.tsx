/**
 * 全站常驻的 WhatsApp 入口
 *
 * 背景(埋点数据):首页 15 次落地里,只有 2 次滚到过第 10 屏的 contact 区,
 * 0 次开始填表 —— 而在此之前,全站的 wa.me / tel: / mailto: 只存在于那一屏。
 * 更糟的是 /blog、/glossary、/fact-sheet、/virtual-factory-tour 这些子页面
 * 连报价浮窗都没有(它只挂在 app/[locale]/page.tsx),询盘入口为零。
 *
 * OEM 这行本来就是在 WhatsApp 上谈的,所以低门槛入口选它,而不是动那张
 * 8 个必填项的表单。
 */
import { describe, it, test, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import fs from 'fs';
import path from 'path';
import FloatingWhatsApp from '@/components/contact/FloatingWhatsApp';
import { toWhatsAppNumber } from '@/lib/contact-links';
import { locales, type Locale } from '@/i18n';

const LOCALES_DIR = path.join(process.cwd(), 'locales');

function loadMessages(locale: Locale) {
  return JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, `${locale}.json`), 'utf-8'));
}

function renderWidget(locale: Locale = 'en') {
  return render(
    <NextIntlClientProvider locale={locale} messages={loadMessages(locale)}>
      <FloatingWhatsApp />
    </NextIntlClientProvider>
  );
}

function link(locale: Locale = 'en'): HTMLAnchorElement {
  renderWidget(locale);
  return screen.getByRole('link') as HTMLAnchorElement;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('链接本身', () => {
  test('指向 wa.me,号码是纯数字 —— 带点或带加号 WhatsApp 会判无效', () => {
    const href = link().getAttribute('href') ?? '';
    const number = loadMessages('en').contact.whatsapp.value as string;

    expect(href.startsWith(`https://wa.me/${toWhatsAppNumber(number)}`)).toBe(true);
    expect(href).not.toMatch(/wa\.me\/[^?]*[.+()\s-]/);
  });

  test('带一句预填消息,买家点开就有话可发', () => {
    const href = link().getAttribute('href') ?? '';

    expect(href).toContain('?text=');
    expect(decodeURIComponent(href.split('?text=')[1]).length).toBeGreaterThan(10);
  });

  test('新标签页打开,并且带 noopener —— 否则新页面能改写原页面', () => {
    const anchor = link();

    expect(anchor.getAttribute('target')).toBe('_blank');
    expect(anchor.getAttribute('rel')).toContain('noopener');
  });
});

describe('埋点', () => {
  test('带 data-analytics-label,委托监听器据此记 whatsapp_click', () => {
    expect(link().getAttribute('data-analytics-label')).toBe('floating');
  });

  test('标签里不含号码本身', () => {
    const label = link().getAttribute('data-analytics-label') ?? '';

    expect(label).not.toMatch(/\d/);
  });
});

describe('无障碍与多语言', () => {
  it.each(locales)('%s 有可读的无障碍名称,且预填消息已本地化', (locale) => {
    const messages = loadMessages(locale as Locale);
    const anchor = link(locale as Locale);

    expect(anchor).toHaveAccessibleName(messages.floatingContact.aria);

    const text = decodeURIComponent((anchor.getAttribute('href') ?? '').split('?text=')[1] ?? '');
    expect(text).toBe(messages.floatingContact.prefill);
  });

  test('图标对读屏隐藏,免得把 svg 念出来', () => {
    const { container } = renderWidget();

    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('定位', () => {
  /**
   * 报价浮窗固定在右上(top 可拖、right: 16),所以这个走右下角 ——
   * 两者不抢同一块地方,而右下角本来就是 WhatsApp 按钮的通用位置。
   */
  test('固定在视口右下角', () => {
    const anchor = link();

    expect(anchor.className).toContain('fixed');
    expect(anchor.className).toMatch(/\bbottom-/);
    expect(anchor.className).toMatch(/\bright-/);
  });

  test('层级低于同意条,欧盟访客先看到的仍然是同意选择', () => {
    // ConsentBanner 是 z-[60],这里必须更低
    expect(link().className).toContain('z-40');
  });
});

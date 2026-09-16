/**
 * 成本优势区的美国关税对比
 *
 * 背景(埋点数据):costAdvantage 是全站停留最久的板块(平均 41 秒,
 * features 24 秒、about 20 秒),而且三天里唯一那次 CTA 点击就来自它。
 * 也就是说这是站上最好的一块版位。
 *
 * 而站上最强的一份内容 —— lib/blog-posts/us-tariff-myanmar-bags-2026,
 * 逐行核对 USITC 2026 年 HTS 第 17 修订版做出来的 —— 此前只能从 /blog
 * 列表翻到。最好的内容和最好的版位是分开的。
 *
 * 更要紧的是:这一区现在讲的「较中国/越南低 10%」说的是**出厂价**,
 * 而美国买家真正付的是**落地成本**。按 17.6% / 30.1% / 55.1% 这组数字,
 * 真实差距远不止 10%。
 *
 * 税率是事实,不是文案:这里锁死 12 语的数值必须一致(允许 17,6% 这种
 * 本地化小数点写法),否则哪个语种被改错了没人会发现。
 */
import { describe, it, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import fs from 'fs';
import path from 'path';
import CostAdvantage from '@/components/sections/CostAdvantage';
import { locales, type Locale } from '@/i18n';

vi.mock('next/navigation', () => ({
  usePathname: () => '/en',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock('@/lib/analytics/beacon', () => ({
  track: vi.fn(),
  trackDwell: vi.fn(),
  flush: vi.fn(),
  resetPageView: vi.fn(),
  getPageViewId: () => 'pv-test',
}));

const LOCALES_DIR = path.join(process.cwd(), 'locales');

function loadMessages(locale: Locale) {
  return JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, `${locale}.json`), 'utf-8'));
}

function renderSection(locale: Locale = 'en') {
  return render(
    <NextIntlClientProvider locale={locale} messages={loadMessages(locale)}>
      <CostAdvantage />
    </NextIntlClientProvider>
  );
}

function tariff(locale: Locale) {
  return loadMessages(locale).costAdvantage.tariff as {
    title: string;
    subtitle: string;
    note: string;
    linkText: string;
    rows: Array<{ code: string; name: string; rate: string }>;
  };
}

/** "17.6%" / "17,6 %" → 17.6。小数点写法各语言不同,数值必须一致 */
function rateValue(rate: string): number {
  return Number(rate.replace(/[^\d.,]/g, '').replace(',', '.'));
}

const EXPECTED = { MM: 17.6, VN: 30.1, CN: 55.1 } as const;

describe('渲染', () => {
  test('三个国家的税率都出现在页面上', () => {
    renderSection();

    for (const row of tariff('en').rows) {
      expect(screen.getByText(row.rate)).toBeInTheDocument();
    }
  });

  test('链到那篇完整的关税文章,并带当前语言前缀', () => {
    const { container } = renderSection('ja');
    const link = container.querySelector('a[href*="us-tariff-myanmar-bags-2026"]');

    expect(link?.getAttribute('href')).toBe('/ja/blog/us-tariff-myanmar-bags-2026');
  });

  test('标注数据来源与口径 —— 写错税率比不写更伤信任', () => {
    renderSection();

    const note = tariff('en').note;
    expect(note).toMatch(/USITC/);
    expect(screen.getByText(note)).toBeInTheDocument();
  });

  test('缅甸那一行被高亮,它是三者里最低的', () => {
    const { container } = renderSection();
    const row = container.querySelector('[data-tariff-row="MM"]');

    expect(row).not.toBeNull();
    expect(row?.className).toMatch(/border-primary|bg-primary/);
  });

  test('原有的三张对比卡与 CTA 没有被挤掉', () => {
    renderSection();

    expect(screen.getByRole('link', { name: 'Get A Quote' })).toBeInTheDocument();
    expect(screen.getByLabelText('Myanmar (Better Bags)')).toBeInTheDocument();
  });
});

describe('12 语的数值一致性', () => {
  it.each(locales)('%s 的三个税率与英文版数值相同', (locale) => {
    const rows = tariff(locale as Locale).rows;

    expect(rows.map((r) => r.code)).toEqual(['MM', 'VN', 'CN']);

    for (const row of rows) {
      expect(rateValue(row.rate)).toBe(EXPECTED[row.code as keyof typeof EXPECTED]);
    }
  });

  it.each(locales)('%s 的国名与链接文案都不为空', (locale) => {
    const block = tariff(locale as Locale);

    expect(block.linkText.trim().length).toBeGreaterThan(0);
    for (const row of block.rows) {
      expect(row.name.trim().length).toBeGreaterThan(0);
    }
  });

  it('缅甸是三者里最低的 —— 这整块内容的论点就建立在这上面', () => {
    expect(EXPECTED.MM).toBeLessThan(EXPECTED.VN);
    expect(EXPECTED.VN).toBeLessThan(EXPECTED.CN);
  });
});

'use client';

import type React from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useAnchorScroll } from '@/hooks/useNavigation';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

/** 美国进口关税对比的一行 */
type TariffRow = {
  code: 'CN' | 'VN' | 'MM';
  name: string;
  rate: string;
};

type Country = {
  code: 'CN' | 'VN' | 'MM';
  name: string;
  priceLabel: string;
  priceValue: string;
  pricePercent: number;
  leadTimeLabel: string;
  leadTimeValue: string;
  leadTimePercent: number;
  badge?: string;
};

/**
 * 成本优势对比区块
 *
 * 三列卡片对比中国 / 越南 / 缅甸：价格 + 交期。
 * 同样出口日本的前提下，强调缅甸"用更长交期换更低成本"的卖点。
 */
export default function CostAdvantage() {
  const t = useTranslations('costAdvantage');
  const locale = useLocale();
  const scrollToAnchor = useAnchorScroll();
  const titleAnim = useScrollAnimation({ variant: 'fade-up' });
  const cardsAnim = useScrollAnimation({ variant: 'fade-up', delay: 100 });

  const countries = t.raw('countries') as Country[];

  return (
    <section
      id="costAdvantage"
      className="relative bg-neutral-50 px-6 py-20 md:px-12 lg:py-28"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div
          ref={titleAnim.ref as React.RefObject<HTMLDivElement>}
          className={`text-center mb-12 ${titleAnim.animationClassName}`}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-deep mb-4">
            {t('title')}
          </h2>
          <p className="text-base md:text-lg text-neutral-600 max-w-3xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        <div
          ref={cardsAnim.ref as React.RefObject<HTMLDivElement>}
          className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${cardsAnim.animationClassName}`}
        >
          {countries.map((c) => (
            <CountryCard key={c.code} country={c} />
          ))}
        </div>

        <TariffBand locale={locale} />

        <p className="mt-12 text-center text-base md:text-lg text-neutral-700 max-w-3xl mx-auto leading-relaxed">
          {t('takeaway')}
        </p>
        <div className="mt-8 text-center">
          {/*
            href 保持不变:tests/components/CostAdvantage.test.tsx 断言它是
            "#contact",而且 JS 挂掉时原生锚点仍然可用。加上 onClick 之后
            这处才终于有了导航栏偏移与平滑滚动 —— 此前它是六处里唯一没有的。
          */}
          <a
            href="#contact"
            onClick={(e) => scrollToAnchor('#contact', e, { cta: 'cost_advantage' })}
            className="inline-block bg-primary hover:bg-primary-dark text-white font-bold px-8 py-3 rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-primary/30"
          >
            {t('cta')}
          </a>
        </div>
      </div>
    </section>
  );
}

/**
 * 美国进口关税对比
 *
 * 为什么单独一条带,而不是塞进上面三张卡:那三张卡的口径是「同样出口日本」
 * 的出厂价与交期,关税是美国专属的另一个维度,混在一起读者会以为
 * 17.6% 和「低 10%」说的是一回事。它们恰恰不是一回事 ——
 * 「低 10%」是出厂价,关税差的是落地成本,后者大得多。
 *
 * 数据出处写在页面上(USITC HTS 2026 Rev. 17):关税变得快,
 * 标了口径和版本,读者才能自己复核 —— 写错税率比不写更伤信任。
 */
function TariffBand({ locale }: { locale: string }) {
  const t = useTranslations('costAdvantage.tariff');
  const rows = t.raw('rows') as TariffRow[];

  return (
    <div className="mt-12 rounded-xl border border-neutral-200 bg-white p-6 md:p-8">
      <h3 className="text-xl md:text-2xl font-bold text-deep text-center">{t('title')}</h3>
      <p className="mt-3 text-sm md:text-base text-neutral-600 text-center max-w-3xl mx-auto leading-relaxed">
        {t('subtitle')}
      </p>

      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {rows.map((row) => {
          const highlight = row.code === 'MM';
          return (
            <li
              key={row.code}
              data-tariff-row={row.code}
              className={`flex items-baseline justify-between gap-3 rounded-lg px-4 py-3 ${
                highlight
                  ? 'border-2 border-primary bg-primary/5'
                  : 'border border-neutral-200 bg-neutral-50'
              }`}
            >
              <span className="text-sm font-medium text-neutral-700">{row.name}</span>
              <span
                className={`text-lg font-bold tabular-nums ${
                  highlight ? 'text-primary' : 'text-neutral-700'
                }`}
              >
                {row.rate}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-5 text-xs text-neutral-500 text-center max-w-3xl mx-auto leading-relaxed">
        {t('note')}
      </p>
      <div className="mt-4 text-center">
        <Link
          href={`/${locale}/blog/us-tariff-myanmar-bags-2026`}
          className="text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary-dark"
        >
          {t('linkText')}
        </Link>
      </div>
    </div>
  );
}

function CountryCard({ country }: { country: Country }) {
  const highlight = country.code === 'MM';
  return (
    <article
      className={`rounded-xl p-6 md:p-8 transition-all ${
        highlight
          ? 'bg-white border-2 border-primary ring-4 ring-primary/10 shadow-md md:scale-[1.02]'
          : 'bg-white border border-neutral-200'
      }`}
      aria-label={country.name}
    >
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex h-10 w-10 items-center justify-center rounded-md text-sm font-bold ${
              highlight ? 'bg-primary text-white' : 'bg-neutral-100 text-neutral-700'
            }`}
          >
            {country.code}
          </span>
          <h3 className="text-xl font-bold text-deep">{country.name}</h3>
        </div>
        {country.badge && (
          <span className="shrink-0 inline-flex items-center justify-center whitespace-nowrap text-center text-xs font-semibold px-2 py-1 rounded-full bg-primary text-white">
            {country.badge}
          </span>
        )}
      </header>

      <Metric
        label={country.priceLabel}
        value={country.priceValue}
        percent={country.pricePercent}
        highlight={highlight}
      />
      <div className="h-4" />
      <Metric
        label={country.leadTimeLabel}
        value={country.leadTimeValue}
        percent={country.leadTimePercent}
        highlight={highlight}
      />
    </article>
  );
}

function Metric({
  label,
  value,
  percent,
  highlight,
}: {
  label: string;
  value: string;
  percent: number;
  highlight: boolean;
}) {
  const barColor = highlight ? 'bg-primary' : 'bg-neutral-300';
  const width = Math.max(8, Math.min(100, percent));
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm font-medium text-neutral-600">{label}</span>
        <span
          className={`text-sm font-bold ${
            highlight ? 'text-primary' : 'text-neutral-700'
          }`}
        >
          {value}
        </span>
      </div>
      <div
        className="h-2 bg-neutral-100 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={`${label}: ${value}`}
      >
        <div
          className={`h-full ${barColor} rounded-full transition-all`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

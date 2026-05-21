'use client';

import type React from 'react';
import { useTranslations } from 'next-intl';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

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

        <p className="mt-12 text-center text-base md:text-lg text-neutral-700 max-w-3xl mx-auto leading-relaxed">
          {t('takeaway')}
        </p>
        <div className="mt-8 text-center">
          <a
            href="#contact"
            className="inline-block bg-primary hover:bg-primary-dark text-white font-bold px-8 py-3 rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-primary/30"
          >
            {t('cta')}
          </a>
        </div>
      </div>
    </section>
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

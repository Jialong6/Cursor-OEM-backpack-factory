'use client';

import type React from 'react';
import { useTranslations } from 'next-intl';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

type DifferentiatorKey = 'qc' | 'cost' | 'leadTime';

type Differentiator = {
  key: DifferentiatorKey;
  title: string;
  description: string;
};

/**
 * 差异化卖点区块
 *
 * 三条"我们与同行工厂的硬实力差异"：
 * - 日式风控标准（断针换针台账 + X 光机全检）
 * - 中缅结合造价（中国供应链 + 仰光人工）
 * - 固定生产周期（4 个月锁定、不超接产能）
 */
export default function WhatSetsUsApart() {
  const t = useTranslations('whatSetsUsApart');
  const titleAnim = useScrollAnimation({ variant: 'fade-up' });
  const cardsAnim = useScrollAnimation({ variant: 'fade-up', delay: 100 });

  const items = t.raw('items') as Differentiator[];

  return (
    <section
      id="whatSetsUsApart"
      className="relative bg-white px-6 py-20 md:px-12 lg:py-28"
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
          {items.map((item) => (
            <DifferentiatorCard key={item.key} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DifferentiatorCard({ item }: { item: Differentiator }) {
  return (
    <article
      className="rounded-xl bg-white border border-neutral-200 p-6 md:p-8 transition-all hover:shadow-md hover:border-primary/40"
      aria-label={item.title}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
        <Icon name={item.key} />
      </div>
      <h3 className="text-xl font-bold text-deep mb-3">{item.title}</h3>
      <p className="text-sm md:text-base text-neutral-600 leading-relaxed">
        {item.description}
      </p>
    </article>
  );
}

function Icon({ name }: { name: DifferentiatorKey }) {
  const common = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (name) {
    case 'qc':
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case 'cost':
      return (
        <svg {...common}>
          <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
          <polyline points="16 17 22 17 22 11" />
        </svg>
      );
    case 'leadTime':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
          <path d="M12 14v2" />
          <circle cx="12" cy="18" r="0.5" fill="currentColor" />
        </svg>
      );
  }
}

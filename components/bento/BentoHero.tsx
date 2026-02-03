'use client';

import { useTranslations } from 'next-intl';
import { BentoGrid } from './BentoGrid';
import { BentoCard } from './BentoCard';
import { DynamicDashboard } from './DynamicDashboard';
import { TrustBadges } from './TrustBadges';
import { CTASection } from './CTASection';

/**
 * BentoHero - 首屏 Bento Grid 布局
 *
 * 整合四个象限组件，实现古腾堡图表布局:
 * ┌─────────────────┬─────────────────┐
 * │   TOP-LEFT      │   TOP-RIGHT     │
 * │   品牌+价值主张   │   DynamicDashboard │
 * ├─────────────────┼─────────────────┤
 * │   BOTTOM-LEFT   │   BOTTOM-RIGHT  │
 * │   TrustBadges   │   CTASection    │
 * └─────────────────┴─────────────────┘
 *
 * 响应式布局:
 * - 移动端: 单列堆叠
 * - 平板/桌面: 2x2 网格，首屏完整可见
 */
export function BentoHero() {
  const t = useTranslations('banner');
  const tBento = useTranslations('bento');

  return (
    <BentoGrid fullHeight>
      {/* 左上: 品牌 + 价值主张 (Primary Optical Area) */}
      <BentoCard
        position="top-left"
        className="flex flex-col justify-center bg-white"
      >
        <div className="max-w-xl">
          {/* 主标语 */}
          <h1 className="mb-3 text-3xl font-bold leading-tight text-deep md:text-4xl lg:text-5xl">
            {t('line1')}
          </h1>
          <h2 className="mb-6 text-xl font-semibold text-primary md:text-2xl lg:text-3xl">
            {t('line2')}
          </h2>

          {/* 描述文字 */}
          <div className="space-y-3 text-sm leading-relaxed text-neutral-600 md:text-base">
            <p>
              {t('p1.pre')}
              <span className="font-bold text-primary">
                {t('p1.highlight')}
              </span>
              {t('p1.post')}
            </p>
            <p className="hidden md:block">{t('p2')}</p>
          </div>
        </div>
      </BentoCard>

      {/* 右上: 数据看板 (Strong Fallow Area) */}
      <BentoCard
        position="top-right"
        className="bg-neutral-50"
      >
        <DynamicDashboard />
      </BentoCard>

      {/* 左下: 信任徽章 (Weak Fallow Area) */}
      <BentoCard
        position="bottom-left"
        className="bg-white"
      >
        <TrustBadges />
      </BentoCard>

      {/* 右下: CTA区块 (Terminal Area) */}
      <BentoCard
        position="bottom-right"
        className="bg-gradient-to-br from-primary/5 to-primary/10"
      >
        <CTASection />
      </BentoCard>
    </BentoGrid>
  );
}

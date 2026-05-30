'use client';

import type React from 'react';
import { useTranslations } from 'next-intl';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

type QuadrantPosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

type Quadrant = {
  position: QuadrantPosition;
  title: string;
  description: string;
  badge?: string;
};

type AxisLabels = {
  xLow: string;
  xHigh: string;
  yLow: string;
  yHigh: string;
};

/**
 * 市场定位 2x2 矩阵区块
 *
 * X 轴：利润空间（左 微薄 → 右 可观）
 * Y 轴：交付质量与风险控制（下 失控 → 上 可靠）
 * 四象限对比 Better Bags 与同行的市场位置。
 */
export default function MarketPositioning() {
  const t = useTranslations('marketPositioning');
  const titleAnim = useScrollAnimation({ variant: 'fade-up' });
  const matrixAnim = useScrollAnimation({ variant: 'fade-up', delay: 100 });

  const quadrants = t.raw('quadrants') as Quadrant[];
  const axisLabels: AxisLabels = {
    xLow: t('axes.profit.low'),
    xHigh: t('axes.profit.high'),
    yLow: t('axes.quality.low'),
    yHigh: t('axes.quality.high'),
  };

  return (
    <section
      id="marketPositioning"
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
          ref={matrixAnim.ref as React.RefObject<HTMLDivElement>}
          className={`max-w-5xl mx-auto ${matrixAnim.animationClassName}`}
        >
          <Matrix quadrants={quadrants} axisLabels={axisLabels} />
        </div>
      </div>
    </section>
  );
}

function Matrix({
  quadrants,
  axisLabels,
}: {
  quadrants: Quadrant[];
  axisLabels: AxisLabels;
}) {
  const order: QuadrantPosition[] = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];
  const byPos = new Map(quadrants.map((q) => [q.position, q]));

  return (
    // 外层 padding 为网格四周的坐标轴标签预留空间
    <div className="px-16 sm:px-20 md:px-28 pt-12 pb-10 md:pb-12">
      <div className="relative grid grid-cols-2 gap-2 md:gap-4">
        {/* 2x2 卡片 */}
        {order.map((pos) => {
          const q = byPos.get(pos);
          if (!q) return null;
          return <QuadrantCard key={pos} quadrant={q} />;
        })}

        {/* 居中十字：竖线穿网格水平正中，横线穿网格垂直正中 */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-neutral-300"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 bg-neutral-300"
          aria-hidden="true"
        />

        {/* Y 高（上方，居中于竖线，文字在网格外不压线）：标签 + 上箭头 */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex w-32 flex-col items-center text-center">
          <span className="text-[10px] md:text-xs font-semibold text-neutral-700 leading-tight">
            {axisLabels.yHigh}
          </span>
          <ArrowUpIcon />
        </div>
        {/* Y 低（下方居中） */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-32 text-center">
          <span className="text-[10px] md:text-xs text-neutral-500 leading-tight">
            {axisLabels.yLow}
          </span>
        </div>

        {/* X 高（右侧，居中于横线）：标签 + 右箭头 */}
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 flex w-12 items-center gap-1 md:w-24">
          <span className="text-[10px] md:text-xs font-semibold text-neutral-700 leading-tight">
            {axisLabels.xHigh}
          </span>
          <ArrowRightIcon />
        </div>
        {/* X 低（左侧，居中于横线） */}
        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 w-12 text-right md:w-20">
          <span className="text-[10px] md:text-xs text-neutral-500 leading-tight">
            {axisLabels.xLow}
          </span>
        </div>
      </div>
    </div>
  );
}

function QuadrantCard({ quadrant }: { quadrant: Quadrant }) {
  const styles = quadrantStyles(quadrant.position);
  return (
    <article
      className={`rounded-xl p-4 md:p-6 min-h-[8rem] md:min-h-[10rem] flex flex-col transition-all ${styles.container}`}
      aria-label={quadrant.title}
    >
      <header className="flex items-start justify-between gap-2 mb-2">
        <h3 className={`text-base md:text-lg font-bold ${styles.title}`}>
          {quadrant.title}
        </h3>
        {quadrant.badge && (
          <span className="shrink-0 text-[10px] md:text-xs font-semibold px-2 py-0.5 rounded-full bg-primary text-white">
            {quadrant.badge}
          </span>
        )}
      </header>
      <p className={`text-xs md:text-sm leading-relaxed ${styles.body}`}>
        {quadrant.description}
      </p>
    </article>
  );
}

function quadrantStyles(position: QuadrantPosition) {
  switch (position) {
    case 'topRight':
      return {
        container: 'bg-white border-2 border-primary ring-4 ring-primary/15 shadow-lg',
        title: 'text-deep',
        body: 'text-neutral-700',
      };
    case 'bottomLeft':
      return {
        container: 'bg-neutral-100 border border-neutral-200',
        title: 'text-neutral-500',
        body: 'text-neutral-500',
      };
    default:
      return {
        container: 'bg-white border border-neutral-300',
        title: 'text-deep',
        body: 'text-neutral-600',
      };
  }
}

function ArrowUpIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-primary"
      aria-hidden="true"
    >
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-primary"
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

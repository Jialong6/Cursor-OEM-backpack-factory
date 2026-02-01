'use client';

import { ReactNode } from 'react';

export interface BentoGridProps {
  children: ReactNode;
  fullHeight?: boolean;
  className?: string;
}

/**
 * BentoGrid - 四象限 Bento 网格容器
 *
 * 响应式布局策略:
 * - 移动端 (<768px): 单列 flex 布局
 * - 平板端 (768-1279px): 2x2 grid 布局
 * - 桌面端 (>=1280px): 2x2 grid, min-h-[calc(100vh-80px)] 首屏完整可见
 *
 * 四象限布局 (古腾堡图表):
 * ┌─────────────────┬─────────────────┐
 * │   TOP-LEFT      │   TOP-RIGHT     │
 * │   品牌+价值主张   │   DynamicDashboard │
 * ├─────────────────┼─────────────────┤
 * │   BOTTOM-LEFT   │   BOTTOM-RIGHT  │
 * │   TrustBadges   │   CTASection    │
 * └─────────────────┴─────────────────┘
 */
export function BentoGrid({
  children,
  fullHeight = true,
  className = '',
}: BentoGridProps) {
  const heightClass = fullHeight
    ? 'lg:min-h-[calc(100vh-80px)]'
    : '';

  return (
    <section
      id="banner"
      className={`
        relative
        flex
        flex-col
        gap-4
        bg-neutral-50
        px-4
        py-8
        md:grid
        md:grid-cols-2
        md:grid-rows-2
        md:gap-6
        md:px-8
        md:py-12
        lg:gap-8
        lg:px-12
        lg:py-16
        ${heightClass}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </section>
  );
}

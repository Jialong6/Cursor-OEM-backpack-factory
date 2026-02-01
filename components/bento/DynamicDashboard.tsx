'use client';

import { useTranslations } from 'next-intl';

interface StatItem {
  label: string;
  value: string;
}

/**
 * DynamicDashboard - 数据看板组件 (右上象限)
 *
 * 古腾堡图表 Strong Fallow Area:
 * 用户视线第二个注意点，展示关键数据指标
 *
 * 功能:
 * - 复用 features.stats 数据结构
 * - 6个统计卡片的 2x3 网格布局
 * - 响应式设计
 */
export function DynamicDashboard() {
  const tFeatures = useTranslations('features');

  const stats = tFeatures.raw('stats') as StatItem[];

  return (
    <div
      data-testid="dynamic-dashboard"
      className="flex h-full flex-col"
    >
      {/* 标题 */}
      <h3 className="mb-4 text-lg font-semibold text-neutral-700 md:text-xl">
        Key Metrics
      </h3>

      {/* 统计卡片网格 */}
      <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="
              flex
              flex-col
              items-center
              justify-center
              rounded-lg
              bg-white
              p-3
              shadow-sm
              transition-transform
              hover:scale-105
              hover:shadow-md
              md:p-4
            "
          >
            <div className="mb-1 text-xl font-bold text-primary md:text-2xl lg:text-3xl">
              {stat.value}
            </div>
            <div className="text-center text-xs text-neutral-600 md:text-sm">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

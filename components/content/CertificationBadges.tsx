'use client';

import { useTranslations } from 'next-intl';
import { FACTORY_INFO } from '@/components/seo/ManufacturingPlantSchema';

/**
 * CertificationBadges 组件属性
 */
interface CertificationBadgesProps {
  readonly variant?: 'horizontal' | 'grid';
  readonly showLabels?: boolean;
}

/**
 * 认证徽章图标（盾牌 SVG）
 */
function ShieldIcon() {
  return (
    <svg
      className="h-5 w-5 text-primary"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

/**
 * 认证徽章可视化组件
 *
 * 展示工厂持有的国际认证标准徽章（ISO 9001, OEKO-TEX, GRS, GOTS）。
 * 数据来源：FACTORY_INFO.credentials
 *
 * 支持两种布局变体：
 * - horizontal: 水平排列（联系页使用）
 * - grid: 网格布局（关于页使用）
 */
export default function CertificationBadges({
  variant = 'horizontal',
  showLabels = false,
}: CertificationBadgesProps) {
  const t = useTranslations('certifications');

  const certifications = FACTORY_INFO.credentials;

  const containerClass = variant === 'grid'
    ? 'grid grid-cols-2 gap-3 sm:grid-cols-4'
    : 'flex flex-wrap gap-3';

  return (
    <div aria-label={t('title')}>
      {showLabels && (
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          {t('title')}
        </h4>
      )}
      <div className={containerClass}>
        {certifications.map((cert) => (
          <div
            key={cert}
            className="flex items-center gap-2 rounded-lg bg-neutral-50 border border-neutral-200 px-3 py-2"
          >
            <ShieldIcon />
            <span className="text-sm font-medium text-neutral-700">{cert}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

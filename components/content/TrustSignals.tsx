'use client';

import { useTranslations } from 'next-intl';
import CertificationBadges from './CertificationBadges';

/**
 * 信任信号组件
 *
 * 用于联系页左栏，展示 E-E-A-T 信任信号：
 * - 国际认证徽章
 * - 24 小时响应承诺
 * - 20+ 年制造经验
 * - 专业资质简介
 */
export default function TrustSignals() {
  const t = useTranslations('contact.trust');

  return (
    <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-6">
      <h3 className="mb-4 text-lg font-semibold text-neutral-800">
        {t('title')}
      </h3>

      {/* 信任指标 */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-3">
          <svg
            className="h-5 w-5 shrink-0 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm text-neutral-600">{t('responseTime')}</span>
        </div>

        <div className="flex items-center gap-3">
          <svg
            className="h-5 w-5 shrink-0 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <span className="text-sm text-neutral-600">{t('experience')}</span>
        </div>

        <div className="flex items-center gap-3">
          <svg
            className="h-5 w-5 shrink-0 text-primary"
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
          <span className="text-sm text-neutral-600">{t('certified')}</span>
        </div>
      </div>

      {/* 认证徽章 */}
      <CertificationBadges variant="horizontal" />
    </div>
  );
}

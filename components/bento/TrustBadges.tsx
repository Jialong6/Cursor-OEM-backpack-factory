'use client';

import { useTranslations } from 'next-intl';

interface Badge {
  id: string;
  name: string;
  description: string;
}

/**
 * TrustBadges - 信任徽章组件 (左下象限)
 *
 * 古腾堡图表 Weak Fallow Area:
 * 展示认证和合作品牌，增强信任感
 *
 * 功能:
 * - ISO 9001:2015, OEKO-TEX, BSCI 认证徽章
 * - 合作品牌展示 (仅名称，保密要求)
 * - 响应式布局
 */
export function TrustBadges() {
  const t = useTranslations('bento');

  // 认证徽章数据
  const certifications: Badge[] = [
    {
      id: 'iso',
      name: 'ISO 9001:2015',
      description: 'Quality Management System',
    },
    {
      id: 'oeko',
      name: 'OEKO-TEX',
      description: 'Tested for Harmful Substances',
    },
    {
      id: 'bsci',
      name: 'BSCI',
      description: 'Business Social Compliance',
    },
  ];

  // 合作品牌 (仅展示名称)
  const partnerBrands = [
    'Anello',
    'New Balance',
    'Nike',
    'Fila',
  ];

  return (
    <div
      data-testid="trust-badges"
      className="flex h-full flex-col"
    >
      {/* 认证徽章 */}
      <div className="mb-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Certifications
        </h3>
        <div className="flex flex-wrap gap-2">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="
                rounded-full
                bg-primary/10
                px-3
                py-1.5
                text-xs
                font-medium
                text-primary-dark
                md:text-sm
              "
              title={cert.description}
            >
              {cert.name}
            </div>
          ))}
        </div>
      </div>

      {/* 合作品牌 */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Trusted By
        </h3>
        <div className="flex flex-wrap gap-2">
          {partnerBrands.map((brand, index) => (
            <span
              key={index}
              className="
                rounded-md
                bg-neutral-100
                px-3
                py-1.5
                text-xs
                font-medium
                text-neutral-600
                md:text-sm
              "
            >
              {brand}
            </span>
          ))}
          <span className="
            rounded-md
            bg-neutral-100
            px-3
            py-1.5
            text-xs
            font-medium
            text-neutral-400
            md:text-sm
          ">
            +20 more
          </span>
        </div>
      </div>
    </div>
  );
}

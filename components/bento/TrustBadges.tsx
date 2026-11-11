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
 * 2026-11 清理:原本硬编码了 ISO 9001:2015 / OEKO-TEX / BSCI 三个认证徽章,
 * 工厂并不持有(已确认),全部撤下。本组件只在 ?bento=true 时渲染,
 * 但公开可达,照样是对外声称。
 *
 * 合作品牌名(Anello / New Balance / Nike / Fila)同时撤下 —— 未经书面授权
 * 公开代工客户名,既受保密条款约束,也有商标与暗示背书的风险。
 * 拿到授权后再逐个放回来。
 *
 * 徽章位现在放有依据的事实:成立年份与员工规模(见 lib/factory-info.ts)。
 * 读到 SMETA 报告原件后,这里可以加一条审核信息。
 *
 * 功能:
 * - 可核验的事实徽章
 * - 响应式布局
 */
export function TrustBadges() {
  const t = useTranslations('bento');

  // 只放手里有依据的事实。新增一项前先去
  // tests/seo/credential-claims.test.ts 的白名单登记并写下凭据出处。
  const certifications: Badge[] = [
    {
      id: 'experience',
      name: '20+ Years',
      description: 'OEM bag manufacturing since 2003',
    },
    {
      id: 'scale',
      name: '600+ Staff',
      description: 'In-house production team',
    },
  ];

  // 合作品牌暂不展示:需要客户的书面公开授权
  const partnerBrands: readonly string[] = [];

  return (
    <div
      data-testid="trust-badges"
      className="flex h-full flex-col"
    >
      {/* 认证徽章 */}
      <div className="mb-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          {t('trust.certifications')}
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
          {t('trust.title')}
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
            text-neutral-600
            md:text-sm
          ">
            {t('trust.more')}
          </span>
        </div>
      </div>
    </div>
  );
}

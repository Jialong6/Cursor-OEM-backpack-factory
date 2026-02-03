'use client';

import { useTranslations, useLocale } from 'next-intl';

/**
 * 关于我们区块组件
 *
 * 功能：
 * - 展示公司使命和愿景
 * - 展示六大核心价值观
 * - 展示公司历史和合作品牌
 * - 包含 Organization JSON-LD 结构化数据
 *
 * 验证需求：7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */
export default function AboutUs() {
  const t = useTranslations('about');
  const locale = useLocale();

  // 获取六大核心价值观
  const values = t.raw('values') as Array<{
    title: string;
    desc: string;
  }>;

  return (
    <>
      {/* Organization JSON-LD 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Better Bags Myanmar Company Limited',
            url: 'https://betterbagsmyanmar.com',
            logo: 'https://betterbagsmyanmar.com/logo.png',
            description: t('mission.desc'),
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Plot No. 48, Myay Taing Block No.24, Ngwe Pin Lai Industrial Zone',
              addressLocality: 'Yangon',
              addressCountry: 'MM',
            },
            contactPoint: {
              '@type': 'ContactPoint',
              telephone: '+1-814-880-1463',
              contactType: 'Customer Service',
              email: 'jay@biteerbags.com',
            },
            foundingDate: '2003',
            founder: {
              '@type': 'Person',
              name: 'Li Guangtong',
            },
          }),
        }}
      />

      <section
        id="about"
        className="relative bg-white px-6 py-20 md:px-12 lg:py-28"
      >
        <div className="mx-auto w-full max-w-7xl">
          {/* 标题 */}
          <h2 className="mb-16 text-center text-3xl font-bold text-neutral-800 md:text-4xl lg:text-5xl">
            {t('title')}
          </h2>

          {/* 使命和愿景 */}
          <div className="mb-16 grid gap-8 md:grid-cols-2">
            {/* 使命 */}
            <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-neutral-800">
                  {t('mission.title')}
                </h3>
              </div>
              <p className="leading-relaxed text-neutral-600">
                {t('mission.desc')}
              </p>
            </div>

            {/* 愿景 */}
            <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-neutral-800">
                  {t('vision.title')}
                </h3>
              </div>
              <p className="leading-relaxed text-neutral-600">
                {t('vision.desc')}
              </p>
            </div>
          </div>

          {/* 六大核心价值观 */}
          <div className="mb-16">
            <h3 className="mb-10 text-center text-2xl font-bold text-neutral-800 md:text-3xl">
              {t('valuesTitle')}
            </h3>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="group rounded-lg border border-neutral-200 bg-white p-6 transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {index + 1}
                    </span>
                    <h4 className="text-lg font-bold text-neutral-800">
                      {value.title}
                    </h4>
                  </div>
                  <p className="text-sm leading-relaxed text-neutral-500">
                    {value.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 公司历史和介绍 */}
          <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-8 md:p-12">
            <h3 className="mb-6 text-center text-2xl font-bold text-neutral-800 md:text-3xl">
              {t('company.title')}
            </h3>
            <div className="mx-auto max-w-4xl space-y-4 text-neutral-600">
              <p className="leading-relaxed">{t('company.p1')}</p>
              <p className="leading-relaxed">{t('company.p2')}</p>
              <p className="leading-relaxed">{t('company.p3')}</p>
              <p className="leading-relaxed">{t('company.p4')}</p>
            </div>

            {/* 合作品牌展示 */}
            <div className="mt-10 border-t border-neutral-200 pt-8">
              <p className="mb-6 text-center text-sm font-semibold uppercase tracking-wide text-neutral-500">
                {locale === 'en' ? 'Trusted by Global Brands' : '与全球知名品牌合作'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-8">
                {['Anello', 'New Balance', 'Nike', 'Fila'].map((brand) => (
                  <div
                    key={brand}
                    className="flex h-16 w-32 items-center justify-center rounded-lg bg-white border border-neutral-200 px-4 py-2 transition-transform hover:scale-105"
                  >
                    <span className="text-lg font-bold text-neutral-500">
                      {brand}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

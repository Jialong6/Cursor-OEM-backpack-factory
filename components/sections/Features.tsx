'use client';

import { useTranslations } from 'next-intl';

/**
 * 特色区块组件
 *
 * 功能：
 * - 展示 Jay 个人介绍
 * - 展示四大核心优势（使用对应品牌色）
 * - 展示定制选项介绍
 * - "立即定制" CTA 按钮
 *
 * 验证需求：8.1, 8.2, 8.3, 8.4, 8.5
 */
export default function Features() {
  const t = useTranslations('features');
  const tCustom = useTranslations('customization');

  // 获取四大核心优势
  const advantages = t.raw('list') as Array<{
    title: string;
    color: string;
    desc: string;
  }>;

  // 获取定制选项
  const customFeatures = tCustom.raw('features') as Array<{
    title: string;
    desc: string;
    highlights: string[];
  }>;

  const handleScrollToContact = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      const navbarHeight = 80;
      const targetPosition =
        contactSection.getBoundingClientRect().top +
        window.pageYOffset -
        navbarHeight;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section
      id="features"
      className="relative bg-gradient-to-b from-gray-50 to-white px-6 py-20 md:px-12 lg:py-28"
    >
      <div className="mx-auto w-full max-w-7xl">
        {/* Jay 个人介绍 */}
        <div className="mb-20 text-center">
          <h2 className="mb-6 text-3xl font-bold text-primary-blue md:text-4xl">
            {t('jay.title')}
          </h2>
          <div className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-700">
            <p>
              {t('jay.desc1')}
              <span className="font-semibold text-primary-blue">
                Penn State University
              </span>
              {t('jay.and')}
              <span className="font-semibold text-primary-blue">
                Harrisburg University of Science and Technology
              </span>
              {t('jay.desc2')}
            </p>
          </div>
        </div>

        {/* 为什么选择 Better Bags */}
        <div className="mb-20">
          <h2 className="mb-12 text-center text-3xl font-bold text-primary-blue md:text-4xl lg:text-5xl">
            {t('title')}
          </h2>

          <div className="grid gap-8 md:grid-cols-2">
            {advantages.map((advantage, index) => (
              <div
                key={index}
                className="group rounded-xl bg-white p-8 shadow-md transition-all hover:shadow-xl"
                style={{
                  borderTop: `4px solid ${advantage.color}`,
                }}
              >
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: advantage.color }}
                  >
                    <span className="text-2xl font-bold">{index + 1}</span>
                  </div>
                  <h3
                    className="text-2xl font-bold"
                    style={{ color: advantage.color }}
                  >
                    {advantage.title}
                  </h3>
                </div>
                <p className="whitespace-pre-line leading-relaxed text-gray-700">
                  {advantage.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 定制选项 */}
        <div className="rounded-2xl bg-gradient-to-br from-primary-cyan/10 via-white to-primary-blue/10 p-8 md:p-12">
          <h2 className="mb-6 text-center text-3xl font-bold text-primary-blue md:text-4xl">
            {tCustom('title')}
          </h2>
          <div
            className="mb-10 text-center text-lg text-gray-700"
            dangerouslySetInnerHTML={{ __html: tCustom('intro') }}
          />

          <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {customFeatures.map((feature, index) => (
              <div
                key={index}
                className="rounded-lg bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                <h4 className="mb-3 text-lg font-bold text-primary-blue">
                  {feature.title}
                </h4>
                <p className="mb-4 text-sm text-gray-600">{feature.desc}</p>
                <ul className="space-y-2">
                  {feature.highlights.map((highlight, hIndex) => (
                    <li
                      key={hIndex}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <svg
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-cyan"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* CTA 部分 */}
          <div className="text-center">
            <div
              className="mb-6 text-lg text-gray-700"
              dangerouslySetInnerHTML={{ __html: tCustom('ready') }}
            />
            <button
              onClick={handleScrollToContact}
              className="rounded-lg bg-primary-blue px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-dark-blue hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-primary-cyan/50"
            >
              {tCustom('cta')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import { useTranslations } from 'next-intl';

export default function HeroBanner() {
  const t = useTranslations('banner');
  const tFeatures = useTranslations('features');

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

  const stats = tFeatures.raw('stats') as Array<{
    label: string;
    value: string;
  }>;

  return (
    <section
      id="banner"
      className="relative flex min-h-[100svh] flex-col items-center justify-center bg-white px-6 py-20 md:px-12"
    >
      <div className="mx-auto w-full max-w-5xl text-center">
        {/* 主标语 */}
        <h1 className="mb-4 text-4xl font-bold leading-tight text-deep md:text-5xl lg:text-6xl">
          {t('line1')}
        </h1>
        <h2 className="mb-8 text-2xl font-semibold text-primary md:text-3xl lg:text-4xl">
          {t('line2')}
        </h2>

        {/* 描述文字 */}
        <div className="mx-auto mb-8 max-w-3xl space-y-4 text-base leading-relaxed text-neutral-600 md:text-lg">
          <p>
            {t('p1.pre')}
            <span className="font-bold text-primary">
              {t('p1.highlight')}
            </span>
            {t('p1.post')}
          </p>
          <p>{t('p2')}</p>
          <p>{t('p3')}</p>
        </div>

        {/* CTA 按钮 */}
        <button
          onClick={handleScrollToContact}
          className="mb-12 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-primary-dark hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-primary/30"
        >
          {t('cta')}
        </button>

        {/* 统计数据 */}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="rounded-lg bg-neutral-50 p-4 shadow-sm transition-transform hover:scale-105 hover:shadow-md"
            >
              <div className="mb-2 text-2xl font-bold text-primary md:text-3xl">
                {stat.value}
              </div>
              <div className="text-sm text-neutral-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 向下滚动提示 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg
          className="h-8 w-8 text-primary"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>
    </section>
  );
}

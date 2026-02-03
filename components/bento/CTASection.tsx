'use client';

import { useTranslations } from 'next-intl';

/**
 * CTASection - CTA区块组件 (右下象限)
 *
 * 古腾堡图表 Terminal Area:
 * 用户视线终点，放置主要行动号召按钮
 *
 * 功能:
 * - 主 CTA 按钮 (滚动到 contact)
 * - 复用 HeroBanner 的滚动逻辑
 * - 无障碍：焦点环 >= 2px, 触控区域 >= 44x44px
 */
export function CTASection() {
  const t = useTranslations('banner');

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
    <div
      data-testid="cta-section"
      className="
        flex
        h-full
        flex-col
        items-center
        justify-center
        text-center
      "
    >
      {/* 标题 */}
      <h3 className="mb-3 text-lg font-semibold text-deep md:text-xl lg:text-2xl">
        Ready to Start Your Project?
      </h3>

      {/* 副标题 */}
      <p className="mb-6 max-w-sm text-sm text-neutral-600 md:text-base">
        Get a free quote within 24 hours
      </p>

      {/* CTA 按钮 */}
      <button
        onClick={handleScrollToContact}
        className="
          min-h-[44px]
          min-w-[44px]
          rounded-lg
          bg-primary
          px-8
          py-4
          text-base
          font-semibold
          text-white
          transition-all
          hover:bg-primary-dark
          hover:shadow-lg
          focus:outline-none
          focus:ring-4
          focus:ring-primary/30
          focus:ring-offset-2
          md:text-lg
        "
      >
        {t('cta')}
      </button>

      {/* 次要链接 */}
      <p className="mt-4 text-xs text-neutral-500 md:text-sm">
        No obligation, free consultation
      </p>
    </div>
  );
}

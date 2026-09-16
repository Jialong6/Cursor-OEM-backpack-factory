'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import FooterLanguageLinks from './FooterLanguageLinks';
import { useAnchorScroll } from '@/hooks/useNavigation';
import { toTelHref } from '@/lib/contact-links';

/**
 * 页脚组件
 *
 * 功能：
 * - 展示公司信息（名称、地址、联系方式）
 * - 快捷链接（平滑滚动到对应区块）
 * - 工作时间
 * - 版权信息
 *
 * 需求: 13.1, 13.2, 13.3, 13.4, 13.5
 */
export default function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();

  /**
   * 锚点链接的点击处理
   *
   * 这里原本是站内第七份各写一遍的滚动实现,而且是唯一一份「找不到元素
   * 就什么都不做」的 —— 它先 preventDefault 再去 getElementById,于是在
   * /blog、/glossary、/fact-sheet 上,页脚的「联系我们」点了毫无反应。
   * useAnchorScroll 自带跨路由兜底(跳 /{locale}#{id}),顺带把 cta_click
   * 也埋上了。
   */
  const scrollToAnchor = useAnchorScroll();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // 非锚点(路径式)href 交给 next/Link 自行处理
    if (!href.startsWith('#')) {
      return;
    }

    scrollToAnchor(href, e, { cta: 'footer' });
  };

  // 获取快捷链接数据
  const quickLinks = t.raw('links') as Array<{ name: string; href: string }>;

  return (
    <footer className="bg-neutral-900 text-neutral-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* 公司信息 - 需求 13.1 */}
          <div className="lg:col-span-2">
            {/* 品牌 logo：深色页脚上套白底圆角卡片保留品牌原色 */}
            <span className="inline-block bg-white rounded-lg p-3 mb-4">
              <Image
                src="/logo.png"
                alt="Better Bags Myanmar"
                width={2481}
                height={1038}
                className="h-10 w-auto"
              />
            </span>
            <h3 className="text-white text-lg font-bold mb-4">
              {t('companyInfo.name')}
            </h3>
            <div className="space-y-3">
              <p className="text-sm flex items-start gap-2">
                <svg
                  className="w-5 h-5 mt-0.5 flex-shrink-0 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>{t('companyInfo.address')}</span>
              </p>
              <p className="text-sm flex items-center gap-2">
                <svg
                  className="w-5 h-5 flex-shrink-0 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span>
                  {t('email')}:{' '}
                  <a
                    href={`mailto:${t('companyInfo.email')}`}
                    /* 只上报这个标签,邮箱地址一个字符都不进库 */
                    data-analytics-label="footer"
                    className="hover:text-primary transition-colors"
                  >
                    {t('companyInfo.email')}
                  </a>
                </span>
              </p>
              <p className="text-sm flex items-center gap-2">
                <svg
                  className="w-5 h-5 flex-shrink-0 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span>
                  {t('tel')}:{' '}
                  <a
                    href={toTelHref(t('companyInfo.phone'))}
                    /* 同上:标签是固定字符串,号码不进库 */
                    data-analytics-label="footer"
                    className="hover:text-primary transition-colors"
                  >
                    {t('companyInfo.phone')}
                  </a>
                </span>
              </p>
            </div>
          </div>

          {/* 快捷链接 - 需求 13.2 */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">{t('quickLinks')}</h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
              {quickLinks.map((link, index) => {
                const href = link.href.startsWith('#')
                  ? link.href
                  : `/${locale}${link.href}`;
                return (
                  <li key={index}>
                    <Link
                      href={href}
                      onClick={(e) => handleLinkClick(e, link.href)}
                      className="text-sm hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* 工作时间 - 需求 13.3 */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">{t('hours')}</h3>
            <p className="text-sm">{t('hoursTime')}</p>
          </div>
        </div>

        {/* 跨语言链接 - SSR 可爬,SEO 内链(不挤现有栅格,全宽一行) */}
        <FooterLanguageLinks />

        {/* 版权信息 - 需求 13.4 */}
        <div className="border-t border-neutral-800 mt-8 pt-8 text-center">
          <p className="text-sm text-neutral-500">
            © {new Date().getFullYear()} {t('copyright')}
          </p>
          {/* 隐私政策:同意条与合规披露的落点,每页可达 */}
          <p className="mt-2 text-sm">
            <Link
              href={`/${locale}/privacy`}
              className="text-neutral-500 transition-colors hover:text-white"
            >
              {t('privacy')}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

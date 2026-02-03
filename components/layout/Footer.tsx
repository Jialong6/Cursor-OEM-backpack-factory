'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

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
   * Handle link clicks: smooth scroll for anchor links, normal navigation otherwise
   */
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith('#')) {
      return;
    }

    e.preventDefault();
    const targetId = href.replace('#', '');
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      const navbarHeight = 80;
      const targetPosition = targetElement.offsetTop - navbarHeight;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      });
    }
  };

  // 获取快捷链接数据
  const quickLinks = t.raw('links') as Array<{ name: string; href: string }>;

  return (
    <footer className="bg-neutral-900 text-neutral-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* 公司信息 - 需求 13.1 */}
          <div className="lg:col-span-2">
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
                  {t('email')}: {t('companyInfo.email')}
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
                  {t('tel')}: {t('companyInfo.phone')}
                </span>
              </p>
            </div>
          </div>

          {/* 快捷链接 - 需求 13.2 */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">{t('quickLinks')}</h3>
            <ul className="space-y-2">
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

        {/* 版权信息 - 需求 13.4 */}
        <div className="border-t border-neutral-800 mt-8 pt-8 text-center">
          <p className="text-sm text-neutral-500">
            © {new Date().getFullYear()} {t('copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}

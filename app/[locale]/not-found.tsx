'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

/**
 * 本地化 404 页
 *
 * 由 [...rest] catch-all 路由触发 notFound() 后渲染(next-intl 标准方案),
 * 在 [locale] 布局内,12 语文案取自 notFound 命名空间。
 * 提供返回首页与博客的内链,把 404 流量导回站内。
 * Next.js 自动为 not-found 返回 404 状态码,无需额外 noindex。
 */
export default function NotFound() {
  const t = useTranslations('notFound');
  const locale = useLocale();

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full text-center py-24">
        <p className="text-7xl md:text-8xl font-bold text-primary mb-6" aria-hidden="true">
          404
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {t('title')}
        </h1>
        <p className="text-lg text-gray-600 mb-10">{t('description')}</p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-lg transition-colors"
          >
            {t('backHome')}
          </Link>
          <Link
            href={`/${locale}/blog`}
            className="inline-flex items-center justify-center border border-primary text-primary hover:bg-primary hover:text-white font-bold py-3 px-8 rounded-lg transition-colors"
          >
            {t('viewBlog')}
          </Link>
        </div>
      </div>
    </main>
  );
}

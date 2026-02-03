'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getAllBlogPosts } from '@/lib/blog-data';
import OptimizedImage, { IMAGE_SIZES, ASPECT_RATIOS } from '@/components/ui/OptimizedImage';

/**
 * 博客列表页面
 *
 * 功能：
 * - 展示所有博客文章
 * - 文章卡片包含标题、摘要、日期、分类、标签
 * - 支持中英文内容切换
 * - 点击卡片导航到博客详情页
 * - 返回首页链接
 * - 使用优化的图片组件（响应式、懒加载、保持宽高比）
 *
 * 验证需求：12.4, 4.5, 15.1, 15.2, 15.3
 */
export default function BlogListPage() {
  const t = useTranslations('blogList');
  const params = useParams();
  const locale = params.locale as 'en' | 'zh';
  const allPosts = getAllBlogPosts();

  /**
   * 格式化日期显示
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', options);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{t('title')}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">{t('subtitle')}</p>

          {/* 返回首页链接 */}
          <Link
            href={`/${locale}`}
            className="inline-flex items-center text-primary hover:text-primary-dark font-semibold transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('backToHome')}
          </Link>
        </div>

        {/* 文章总数 */}
        <div className="mb-8">
          <p className="text-gray-600">
            {t('totalArticles', { count: allPosts.length })}
          </p>
        </div>

        {/* 博客文章网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {allPosts.map((post) => (
            <Link
              key={post.id}
              href={`/${locale}/blog/${post.slug}`}
              className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* 文章缩略图 - 使用优化的图片组件 */}
              <div className="relative">
                <OptimizedImage
                  src={post.thumbnail}
                  alt={post.title[locale]}
                  fill
                  aspectRatio={ASPECT_RATIOS.WIDE}
                  sizes={IMAGE_SIZES.BLOG_THUMBNAIL}
                  className="group-hover:scale-105 transition-transform duration-300"
                  objectFit="cover"
                  quality={75}
                />

                {/* 分类标签 */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="bg-white text-primary px-3 py-1 rounded-full text-xs font-semibold uppercase shadow-md">
                    {post.category}
                  </span>
                </div>
              </div>

              {/* 文章内容 */}
              <div className="p-6">
                {/* 日期 */}
                <div className="flex items-center text-xs text-gray-500 mb-3">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {formatDate(post.date)}
                </div>

                {/* 标题 */}
                <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors line-clamp-2">
                  {post.title[locale]}
                </h2>

                {/* 摘要 */}
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">{post.excerpt[locale]}</p>

                {/* 标签 */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 阅读更多 */}
                <div className="flex items-center text-primary font-semibold text-sm group-hover:underline">
                  {t('readMore')}
                  <svg
                    className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 如果没有文章 */}
        {allPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">{t('noArticles')}</p>
          </div>
        )}

        {/* Cross-links to Glossary and FAQ */}
        <div className="mt-12 rounded-xl bg-white border border-gray-200 p-6 text-center">
          <div className="flex flex-col sm:flex-row justify-center gap-4 text-sm">
            <Link
              href={`/${locale}/glossary`}
              className="text-primary hover:text-primary-dark font-medium transition-colors"
            >
              {t('relatedLinks.glossary')}
            </Link>
            <Link
              href={`/${locale}/#faq`}
              className="text-primary hover:text-primary-dark font-medium transition-colors"
            >
              {t('relatedLinks.faq')}
            </Link>
          </div>
        </div>

        {/* Back to top */}
        <div className="mt-8 text-center">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            {t('backToTop')}
          </button>
        </div>
      </div>
    </main>
  );
}

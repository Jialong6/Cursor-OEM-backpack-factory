'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getFeaturedBlogPosts } from '@/lib/blog-data';
import OptimizedImage, { IMAGE_SIZES, ASPECT_RATIOS } from '@/components/ui/OptimizedImage';

/**
 * 博客预览区块组件
 *
 * 功能：
 * - 展示精选博客文章卡片列表
 * - 卡片包含标题、摘要、发布日期、缩略图
 * - 点击卡片导航到博客详情页
 * - 支持中英文内容切换
 * - 使用优化的图片组件（响应式、懒加载、保持宽高比）
 *
 * 验证需求：12.1, 12.2, 12.4, 4.5, 15.1, 15.2, 15.3
 */
export default function Blog() {
  const t = useTranslations('blog');
  const params = useParams();
  const locale = params.locale as 'en' | 'zh';
  const featuredPosts = getFeaturedBlogPosts(3);

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
    <section id="blog" className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* 标题部分 */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{t('title')}</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t('subtitle')}</p>
        </div>

        {/* 博客文章网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {featuredPosts.map((post) => (
            <Link
              key={post.id}
              href={`/${locale}/blog/${post.slug}`}
              className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              {/* 文章缩略图 - 使用优化的图片组件 */}
              <OptimizedImage
                src={post.thumbnail}
                alt={post.title[locale]}
                fill
                aspectRatio={ASPECT_RATIOS.WIDE}
                sizes={IMAGE_SIZES.BLOG_THUMBNAIL}
                className="group-hover:scale-105 transition-transform duration-300"
                objectFit="cover"
                quality={80}
              />

              {/* 文章内容 */}
              <div className="p-6">
                {/* 分类和日期 */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                    {post.category}
                  </span>
                  <span className="text-xs text-gray-500">{formatDate(post.date)}</span>
                </div>

                {/* 标题 */}
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {post.title[locale]}
                </h3>

                {/* 摘要 */}
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">{post.excerpt[locale]}</p>

                {/* 阅读更多 */}
                <div className="flex items-center text-primary font-semibold text-sm group-hover:underline">
                  {t('readMore')}
                  <svg
                    className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 查看所有文章按钮 */}
        <div className="text-center">
          <Link
            href={`/${locale}/blog`}
            className="inline-block bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-lg transition-colors"
          >
            {t('viewAll')}
          </Link>
        </div>
      </div>
    </section>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getBlogPostBySlug } from '@/lib/blog-data';
import { notFound } from 'next/navigation';
import OptimizedImage, { IMAGE_SIZES, ASPECT_RATIOS } from '@/components/ui/OptimizedImage';

/**
 * 博客详情页面
 *
 * 功能：
 * - 展示博客文章完整内容
 * - 显示文章元信息（标题、日期、作者、分类、标签）
 * - 支持中英文内容切换
 * - 返回列表链接
 * - 面包屑导航
 * - Markdown 样式渲染
 * - 使用优化的图片组件（响应式、懒加载、保持宽高比）
 *
 * 验证需求：12.3, 4.5, 15.1, 15.2, 15.3
 */
export default function BlogDetailPage() {
  const t = useTranslations('blogDetail');
  const params = useParams();
  const locale = params.locale as 'en' | 'zh';
  const slug = params.slug as string;

  // 获取文章数据
  const post = getBlogPostBySlug(slug);

  // 如果文章不存在，显示 404
  if (!post) {
    notFound();
  }

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

  /**
   * 渲染 Markdown 内容
   * 这是一个简单的实现，将 Markdown 转换为基本的 HTML
   * 在生产环境中，建议使用专业的 Markdown 渲染库如 react-markdown
   */
  const renderMarkdown = (markdown: string) => {
    if (!markdown) return null;

    // 简单的 Markdown 解析（仅用于演示）
    const lines = markdown.trim().split('\n');
    const elements: React.ReactElement[] = [];
    let key = 0;

    lines.forEach((line, index) => {
      // 标题
      // 注意：Markdown 中的 # 渲染为 h2，因为页面已经有一个 h1（文章标题）
      // 符合 SEO 最佳实践：每个页面只有一个 h1（需求 14.5）
      if (line.startsWith('### ')) {
        elements.push(
          <h4 key={key++} className="text-lg font-bold text-gray-900 mb-2 mt-4">
            {line.substring(4)}
          </h4>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h3 key={key++} className="text-xl font-bold text-gray-900 mb-3 mt-5">
            {line.substring(3)}
          </h3>
        );
      } else if (line.startsWith('# ')) {
        elements.push(
          <h2 key={key++} className="text-2xl font-bold text-gray-900 mb-4 mt-6">
            {line.substring(2)}
          </h2>
        );
      }
      // 列表
      else if (line.startsWith('- ')) {
        elements.push(
          <li key={key++} className="ml-6 mb-2 text-gray-700 list-disc">
            {line.substring(2)}
          </li>
        );
      }
      // 有序列表
      else if (/^\d+\.\s/.test(line)) {
        const match = line.match(/^\d+\.\s(.*)$/);
        if (match) {
          elements.push(
            <li key={key++} className="ml-6 mb-2 text-gray-700 list-decimal">
              {match[1]}
            </li>
          );
        }
      }
      // 粗体文本
      else if (line.includes('**')) {
        const parts = line.split('**');
        elements.push(
          <p key={key++} className="text-gray-700 leading-relaxed mb-4">
            {parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))}
          </p>
        );
      }
      // 空行
      else if (line.trim() === '') {
        // 跳过空行
      }
      // 普通段落
      else if (line.trim()) {
        elements.push(
          <p key={key++} className="text-gray-700 leading-relaxed mb-4">
            {line}
          </p>
        );
      }
    });

    return elements;
  };

  return (
    <main className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
      <article className="max-w-4xl mx-auto">
        {/* 面包屑导航 */}
        <nav className="mb-8 text-sm">
          <ol className="flex items-center space-x-2 text-gray-500">
            <li>
              <Link href={`/${locale}`} className="hover:text-primary transition-colors">
                {t('home')}
              </Link>
            </li>
            <li>
              <span className="mx-2">/</span>
            </li>
            <li>
              <Link href={`/${locale}/blog`} className="hover:text-primary transition-colors">
                {t('blog')}
              </Link>
            </li>
            <li>
              <span className="mx-2">/</span>
            </li>
            <li className="text-gray-900 font-medium truncate">{post.title[locale]}</li>
          </ol>
        </nav>

        {/* 返回按钮 */}
        <div className="mb-8">
          <Link
            href={`/${locale}/blog`}
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
            {t('backToList')}
          </Link>
        </div>

        {/* 文章头部 */}
        <header className="mb-8 pb-8 border-b border-gray-200">
          {/* 分类标签 */}
          <div className="mb-4">
            <span className="inline-block bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold uppercase">
              {post.category}
            </span>
          </div>

          {/* 标题 */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{post.title[locale]}</h1>

          {/* 文章元信息 */}
          <div className="flex flex-wrap items-center gap-4 text-gray-600 text-sm">
            {/* 日期 */}
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
              {formatDate(post.date)}
            </div>

            {/* 作者 */}
            {post.author && (
              <>
                <span className="text-gray-400">•</span>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {post.author}
                </div>
              </>
            )}
          </div>

          {/* 标签 */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* 文章缩略图 */}
        {/* 文章封面图片 - 使用优化的图片组件 */}
        <div className="mb-8 rounded-lg overflow-hidden">
          <OptimizedImage
            src={post.thumbnail}
            alt={post.title[locale]}
            fill
            aspectRatio={ASPECT_RATIOS.WIDE}
            sizes={IMAGE_SIZES.CONTENT}
            priority
            quality={90}
            objectFit="cover"
          />
        </div>

        {/* 文章摘要 */}
        <div className="mb-8 p-6 bg-gray-50 border-l-4 border-primary rounded-r-lg">
          <p className="text-lg text-gray-700 italic">{post.excerpt[locale]}</p>
        </div>

        {/* 文章内容 */}
        <div className="prose prose-lg max-w-none mb-12">
          {post.content ? (
            renderMarkdown(post.content[locale])
          ) : (
            <div className="text-gray-500 text-center py-8">
              <p>{t('noContent')}</p>
            </div>
          )}
        </div>

        {/* 文章底部 */}
        <footer className="pt-8 border-t border-gray-200">
          {/* 分享和返回按钮 */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Link
              href={`/${locale}/blog`}
              className="inline-flex items-center bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t('backToList')}
            </Link>

            {/* 返回顶部 */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center text-gray-600 hover:text-primary font-semibold transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              {t('backToTop')}
            </button>
          </div>

          {/* CTA 区块 */}
          <div className="mt-12 p-8 bg-gradient-to-r from-primary to-primary-dark rounded-lg text-center">
            <h3 className="text-2xl font-bold text-white mb-3">{t('cta.title')}</h3>
            <p className="text-white text-lg mb-6 opacity-90">{t('cta.subtitle')}</p>
            <Link
              href={`/${locale}#contact`}
              className="inline-block bg-white text-primary hover:bg-gray-100 font-bold py-3 px-8 rounded-lg transition-colors"
            >
              {t('cta.button')}
            </Link>
          </div>
        </footer>
      </article>
    </main>
  );
}

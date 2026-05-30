'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getBlogPostBySlug } from '@/lib/blog-data';
import { getAuthorForPost } from '@/lib/author-data';
import { getLocalizedField } from '@/lib/blog-utils';
import { notFound } from 'next/navigation';
import OptimizedImage, { IMAGE_SIZES, ASPECT_RATIOS } from '@/components/ui/OptimizedImage';
import AuthorByline from '@/components/content/AuthorByline';
import { BlogPostingSchema } from '@/components/seo';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export default function BlogDetailPage() {
  const t = useTranslations('blogDetail');
  const params = useParams();
  const locale = params.locale as string;
  const slug = params.slug as string;

  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const author = getAuthorForPost(post);
  const title = getLocalizedField(post.title, locale) ?? '';
  const excerpt = getLocalizedField(post.excerpt, locale) ?? '';
  const content = getLocalizedField(post.content, locale);
  const category = getLocalizedField(post.category, locale);
  const tags = getLocalizedField(post.tags, locale);

  return (
    <main className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
      <BlogPostingSchema
        headline={title}
        description={excerpt}
        image={post.thumbnail}
        datePublished={post.date}
        author={author}
        locale={locale}
      />

      <article className="max-w-4xl mx-auto">
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
            <li className="text-gray-900 font-medium truncate">{title}</li>
          </ol>
        </nav>

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

        <header className="mb-8 pb-8 border-b border-gray-200">
          <div className="mb-4">
            <span className="inline-block bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold uppercase">
              {category}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{title}</h1>

          <AuthorByline
            author={author}
            locale={locale}
            publishDate={post.date}
            content={content}
            variant="full"
          />

          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {tags.map((tag, index) => (
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

        <div className="mb-8 rounded-lg overflow-hidden">
          <OptimizedImage
            src={post.thumbnail}
            alt={title}
            fill
            aspectRatio={ASPECT_RATIOS.WIDE}
            sizes={IMAGE_SIZES.CONTENT}
            priority
            quality={90}
            objectFit="cover"
          />
        </div>

        <div className="mb-8 p-6 bg-gray-50 border-l-4 border-primary rounded-r-lg">
          <p className="text-lg text-gray-700 italic">{excerpt}</p>
        </div>

        <div className="prose prose-lg max-w-none mb-12 blog-content">
          {content ? (
            <MarkdownContent markdown={content} locale={locale} />
          ) : (
            <div className="text-gray-500 text-center py-8">
              <p>{t('noContent')}</p>
            </div>
          )}
        </div>

        <div className="mb-8">
          <AuthorByline
            author={author}
            locale={locale}
            publishDate={post.date}
            variant="card"
          />
        </div>

        <footer className="pt-8 border-t border-gray-200">
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

function MarkdownContent({ markdown, locale }: { markdown: string; locale: string }) {
  // CommonMark 的 emphasis flanking 规则在 CJK 文本 + 全角标点旁会失效，
  // 导致 **粗体** 被当作字面星号输出。先转成 <strong>，由 rehype-raw 渲染。
  const normalized = markdown.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        h1: ({ children }) => (
          <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">{children}</h2>
        ),
        h2: ({ children }) => (
          <h3 className="text-2xl font-bold text-gray-900 mb-3 mt-7">{children}</h3>
        ),
        h3: ({ children }) => (
          <h4 className="text-xl font-bold text-gray-900 mb-3 mt-6">{children}</h4>
        ),
        h4: ({ children }) => (
          <h5 className="text-lg font-bold text-gray-900 mb-2 mt-5">{children}</h5>
        ),
        p: ({ node, children }) => {
          // 独占一行的图片会被包进 <p>，而 <figure> 是块级元素，
          // 嵌套在 <p> 内是无效 HTML，这里去掉外层 <p>。
          const onlyChild = node?.children?.length === 1 ? node.children[0] : undefined;
          if (onlyChild?.type === 'element' && onlyChild.tagName === 'img') {
            return <>{children}</>;
          }
          return <p className="text-gray-700 leading-relaxed mb-4">{children}</p>;
        },
        img: ({ src, alt }: ComponentPropsWithoutRef<'img'>) => (
          <figure className="my-6">
            <div className="rounded-lg overflow-hidden ring-1 ring-black/5 shadow-sm">
              <OptimizedImage
                src={typeof src === 'string' ? src : ''}
                alt={alt ?? ''}
                fill
                aspectRatio={ASPECT_RATIOS.WIDE}
                sizes={IMAGE_SIZES.CONTENT}
                objectFit="cover"
                quality={85}
              />
            </div>
            {alt ? (
              <figcaption className="mt-2 text-center text-sm text-gray-500">{alt}</figcaption>
            ) : null}
          </figure>
        ),
        ul: ({ children }) => (
          <ul className="list-disc ml-6 mb-4 space-y-2 text-gray-700">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal ml-6 mb-4 space-y-2 text-gray-700">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary/60 bg-gray-50 px-6 py-3 my-5 text-gray-700 italic rounded-r">
            {children}
          </blockquote>
        ),
        a: ({ href, children }: ComponentPropsWithoutRef<'a'>) => {
          const url = href ?? '#';
          const isExternal = /^https?:\/\//.test(url);
          if (isExternal) {
            return (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-dark underline underline-offset-2"
              >
                {children}
              </a>
            );
          }
          const internalHref = url.startsWith('/blog/')
            ? `/${locale}${url}`
            : url.startsWith('#')
              ? `/${locale}${url}`
              : url;
          return (
            <Link
              href={internalHref}
              className="text-primary hover:text-primary-dark underline underline-offset-2"
            >
              {children}
            </Link>
          );
        },
        table: ({ children }) => (
          <div className="overflow-x-auto my-6 -mx-2 sm:mx-0">
            <table className="min-w-full text-sm border-collapse border border-gray-200">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-gray-100">{children}</thead>,
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => <tr className="border-b border-gray-200">{children}</tr>,
        th: ({ children }) => (
          <th className="border border-gray-200 px-4 py-2 text-left font-semibold text-gray-800 bg-gray-50">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-gray-200 px-4 py-2 align-top text-gray-700">
            {children}
          </td>
        ),
        code: ({ className, children, ...props }: ComponentPropsWithoutRef<'code'> & { children?: ReactNode }) => {
          const isBlock = typeof className === 'string' && /^language-/.test(className);
          if (isBlock) {
            return (
              <code className={`${className} font-mono whitespace-pre`} {...props}>
                {children}
              </code>
            );
          }
          return (
            <code className="bg-gray-100 text-primary px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-6 text-xs leading-relaxed font-mono">
            {children}
          </pre>
        ),
        hr: () => <hr className="my-8 border-gray-200" />,
        strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        sup: ({ children }) => <sup className="text-xs text-primary">{children}</sup>,
      }}
    >
      {normalized}
    </ReactMarkdown>
  );
}

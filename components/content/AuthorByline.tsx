'use client';

import { useTranslations } from 'next-intl';
import type { AuthorProfile } from '@/lib/author-data';
import { estimateReadingTime, getAuthorText } from '@/lib/author-data';
import OptimizedImage, { IMAGE_SIZES, ASPECT_RATIOS } from '@/components/ui/OptimizedImage';

/**
 * AuthorByline 组件属性
 */
interface AuthorBylineProps {
  readonly author: AuthorProfile;
  readonly locale: string;
  readonly publishDate: string;
  readonly content?: string;
  readonly variant?: 'full' | 'compact' | 'card';
}

/**
 * 获取作者名首字母用于头像 fallback
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * 格式化日期显示
 */
function formatDate(dateString: string, locale: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  const dateLocale =
    locale === 'ja'
      ? 'ja-JP'
      : locale === 'zh' || locale === 'zh-tw'
        ? 'zh-CN'
        : 'en-US';
  return date.toLocaleDateString(dateLocale, options);
}

/**
 * 作者头像：有真实图片时用圆形图片，否则回退首字母圆形徽章
 */
function Avatar({
  src,
  alt,
  initials,
  sizeClass,
  textClass,
}: {
  readonly src: string;
  readonly alt: string;
  readonly initials: string;
  readonly sizeClass: string;
  readonly textClass: string;
}) {
  if (src) {
    return (
      <div className={`relative shrink-0 overflow-hidden rounded-full ${sizeClass}`}>
        <OptimizedImage
          src={src}
          alt={alt}
          fill
          aspectRatio={ASPECT_RATIOS.SQUARE}
          sizes={IMAGE_SIZES.AVATAR}
          objectFit="cover"
          objectPosition="top"
        />
      </div>
    );
  }
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white ${sizeClass} ${textClass}`}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

/**
 * 作者署名组件
 *
 * 展示博客文章作者信息，支持三种变体：
 * - full: 完整布局（博客详情页头部），含头像、姓名、角色、资质、日期、阅读时间
 * - compact: 紧凑布局（列表卡片），含小头像、姓名、日期
 * - card: 文末「关于作者」卡片，含大头像、姓名、角色、bio 介绍
 *
 * 无障碍：
 * - 使用 <time> 语义化日期元素
 * - aria-label 标注作者信息区域
 * - 头像无图片时回退首字母
 */
export default function AuthorByline({
  author,
  locale,
  publishDate,
  content,
  variant = 'full',
}: AuthorBylineProps) {
  const t = useTranslations('author');

  // 作者档案已覆盖全部 12 语,直接按 locale 取值(未识别回退英文)
  const authorName = getAuthorText(author.name, locale);
  const authorRole = getAuthorText(author.role, locale);
  const authorBio = getAuthorText(author.bio, locale);
  const readingTime = content ? estimateReadingTime(content) : undefined;
  const formattedDate = formatDate(publishDate, locale);
  const initials = getInitials(author.name.en);

  if (variant === 'compact') {
    return (
      <div
        className="flex items-center gap-2 text-sm text-neutral-500"
        aria-label={`${t('writtenBy')} ${authorName}`}
      >
        <Avatar src={author.avatar} alt={authorName} initials={initials} sizeClass="h-8 w-8" textClass="text-xs" />
        <span className="font-medium text-neutral-700">{authorName}</span>
        <span aria-hidden="true">&#183;</span>
        <time dateTime={publishDate}>{formattedDate}</time>
      </div>
    );
  }

  if (variant === 'card') {
    const aboutLabel = t('aboutAuthor');
    return (
      <section
        className="rounded-lg bg-neutral-50 border border-neutral-200 p-5"
        aria-label={aboutLabel}
      >
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          {aboutLabel}
        </h2>
        <div className="flex items-start gap-4">
          <Avatar src={author.avatar} alt={authorName} initials={initials} sizeClass="h-16 w-16" textClass="text-xl" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-base font-semibold text-neutral-800">{authorName}</span>
              <span className="text-sm text-neutral-500">{authorRole}</span>
            </div>
            {authorBio && (
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                {authorBio}
              </p>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <div
      className="flex flex-wrap items-start gap-4 rounded-lg bg-neutral-50 border border-neutral-200 p-4"
      aria-label={`${t('writtenBy')} ${authorName}`}
    >
      <Avatar src={author.avatar} alt={authorName} initials={initials} sizeClass="h-12 w-12" textClass="text-lg" />

      {/* 作者信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-semibold text-neutral-800">{authorName}</span>
          <span className="text-sm text-neutral-500">{authorRole}</span>
        </div>

        {/* 资质徽章 */}
        {author.credentials.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {author.credentials.map((credential) => (
              <span
                key={credential}
                className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
              >
                {credential}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 日期和阅读时间 */}
      <div className="flex shrink-0 flex-col items-end text-sm text-neutral-500">
        <time dateTime={publishDate}>{formattedDate}</time>
        {readingTime !== undefined && (
          <span className="mt-0.5">
            {readingTime} {t('minRead')}
          </span>
        )}
      </div>
    </div>
  );
}

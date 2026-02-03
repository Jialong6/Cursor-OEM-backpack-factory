'use client';

import { useTranslations } from 'next-intl';
import type { AuthorProfile } from '@/lib/author-data';
import { estimateReadingTime } from '@/lib/author-data';

/**
 * AuthorByline 组件属性
 */
interface AuthorBylineProps {
  readonly author: AuthorProfile;
  readonly locale: string;
  readonly publishDate: string;
  readonly content?: string;
  readonly variant?: 'full' | 'compact';
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
  return date.toLocaleDateString(
    locale === 'zh' || locale === 'zh-tw' ? 'zh-CN' : 'en-US',
    options
  );
}

/**
 * 作者署名组件
 *
 * 展示博客文章作者信息，支持两种变体：
 * - full: 完整布局（博客详情页头部），含头像、姓名、角色、资质、日期、阅读时间
 * - compact: 紧凑布局（博客列表卡片或文末署名），含小头像、姓名、日期
 *
 * 无障碍：
 * - 使用 <time> 语义化日期元素
 * - aria-label 标注作者信息区域
 * - 头像使用首字母 fallback，不依赖图片文件
 */
export default function AuthorByline({
  author,
  locale,
  publishDate,
  content,
  variant = 'full',
}: AuthorBylineProps) {
  const t = useTranslations('author');

  const authorName = locale === 'zh' || locale === 'zh-tw'
    ? author.name.zh
    : author.name.en;
  const authorRole = locale === 'zh' || locale === 'zh-tw'
    ? author.role.zh
    : author.role.en;
  const readingTime = content ? estimateReadingTime(content) : undefined;
  const formattedDate = formatDate(publishDate, locale);
  const initials = getInitials(author.name.en);

  if (variant === 'compact') {
    return (
      <div
        className="flex items-center gap-2 text-sm text-neutral-500"
        aria-label={`${t('writtenBy')} ${authorName}`}
      >
        {/* 小头像 */}
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
          aria-hidden="true"
        >
          {initials}
        </div>
        <span className="font-medium text-neutral-700">{authorName}</span>
        <span aria-hidden="true">&#183;</span>
        <time dateTime={publishDate}>{formattedDate}</time>
      </div>
    );
  }

  return (
    <div
      className="flex flex-wrap items-start gap-4 rounded-lg bg-neutral-50 border border-neutral-200 p-4"
      aria-label={`${t('writtenBy')} ${authorName}`}
    >
      {/* 头像 */}
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-white"
        aria-hidden="true"
      >
        {initials}
      </div>

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

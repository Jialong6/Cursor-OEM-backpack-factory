/**
 * next.config redirects 规则(纯数据模块,可单测)
 *
 * 执行时机:先于 middleware(headers -> redirects -> middleware -> 文件系统),
 * 因此 www 归一与旧 slug 308 均不受 geo/locale 中间件影响,且覆盖
 * middleware matcher 排除的带点路径(sitemap.xml / robots.txt / 静态资源)。
 *
 * 注意:本模块被 next.config.ts 以相对路径引用,不能依赖 '@/' 别名,
 * 也不能引入任何 'use client' 模块。
 */
import type { NextConfig } from 'next';
import { locales } from '../i18n';

type RedirectRule = Awaited<ReturnType<NonNullable<NextConfig['redirects']>>>[number];

/** 生产 apex 域名(与 lib/metadata 的 BASE_URL 默认值一致,有防漂移测试) */
export const APEX_ORIGIN = 'https://betterbagsmm.com';

/**
 * 2026-05-28 commit 344d160 博客改版删除的旧 slug(曾被收录约 4.5 个月),
 * 统一 308 到对应语言的 /blog 列表:回收外链权益、消灭 GSC「未找到 404」。
 * 不做旧文 -> 新文的主题映射,不相关映射会被 Google 判 soft-404。
 */
export const REMOVED_BLOG_SLUGS = [
  'custom-backpack-guide-2024',
  'sustainable-materials-backpacks',
  'oem-vs-odm-differences',
  'quality-control-process',
  'backpack-trends-2024',
  'choosing-right-backpack-manufacturer',
] as const;

/** path-to-regexp 参数正则:连字符为字面量无需转义(与 Next 内置 i18n 同款拼法) */
const LOCALE_PATTERN = locales.join('|');
const REMOVED_SLUG_PATTERN = REMOVED_BLOG_SLUGS.join('|');

/**
 * www -> apex 308 永久重定向
 * - has host 按正则解释,点号转义做精确匹配
 * - localhost / *.vercel.app preview 的 host 不满足条件,天然不受影响
 */
export const wwwToApexRedirect: RedirectRule = {
  source: '/:path*',
  has: [{ type: 'host', value: 'www\\.betterbagsmm\\.com' }],
  destination: `${APEX_ORIGIN}/:path*`,
  permanent: true,
};

export const removedBlogSlugRedirects: RedirectRule[] = [
  // 带 locale 前缀 -> 同语言 blog 列表(:slug 未用于 destination,
  // Next redirects 的 appendParamsToQuery=false,不会泄漏为 query 参数)
  {
    source: `/:locale(${LOCALE_PATTERN})/blog/:slug(${REMOVED_SLUG_PATTERN})`,
    destination: '/:locale/blog',
    permanent: true,
  },
  // 无前缀变体 -> 单跳直达 /en/blog(与 x-default 一致,避免 308+302 两跳链)
  {
    source: `/blog/:slug(${REMOVED_SLUG_PATTERN})`,
    destination: '/en/blog',
    permanent: true,
  },
];

/** next.config redirects() 的唯一入口;www 规则放最前(先归一 host 再谈路径) */
export function buildRedirects(): RedirectRule[] {
  return [wwwToApexRedirect, ...removedBlogSlugRedirects];
}

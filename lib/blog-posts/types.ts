/**
 * 博客文章数据类型
 *
 * 元数据(title / excerpt / category / tags)多语言内嵌,由
 * getLocalizedField 按 locale 取值(ja/zh/en 必填,其余语言渐进补齐)。
 *
 * 正文按语言拆分为 lib/blog-posts/{slug}/content.{locale}.ts,
 * 经 contentLoaders 动态 import 按需加载 —— 12 语正文不进客户端
 * bundle,SSG 构建时每个 locale 页面只取对应语言一份。
 */
import type { Locale } from '@/i18n';
import type { LocalizedField } from '../blog-utils';

/** 单语正文加载器:显式 () => import('./content.xx') 保证打包器可静态分析 */
export type ContentLoaders = Partial<Record<Locale, () => Promise<{ default: string }>>>;

export interface BlogPost {
  id: string;
  slug: string;
  title: LocalizedField<string>;
  excerpt: LocalizedField<string>;
  date: string;
  /** 最后实质性更新日期(ISO);未更新过则与 date 相同 */
  dateModified?: string;
  thumbnail: string;
  category: LocalizedField<string>;
  author?: string;
  authorId?: string;
  tags?: LocalizedField<string[]>;
  contentLoaders: ContentLoaders;
}

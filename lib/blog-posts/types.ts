/**
 * 博客文章数据类型
 *
 * 站点目前发布日文（原文）+ 简体中文（翻译）。
 * 英文版可选 —— 缺省时由 getLocalizedField 兜底回退到中文。
 * category / tags 同样多语言化，由 getLocalizedField 按 locale 取值。
 */
import type { LocalizedField } from '../blog-utils';

export interface BlogPost {
  id: string;
  slug: string;
  title: LocalizedField<string>;
  excerpt: LocalizedField<string>;
  content?: LocalizedField<string>;
  date: string;
  thumbnail: string;
  category: LocalizedField<string>;
  author?: string;
  authorId?: string;
  tags?: LocalizedField<string[]>;
}

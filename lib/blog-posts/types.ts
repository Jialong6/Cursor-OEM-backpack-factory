/**
 * 博客文章数据类型
 *
 * 站点目前发布日文（原文）+ 简体中文（翻译）。
 * 英文版可选 —— 缺省时由 getLocalizedField 兜底回退到中文。
 */
export interface BlogPost {
  id: string;
  slug: string;
  title: {
    ja: string;
    zh: string;
    en?: string;
  };
  excerpt: {
    ja: string;
    zh: string;
    en?: string;
  };
  content?: {
    ja: string;
    zh: string;
    en?: string;
  };
  date: string;
  thumbnail: string;
  category: string;
  author?: string;
  authorId?: string;
  tags?: string[];
}

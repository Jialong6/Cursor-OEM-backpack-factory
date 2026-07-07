/**
 * 博客字段的多语言访问工具
 *
 * BlogPost 的 title / excerpt / category / tags 结构为
 * Partial<Record<Locale, T>> & { ja; zh; en }:
 * ja(原文)/ zh / en 为必填基准语,其余 9 语在翻译落地前可缺省。
 *
 * 回退顺序:
 *   - 命中当前 locale → 直接返回
 *   - FALLBACK_CHAIN 定义的链(zh-tw→zh、my/ko→en)
 *   - 链尽头兜底 en → zh,保证任何 locale 都不会拿到 undefined
 */
import type { Locale } from '@/i18n';

export type LocalizedField<T = string> = Partial<Record<Locale, T>> & {
  ja: T;
  zh: T;
  en: T;
};

/**
 * 非直击时的语言回退链(正文与元数据共用;
 * blog-data.getBlogPostContent 也引用它决定正文加载顺序)
 */
export const FALLBACK_CHAIN: Partial<Record<Locale, readonly Locale[]>> = {
  'zh-tw': ['zh'],
  // 缅/韩 B2B 读者英语可读性最好,回退 en
  my: ['en'],
  ko: ['en'],
};

export function getLocalizedField<T>(
  field: LocalizedField<T> | undefined,
  locale: string,
): T | undefined {
  if (!field) return undefined;

  const direct = field[locale as Locale];
  if (direct !== undefined) return direct;

  for (const fallback of FALLBACK_CHAIN[locale as Locale] ?? []) {
    const value = field[fallback];
    if (value !== undefined) return value;
  }

  return field.en ?? field.zh;
}

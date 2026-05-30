/**
 * 博客字段的多语言访问工具
 *
 * BlogPost 的 title / excerpt / content 字段结构为 { ja, zh, en? }，
 * 站点同时支持 10 种 locale（ja/zh/en/de/nl/fr/pt/es/zh-tw/ru）。
 * 这个工具按以下顺序回退：
 *   - ja  → field.ja
 *   - zh / zh-tw → field.zh
 *   - en  → field.en ?? field.zh
 *   - 其他 → field.en ?? field.zh
 *
 * 中文作为最终兜底，保证任何 locale 都不会拿到 undefined。
 */
export interface LocalizedField<T = string> {
  ja: T;
  zh: T;
  en?: T;
}

export function getLocalizedField<T>(
  field: LocalizedField<T> | undefined,
  locale: string,
): T | undefined {
  if (!field) return undefined;
  if (locale === 'ja') return field.ja;
  if (locale === 'zh' || locale === 'zh-tw') return field.zh;
  if (field.en !== undefined) return field.en;
  return field.zh;
}

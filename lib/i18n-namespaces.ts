/**
 * 翻译命名空间配置
 *
 * Task 19.2: 定义页面级命名空间常量和过滤工具函数，
 * 支持未来页面级翻译代码分割优化。
 */

/**
 * 布局组件共用的命名空间（Navbar, Footer, LanguageBanner 等）
 */
export const LAYOUT_NAMESPACES = [
  'nav',
  'footer',
  'language',
  'languageBanner',
] as const;

/**
 * 首页使用的命名空间
 */
export const HOME_NAMESPACES = [
  'banner',
  'features',
  'customization',
  'about',
  'services',
  'faq',
  'contact',
  'testimonials',
  'blog',
  'bento',
  'author',
  'certifications',
] as const;

/**
 * 博客页面使用的命名空间
 */
export const BLOG_NAMESPACES = [
  'blogList',
  'blogDetail',
  'glossary',
] as const;

/**
 * 从完整翻译消息中过滤指定命名空间
 *
 * @param messages - 完整的翻译消息对象
 * @param namespaces - 需要保留的命名空间列表
 * @returns 仅包含指定命名空间的消息子集
 */
export function pickNamespaces(
  messages: Record<string, unknown>,
  namespaces: readonly string[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const ns of namespaces) {
    if (Object.prototype.hasOwnProperty.call(messages, ns)) {
      result[ns] = messages[ns];
    }
  }
  return result;
}

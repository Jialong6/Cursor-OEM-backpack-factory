import { getRequestConfig } from 'next-intl/server';

/**
 * 支持的语言列表
 */
export const locales = ['en', 'zh'] as const;

/**
 * 默认语言
 */
export const defaultLocale = 'en' as const;

/**
 * 语言类型定义
 */
export type Locale = (typeof locales)[number];

/**
 * next-intl 配置
 * 根据请求的 locale 参数加载对应的翻译文件
 */
export default getRequestConfig(async ({ requestLocale }) => {
  // 获取请求的 locale（对应 [locale] 路由段）
  let locale = await requestLocale;

  // 如果 locale 无效，使用默认语言
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./locales/${locale}.json`)).default,
  };
});

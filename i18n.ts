import { notFound } from 'next/navigation';
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
export default getRequestConfig(async ({ locale }) => {
  // 验证传入的 locale 是否在支持的列表中
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    locale: locale as string,
    messages: (await import(`./locales/${locale}.json`)).default,
  };
});

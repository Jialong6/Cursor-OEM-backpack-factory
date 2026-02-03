/**
 * 多语言字体配置（纯数据模块，不依赖 next/font）
 *
 * Task 16: 配置多语言字体
 * - 16.1 Noto Sans 字体家族配置
 * - 16.3 字体回退栈
 *
 * 此模块仅包含字体映射和回退栈数据，
 * 实际字体加载由 app/fonts.ts 通过 next/font/google 完成。
 */

import type { Locale } from '@/i18n';

/**
 * 字体配置接口
 */
export interface LocaleFontConfig {
  /** 主要字体名称列表（按优先级排序） */
  readonly primary: readonly string[];
  /** 回退字体列表（按优先级排序） */
  readonly fallback: readonly string[];
}

/**
 * 全局字体回退栈
 * 所有 locale 最终都会回退到这些通用字体族
 */
export const FONT_FALLBACK_STACK: readonly string[] = [
  'system-ui',
  'sans-serif',
] as const;

/**
 * 简体中文字体配置
 */
const zhFontConfig: LocaleFontConfig = {
  primary: ['Noto Sans SC', 'Noto Sans'],
  fallback: ['PingFang SC', 'Microsoft YaHei', 'SimHei', 'system-ui', 'sans-serif'],
};

/**
 * 繁体中文字体配置
 */
const zhTwFontConfig: LocaleFontConfig = {
  primary: ['Noto Sans TC', 'Noto Sans'],
  fallback: ['PingFang TC', 'Microsoft JhengHei', 'system-ui', 'sans-serif'],
};

/**
 * 日语字体配置
 */
const jaFontConfig: LocaleFontConfig = {
  primary: ['Noto Sans JP', 'Noto Sans'],
  fallback: ['Hiragino Sans', 'MS Gothic', 'Yu Gothic', 'system-ui', 'sans-serif'],
};

/**
 * 俄语字体配置（西里尔字母）
 */
const ruFontConfig: LocaleFontConfig = {
  primary: ['Noto Sans'],
  fallback: ['Arial', 'system-ui', 'sans-serif'],
};

/**
 * 拉丁语言字体配置（en, de, nl, fr, pt, es）
 */
const latinFontConfig: LocaleFontConfig = {
  primary: ['Noto Sans'],
  fallback: ['Arial', 'Helvetica Neue', 'system-ui', 'sans-serif'],
};

/**
 * locale 到字体配置的完整映射
 */
const localeFontConfigs: Record<Locale, LocaleFontConfig> = {
  en: latinFontConfig,
  de: latinFontConfig,
  nl: latinFontConfig,
  fr: latinFontConfig,
  pt: latinFontConfig,
  es: latinFontConfig,
  zh: zhFontConfig,
  'zh-tw': zhTwFontConfig,
  ja: jaFontConfig,
  ru: ruFontConfig,
};

/**
 * 获取指定 locale 的字体配置
 *
 * @param locale - 语言代码
 * @returns 字体配置（primary + fallback）
 */
export function getLocaleFontConfig(locale: Locale): LocaleFontConfig {
  return localeFontConfigs[locale] ?? latinFontConfig;
}

/**
 * 获取指定 locale 的完整字体栈（primary + fallback）
 * 用于 CSS font-family 声明
 *
 * @param locale - 语言代码
 * @returns 字体名称数组（按优先级排序）
 */
export function getFontStack(locale: Locale): readonly string[] {
  const config = getLocaleFontConfig(locale);
  return [...config.primary, ...config.fallback];
}

/**
 * CSS 变量名称映射
 * 用于 next/font/google 的 variable 选项
 */
export const FONT_CSS_VARIABLES = {
  base: '--font-noto-sans',
  sc: '--font-noto-sans-sc',
  tc: '--font-noto-sans-tc',
  jp: '--font-noto-sans-jp',
} as const;

/**
 * 获取指定 locale 需要的 CSS 变量名称列表
 *
 * @param locale - 语言代码
 * @returns 需要的 CSS 变量名称数组
 */
export function getRequiredCSSVariables(locale: Locale): readonly string[] {
  const base = FONT_CSS_VARIABLES.base;

  switch (locale) {
    case 'zh':
      return [base, FONT_CSS_VARIABLES.sc];
    case 'zh-tw':
      return [base, FONT_CSS_VARIABLES.tc];
    case 'ja':
      return [base, FONT_CSS_VARIABLES.jp];
    default:
      return [base];
  }
}

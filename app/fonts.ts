/**
 * Next.js 字体加载模块
 *
 * Task 16: 配置多语言字体
 * - 16.2 实现按语言加载字体
 *
 * 字体策略:
 * - 拉丁/西里尔语言: Noto Sans (latin, latin-ext, cyrillic)
 * - 简体中文 (zh): Noto Sans SC
 * - 繁体中文 (zh-tw): Noto Sans TC
 * - 日语 (ja): Noto Sans JP
 *
 * 配置数据定义在 lib/font-config.ts（可独立测试）
 */

import {
  Noto_Sans,
  Noto_Sans_SC,
  Noto_Sans_TC,
  Noto_Sans_JP,
} from 'next/font/google';
import type { Locale } from '@/i18n';

// Re-export config types and functions for convenience
export {
  getLocaleFontConfig,
  getFontStack,
  getRequiredCSSVariables,
  FONT_FALLBACK_STACK,
  FONT_CSS_VARIABLES,
  type LocaleFontConfig,
} from '@/lib/font-config';

// -- Next.js 字体实例 --

/**
 * Noto Sans - 拉丁/西里尔/希腊字母基础字体
 * 覆盖: en, de, nl, fr, pt, es, ru
 */
const notoSans = Noto_Sans({
  variable: '--font-noto-sans',
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  adjustFontFallback: true,
});

/**
 * Noto Sans SC - 简体中文
 */
const notoSansSC = Noto_Sans_SC({
  variable: '--font-noto-sans-sc',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '700'],
  preload: true,
});

/**
 * Noto Sans TC - 繁体中文
 */
const notoSansTC = Noto_Sans_TC({
  variable: '--font-noto-sans-tc',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '700'],
  preload: true,
});

/**
 * Noto Sans JP - 日语
 */
const notoSansJP = Noto_Sans_JP({
  variable: '--font-noto-sans-jp',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '700'],
  preload: true,
});

/**
 * 获取指定 locale 的 CSS 变量类名字符串
 *
 * next/font/google 的每个字体实例生成一个 CSS 变量类名，
 * 此函数根据 locale 组合需要的 CSS 变量。
 *
 * @param locale - 语言代码
 * @returns CSS 类名字符串，用于应用到 body 元素
 */
export function getFontVariables(locale: Locale): string {
  const base = notoSans.variable;

  switch (locale) {
    case 'zh':
      return `${base} ${notoSansSC.variable}`;
    case 'zh-tw':
      return `${base} ${notoSansTC.variable}`;
    case 'ja':
      return `${base} ${notoSansJP.variable}`;
    default:
      return base;
  }
}

/**
 * 获取指定 locale 的字体 className
 *
 * 用于直接应用字体样式（非 CSS 变量方式）
 *
 * @param locale - 语言代码
 * @returns CSS 类名字符串
 */
export function getFontClassName(locale: Locale): string {
  const base = notoSans.className;

  switch (locale) {
    case 'zh':
      return `${base} ${notoSansSC.className}`;
    case 'zh-tw':
      return `${base} ${notoSansTC.className}`;
    case 'ja':
      return `${base} ${notoSansJP.className}`;
    default:
      return base;
  }
}

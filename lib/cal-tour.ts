import type { Locale } from '@/i18n';

/**
 * Cal.com 虚拟看厂预约配置与纯函数
 *
 * 预约排期(可约时段 Mon-Sat 07:30-17:00 Asia/Yangon、60 分钟、Zoom/Google
 * Meet 双地点)全部配置在 Cal.com 后台(见 docs/CAL_COM_SETUP.md),代码侧
 * 只持有嵌入链接与 locale 相关的展示决策。
 */

/**
 * 读取 Cal.com 预约链接(形如 "用户名/virtual-factory-tour")
 *
 * 用函数而非模块常量:NEXT_PUBLIC_ 变量由 Next.js 构建期内联,函数内引用
 * 同样生效,且便于测试(vi.stubEnv)。未配置返回空串,由嵌入组件降级为
 * 联系方式兜底卡,避免渲染坏的 embed。
 */
export function getCalLink(): string {
  return process.env.NEXT_PUBLIC_CAL_LINK ?? '';
}

/**
 * 不加载 Cal.com embed 的 locale
 *
 * zh(中国大陆):app.cal.com 为海外 Vercel 域,可达性不可靠;Google Meet
 * 在大陆完全不可用;确认邮件中的 Google Calendar 链接也可能被墙。改为渲染
 * WhatsApp/邮件/联系表单替代卡(模式同 FactoryMapEmbed 的 HIDDEN_LOCALES)。
 */
export const EMBED_HIDDEN_LOCALES: readonly string[] = ['zh'];

/**
 * 判断当前 locale 是否应隐藏 embed、改渲染替代联系卡
 */
export function isEmbedHiddenLocale(locale: string): boolean {
  return EMBED_HIDDEN_LOCALES.includes(locale);
}

/**
 * Cal.com 预约界面支持的语言代码(与 cal.com 仓库 i18n.json 对齐的本站子集)
 */
export const CAL_SUPPORTED_LOCALES: readonly string[] = [
  'en',
  'zh-CN',
  'zh-TW',
  'ja',
  'de',
  'nl',
  'fr',
  'pt',
  'es',
  'ru',
  'ko',
];

/** locale 与 Cal.com 语言代码不一致时的映射(其余 locale 直接透传) */
const CAL_LOCALE_OVERRIDES: Record<string, string> = {
  zh: 'zh-CN',
  'zh-tw': 'zh-TW',
};

/**
 * 站点 locale → Cal.com UI 语言代码;Cal.com 不支持的语言(缅甸语)返回 null
 *
 * 现状:Cal.com embed 的界面语言由访客浏览器 Accept-Language 决定,无强制
 * 参数。本映射今日用于 my 页面的"预约表单可能显示为英文"提示条,并为未来
 * embed 支持强制语言参数时预留。
 */
export function toCalLocale(locale: Locale): string | null {
  if (locale === 'my') {
    return null;
  }
  return CAL_LOCALE_OVERRIDES[locale] ?? locale;
}

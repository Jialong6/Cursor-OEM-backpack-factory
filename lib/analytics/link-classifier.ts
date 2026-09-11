/**
 * 把链接 href 归类成外链转化事件(纯函数)
 *
 * 为什么要有这个模块:所有 WhatsApp / 邮件 / 电话 / 地图链接的点击都靠
 * InsightTracker 里一个 document 级委托监听器采集,而不是去改六个组件。
 * lib/contact-links.ts 是会被服务端组件 import 的纯字符串模块,不能塞
 * track();而 Contact.tsx 里还有一个没走那个模块的裸 mailto:,逐个改
 * 迟早会漏。委托 + 分类的做法零组件改动,而且以后任何地方新加一个
 * WhatsApp 链接都会自动被采到。
 *
 * 两条硬约束:
 * 1. 站内锚点与同源链接必须返回 null。否则 CostAdvantage / FAQ 的
 *    <a href="#contact"> 会被委托监听器和 useAnchorScroll 各记一次,
 *    cta_click 直接翻倍。
 * 2. 返回值里永远不含 href 的任何片段。电话号码与邮箱地址一个字符都不
 *    进库 —— 维度靠元素上的 data-analytics-label,不靠解析 href。
 */

/** 委托监听器能识别的四类外链转化 */
export const OUTBOUND_EVENT_NAMES = Object.freeze([
  'whatsapp_click',
  'email_click',
  'phone_click',
  'map_click',
] as const);

export type OutboundEventName = (typeof OUTBOUND_EVENT_NAMES)[number];

/** 地图外链的域名特征。goo.gl/maps 是 Google 地图的短链形式 */
const MAP_PATTERNS: readonly string[] = Object.freeze([
  'google.com/maps',
  'maps.google.com',
  'goo.gl/maps',
]);

/** WhatsApp 的两种官方链接形式 */
const WHATSAPP_PATTERNS: readonly string[] = Object.freeze([
  'wa.me/',
  'api.whatsapp.com/',
]);

/**
 * 判断一个 href 属于哪类外链转化
 *
 * @param href - 元素上的原始 href,可以带前后空格
 * @returns 事件名;站内链接、无法识别的外链、空值一律返回 null
 */
export function classifyLink(
  href: string | null | undefined
): OutboundEventName | null {
  if (typeof href !== 'string') {
    return null;
  }

  const trimmed = href.trim();

  if (trimmed === '') {
    return null;
  }

  const lowered = trimmed.toLowerCase();

  // 站内锚点与相对路径最先排除:它们由 useAnchorScroll 单独上报,
  // 在这里再记一次会让 cta_click 翻倍
  if (lowered.startsWith('#') || lowered.startsWith('/')) {
    return null;
  }

  if (lowered.startsWith('mailto:')) {
    return 'email_click';
  }

  if (lowered.startsWith('tel:')) {
    return 'phone_click';
  }

  if (WHATSAPP_PATTERNS.some((pattern) => lowered.includes(pattern))) {
    return 'whatsapp_click';
  }

  if (MAP_PATTERNS.some((pattern) => lowered.includes(pattern))) {
    return 'map_click';
  }

  return null;
}

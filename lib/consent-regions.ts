/**
 * 需要 Cookie 同意的国家/地区(纯数据模块)
 *
 * 站点接入的第三方分析(Google Analytics 4、Microsoft Clarity)会写非必要
 * cookie。在下列法域,ePrivacy/PECR 要求先取得访客同意才能写入:
 * - 欧洲经济区 EEA:欧盟 27 国 + 冰岛/列支敦士登/挪威
 * - 英国:脱欧后适用 UK GDPR + PECR,要求不变
 * - 瑞士:适用 FADP;且微软自 2025-10-31 起把瑞士纳入 Clarity 强制同意名单
 *
 * 其余国家的访客默认放行,不弹同意条 —— 对美国/中东/东南亚这些不要求同意的
 * 市场弹条只会白白损失询盘转化。
 *
 * 本模块不能引入 'use client',也不能引入 next/server:它同时被中间件、
 * 服务端组件和客户端组件使用。
 */

/** 欧盟 27 个成员国(2020 年英国脱欧后的名单) */
export const EU_MEMBER_COUNTRIES: readonly string[] = Object.freeze([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
]);

/** 欧洲经济区中不属于欧盟的 3 国 */
export const NON_EU_EEA_COUNTRIES: readonly string[] = Object.freeze([
  'IS', 'LI', 'NO',
]);

/** 适用 EEA 同等要求、但不属于 EEA 的国家 */
export const ADDITIONAL_CONSENT_COUNTRIES: readonly string[] = Object.freeze([
  'GB', 'CH',
]);

/** 需要弹同意条的完整国家清单(32 个) */
export const CONSENT_REQUIRED_COUNTRIES: readonly string[] = Object.freeze([
  ...EU_MEMBER_COUNTRIES,
  ...NON_EU_EEA_COUNTRIES,
  ...ADDITIONAL_CONSENT_COUNTRIES,
]);

/**
 * 用 Set 而非普通对象做查表,避免 '__proto__' 一类的键落到原型链上
 * 被误判为命中。
 */
const CONSENT_REQUIRED_SET: ReadonlySet<string> = new Set(
  CONSENT_REQUIRED_COUNTRIES
);

/**
 * 判断该国家码的访客是否必须先取得同意才能加载第三方分析脚本
 *
 * 国家未知(空值)时返回 false:此时按不需要同意处理。地理信息缺失多发生在
 * 本地开发和少数无法定位的 IP 上,对这些访客弹条既无法律必要也无意义。
 *
 * @param countryCode - ISO 3166-1 alpha-2 国家码,大小写与前后空格均可
 * @returns true 表示该访客需要先同意
 */
export function requiresConsent(
  countryCode: string | null | undefined
): boolean {
  if (typeof countryCode !== 'string') {
    return false;
  }

  const normalized = countryCode.trim().toUpperCase();

  if (normalized.length !== 2) {
    return false;
  }

  return CONSENT_REQUIRED_SET.has(normalized);
}

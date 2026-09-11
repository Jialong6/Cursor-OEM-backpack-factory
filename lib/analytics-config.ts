/**
 * 第三方分析脚本的配置与地区门禁(纯数据模块)
 *
 * 两条门禁互相独立,共用中间件写入的 geo_cc cookie:
 * 1. 中国门禁(本模块):CN 访客不加载 GA 与 Clarity。googletagmanager.com
 *    被墙,clarity.ms 同样不可靠;硬加载只会让中文买家的页面挂起。中文市场
 *    的行为数据由第二期的同源自建埋点覆盖。
 * 2. 同意门禁(lib/consent-regions.ts):EEA/英国/瑞士访客需先点同意。
 *
 * 两个 ID 都遵循「留空即禁用」,因此本地开发和 preview 环境默认不上报,
 * 不会污染生产数据。
 *
 * 本模块不能引入 'use client',也不能引入 next/server。
 */

/** 中间件写入的国家码 cookie 名(非 HttpOnly,客户端需要同步读取) */
export const GEO_COUNTRY_COOKIE = 'geo_cc';

/** 不加载任何第三方分析脚本的国家 */
export const BLOCKED_ANALYTICS_COUNTRIES: readonly string[] = Object.freeze([
  'CN',
]);

const BLOCKED_SET: ReadonlySet<string> = new Set(BLOCKED_ANALYTICS_COUNTRIES);

/**
 * .env.example 里的占位值。误把占位值带上生产会让脚本请求一个不存在的
 * 媒体资源,这里直接当作未配置。
 */
const PLACEHOLDER_IDS: ReadonlySet<string> = new Set([
  'G-XXXXXXXXXX',
  'XXXXXXXXXX',
  'xxxxxxxxxx',
]);

/**
 * 读取并清洗一个 NEXT_PUBLIC 环境变量
 *
 * 注意:调用方必须把 process.env.NEXT_PUBLIC_XXX 这个完整字面量传进来。
 * Next.js 在构建期做的是字面量替换,动态拼接的键名拿不到值。
 */
function normalizeId(raw: string | undefined): string {
  const trimmed = (raw ?? '').trim();

  if (!trimmed || PLACEHOLDER_IDS.has(trimmed)) {
    return '';
  }

  return trimmed;
}

/** Google Analytics 4 的 Measurement ID,未配置时返回空串 */
export function getGaMeasurementId(): string {
  return normalizeId(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);
}

/** Microsoft Clarity 的 Project ID,未配置时返回空串 */
export function getClarityProjectId(): string {
  return normalizeId(process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID);
}

/**
 * 该国家的访客是否可以加载第三方分析脚本
 *
 * 国家未知时返回 true:定位失败不应该让全站都收不到数据。
 *
 * @param countryCode - ISO 3166-1 alpha-2 国家码
 */
export function shouldLoadThirdParty(
  countryCode: string | null | undefined
): boolean {
  if (typeof countryCode !== 'string') {
    return true;
  }

  const normalized = countryCode.trim().toUpperCase();

  if (normalized.length !== 2) {
    return true;
  }

  return !BLOCKED_SET.has(normalized);
}

/**
 * 从 document.cookie 字符串里取出国家码
 *
 * 做成纯函数而不是直接读 document,是为了能在 happy-dom 之外单测,
 * 也让组件保持薄。
 *
 * @param cookieHeader - document.cookie 的原始字符串
 * @returns 两位大写国家码;未找到或格式不对时返回空串
 */
export function parseGeoCountry(
  cookieHeader: string | null | undefined
): string {
  if (typeof cookieHeader !== 'string' || !cookieHeader) {
    return '';
  }

  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');

    if (separator === -1) {
      continue;
    }

    const name = part.slice(0, separator).trim();

    if (name !== GEO_COUNTRY_COOKIE) {
      continue;
    }

    const value = part.slice(separator + 1).trim().toUpperCase();

    return /^[A-Z]{2}$/.test(value) ? value : '';
  }

  return '';
}

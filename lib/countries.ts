/**
 * 国家数据常量和工具函数
 *
 * 提供国际化的国家列表，用于联系表单的国家选择器。
 * 包含约 30 个常用国家/地区，支持中英文名称。
 */

/**
 * 国家选项接口
 */
export interface CountryOption {
  /** ISO 3166-1 alpha-2 国家代码 */
  code: string;
  /** 中文名称 */
  nameZh: string;
  /** 英文名称 */
  nameEn: string;
}

/**
 * 本地化国家信息（简化结构）
 */
export interface LocalizedCountry {
  code: string;
  name: string;
}

/**
 * 热门国家代码（置顶显示）
 * 这些国家将在下拉列表顶部优先显示
 */
export const POPULAR_COUNTRY_CODES: readonly string[] = Object.freeze([
  'CN', // 中国
  'US', // 美国
  'JP', // 日本
  'DE', // 德国
  'GB', // 英国
  'FR', // 法国
  'KR', // 韩国
  'MM', // 缅甸
]);

/**
 * 完整国家列表
 * 包含约 30 个常用国家/地区，按英文名称字母排序
 */
export const COUNTRIES: readonly CountryOption[] = Object.freeze([
  { code: 'AU', nameZh: '澳大利亚', nameEn: 'Australia' },
  { code: 'BR', nameZh: '巴西', nameEn: 'Brazil' },
  { code: 'CA', nameZh: '加拿大', nameEn: 'Canada' },
  { code: 'CN', nameZh: '中国', nameEn: 'China' },
  { code: 'DE', nameZh: '德国', nameEn: 'Germany' },
  { code: 'ES', nameZh: '西班牙', nameEn: 'Spain' },
  { code: 'FR', nameZh: '法国', nameEn: 'France' },
  { code: 'GB', nameZh: '英国', nameEn: 'United Kingdom' },
  { code: 'HK', nameZh: '中国香港', nameEn: 'Hong Kong' },
  { code: 'ID', nameZh: '印度尼西亚', nameEn: 'Indonesia' },
  { code: 'IN', nameZh: '印度', nameEn: 'India' },
  { code: 'IT', nameZh: '意大利', nameEn: 'Italy' },
  { code: 'JP', nameZh: '日本', nameEn: 'Japan' },
  { code: 'KR', nameZh: '韩国', nameEn: 'South Korea' },
  { code: 'MM', nameZh: '缅甸', nameEn: 'Myanmar' },
  { code: 'MX', nameZh: '墨西哥', nameEn: 'Mexico' },
  { code: 'MY', nameZh: '马来西亚', nameEn: 'Malaysia' },
  { code: 'NL', nameZh: '荷兰', nameEn: 'Netherlands' },
  { code: 'NZ', nameZh: '新西兰', nameEn: 'New Zealand' },
  { code: 'PH', nameZh: '菲律宾', nameEn: 'Philippines' },
  { code: 'PL', nameZh: '波兰', nameEn: 'Poland' },
  { code: 'RU', nameZh: '俄罗斯', nameEn: 'Russia' },
  { code: 'SA', nameZh: '沙特阿拉伯', nameEn: 'Saudi Arabia' },
  { code: 'SG', nameZh: '新加坡', nameEn: 'Singapore' },
  { code: 'TH', nameZh: '泰国', nameEn: 'Thailand' },
  { code: 'TR', nameZh: '土耳其', nameEn: 'Turkey' },
  { code: 'TW', nameZh: '中国台湾', nameEn: 'Taiwan' },
  { code: 'AE', nameZh: '阿联酋', nameEn: 'United Arab Emirates' },
  { code: 'US', nameZh: '美国', nameEn: 'United States' },
  { code: 'VN', nameZh: '越南', nameEn: 'Vietnam' },
]);

/**
 * 根据 locale 获取本地化国家列表
 *
 * @param locale - 语言代码 ('zh' | 'en' | 其他)
 * @returns 本地化后的国家数组，包含 code 和 name
 *
 * @example
 * ```ts
 * const countries = getLocalizedCountries('zh');
 * // [{ code: 'CN', name: '中国' }, ...]
 * ```
 */
export function getLocalizedCountries(locale: string): LocalizedCountry[] {
  const isZh = locale === 'zh' || locale.startsWith('zh-');

  return COUNTRIES.map((country) => ({
    code: country.code,
    name: isZh ? country.nameZh : country.nameEn,
  }));
}

/**
 * 根据国家代码获取国家信息
 *
 * @param code - ISO 3166-1 alpha-2 国家代码（不区分大小写）
 * @returns 匹配的国家对象，未找到时返回 undefined
 *
 * @example
 * ```ts
 * const china = getCountryByCode('CN');
 * // { code: 'CN', nameZh: '中国', nameEn: 'China' }
 * ```
 */
export function getCountryByCode(code: string): CountryOption | undefined {
  if (!code) return undefined;
  const upperCode = code.toUpperCase();
  return COUNTRIES.find((country) => country.code === upperCode);
}

import { getExampleNumber, isSupportedCountry, type CountryCode } from 'libphonenumber-js/min';
import examples from 'libphonenumber-js/mobile/examples';

/**
 * 返回该国家本地号码示例（不含 + 和 dial code），用作表单 placeholder。
 *
 * 例如：
 *   getLocalExampleNumber('US') → '2015550123'
 *   getLocalExampleNumber('CN') → '13123456789'
 *   getLocalExampleNumber('JP') → '9012345678'
 *
 * 若国家码无效或库不支持，返回 null —— 调用方应回退到通用占位符。
 */
export function getLocalExampleNumber(isoCode: string): string | null {
  if (!isoCode || isoCode.length !== 2) return null;
  const upper = isoCode.toUpperCase();
  if (!isSupportedCountry(upper)) return null;
  try {
    const phone = getExampleNumber(upper as CountryCode, examples);
    return phone?.nationalNumber ?? null;
  } catch {
    return null;
  }
}

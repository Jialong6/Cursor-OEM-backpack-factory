/**
 * Unit tests for lib/analytics-config.ts
 *
 * 第三方分析脚本的开关与地区门禁:
 * - 环境变量留空即禁用(preview/本地默认不污染生产数据)
 * - 中国大陆访客跳过 GA 与 Clarity(googletagmanager.com 被墙,
 *   clarity.ms 同样不可靠;硬加载只会拖慢中文买家的页面)
 * - geo_cc cookie 由中间件写入,客户端同步读取,不额外发请求
 */
import { describe, test, expect, afterEach, vi } from 'vitest';
import {
  BLOCKED_ANALYTICS_COUNTRIES,
  GEO_COUNTRY_COOKIE,
  getGaMeasurementId,
  getClarityProjectId,
  shouldLoadThirdParty,
  parseGeoCountry,
} from '../../lib/analytics-config';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getGaMeasurementId', () => {
  test('returns the configured measurement id', () => {
    vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', 'G-ABC123XYZ');
    expect(getGaMeasurementId()).toBe('G-ABC123XYZ');
  });

  test('returns empty string when unset', () => {
    vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', '');
    expect(getGaMeasurementId()).toBe('');
  });

  test('trims whitespace so a stray space in the dashboard does not break the id', () => {
    vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', '  G-ABC123XYZ  ');
    expect(getGaMeasurementId()).toBe('G-ABC123XYZ');
  });

  test('rejects a placeholder that was never replaced', () => {
    vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', 'G-XXXXXXXXXX');
    expect(getGaMeasurementId()).toBe('');
  });
});

describe('getClarityProjectId', () => {
  test('returns the configured project id', () => {
    vi.stubEnv('NEXT_PUBLIC_CLARITY_PROJECT_ID', 'abcd1234ef');
    expect(getClarityProjectId()).toBe('abcd1234ef');
  });

  test('returns empty string when unset', () => {
    vi.stubEnv('NEXT_PUBLIC_CLARITY_PROJECT_ID', '');
    expect(getClarityProjectId()).toBe('');
  });
});

describe('BLOCKED_ANALYTICS_COUNTRIES', () => {
  test('blocks mainland China', () => {
    expect(BLOCKED_ANALYTICS_COUNTRIES).toContain('CN');
  });

  test('does not block Hong Kong, Macau or Taiwan', () => {
    expect(BLOCKED_ANALYTICS_COUNTRIES).not.toContain('HK');
    expect(BLOCKED_ANALYTICS_COUNTRIES).not.toContain('MO');
    expect(BLOCKED_ANALYTICS_COUNTRIES).not.toContain('TW');
  });
});

describe('shouldLoadThirdParty', () => {
  test('returns false for mainland China', () => {
    expect(shouldLoadThirdParty('CN')).toBe(false);
  });

  test.each(['DE', 'US', 'MM', 'JP', 'HK', 'TW'])(
    'returns true for %s',
    (code) => {
      expect(shouldLoadThirdParty(code)).toBe(true);
    }
  );

  test('is case insensitive', () => {
    expect(shouldLoadThirdParty('cn')).toBe(false);
  });

  test('returns true when the country is unknown', () => {
    expect(shouldLoadThirdParty('')).toBe(true);
    expect(shouldLoadThirdParty(null)).toBe(true);
    expect(shouldLoadThirdParty(undefined)).toBe(true);
  });
});

describe('parseGeoCountry', () => {
  test('reads the geo cookie from a document.cookie string', () => {
    expect(parseGeoCountry(`${GEO_COUNTRY_COOKIE}=DE`)).toBe('DE');
  });

  test('finds the cookie among others regardless of position', () => {
    const jar = `NEXT_LOCALE=de; ${GEO_COUNTRY_COOKIE}=FR; lang_auto_redirect=true`;
    expect(parseGeoCountry(jar)).toBe('FR');
  });

  test('uppercases and trims the value', () => {
    expect(parseGeoCountry(`${GEO_COUNTRY_COOKIE}= us `)).toBe('US');
  });

  test('returns empty string when the cookie is absent', () => {
    expect(parseGeoCountry('NEXT_LOCALE=en')).toBe('');
    expect(parseGeoCountry('')).toBe('');
  });

  test('does not match a cookie whose name merely ends with the geo cookie name', () => {
    expect(parseGeoCountry(`x_${GEO_COUNTRY_COOKIE}=DE`)).toBe('');
  });

  test('ignores a value that is not a two letter code', () => {
    expect(parseGeoCountry(`${GEO_COUNTRY_COOKIE}=DEU`)).toBe('');
    expect(parseGeoCountry(`${GEO_COUNTRY_COOKIE}=`)).toBe('');
  });

  test('tolerates null and undefined input', () => {
    expect(parseGeoCountry(null)).toBe('');
    expect(parseGeoCountry(undefined)).toBe('');
  });
});

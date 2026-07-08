/**
 * Unit tests for lib/cal-tour.ts
 *
 * Cal.com 虚拟看厂预约的配置与纯函数:
 * - getCalLink: 从 NEXT_PUBLIC_CAL_LINK 读取预约链接(未配置返回空串)
 * - isEmbedHiddenLocale: zh(中国大陆)不加载 embed
 */
import { describe, test, expect, afterEach, vi } from 'vitest';
import { locales } from '../../i18n';
import { getCalLink, isEmbedHiddenLocale } from '../../lib/cal-tour';

describe('getCalLink', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('returns the value of NEXT_PUBLIC_CAL_LINK when set', () => {
    vi.stubEnv('NEXT_PUBLIC_CAL_LINK', 'better-bags/virtual-factory-tour');
    expect(getCalLink()).toBe('better-bags/virtual-factory-tour');
  });

  test('returns empty string when NEXT_PUBLIC_CAL_LINK is not set', () => {
    vi.stubEnv('NEXT_PUBLIC_CAL_LINK', '');
    expect(getCalLink()).toBe('');
  });
});

describe('isEmbedHiddenLocale', () => {
  test('returns true for zh (Google Meet + app.cal.com unreliable in mainland China)', () => {
    expect(isEmbedHiddenLocale('zh')).toBe(true);
  });

  test.each(locales.filter((l) => l !== 'zh'))(
    'returns false for locale "%s"',
    (locale) => {
      expect(isEmbedHiddenLocale(locale)).toBe(false);
    }
  );

  test('returns false for unknown locale strings', () => {
    expect(isEmbedHiddenLocale('xx')).toBe(false);
  });
});

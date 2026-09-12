/**
 * Unit tests for lib/analytics/device.ts
 *
 * 三个粗粒度维度,用来回答「手机端是不是转化更差」这类问题。
 * 两处顺序是有真实出错空间的:平板要先于手机判断(iPad 的 UA 里同时含
 * Mobile 与 iPad),Edge 要先于 Chrome、Chrome 要先于 Safari(它们互相
 * 把对方的名字写进了自己的 UA)。
 */
import { describe, it, test, expect } from 'vitest';
import fc from 'fast-check';
import { parseUserAgent } from '../../../lib/analytics/device';

const UA = {
  iphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  ipad:
    'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  androidPhone:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  androidTablet:
    'Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  macChrome:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  winEdge:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  winFirefox:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  macSafari:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
} as const;

describe('设备类型', () => {
  test('iPhone 是手机', () => {
    expect(parseUserAgent(UA.iphone).type).toBe('mobile');
  });

  test('iPad 是平板,不是手机 —— 它的 UA 里同时含 Mobile 与 iPad', () => {
    expect(parseUserAgent(UA.ipad).type).toBe('tablet');
  });

  test('安卓手机是手机', () => {
    expect(parseUserAgent(UA.androidPhone).type).toBe('mobile');
  });

  test('安卓平板是平板 —— 特征是有 Android 却没有 Mobile', () => {
    expect(parseUserAgent(UA.androidTablet).type).toBe('tablet');
  });

  test('桌面浏览器是桌面', () => {
    expect(parseUserAgent(UA.macChrome).type).toBe('desktop');
    expect(parseUserAgent(UA.winEdge).type).toBe('desktop');
  });
});

describe('浏览器', () => {
  test('Edge 不会被算成 Chrome', () => {
    expect(parseUserAgent(UA.winEdge).browser).toBe('Edge');
  });

  test('Chrome 不会被算成 Safari', () => {
    expect(parseUserAgent(UA.macChrome).browser).toBe('Chrome');
  });

  test('Safari 就是 Safari', () => {
    expect(parseUserAgent(UA.macSafari).browser).toBe('Safari');
  });

  test('Firefox', () => {
    expect(parseUserAgent(UA.winFirefox).browser).toBe('Firefox');
  });
});

describe('系统', () => {
  test.each([
    [UA.iphone, 'iOS'],
    [UA.ipad, 'iOS'],
    [UA.androidPhone, 'Android'],
    [UA.macChrome, 'macOS'],
    [UA.winEdge, 'Windows'],
  ])('识别出系统 %#', (ua, expected) => {
    expect(parseUserAgent(ua).os).toBe(expected);
  });
});

describe('异常输入', () => {
  test('空值不抛错,退回桌面与未知', () => {
    for (const input of ['', '   ', null, undefined]) {
      const info = parseUserAgent(input);
      expect(info.type).toBe('desktop');
      expect(info.browser).toBe('unknown');
    }
  });
});

describe('Property: 输出恒为有限枚举,绝不回传原始 UA', () => {
  it('属性:任意字符串都得到合法的三元组', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 300 }), (ua) => {
        const info = parseUserAgent(ua);

        expect(['mobile', 'tablet', 'desktop']).toContain(info.type);
        expect(typeof info.browser).toBe('string');
        expect(typeof info.os).toBe('string');
      }),
      { numRuns: 400 }
    );
  });

  it('属性:结果里不会夹带 UA 原文', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 12, maxLength: 200 }).filter((s) => s.trim().length >= 12),
        (ua) => {
          const serialized = JSON.stringify(parseUserAgent(ua));

          expect(serialized).not.toContain(ua.trim());
        }
      ),
      { numRuns: 300 }
    );
  });
});

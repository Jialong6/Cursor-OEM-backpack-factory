/**
 * Unit tests for lib/analytics/request-context.ts
 *
 * IP 只用来即刻派生不可逆指纹,绝不落库 —— 这一点由 ingest 层保证,
 * 这里保证的是读取本身正确:Vercel 的占位国家码要被当成「未知」,
 * 城市名要解码,跨站上报要能识别出来。
 */
import { describe, test, expect } from 'vitest';
import {
  isSameOrigin,
  readClientIp,
  readGeo,
  readRequestContext,
} from '../../../lib/analytics/request-context';

function headers(init: Record<string, string>): Headers {
  return new Headers(init);
}

describe('readClientIp', () => {
  test('取 x-forwarded-for 的首段', () => {
    expect(readClientIp(headers({ 'x-forwarded-for': '203.0.113.1, 70.41.3.18' }))).toBe(
      '203.0.113.1'
    );
  });

  test('退回 x-real-ip', () => {
    expect(readClientIp(headers({ 'x-real-ip': '198.51.100.9' }))).toBe('198.51.100.9');
  });

  test('都没有时返回空串,不抛错', () => {
    expect(readClientIp(headers({}))).toBe('');
  });
});

describe('readGeo', () => {
  test('读出四个维度', () => {
    const geo = readGeo(
      headers({
        'x-vercel-ip-country': 'DE',
        'x-vercel-ip-country-region': 'BE',
        'x-vercel-ip-city': 'Berlin',
        'x-vercel-ip-timezone': 'Europe/Berlin',
      })
    );

    expect(geo).toEqual({
      country: 'DE',
      region: 'BE',
      city: 'Berlin',
      timezone: 'Europe/Berlin',
    });
  });

  test('城市名会被解码', () => {
    expect(readGeo(headers({ 'x-vercel-ip-city': 'Ho%20Chi%20Minh%20City' })).city).toBe(
      'Ho Chi Minh City'
    );
  });

  test('编码异常时留空,不把乱码写进库', () => {
    expect(readGeo(headers({ 'x-vercel-ip-city': '%E0%A4%A' })).city).toBe('');
  });

  test('Vercel 定位不到时给的占位码当成未知', () => {
    expect(readGeo(headers({ 'x-vercel-ip-country': 'XX' })).country).toBe('');
    expect(readGeo(headers({ 'x-vercel-ip-country': 'T1' })).country).toBe('');
  });

  test('退回 Cloudflare 的国家头', () => {
    expect(readGeo(headers({ 'cf-ipcountry': 'MM' })).country).toBe('MM');
  });

  test('格式不对的国家码当成未知', () => {
    expect(readGeo(headers({ 'x-vercel-ip-country': 'DEU' })).country).toBe('');
  });
});

describe('readRequestContext', () => {
  test('一次读出全部上下文,并解析出设备', () => {
    const context = readRequestContext(
      headers({
        'x-forwarded-for': '203.0.113.1',
        'user-agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
        'x-vercel-ip-country': 'JP',
      })
    );

    expect(context.ip).toBe('203.0.113.1');
    expect(context.device.type).toBe('mobile');
    expect(context.device.os).toBe('iOS');
    expect(context.geo.country).toBe('JP');
  });
});

describe('isSameOrigin', () => {
  test('同源放行', () => {
    expect(
      isSameOrigin(
        headers({ origin: 'https://betterbagsmm.com', host: 'betterbagsmm.com' })
      )
    ).toBe(true);
  });

  test('跨站拒绝', () => {
    expect(
      isSameOrigin(headers({ origin: 'https://evil.example', host: 'betterbagsmm.com' }))
    ).toBe(false);
  });

  test('缺 Origin 时放行 —— sendBeacon 在部分浏览器上确实不带这个头', () => {
    expect(isSameOrigin(headers({ host: 'betterbagsmm.com' }))).toBe(true);
  });

  test('Origin 不是合法 URL 时拒绝', () => {
    expect(isSameOrigin(headers({ origin: 'not a url', host: 'betterbagsmm.com' }))).toBe(
      false
    );
  });

  test('带端口的本地开发环境也能匹配', () => {
    expect(
      isSameOrigin(headers({ origin: 'http://localhost:3000', host: 'localhost:3000' }))
    ).toBe(true);
  });
});

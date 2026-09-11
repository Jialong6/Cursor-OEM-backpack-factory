/**
 * Unit tests for lib/geo-country-cookie.ts
 *
 * 中间件把 Vercel 的地理头写成一个可被客户端读取的 cookie,让
 * app/[locale]/layout.tsx 的静态生成不必被 headers() 打破,也不必为了
 * 拿国家码多发一次 /api/geo 请求。
 */
import { describe, test, expect } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import {
  GEO_COUNTRY_COOKIE_MAX_AGE,
  readCountryFromRequest,
  syncGeoCountryCookie,
} from '../../lib/geo-country-cookie';
import { GEO_COUNTRY_COOKIE } from '../../lib/analytics-config';

function request(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('https://betterbagsmm.com/en', { headers });
}

/**
 * fetch 规范禁止通过 Request 构造函数设置 cookie 头,必须用
 * NextRequest 自己的 cookies API 写入。
 */
function requestWithCookie(
  cookieValue: string,
  headers: Record<string, string> = {}
): NextRequest {
  const req = new NextRequest('https://betterbagsmm.com/en', { headers });
  req.cookies.set(GEO_COUNTRY_COOKIE, cookieValue);
  return req;
}

describe('readCountryFromRequest', () => {
  test('reads the Vercel geo header', () => {
    expect(readCountryFromRequest(request({ 'x-vercel-ip-country': 'DE' }))).toBe('DE');
  });

  test('falls back to the Cloudflare header', () => {
    expect(readCountryFromRequest(request({ 'cf-ipcountry': 'FR' }))).toBe('FR');
  });

  test('prefers the Vercel header over the Cloudflare one', () => {
    const req = request({ 'x-vercel-ip-country': 'DE', 'cf-ipcountry': 'FR' });
    expect(readCountryFromRequest(req)).toBe('DE');
  });

  test('uppercases the value', () => {
    expect(readCountryFromRequest(request({ 'x-vercel-ip-country': 'de' }))).toBe('DE');
  });

  test('returns empty string when no geo header is present', () => {
    expect(readCountryFromRequest(request())).toBe('');
  });

  test('ignores the XX placeholder Vercel sends when it cannot locate an IP', () => {
    expect(readCountryFromRequest(request({ 'x-vercel-ip-country': 'XX' }))).toBe('');
  });

  test('ignores malformed values', () => {
    expect(readCountryFromRequest(request({ 'x-vercel-ip-country': 'DEU' }))).toBe('');
    expect(readCountryFromRequest(request({ 'x-vercel-ip-country': '' }))).toBe('');
  });
});

describe('syncGeoCountryCookie', () => {
  test('writes the country cookie when the header is present', () => {
    const response = NextResponse.next();
    syncGeoCountryCookie(request({ 'x-vercel-ip-country': 'DE' }), response);

    expect(response.cookies.get(GEO_COUNTRY_COOKIE)?.value).toBe('DE');
  });

  test('leaves the cookie readable by client scripts', () => {
    const response = NextResponse.next();
    syncGeoCountryCookie(request({ 'x-vercel-ip-country': 'DE' }), response);

    expect(response.cookies.get(GEO_COUNTRY_COOKIE)?.httpOnly).toBeFalsy();
  });

  test('sets a bounded max age so a travelling visitor is re-detected', () => {
    const response = NextResponse.next();
    syncGeoCountryCookie(request({ 'x-vercel-ip-country': 'DE' }), response);

    expect(response.cookies.get(GEO_COUNTRY_COOKIE)?.maxAge).toBe(
      GEO_COUNTRY_COOKIE_MAX_AGE
    );
  });

  test('does not write the cookie when there is no geo header', () => {
    const response = NextResponse.next();
    syncGeoCountryCookie(request(), response);

    expect(response.cookies.get(GEO_COUNTRY_COOKIE)).toBeUndefined();
  });

  test('skips the write when the cookie already holds the same country', () => {
    const response = NextResponse.next();
    const req = requestWithCookie('DE', { 'x-vercel-ip-country': 'DE' });
    syncGeoCountryCookie(req, response);

    expect(response.cookies.get(GEO_COUNTRY_COOKIE)).toBeUndefined();
  });

  test('rewrites the cookie when the detected country changed', () => {
    const response = NextResponse.next();
    const req = requestWithCookie('DE', { 'x-vercel-ip-country': 'FR' });
    syncGeoCountryCookie(req, response);

    expect(response.cookies.get(GEO_COUNTRY_COOKIE)?.value).toBe('FR');
  });

  test('returns the country it settled on', () => {
    const response = NextResponse.next();
    const settled = syncGeoCountryCookie(
      request({ 'x-vercel-ip-country': 'JP' }),
      response
    );

    expect(settled).toBe('JP');
  });
});

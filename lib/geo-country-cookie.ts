import { NextRequest, NextResponse } from 'next/server';
import { GEO_COUNTRY_COOKIE } from './analytics-config';

/**
 * 把 Vercel 的地理定位结果写成一个客户端可读的 cookie
 *
 * 为什么不在布局里直接读 headers():app/[locale]/layout.tsx 有
 * generateStaticParams() 为 12 个 locale 预渲染,一旦调用 headers() 就会
 * 强制转成动态渲染,整站 SEO 页面的性能都要陪葬。
 *
 * 为什么不复用 hooks/useGeoCountry.ts 的 /api/geo:那会给每个访客多加一次
 * function 调用,纯属浪费 —— 中间件本来就已经拿到了国家码。
 *
 * 这个 cookie 只决定「加载哪些脚本、要不要弹同意条」,属于功能性 cookie,
 * 与已有的 NEXT_LOCALE 同类,本身不触发同意义务。
 *
 * 注意:本模块引入 next/server,不能进客户端包。客户端解析该 cookie 用
 * lib/analytics-config.ts 的 parseGeoCountry()。
 */

/**
 * cookie 有效期 1 天
 *
 * 不用 NEXT_LOCALE 那样的一年:访客出差、换网络、开关 VPN 都会改变实际
 * 所在地,而同意义务和中国门禁都跟着所在地走。一天既能省下绝大多数请求的
 * Set-Cookie,又不会让判断长期停留在过期结论上。
 */
export const GEO_COUNTRY_COOKIE_MAX_AGE = 24 * 60 * 60;

/**
 * Vercel 无法定位 IP 时会给出的占位值,不能当成真实国家
 */
const UNKNOWN_COUNTRY_CODES: ReadonlySet<string> = new Set(['XX', 'T1']);

function normalizeCountry(raw: string | null | undefined): string {
  const normalized = (raw ?? '').trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(normalized) || UNKNOWN_COUNTRY_CODES.has(normalized)) {
    return '';
  }

  return normalized;
}

/**
 * 从请求头读取访客所在国家
 *
 * 优先级与 app/api/geo/route.ts 保持一致:Vercel 边缘头优先,其次
 * Cloudflare 头(灰云模式下通常不会出现,保留作为兜底)。
 *
 * @returns 两位大写国家码;无法确定时返回空串
 */
export function readCountryFromRequest(request: NextRequest): string {
  return (
    normalizeCountry(request.headers.get('x-vercel-ip-country')) ||
    normalizeCountry(request.headers.get('cf-ipcountry')) ||
    ''
  );
}

/**
 * 按需把国家码同步到 cookie 上
 *
 * 只在「检测到国家」且「与现有 cookie 不同」时才写,避免给每一个请求都挂
 * 一个多余的 Set-Cookie 响应头。
 *
 * @param request - 当前请求
 * @param response - 即将返回的响应
 * @returns 本次确定的国家码(可能来自请求头,也可能沿用已有 cookie)
 */
export function syncGeoCountryCookie(
  request: NextRequest,
  response: NextResponse
): string {
  const detected = readCountryFromRequest(request);
  const existing = normalizeCountry(
    request.cookies.get(GEO_COUNTRY_COOKIE)?.value
  );

  if (!detected) {
    return existing;
  }

  if (detected === existing) {
    return existing;
  }

  response.cookies.set(GEO_COUNTRY_COOKIE, detected, {
    maxAge: GEO_COUNTRY_COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    // 刻意不设 httpOnly:客户端组件需要同步读取它来决定加载哪些脚本
    secure: process.env.NODE_ENV === 'production',
  });

  return detected;
}

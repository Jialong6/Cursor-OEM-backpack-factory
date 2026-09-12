/**
 * 从请求头读出埋点需要的上下文
 *
 * 取客户端 IP 的逻辑本来只有三行,这里单独成模块、并刻意取名
 * readClientIp 而不是 getClientIp:未合并的 PR #29(缅甸可达性)带来了一个
 * 同名的 getClientIp,两边撞名会在合并时制造无谓的冲突。
 *
 * 国家、地区、城市、时区全部来自 Vercel 边缘头,不需要任何外部服务。
 * 本轮刻意不做运营商/公司识别 —— 那要接 IPinfo、要多一个外部账号,
 * 用户这轮选了不做。
 *
 * 本模块只读 Headers,不依赖 next/server,便于在测试里直接构造。
 */
import { parseUserAgent, type DeviceInfo } from './device';

/** Vercel 定位不到 IP 时会给出的占位值 */
const UNKNOWN_COUNTRY_CODES: ReadonlySet<string> = new Set(['XX', 'T1']);

export interface RequestGeo {
  readonly country: string;
  readonly region: string;
  readonly city: string;
  readonly timezone: string;
}

export interface InsightRequestContext {
  readonly ip: string;
  readonly userAgent: string;
  readonly device: DeviceInfo;
  readonly geo: RequestGeo;
  readonly origin: string;
}

function header(headers: Headers, name: string): string {
  return headers.get(name)?.trim() ?? '';
}

/**
 * 客户端 IP
 *
 * Vercel 把真实客户端 IP 放在 x-forwarded-for 首段,并且会覆盖客户端
 * 自己伪造的值,所以这里可以直接信任它。
 *
 * 注意:这个值只用来即刻派生不可逆指纹,绝不落库。
 */
export function readClientIp(headers: Headers): string {
  const forwarded = header(headers, 'x-forwarded-for').split(',')[0]?.trim();

  return forwarded || header(headers, 'x-real-ip') || '';
}

function normalizeCountry(raw: string): string {
  const value = raw.toUpperCase();

  return /^[A-Z]{2}$/.test(value) && !UNKNOWN_COUNTRY_CODES.has(value) ? value : '';
}

/**
 * 地理信息
 *
 * 城市名按 RFC3986 编码过,要解回来才可读(例如 Ho%20Chi%20Minh%20City)。
 */
export function readGeo(headers: Headers): RequestGeo {
  const rawCity = header(headers, 'x-vercel-ip-city');

  let city = '';
  try {
    city = rawCity ? decodeURIComponent(rawCity) : '';
  } catch {
    // 编码异常时宁可留空,也不要把乱码写进库
    city = '';
  }

  return {
    country:
      normalizeCountry(header(headers, 'x-vercel-ip-country')) ||
      normalizeCountry(header(headers, 'cf-ipcountry')),
    region: header(headers, 'x-vercel-ip-country-region'),
    city,
    timezone: header(headers, 'x-vercel-ip-timezone'),
  };
}

/** 一次性读出埋点端点需要的全部上下文 */
export function readRequestContext(headers: Headers): InsightRequestContext {
  const userAgent = header(headers, 'user-agent');

  return {
    ip: readClientIp(headers),
    userAgent,
    device: parseUserAgent(userAgent),
    geo: readGeo(headers),
    origin: header(headers, 'origin'),
  };
}

/**
 * 上报是否来自本站
 *
 * 同源请求的 Origin 与 Host 一致。缺 Origin 的情况要放行:
 * sendBeacon 在部分浏览器上确实不带这个头。
 */
export function isSameOrigin(headers: Headers): boolean {
  const origin = header(headers, 'origin');

  if (origin === '') {
    return true;
  }

  const host = header(headers, 'host');

  if (host === '') {
    return false;
  }

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

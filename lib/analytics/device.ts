/**
 * 从 User-Agent 粗分设备、浏览器与系统(纯函数)
 *
 * 手写而不是引 ua-parser-js:我们只需要三个粗粒度维度用来回答
 * 「手机端是不是转化更差」这类问题,不需要精确到浏览器小版本。
 * 引一个几十 KB 的库来做这件事,还要跟着它的规则库更新,不划算。
 *
 * 刻意只产出有限的枚举值,不把原始 UA 存进库 —— UA 拼上别的字段足以
 * 构成指纹,而我们对访客承诺过只保留不可逆标识。
 */

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface DeviceInfo {
  readonly type: DeviceType;
  readonly browser: string;
  readonly os: string;
}

const UNKNOWN = 'unknown';

/**
 * 平板要先于手机判断
 *
 * iPad 的 UA 里同时含 "Mobile" 与 "iPad";Android 平板的特征是有 "Android"
 * 却没有 "Mobile"。顺序错了平板会被全部算成手机。
 */
function detectType(ua: string): DeviceType {
  if (/ipad|tablet|playbook|silk/.test(ua)) {
    return 'tablet';
  }

  if (/android/.test(ua) && !/mobile/.test(ua)) {
    return 'tablet';
  }

  if (/mobi|iphone|ipod|phone|blackberry|iemobile|opera mini/.test(ua)) {
    return 'mobile';
  }

  return 'desktop';
}

/**
 * 浏览器判断的顺序很关键
 *
 * Edge 的 UA 里含 "Chrome",Chrome 的 UA 里含 "Safari"。从最specific 的
 * 往下排,否则 Edge 会被算成 Chrome、Chrome 会被算成 Safari。
 */
function detectBrowser(ua: string): string {
  if (/edg\//.test(ua)) return 'Edge';
  if (/opr\/|opera/.test(ua)) return 'Opera';
  if (/samsungbrowser/.test(ua)) return 'Samsung Internet';
  if (/firefox|fxios/.test(ua)) return 'Firefox';
  if (/chrome|crios/.test(ua)) return 'Chrome';
  if (/safari/.test(ua)) return 'Safari';
  return UNKNOWN;
}

function detectOs(ua: string): string {
  if (/iphone|ipad|ipod|ios/.test(ua)) return 'iOS';
  if (/android/.test(ua)) return 'Android';
  if (/windows/.test(ua)) return 'Windows';
  if (/mac os x|macintosh/.test(ua)) return 'macOS';
  if (/cros/.test(ua)) return 'ChromeOS';
  if (/linux/.test(ua)) return 'Linux';
  return UNKNOWN;
}

/**
 * 解析 User-Agent
 *
 * @param userAgent - 原始 UA,可为空
 */
export function parseUserAgent(userAgent: string | null | undefined): DeviceInfo {
  if (typeof userAgent !== 'string' || userAgent.trim() === '') {
    return { type: 'desktop', browser: UNKNOWN, os: UNKNOWN };
  }

  const ua = userAgent.toLowerCase();

  return {
    type: detectType(ua),
    browser: detectBrowser(ua),
    os: detectOs(ua),
  };
}

/**
 * 看板页的 HTTP Basic 鉴权
 *
 * 挂在 middleware 顶部而不是页面内部:middleware 才能返回带
 * WWW-Authenticate 的 401,让浏览器弹出原生登录框。手机上也能用,
 * 不必为一个自用页面引入登录表单、会话 cookie 和一套 auth 库。
 *
 * 必须 Edge 兼容:middleware 默认跑在 Edge runtime,那里没有
 * node:crypto 的 timingSafeEqual。改用 Web Crypto 先把两边都摘要成
 * 定长十六进制再比 —— 比较的是摘要而不是口令本身,时序上泄漏的信息
 * 对攻击者没有用。
 *
 * 未配置口令时一律拒绝(fail-closed),与站内 Turnstile 的生产策略一致。
 */

/** 看板所在路径 */
export const ADMIN_PATH_PREFIX = '/admin';

/** 浏览器弹框上显示的领域名 */
export const ADMIN_REALM = 'Better Bags Analytics';

export function isAdminPath(pathname: string): boolean {
  return pathname === ADMIN_PATH_PREFIX || pathname.startsWith(`${ADMIN_PATH_PREFIX}/`);
}

async function digest(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const hashed = await crypto.subtle.digest('SHA-256', bytes);

  return Array.from(new Uint8Array(hashed))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/** 解析 Basic 认证头,失败返回空串 */
function decodeCredentials(header: string | null): string {
  if (!header) {
    return '';
  }

  const [scheme, encoded] = header.split(' ');

  if (scheme?.toLowerCase() !== 'basic' || !encoded) {
    return '';
  }

  try {
    return atob(encoded);
  } catch {
    return '';
  }
}

export interface AdminCredentials {
  readonly user: string;
  readonly password: string;
}

/**
 * 校验请求是否带了正确的口令
 *
 * @param header - Authorization 头的原始值
 * @param expected - 期望的用户名与口令,来自环境变量
 */
export async function isAuthorized(
  header: string | null,
  expected: AdminCredentials
): Promise<boolean> {
  // 口令没配就一律拒绝,绝不因为「没设密码」而变成公开页面
  if (!expected.password) {
    return false;
  }

  const provided = decodeCredentials(header);

  if (!provided) {
    return false;
  }

  const want = `${expected.user || 'admin'}:${expected.password}`;

  // 比摘要而不是比原文:两边都是定长十六进制,时序差异不泄漏口令内容
  const [a, b] = await Promise.all([digest(provided), digest(want)]);

  return a === b;
}

/** 从环境变量读期望口令 */
export function readAdminCredentials(env: {
  ADMIN_USER?: string;
  ADMIN_PASSWORD?: string;
}): AdminCredentials {
  return {
    user: env.ADMIN_USER ?? 'admin',
    password: env.ADMIN_PASSWORD ?? '',
  };
}

/** 401 响应,带上让浏览器弹框的头 */
export function buildUnauthorizedResponse(): Response {
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${ADMIN_REALM}", charset="UTF-8"`,
      // 看板页永远不该进搜索索引
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

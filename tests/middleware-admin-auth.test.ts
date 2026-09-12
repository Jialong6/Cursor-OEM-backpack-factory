/**
 * middleware —— 看板页的 Basic 鉴权分支
 *
 * 这个分支必须在 bot 检测之前:爬虫打 /admin 也该拿 401。
 * 也必须在 i18n 之前:matcher 会匹配 /admin(它不以 api 开头),
 * 不早退就会被 302 到 /en/admin,鉴权根本轮不到。
 *
 * 把 admin 加进 matcher 的排除组是另一条路,但那样 middleware 跑不到
 * /admin,Basic 鉴权就无处可挂了。
 */
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import middleware from '@/middleware';

const CHROME_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const GOOGLEBOT_UA =
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

const PASSWORD = 'correct-horse-battery';

function visit(
  path: string,
  { auth, userAgent = CHROME_UA }: { auth?: string; userAgent?: string } = {}
): NextRequest {
  const headers: Record<string, string> = { 'user-agent': userAgent };

  if (auth) {
    headers.authorization = auth;
  }

  return new NextRequest(`https://betterbagsmm.com${path}`, { headers });
}

function basic(user: string, password: string): string {
  return `Basic ${btoa(`${user}:${password}`)}`;
}

beforeEach(() => {
  vi.stubEnv('ADMIN_USER', 'jay');
  vi.stubEnv('ADMIN_PASSWORD', PASSWORD);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('未授权', () => {
  test('没带认证头时返回 401', async () => {
    const response = await middleware(visit('/admin/analytics'));

    expect(response.status).toBe(401);
  });

  test('401 带上 WWW-Authenticate,浏览器才会弹原生登录框', async () => {
    const response = await middleware(visit('/admin/analytics'));

    expect(response.headers.get('WWW-Authenticate')).toContain('Basic realm=');
  });

  test('口令错误时返回 401', async () => {
    const response = await middleware(visit('/admin/analytics', { auth: basic('jay', 'wrong') }));

    expect(response.status).toBe(401);
  });

  test('环境变量没配口令时一律 401,不会变成公开页面', async () => {
    vi.stubEnv('ADMIN_PASSWORD', '');

    const response = await middleware(visit('/admin/analytics', { auth: basic('jay', '') }));

    expect(response.status).toBe(401);
  });

  test('爬虫同样拿 401,而不是被当成 bot 走 i18n 分支', async () => {
    const response = await middleware(visit('/admin/analytics', { userAgent: GOOGLEBOT_UA }));

    expect(response.status).toBe(401);
  });

  test('裸 /admin 也受保护', async () => {
    expect((await middleware(visit('/admin'))).status).toBe(401);
  });
});

describe('已授权', () => {
  test('口令正确时放行,且不被重定向到语言前缀', async () => {
    const response = await middleware(
      visit('/admin/analytics', { auth: basic('jay', PASSWORD) })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });
});

describe('不影响站内其他路径', () => {
  test('看起来像但不是看板的路径照常走 i18n', async () => {
    const response = await middleware(visit('/administrator'));

    expect(response.status).not.toBe(401);
  });

  test('带语言前缀的 admin 不走鉴权分支', async () => {
    const response = await middleware(visit('/en/admin'));

    expect(response.status).not.toBe(401);
  });

  test('普通页面不受影响', async () => {
    const response = await middleware(visit('/en'));

    expect(response.status).not.toBe(401);
  });
});

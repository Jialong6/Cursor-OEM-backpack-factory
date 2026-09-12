/**
 * Unit tests for lib/admin-auth.ts
 *
 * 看板页里有全站访客的行为明细,鉴权没配好等于把它公开了。
 * 最要紧的一条是 fail-closed:环境变量没设时必须拒绝,
 * 绝不能因为「没设密码」而变成谁都能看。
 */
import { describe, test, expect } from 'vitest';
import {
  ADMIN_PATH_PREFIX,
  buildUnauthorizedResponse,
  isAdminPath,
  isAuthorized,
  readAdminCredentials,
} from '../../lib/admin-auth';

const EXPECTED = { user: 'jay', password: 'correct-horse-battery' };

function basic(user: string, password: string): string {
  return `Basic ${btoa(`${user}:${password}`)}`;
}

describe('isAdminPath', () => {
  test.each(['/admin', '/admin/analytics', '/admin/analytics/deep'])(
    '%s 属于看板',
    (path) => {
      expect(isAdminPath(path)).toBe(true);
    }
  );

  test.each(['/', '/en', '/en/admin', '/administrator', '/api/insight'])(
    '%s 不属于看板',
    (path) => {
      expect(isAdminPath(path)).toBe(false);
    }
  );

  test('前缀常量就是 /admin', () => {
    expect(ADMIN_PATH_PREFIX).toBe('/admin');
  });
});

describe('isAuthorized', () => {
  test('口令正确时放行', async () => {
    await expect(isAuthorized(basic('jay', EXPECTED.password), EXPECTED)).resolves.toBe(true);
  });

  test('口令错误时拒绝', async () => {
    await expect(isAuthorized(basic('jay', 'wrong'), EXPECTED)).resolves.toBe(false);
  });

  test('用户名错误时拒绝', async () => {
    await expect(isAuthorized(basic('someone', EXPECTED.password), EXPECTED)).resolves.toBe(
      false
    );
  });

  test('环境变量没配口令时一律拒绝,不因此变成公开页面', async () => {
    await expect(
      isAuthorized(basic('jay', 'anything'), { user: 'jay', password: '' })
    ).resolves.toBe(false);
  });

  test('没带认证头时拒绝', async () => {
    await expect(isAuthorized(null, EXPECTED)).resolves.toBe(false);
    await expect(isAuthorized('', EXPECTED)).resolves.toBe(false);
  });

  test('认证方式不是 Basic 时拒绝', async () => {
    await expect(isAuthorized('Bearer some-token', EXPECTED)).resolves.toBe(false);
  });

  test('base64 损坏时拒绝,不抛错', async () => {
    await expect(isAuthorized('Basic !!!not-base64!!!', EXPECTED)).resolves.toBe(false);
  });

  test('口令里含冒号也能正确处理', async () => {
    const tricky = { user: 'jay', password: 'a:b:c' };
    await expect(isAuthorized(basic('jay', 'a:b:c'), tricky)).resolves.toBe(true);
  });
});

describe('readAdminCredentials', () => {
  test('用户名默认 admin', () => {
    expect(readAdminCredentials({ ADMIN_PASSWORD: 'x' })).toEqual({
      user: 'admin',
      password: 'x',
    });
  });

  test('口令默认空串,配合 fail-closed', () => {
    expect(readAdminCredentials({}).password).toBe('');
  });
});

describe('buildUnauthorizedResponse', () => {
  test('返回 401 并让浏览器弹出原生登录框', () => {
    const response = buildUnauthorizedResponse();

    expect(response.status).toBe(401);
    expect(response.headers.get('WWW-Authenticate')).toContain('Basic realm=');
  });

  test('带上 noindex,看板永远不进搜索索引', () => {
    expect(buildUnauthorizedResponse().headers.get('X-Robots-Tag')).toContain('noindex');
  });
});

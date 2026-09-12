/**
 * 两个定时任务端点
 *
 * 一个会发邮件、一个会删数据,所以鉴权必须 fail-closed:
 * CRON_SECRET 没配时一律拒绝,绝不能因为「忘了配」而变成公开可调用。
 */
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

const { collectMock, sendMock, pruneMock } = vi.hoisted(() => ({
  collectMock: vi.fn(async () => ({
    current: { visitors: 42, pageViews: 80, avgDwellMs: 5_000, shallowPct: 30 },
    previous: { visitors: 30, pageViews: 60, avgDwellMs: 4_000, shallowPct: 35 },
    sections: [],
    funnel: [{ step: 'submitted', count: 3 }],
    countries: [],
    windowDays: 7,
    dashboardUrl: 'https://betterbagsmm.com/admin/analytics',
  })),
  sendMock: vi.fn(async () => ({ success: true })),
  pruneMock: vi.fn(async () => ({ pageViews: 10, events: 20, sectionDwell: 5, ingestedBatches: 2 })),
}));

vi.mock('@/lib/analytics-report', () => ({
  collectWeeklyReport: collectMock,
  sendWeeklyReport: sendMock,
}));

vi.mock('@/lib/analytics/queries', () => ({ pruneOlderThan: pruneMock }));

import { GET as weeklyReport } from '@/app/api/cron/weekly-report/route';
import { GET as prune, RETENTION_DAYS } from '@/app/api/cron/prune/route';

const SECRET = 'cron-secret-value';

function request(auth?: string): Parameters<typeof prune>[0] {
  return {
    headers: new Headers(auth ? { authorization: auth } : {}),
  } as unknown as Parameters<typeof prune>[0];
}

beforeEach(() => {
  collectMock.mockClear();
  sendMock.mockClear();
  pruneMock.mockClear();
  vi.stubEnv('CRON_SECRET', SECRET);
  vi.stubEnv('DATABASE_URL', 'postgres://example/db');
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('鉴权', () => {
  test.each([
    ['weekly-report', weeklyReport],
    ['prune', prune],
  ])('%s 没带口令时 401', async (_name, handler) => {
    expect((await handler(request())).status).toBe(401);
  });

  test.each([
    ['weekly-report', weeklyReport],
    ['prune', prune],
  ])('%s 口令错误时 401', async (_name, handler) => {
    expect((await handler(request('Bearer wrong'))).status).toBe(401);
  });

  test.each([
    ['weekly-report', weeklyReport],
    ['prune', prune],
  ])('%s 在 CRON_SECRET 没配时一律 401', async (_name, handler) => {
    vi.stubEnv('CRON_SECRET', '');

    expect((await handler(request(`Bearer ${SECRET}`))).status).toBe(401);
  });

  test('口令正确时放行', async () => {
    expect((await prune(request(`Bearer ${SECRET}`))).status).toBe(200);
  });
});

describe('周报', () => {
  test('取数并发信', async () => {
    const response = await weeklyReport(request(`Bearer ${SECRET}`));

    expect(response.status).toBe(200);
    expect(collectMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  test('没配数据库时跳过,不报错', async () => {
    vi.stubEnv('DATABASE_URL', '');

    const response = await weeklyReport(request(`Bearer ${SECRET}`));

    expect(response.status).toBe(200);
    expect(collectMock).not.toHaveBeenCalled();
  });

  test('发信失败时返回 500,让 Vercel 的日志里看得到', async () => {
    sendMock.mockResolvedValueOnce({ success: false, error: 'resend is down' });

    expect((await weeklyReport(request(`Bearer ${SECRET}`))).status).toBe(500);
  });

  test('取数抛错时返回 500', async () => {
    collectMock.mockRejectedValueOnce(new Error('neon is down'));

    expect((await weeklyReport(request(`Bearer ${SECRET}`))).status).toBe(500);
  });
});

describe('保留期清理', () => {
  test('按 180 天清理 —— 与隐私政策里写给访客的天数一致', async () => {
    await prune(request(`Bearer ${SECRET}`));

    expect(RETENTION_DAYS).toBe(180);
    expect(pruneMock).toHaveBeenCalledWith(180);
  });

  test('返回各表删掉的行数', async () => {
    const response = await prune(request(`Bearer ${SECRET}`));
    const body = (await response.json()) as { deleted: Record<string, number> };

    expect(body.deleted.pageViews).toBe(10);
  });

  test('删除天然幂等,重复调用不会出错', async () => {
    await prune(request(`Bearer ${SECRET}`));
    const second = await prune(request(`Bearer ${SECRET}`));

    expect(second.status).toBe(200);
    expect(pruneMock).toHaveBeenCalledTimes(2);
  });

  test('数据库抛错时返回 500', async () => {
    pruneMock.mockRejectedValueOnce(new Error('neon is down'));

    expect((await prune(request(`Bearer ${SECRET}`))).status).toBe(500);
  });
});

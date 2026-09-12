/**
 * /api/insight —— 上报端点
 *
 * 这个端点是公开的,任何人都能往里灌东西,所以每一道闸门都得有用例守着:
 * 跨站、爬虫、超大载荷、形状不对、维度超量,全部安静地丢弃并返回 204。
 *
 * 「无论发生什么都返回 204」本身也是一条被测的契约:客户端用 sendBeacon
 * 读不到响应,而把「有没有被记录」告诉调用方只会方便别人试探。
 */
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

const { ingestMock, afterMock } = vi.hoisted(() => ({
  ingestMock: vi.fn(async () => undefined),
  afterMock: vi.fn((callback: () => unknown) => {
    // after() 在测试里同步执行,断言才拿得到结果
    void callback();
  }),
}));

vi.mock('@/lib/analytics/ingest', () => ({ ingestEnvelope: ingestMock }));

vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server');
  return { ...actual, after: afterMock };
});

import { POST } from '@/app/api/insight/route';

const CHROME_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const GOOGLEBOT_UA =
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

function envelope(overrides: Record<string, unknown> = {}) {
  return {
    v: 1,
    pageViewId: 'pv-abc',
    seq: 1,
    path: '/en',
    locale: 'en',
    viewport: { w: 1440, h: 900 },
    events: [{ name: 'page_view', ts: 0, props: { path: '/en' } }],
    dwell: [{ sectionId: 'features', ms: 4_000, enterCount: 1, maxCoverage: 0.9 }],
    ...overrides,
  };
}

function makeRequest(
  body: unknown,
  headers: Record<string, string> = {}
): Parameters<typeof POST>[0] {
  const text = typeof body === 'string' ? body : JSON.stringify(body);

  return {
    headers: new Headers({
      'user-agent': CHROME_UA,
      host: 'betterbagsmm.com',
      origin: 'https://betterbagsmm.com',
      'x-forwarded-for': '203.0.113.9',
      'x-vercel-ip-country': 'DE',
      ...headers,
    }),
    text: async () => text,
  } as unknown as Parameters<typeof POST>[0];
}

beforeEach(() => {
  ingestMock.mockClear();
  afterMock.mockClear();
  vi.stubEnv('DATABASE_URL', 'postgres://example/db');
  vi.stubEnv('ANALYTICS_SALT_SECRET', 'test-secret');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('正常上报', () => {
  test('返回 204 且写一次库', async () => {
    const response = await POST(makeRequest(envelope()));

    expect(response.status).toBe(204);
    expect(ingestMock).toHaveBeenCalledTimes(1);
  });

  test('落库工作放在 after 里,不阻塞响应', async () => {
    await POST(makeRequest(envelope()));

    expect(afterMock).toHaveBeenCalledTimes(1);
  });

  test('访客标识是六十四位十六进制,且不含原始 IP', async () => {
    await POST(makeRequest(envelope()));

    const { visitorHash } = ingestMock.mock.calls[0][0] as { visitorHash: string };

    expect(visitorHash).toMatch(/^[0-9a-f]{64}$/);
    expect(visitorHash).not.toContain('203.0.113.9');
  });

  test('明文 IP 不会出现在交给落库层的任何字段里', async () => {
    await POST(makeRequest(envelope()));

    const call = ingestMock.mock.calls[0][0] as { envelope: unknown; visitorHash: string };

    expect(JSON.stringify(call.envelope)).not.toContain('203.0.113.9');
  });

  test('带上从请求头读到的国家与设备', async () => {
    await POST(makeRequest(envelope()));

    const { context } = ingestMock.mock.calls[0][0] as {
      context: { geo: { country: string }; device: { type: string } };
    };

    expect(context.geo.country).toBe('DE');
    expect(context.device.type).toBe('desktop');
  });

  test('同一台设备同一天得到同一个标识', async () => {
    await POST(makeRequest(envelope()));
    await POST(makeRequest(envelope({ seq: 2 })));

    const first = (ingestMock.mock.calls[0][0] as { visitorHash: string }).visitorHash;
    const second = (ingestMock.mock.calls[1][0] as { visitorHash: string }).visitorHash;

    expect(first).toBe(second);
  });
});

describe('闸门', () => {
  test('爬虫不落库', async () => {
    const response = await POST(makeRequest(envelope(), { 'user-agent': GOOGLEBOT_UA }));

    expect(response.status).toBe(204);
    expect(ingestMock).not.toHaveBeenCalled();
  });

  test('跨站上报不落库', async () => {
    const response = await POST(makeRequest(envelope(), { origin: 'https://evil.example' }));

    expect(response.status).toBe(204);
    expect(ingestMock).not.toHaveBeenCalled();
  });

  test('缺 Origin 时放行 —— sendBeacon 在部分浏览器上不带这个头', async () => {
    const request = makeRequest(envelope());
    request.headers.delete('origin');

    await POST(request);

    expect(ingestMock).toHaveBeenCalledTimes(1);
  });

  test('超大载荷不落库', async () => {
    const huge = JSON.stringify(envelope({ path: 'x'.repeat(40_000) }));
    const response = await POST(makeRequest(huge));

    expect(response.status).toBe(204);
    expect(ingestMock).not.toHaveBeenCalled();
  });

  test('不是 JSON 时不落库', async () => {
    const response = await POST(makeRequest('not json at all'));

    expect(response.status).toBe(204);
    expect(ingestMock).not.toHaveBeenCalled();
  });

  test('未知事件名被拒', async () => {
    await POST(makeRequest(envelope({ events: [{ name: 'evil_event', ts: 0, props: {} }] })));

    expect(ingestMock).not.toHaveBeenCalled();
  });

  test('事件条数超上限被拒', async () => {
    const events = Array.from({ length: 40 }, () => ({ name: 'scroll_depth', ts: 0, props: {} }));

    await POST(makeRequest(envelope({ events })));

    expect(ingestMock).not.toHaveBeenCalled();
  });

  test('维度里塞嵌套对象被拒', async () => {
    await POST(
      makeRequest(envelope({ events: [{ name: 'cta_click', ts: 0, props: { deep: { a: 1 } } }] }))
    );

    expect(ingestMock).not.toHaveBeenCalled();
  });

  test('维度数量超量被拒', async () => {
    const props = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`k${i}`, i]));

    await POST(makeRequest(envelope({ events: [{ name: 'cta_click', ts: 0, props }] })));

    expect(ingestMock).not.toHaveBeenCalled();
  });

  test('缺少必填字段被拒', async () => {
    await POST(makeRequest({ v: 1, seq: 1 }));

    expect(ingestMock).not.toHaveBeenCalled();
  });
});

describe('配置缺失时静默跳过', () => {
  test('没配数据库就不写,也不报错', async () => {
    vi.stubEnv('DATABASE_URL', '');

    const response = await POST(makeRequest(envelope()));

    expect(response.status).toBe(204);
    expect(ingestMock).not.toHaveBeenCalled();
  });

  test('没配盐密钥就不写 —— 绝不降级成无盐哈希', async () => {
    vi.stubEnv('ANALYTICS_SALT_SECRET', '');

    const response = await POST(makeRequest(envelope()));

    expect(response.status).toBe(204);
    expect(ingestMock).not.toHaveBeenCalled();
  });
});

describe('落库失败不影响响应', () => {
  test('写库抛错时仍然返回 204', async () => {
    ingestMock.mockRejectedValueOnce(new Error('neon is down'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await POST(makeRequest(envelope()));

    expect(response.status).toBe(204);
    consoleError.mockRestore();
  });
});

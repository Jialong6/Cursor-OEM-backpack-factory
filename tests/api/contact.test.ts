import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Contact API 路由测试
 *
 * 回归与新增：
 * - phoneCountryCode 必须被后端提取并通过 schema 校验（历史 bug）
 * - 请求体为 JSON：文件经 R2 presigned 直传后只回传 {name,key,size,type}
 * - Turnstile 服务端校验：NODE_ENV 在 vitest 下恒为 'test'，走生产分支；
 *   配齐 TURNSTILE_SECRET_KEY 并把 siteverify fetch 打桩为 success:true
 * - 文件 key 必须以 inquiries/ 开头（防注入）；合法 key 会经 presignGetUrl 转成附件 URL
 *
 * mock：@/lib/email（发送）与 @/lib/r2（presignGetUrl）。
 */

const { sendInquiryEmailMock } = vi.hoisted(() => ({
  sendInquiryEmailMock: vi.fn(),
}));
vi.mock('@/lib/email', () => ({
  sendInquiryEmail: sendInquiryEmailMock,
}));
vi.mock('@/lib/r2', () => ({
  presignGetUrl: vi.fn(async (key: string) => `https://r2-get.example/${key}?sig=1`),
}));

import { POST } from '@/app/api/contact/route';

type FileRef = { name: string; key: string; size: number; type: string };

function createJsonRequest(fields: Record<string, string>, files: FileRef[] = []): Request {
  return { json: async () => ({ ...fields, files }) } as unknown as Request;
}

const validFields: Record<string, string> = {
  name: 'John Doe',
  email: 'john@example.com',
  countryRegion: 'CN',
  companyBrandName: 'Acme Co',
  phoneCountryCode: '',
  phoneNumber: '',
  subject: 'Custom backpack inquiry',
  message: '',
  orderQuantity: '100-300 pcs',
  techPackAvailability: 'Yes, I have a tech pack',
  turnstileToken: 'dev-skip-token',
};

describe('Contact API Route', () => {
  beforeEach(() => {
    sendInquiryEmailMock.mockReset();
    sendInquiryEmailMock.mockResolvedValue({ success: true });
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) })
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('accepts a full submission with phone + ISO phoneCountryCode (regression)', async () => {
    const req = createJsonRequest({
      ...validFields,
      phoneNumber: '13800138000',
      phoneCountryCode: 'CN',
    });
    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(sendInquiryEmailMock).toHaveBeenCalledTimes(1);
    expect(sendInquiryEmailMock.mock.calls[0][0].phoneCountryCode).toBe('CN');
  });

  it('rejects when phoneNumber is provided without a phoneCountryCode', async () => {
    const req = createJsonRequest({ ...validFields, phoneNumber: '13800138000' });
    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.errors?.phoneCountryCode).toBeTruthy();
    expect(sendInquiryEmailMock).not.toHaveBeenCalled();
  });

  it('accepts a valid submission without phone', async () => {
    const req = createJsonRequest(validFields);
    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(sendInquiryEmailMock).toHaveBeenCalledTimes(1);
  });

  it('rejects when Turnstile verification fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: false }) })
    );
    const req = createJsonRequest(validFields);
    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.errors?.turnstileToken).toBeTruthy();
    expect(sendInquiryEmailMock).not.toHaveBeenCalled();
  });

  it('accepts valid R2 file refs and forwards presigned URLs to email', async () => {
    const req = createJsonRequest(validFields, [
      { name: 'spec.pdf', key: 'inquiries/uuid-spec.pdf', size: 1234, type: 'application/pdf' },
    ]);
    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    const attachments = sendInquiryEmailMock.mock.calls[0][1];
    expect(attachments).toHaveLength(1);
    expect(attachments[0].name).toBe('spec.pdf');
    expect(attachments[0].url).toContain('inquiries/uuid-spec.pdf');
  });

  it('rejects file refs whose key is not under inquiries/ (anti-injection)', async () => {
    const req = createJsonRequest(validFields, [
      { name: 'evil.pdf', key: 'secrets/private.pdf', size: 1234, type: 'application/pdf' },
    ]);
    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.errors?.files).toBeTruthy();
    expect(sendInquiryEmailMock).not.toHaveBeenCalled();
  });

  it('returns 500 when the inquiry email fails to send', async () => {
    sendInquiryEmailMock.mockResolvedValue({ success: false, error: 'smtp down' });
    const req = createJsonRequest(validFields);
    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
  });

  it('accepts a submission that omits optional fields entirely (null-safe extraction)', async () => {
    const req = createJsonRequest({
      name: 'Jane Doe',
      email: 'jane@example.com',
      countryRegion: 'US',
      companyBrandName: 'Globex',
      subject: 'Inquiry',
      orderQuantity: '100-300 pcs',
      techPackAvailability: 'I only have an idea/sketch',
      turnstileToken: 'dev-skip-token',
    });
    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('rejects submission with missing/invalid required fields', async () => {
    const req = createJsonRequest({ name: 'A', email: 'bad', turnstileToken: 't' });
    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(sendInquiryEmailMock).not.toHaveBeenCalled();
  });
});

/**
 * Turnstile 降级路径(备用防护)
 *
 * 客户端在 Turnstile 脚本加载超时后提交哨兵 token;服务端不再调用 siteverify,
 * 改为:蜜罐为空 + 停留时间合理 + 每 IP 每小时 3 次限流。
 * 注意:siteverify fetch 仍被打桩为 success:false,以证明降级路径不依赖它。
 */
import { TURNSTILE_UNAVAILABLE_TOKEN, FALLBACK_NOTE } from '@/lib/turnstile-fallback';

function createFallbackRequest(
  overrides: Record<string, unknown>,
  ip = '203.0.113.10'
): Request {
  const payload = {
    ...validFields,
    turnstileToken: TURNSTILE_UNAVAILABLE_TOKEN,
    website: '',
    formStartedAt: Date.now() - 30_000,
    files: [],
    ...overrides,
  };
  return {
    json: async () => payload,
    headers: new Headers({ 'x-forwarded-for': `${ip}, 10.0.0.1`, 'x-vercel-ip-country': 'MM' }),
  } as unknown as Request;
}

describe('Contact API Route - Turnstile fallback path', () => {
  beforeEach(() => {
    sendInquiryEmailMock.mockReset();
    sendInquiryEmailMock.mockResolvedValue({ success: true });
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: false }) })
    );
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('哨兵 token + 干净信号 → 200,发邮件且留言带降级标记,不调用 siteverify', async () => {
    const res = await POST(createFallbackRequest({ message: 'Need 2000 backpacks' }, '203.0.113.1') as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(sendInquiryEmailMock).toHaveBeenCalledTimes(1);
    expect(sendInquiryEmailMock.mock.calls[0][0].message).toContain('Need 2000 backpacks');
    expect(sendInquiryEmailMock.mock.calls[0][0].message).toContain(FALLBACK_NOTE);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('蜜罐非空 → 假装成功(200)但不发邮件', async () => {
    const res = await POST(createFallbackRequest({ website: 'https://spam.example' }, '203.0.113.2') as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(sendInquiryEmailMock).not.toHaveBeenCalled();
  });

  it('停留时间不足 5 秒 → 400 turnstileToken 错误', async () => {
    const res = await POST(createFallbackRequest({ formStartedAt: Date.now() - 1_000 }, '203.0.113.3') as never);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.errors?.turnstileToken).toBeTruthy();
    expect(sendInquiryEmailMock).not.toHaveBeenCalled();
  });

  it('缺少 formStartedAt → 400', async () => {
    const res = await POST(createFallbackRequest({ formStartedAt: undefined }, '203.0.113.4') as never);
    expect(res.status).toBe(400);
    expect(sendInquiryEmailMock).not.toHaveBeenCalled();
  });

  it('同一 IP 一小时内第 4 次 → 429', async () => {
    const ip = '203.0.113.5';
    for (let i = 0; i < 3; i++) {
      const res = await POST(createFallbackRequest({}, ip) as never);
      expect(res.status).toBe(200);
    }
    const res = await POST(createFallbackRequest({}, ip) as never);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.success).toBe(false);
    expect(sendInquiryEmailMock).toHaveBeenCalledTimes(3);
  });

  it('正常 token 仍走 siteverify,不受降级逻辑影响', async () => {
    const res = await POST(createFallbackRequest({ turnstileToken: 'real-token' }, '203.0.113.6') as never);
    expect(res.status).toBe(400);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(sendInquiryEmailMock).not.toHaveBeenCalled();
  });
});

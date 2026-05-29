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

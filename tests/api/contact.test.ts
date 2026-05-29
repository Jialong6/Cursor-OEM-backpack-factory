import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Contact API 路由测试
 *
 * 回归与新增：
 * - phoneCountryCode 必须被后端提取并通过 schema 校验（历史 bug）
 * - 请求体改为 JSON：文件直传 Vercel Blob 后只回传 URL 引用，绕开 4.5MB 限制
 * - Turnstile 服务端校验：NODE_ENV 在 vitest 下恒为 'test'（vite 内联），走生产分支，
 *   配齐 TURNSTILE_SECRET_KEY 并把 siteverify fetch 打桩为 success:true 让其通过
 * - 文件引用 URL 必须落在 *.public.blob.vercel-storage.com（防注入）
 *
 * 说明：用真实 NextResponse，仅 mock 邮件发送。
 */

const { sendInquiryEmailMock } = vi.hoisted(() => ({
  sendInquiryEmailMock: vi.fn(),
}));
vi.mock('@/lib/email', () => ({
  sendInquiryEmail: sendInquiryEmailMock,
}));

import { POST } from '@/app/api/contact/route';

type FileRef = { name: string; url: string; size: number; type: string };

function createJsonRequest(
  fields: Record<string, string>,
  files: FileRef[] = []
): Request {
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

const BLOB_URL = 'https://store.public.blob.vercel-storage.com/spec-abc.pdf';

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
    const req = createJsonRequest({
      ...validFields,
      phoneNumber: '13800138000', // phoneCountryCode 保持空串 → superRefine 触发
    });
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

  it('accepts valid Vercel Blob file refs and forwards them to email', async () => {
    const req = createJsonRequest(validFields, [
      { name: 'spec.pdf', url: BLOB_URL, size: 1234, type: 'application/pdf' },
    ]);
    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    const files = sendInquiryEmailMock.mock.calls[0][1];
    expect(files).toHaveLength(1);
    expect(files[0].url).toBe(BLOB_URL);
  });

  it('rejects file refs whose URL is not a Vercel Blob URL (anti-injection)', async () => {
    const req = createJsonRequest(validFields, [
      { name: 'evil.pdf', url: 'https://evil.example.com/x.pdf', size: 1234, type: 'application/pdf' },
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
    // 只发必填字段，完全不带 phoneCountryCode/phoneNumber/message
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

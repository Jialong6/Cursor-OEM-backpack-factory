import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Contact API 路由测试
 *
 * 重点回归：phoneCountryCode 必须被后端提取并通过 schema 校验
 * （历史 bug：route 漏读该字段 + 前端把 ISO 码转成拨号码，导致填了电话就 400）。
 *
 * 说明：用真实 NextResponse（同 tests/api/geo.test.ts），仅 mock 邮件发送。
 * 测试数据模拟前端真实提交 —— 所有字段都发送，可选项为空串
 * （QuoteFormContext 用 formData.append(key, value ?? '')），因为
 * 后端 formData.get() 对缺失字段返回 null，而 null 不被可选字段 schema 接受。
 */

const { sendInquiryEmailMock } = vi.hoisted(() => ({
  sendInquiryEmailMock: vi.fn(),
}));
vi.mock('@/lib/email', () => ({
  sendInquiryEmail: sendInquiryEmailMock,
}));

import { POST } from '@/app/api/contact/route';

function createFormRequest(
  fields: Record<string, string>,
  files: File[] = []
): Request {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
  files.forEach((f) => fd.append('files', f));
  return { formData: async () => fd } as unknown as Request;
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
  mcaptchaToken: 'dev-skip-token',
};

describe('Contact API Route', () => {
  beforeEach(() => {
    sendInquiryEmailMock.mockReset();
    sendInquiryEmailMock.mockResolvedValue({ success: true });
    // 服务端 mCaptcha：NODE_ENV 在 vitest 下恒为 'test'（vite 内联），故走生产分支。
    // 配齐 env 并把 verify 端点 fetch 打桩为 valid:true 让其通过。
    vi.stubEnv('NEXT_PUBLIC_MCAPTCHA_INSTANCE_URL', 'https://captcha.test');
    vi.stubEnv('NEXT_PUBLIC_MCAPTCHA_SITEKEY', 'site-key');
    vi.stubEnv('MCAPTCHA_SECRET', 'secret');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ valid: true }) })
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('accepts a full submission with phone + ISO phoneCountryCode (regression)', async () => {
    const req = createFormRequest({
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
    const req = createFormRequest({
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
    const req = createFormRequest(validFields);
    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(sendInquiryEmailMock).toHaveBeenCalledTimes(1);
  });

  it('returns 500 when the inquiry email fails to send', async () => {
    sendInquiryEmailMock.mockResolvedValue({ success: false, error: 'smtp down' });
    const req = createFormRequest(validFields);
    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
  });

  it('accepts a submission that omits optional fields entirely (null-safe extraction)', async () => {
    // 只发必填字段，完全不带 phoneCountryCode/phoneNumber/message
    // → 后端把缺失字段归一为空串，可选项 schema 接受 → 200
    const req = createFormRequest({
      name: 'Jane Doe',
      email: 'jane@example.com',
      countryRegion: 'US',
      companyBrandName: 'Globex',
      subject: 'Inquiry',
      orderQuantity: '100-300 pcs',
      techPackAvailability: 'I only have an idea/sketch',
      mcaptchaToken: 'dev-skip-token',
    });
    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('rejects submission with missing/invalid required fields', async () => {
    const req = createFormRequest({ name: 'A', email: 'bad', mcaptchaToken: 't' });
    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(sendInquiryEmailMock).not.toHaveBeenCalled();
  });
});

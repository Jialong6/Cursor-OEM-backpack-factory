import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ContactFormData } from '@/lib/validations';

/**
 * lib/email.ts 单元测试
 *
 * 用 mock 替换 Resend SDK，覆盖：未配置 key 软跳过、正常发送、
 * Resend 返回 error、Resend 抛异常 四种路径。
 */

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

// 用 class 而非 vi.fn(arrowFn)：email.ts 通过 `new Resend()` 实例化，
// 箭头函数不能作构造器（会抛 "is not a constructor"）
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

import { sendInquiryEmail } from '@/lib/email';

const baseData: ContactFormData = {
  name: 'John Doe',
  email: 'john@example.com',
  countryRegion: 'CN',
  companyBrandName: 'Acme Co',
  phoneCountryCode: 'CN',
  phoneNumber: '13800138000',
  subject: 'Custom backpack',
  message: 'Hello there',
  orderQuantity: '100-300 pcs',
  techPackAvailability: 'Yes, I have a tech pack',
  turnstileToken: 'token',
};

describe('sendInquiryEmail', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    sendMock.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it('soft-skips when RESEND_API_KEY is missing', async () => {
    delete process.env.RESEND_API_KEY;
    const result = await sendInquiryEmail(baseData);
    expect(result.success).toBe(true);
    expect(result.skipped).toBe(true);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('sends via Resend and renders the dial code when configured', async () => {
    process.env.RESEND_API_KEY = 're_test';
    process.env.CONTACT_EMAIL_TO = 'admin@example.com';
    delete process.env.CONTACT_EMAIL_FROM;
    sendMock.mockResolvedValue({ data: { id: 'abc' }, error: null });

    const result = await sendInquiryEmail(baseData);

    expect(result.success).toBe(true);
    expect(sendMock).toHaveBeenCalledTimes(1);
    const payload = sendMock.mock.calls[0][0];
    expect(payload.to).toBe('admin@example.com');
    expect(payload.from).toBe('onboarding@resend.dev'); // 默认发件人
    expect(payload.replyTo).toBe('john@example.com');
    expect(payload.subject).toContain('Custom backpack');
    expect(payload.html).toContain('+86 13800138000'); // ISO→dial 在模板内完成
  });

  it('passes attachments to Resend as path (presigned URL)', async () => {
    process.env.RESEND_API_KEY = 're_test';
    sendMock.mockResolvedValue({ data: { id: 'abc' }, error: null });

    await sendInquiryEmail(baseData, [
      { name: 'spec.pdf', url: 'https://acc.r2.cloudflarestorage.com/betterbags/inquiries/x-spec.pdf?sig=1' },
    ]);

    const payload = sendMock.mock.calls[0][0];
    expect(payload.attachments).toEqual([
      {
        filename: 'spec.pdf',
        path: 'https://acc.r2.cloudflarestorage.com/betterbags/inquiries/x-spec.pdf?sig=1',
      },
    ]);
  });

  it('returns failure when Resend responds with an error', async () => {
    process.env.RESEND_API_KEY = 're_test';
    sendMock.mockResolvedValue({ data: null, error: { message: 'domain not verified' } });
    const result = await sendInquiryEmail(baseData);
    expect(result.success).toBe(false);
    expect(result.error).toBe('domain not verified');
  });

  it('returns failure when Resend throws', async () => {
    process.env.RESEND_API_KEY = 're_test';
    sendMock.mockRejectedValue(new Error('network down'));
    const result = await sendInquiryEmail(baseData);
    expect(result.success).toBe(false);
    expect(result.error).toBe('network down');
  });
});

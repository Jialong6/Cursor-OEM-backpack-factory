import { NextRequest, NextResponse } from 'next/server';
import {
  contactFormSchema,
  formatZodErrors,
  validateFileRefs,
  type ContactFormResponse,
  type UploadedFileRef,
} from '@/lib/validations';
import { sendInquiryEmail } from '@/lib/email';
import { presignGetUrl } from '@/lib/r2';

/**
 * Contact Form API Route
 *
 * 功能：
 * - 接收并验证联系表单数据（JSON）
 * - 验证 Cloudflare Turnstile token
 * - 校验已直传 Vercel Blob 的文件引用（URL 来源/大小/类型）
 * - 发送邮件通知给管理员（文件以 Resend path 附件远程抓取）
 * - 返回成功/失败响应
 *
 * 注：文件经浏览器直传 Blob，请求体只含字段 + 文件 URL（小 JSON），
 * 绕开 Vercel 函数 4.5MB 请求体限制。
 *
 * 验证需求：11.9, 11.10
 */

/**
 * 验证 Cloudflare Turnstile token
 *
 * - Dev：直接放行，避免本地开发依赖真实密钥
 * - Prod：必须配置 TURNSTILE_SECRET_KEY；缺失即拒绝（fail-closed）。
 *   调用 siteverify 带 5s 超时，网络异常一律视为失败。
 */
async function verifyTurnstileToken(token: string): Promise<boolean> {
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    console.error('[Turnstile] Missing TURNSTILE_SECRET_KEY in production');
    return false;
  }

  if (!token) return false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, response: token }),
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);
    if (!response.ok) return false;
    const data = (await response.json()) as { success?: boolean };
    return data.success === true;
  } catch (error) {
    console.error('[Turnstile] Verify request failed:', error);
    return false;
  }
}

/**
 * 从请求体中安全提取文件引用数组（防御非法 shape）
 */
function extractFileRefs(body: unknown): UploadedFileRef[] {
  const raw = (body as { files?: unknown })?.files;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (f): f is UploadedFileRef =>
      !!f &&
      typeof f === 'object' &&
      typeof (f as UploadedFileRef).name === 'string' &&
      typeof (f as UploadedFileRef).key === 'string' &&
      typeof (f as UploadedFileRef).size === 'number' &&
      typeof (f as UploadedFileRef).type === 'string'
  );
}

/**
 * POST /api/contact
 * 处理联系表单提交
 */
export async function POST(request: NextRequest) {
  try {
    // 解析 JSON 请求体（字段 + 已直传文件的 URL 引用）
    const body = (await request.json()) as Record<string, unknown>;

    // 统一把缺失/非字符串字段归一为空串，
    // 避免可选字段(phone/message)缺失时 undefined 触发 schema 校验失败
    const field = (key: string): string => {
      const value = body[key];
      return typeof value === 'string' ? value : '';
    };

    const data = {
      name: field('name'),
      email: field('email'),
      countryRegion: field('countryRegion'),
      companyBrandName: field('companyBrandName'),
      phoneCountryCode: field('phoneCountryCode'),
      phoneNumber: field('phoneNumber'),
      subject: field('subject'),
      message: field('message'),
      orderQuantity: field('orderQuantity'),
      techPackAvailability: field('techPackAvailability'),
      turnstileToken: field('turnstileToken'),
    };

    // 验证表单数据
    const validationResult = contactFormSchema.safeParse(data);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed. Please check your input.',
          errors: formatZodErrors(validationResult.error),
        } satisfies ContactFormResponse,
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // 验证 Turnstile token
    const isCaptchaValid = await verifyTurnstileToken(validatedData.turnstileToken);

    if (!isCaptchaValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Verification failed. Please try again.',
          errors: {
            turnstileToken: ['Verification failed. Please complete the challenge again.'],
          },
        } satisfies ContactFormResponse,
        { status: 400 }
      );
    }

    // 校验已上传文件引用（数量/URL 来源/大小/类型）
    const fileRefs = extractFileRefs(body);

    if (fileRefs.length > 0) {
      const fileValidation = validateFileRefs(fileRefs);

      if (!fileValidation.valid) {
        return NextResponse.json(
          {
            success: false,
            message: 'File validation failed.',
            errors: {
              files: fileValidation.errors,
            },
          } satisfies ContactFormResponse,
          { status: 400 }
        );
      }
    }

    // 为每个文件签发限时 presigned GET URL，供 Resend 发信时抓取作附件
    let emailAttachments: Array<{ name: string; url: string }> = [];
    if (fileRefs.length > 0) {
      try {
        emailAttachments = await Promise.all(
          fileRefs.map(async (f) => ({ name: f.name, url: await presignGetUrl(f.key) }))
        );
      } catch (err) {
        // 签发失败不阻断询盘：照常发邮件，仅记录（避免因附件问题丢询盘）
        console.error('[API Error] presign GET for attachments failed:', err);
      }
    }

    // 发送询盘通知邮件给管理员
    const emailResult = await sendInquiryEmail(validatedData, emailAttachments);

    if (!emailResult.success) {
      // 邮件发送失败：返回 500，避免询盘被静默丢弃（前端会提示用户直接联系我们）
      console.error('[API Error] Inquiry email failed to send:', emailResult.error);
      return NextResponse.json(
        {
          success: false,
          message: 'An unexpected error occurred. Please try again later.',
        } satisfies ContactFormResponse,
        { status: 500 }
      );
    }

    // 返回成功响应
    return NextResponse.json(
      {
        success: true,
        message: 'Thank you for your inquiry! We will get back to you within 24 hours.',
      } satisfies ContactFormResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('[API Error] Contact form submission failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected error occurred. Please try again later.',
      } satisfies ContactFormResponse,
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/contact
 * 处理 CORS 预检请求
 */
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}

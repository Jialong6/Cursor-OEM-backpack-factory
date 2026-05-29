import { NextRequest, NextResponse } from 'next/server';
import { contactFormSchema, formatZodErrors, validateFiles, type ContactFormResponse } from '@/lib/validations';
import { sendInquiryEmail } from '@/lib/email';

/**
 * Contact Form API Route
 *
 * 功能：
 * - 接收并验证联系表单数据
 * - 验证 mCaptcha token
 * - 处理文件上传
 * - 发送邮件通知给管理员
 * - 返回成功/失败响应
 *
 * 验证需求：11.9, 11.10
 */

/**
 * 验证 mCaptcha token
 *
 * - Dev：直接放行，避免本地开发依赖真实实例
 * - Prod：必须配齐 NEXT_PUBLIC_MCAPTCHA_INSTANCE_URL + NEXT_PUBLIC_MCAPTCHA_SITEKEY + MCAPTCHA_SECRET
 *   缺任意一项即拒绝（fail-closed）；调用 verify 端点带 5s 超时，网络异常一律视为失败
 */
async function verifyMCaptchaToken(token: string): Promise<boolean> {
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  const instanceUrl = process.env.NEXT_PUBLIC_MCAPTCHA_INSTANCE_URL;
  const siteKey = process.env.NEXT_PUBLIC_MCAPTCHA_SITEKEY;
  const secret = process.env.MCAPTCHA_SECRET;

  if (!instanceUrl || !siteKey || !secret) {
    console.error('[mCaptcha] Missing configuration in production');
    return false;
  }

  if (!token) return false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${instanceUrl.replace(/\/$/, '')}/api/v1/pow/siteverify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, key: siteKey, secret }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) return false;
    const data = (await response.json()) as { valid?: boolean };
    return data.valid === true;
  } catch (error) {
    console.error('[mCaptcha] Verify request failed:', error);
    return false;
  }
}

/**
 * POST /api/contact
 * 处理联系表单提交
 */
export async function POST(request: NextRequest) {
  try {
    // 解析表单数据 (multipart/form-data)
    const formData = await request.formData();

    // 提取表单字段
    // formData.get() 对缺失字段返回 null、对文件返回 File；统一归一为字符串，
    // 避免可选字段(phone/message)缺失时 null 触发 schema 校验失败，
    // 不依赖前端一定把空字段发成空串
    const field = (key: string): string => {
      const value = formData.get(key);
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
      mcaptchaToken: field('mcaptchaToken'),
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

    // 验证 mCaptcha token
    const isCaptchaValid = await verifyMCaptchaToken(validatedData.mcaptchaToken);

    if (!isCaptchaValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Verification failed. Please try again.',
          errors: {
            mcaptchaToken: ['Verification failed. Please complete the challenge again.'],
          },
        } satisfies ContactFormResponse,
        { status: 400 }
      );
    }

    // 处理文件上传
    const uploadedFiles: File[] = [];
    const fileEntries = formData.getAll('files');

    for (const entry of fileEntries) {
      if (entry instanceof File && entry.size > 0) {
        uploadedFiles.push(entry);
      }
    }

    // 验证上传的文件
    if (uploadedFiles.length > 0) {
      const fileValidation = validateFiles(uploadedFiles);

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

    // 发送询盘通知邮件给管理员
    const emailResult = await sendInquiryEmail(validatedData, uploadedFiles);

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

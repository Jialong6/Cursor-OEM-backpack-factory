import { NextRequest, NextResponse } from 'next/server';
import { contactFormSchema, formatZodErrors, validateFiles, type ContactFormResponse } from '@/lib/validations';
import { z } from 'zod';

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
 * 发送邮件通知给管理员
 */
async function sendEmailNotification(formData: z.infer<typeof contactFormSchema>, files?: File[]) {
  // TODO: 实现邮件发送功能
  // 需要配置 SMTP 服务器或使用邮件服务 (nodemailer, sendgrid, resend 等)
  //
  // 示例实现：
  // const transporter = nodemailer.createTransport({
  //   host: process.env.SMTP_HOST,
  //   port: parseInt(process.env.SMTP_PORT || '587'),
  //   secure: false,
  //   auth: {
  //     user: process.env.SMTP_USER,
  //     pass: process.env.SMTP_PASS,
  //   },
  // });
  //
  // await transporter.sendMail({
  //   from: process.env.SMTP_FROM,
  //   to: 'jay@biteerbags.com',
  //   subject: `New Inquiry: ${formData.subject}`,
  //   html: generateEmailHTML(formData),
  //   attachments: files?.map(file => ({
  //     filename: file.name,
  //     content: Buffer.from(await file.arrayBuffer()),
  //   })),
  // });

  console.log('[EMAIL] Notification would be sent to admin:', {
    to: 'jay@biteerbags.com',
    subject: formData.subject,
    from: formData.email,
    filesCount: files?.length || 0,
  });

  // 在开发环境中，仅记录日志
  if (process.env.NODE_ENV === 'development') {
    console.log('[DEV] Email notification skipped in development mode');
    console.log('[DEV] Form data:', JSON.stringify(formData, null, 2));
    return;
  }

  // TODO: 在生产环境中实现真实的邮件发送
  console.warn('[WARN] Email notification not fully implemented');
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
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      countryRegion: formData.get('countryRegion') as string,
      companyBrandName: formData.get('companyBrandName') as string,
      phoneNumber: formData.get('phoneNumber') as string,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
      orderQuantity: formData.get('orderQuantity') as string,
      techPackAvailability: formData.get('techPackAvailability') as string,
      mcaptchaToken: formData.get('mcaptchaToken') as string,
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

    // 发送邮件通知给管理员
    await sendEmailNotification(validatedData, uploadedFiles);

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

import { Resend } from 'resend';
import type { ContactFormData } from '@/lib/validations';
import { buildInquiryEmailHtml, buildInquiryEmailSubject } from '@/lib/email-template';

/**
 * 询盘邮件发送(封装 Resend)
 *
 * - 读取 RESEND_API_KEY / CONTACT_EMAIL_TO / CONTACT_EMAIL_FROM
 * - 未配置 RESEND_API_KEY 时「软跳过」:返回 success 但不发信,
 *   保证本地/未配置环境表单仍可提交,不阻断用户
 * - 配置后真实调用 Resend;失败返回 success:false 供路由层决定是否回 500
 */

const DEFAULT_TO = 'jay@biteerbags.com';
const DEFAULT_FROM = 'onboarding@resend.dev';

export interface SendEmailResult {
  success: boolean;
  /** true 表示因未配置 key 而跳过发送(非错误) */
  skipped?: boolean;
  error?: string;
}

/**
 * 把上传文件转成 Resend 附件格式
 */
async function toAttachments(
  files: File[]
): Promise<Array<{ filename: string; content: Buffer }>> {
  return Promise.all(
    files.map(async (file) => ({
      filename: file.name,
      content: Buffer.from(await file.arrayBuffer()),
    }))
  );
}

/**
 * 发送询盘通知邮件给管理员
 */
export async function sendInquiryEmail(
  data: ContactFormData,
  files: File[] = []
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  // 未配置 key:软跳过,不阻断表单提交
  if (!apiKey) {
    return { success: true, skipped: true };
  }

  const to = process.env.CONTACT_EMAIL_TO || DEFAULT_TO;
  const from = process.env.CONTACT_EMAIL_FROM || DEFAULT_FROM;

  try {
    const resend = new Resend(apiKey);
    const attachments = files.length > 0 ? await toAttachments(files) : undefined;

    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: data.email,
      subject: buildInquiryEmailSubject(data),
      html: buildInquiryEmailHtml(data),
      attachments,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown email error';
    return { success: false, error: message };
  }
}

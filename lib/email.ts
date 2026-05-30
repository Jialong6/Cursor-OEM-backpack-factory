import { Resend } from 'resend';
import type { ContactFormData } from '@/lib/validations';
import { buildInquiryEmailHtml, buildInquiryEmailSubject } from '@/lib/email-template';
import { buildAckEmailHtml, buildAckEmailSubject } from '@/lib/email-ack-template';

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
/** 客户回执发件地址（已验证域名 → 可投递任意收件人） */
const DEFAULT_ACK_FROM = 'no-reply@betterbagsmm.com';

export interface SendEmailResult {
  success: boolean;
  /** true 表示因未配置 key 而跳过发送(非错误) */
  skipped?: boolean;
  error?: string;
}

/**
 * 发送询盘通知邮件给管理员
 *
 * files 为附件引用（name + 限时可访问 url，来自 R2 presigned GET）；用 Resend 的 path 附件，
 * Resend 在发信时远程抓取并内嵌，文件内容不经过本函数。
 */
export async function sendInquiryEmail(
  data: ContactFormData,
  files: Array<{ name: string; url: string }> = []
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
    const attachments =
      files.length > 0 ? files.map((f) => ({ filename: f.name, path: f.url })) : undefined;

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

/**
 * 给填表客户本人发一封「已收到询盘」回执（按其提交语言本地化）。
 *
 * 发件用已验证域名地址（no-reply@betterbagsmm.com,可投递任意收件人）。
 * best-effort：未配置 key 软跳过;失败仅返回 success:false 供路由记录,不阻断主流程。
 */
export async function sendCustomerAcknowledgment(
  data: ContactFormData,
  locale = 'en'
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: true, skipped: true };
  }

  const from = process.env.CONTACT_ACK_FROM || DEFAULT_ACK_FROM;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: data.email,
      subject: buildAckEmailSubject(locale),
      html: buildAckEmailHtml(data.name, locale),
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

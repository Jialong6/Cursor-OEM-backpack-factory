import type { ContactFormData } from '@/lib/validations';
import { getCountryByCode, getDialCodeByCountry } from '@/lib/countries';

/**
 * 询盘通知邮件 HTML 模板(纯函数,无副作用)
 *
 * 把校验后的表单数据渲染为管理员收到的 HTML 邮件正文。
 * - phoneCountryCode 为 ISO 码(如 "CN"),此处转成拨号码 "+86" 展示
 * - countryRegion 为 ISO 码,转成英文国家名 + ISO 展示
 * - 所有用户输入经 HTML 转义,防止注入破坏邮件结构
 */

const ESCAPE_MAP: Readonly<Record<string, string>> = Object.freeze({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
});

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch] ?? ch);
}

/** 把 ISO 国家码展示为「国家名 (ISO)」,无法识别时回退原值 */
function formatCountry(code: string): string {
  const country = getCountryByCode(code);
  return country ? `${country.nameEn} (${country.code})` : code;
}

/** 把电话所属国家 ISO 码 + 号码拼成 "+86 13800138000" */
function formatPhone(phoneCountryCode?: string, phoneNumber?: string): string {
  if (!phoneNumber) return '—';
  const dial = phoneCountryCode ? getDialCodeByCountry(phoneCountryCode) : undefined;
  return dial ? `${dial} ${phoneNumber}` : phoneNumber;
}

interface Row {
  label: string;
  value: string;
}

function renderRows(rows: readonly Row[]): string {
  return rows
    .map(
      (row) => `
        <tr>
          <td style="padding:8px 12px;font-weight:600;color:#374151;background:#f9fafb;white-space:nowrap;vertical-align:top;">${escapeHtml(row.label)}</td>
          <td style="padding:8px 12px;color:#111827;">${escapeHtml(row.value)}</td>
        </tr>`
    )
    .join('');
}

/**
 * 生成询盘通知邮件的 HTML 正文
 */
export function buildInquiryEmailHtml(data: ContactFormData): string {
  const rows: Row[] = [
    { label: 'Name', value: data.name },
    { label: 'Email', value: data.email },
    { label: 'Country/Region', value: formatCountry(data.countryRegion) },
    { label: 'Company/Brand', value: data.companyBrandName },
    { label: 'Phone', value: formatPhone(data.phoneCountryCode, data.phoneNumber) },
    { label: 'Subject', value: data.subject },
    { label: 'Order Quantity', value: data.orderQuantity },
    { label: 'Tech Pack', value: data.techPackAvailability },
  ];

  const message = data.message?.trim()
    ? `<div style="margin-top:16px;">
         <div style="font-weight:600;color:#374151;margin-bottom:6px;">Message</div>
         <div style="padding:12px;background:#f9fafb;border-radius:8px;color:#111827;white-space:pre-wrap;">${escapeHtml(data.message)}</div>
       </div>`
    : '';

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:24px;background:#f3f4f6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="padding:20px 24px;background:#111827;color:#ffffff;font-size:18px;font-weight:700;">
        New Inquiry — Better Bags Myanmar
      </div>
      <div style="padding:24px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          ${renderRows(rows)}
        </table>
        ${message}
      </div>
    </div>
  </body>
</html>`;
}

/** 邮件主题:含来询主题,便于管理员一眼识别 */
export function buildInquiryEmailSubject(data: ContactFormData): string {
  return `New Inquiry: ${data.subject}`;
}

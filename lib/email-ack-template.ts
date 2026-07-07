/**
 * 客户回执邮件模板（纯函数,无副作用）
 *
 * 表单提交成功后,给填表客户本人发一封简洁的「已收到询盘」确认信,
 * 按客户提交时的界面语言本地化。仅用 name —— 客户已知自己的内容,无需回填表单。
 */

interface AckStrings {
  subject: string;
  /** 问候语,含 {name} 占位 */
  greeting: string;
  line1: string;
  line2: string;
  team: string;
  /** 自动信脚注 */
  note: string;
}

const BRAND = 'Better Bags Myanmar';

/** 各语言文案;未命中语言回退 en */
const ACK: Readonly<Record<string, AckStrings>> = Object.freeze({
  en: {
    subject: `Thank you for your inquiry — ${BRAND}`,
    greeting: 'Dear {name},',
    line1: `Thank you for your interest in ${BRAND}. We have received your inquiry.`,
    line2: 'Our team will review your request and get back to you within 24 hours.',
    team: `The ${BRAND} Team`,
    note: 'This is an automated confirmation — please do not reply to this email.',
  },
  zh: {
    subject: `已收到您的询盘 — ${BRAND}`,
    greeting: '{name},您好:',
    line1: `感谢您对 ${BRAND} 的关注,我们已收到您的询盘。`,
    line2: '我们的团队会尽快查看,并在 24 小时内回复您。',
    team: `${BRAND} 团队`,
    note: '本邮件为系统自动发送,请勿直接回复。',
  },
  'zh-tw': {
    subject: `已收到您的詢盤 — ${BRAND}`,
    greeting: '{name},您好:',
    line1: `感謝您對 ${BRAND} 的關注,我們已收到您的詢盤。`,
    line2: '我們的團隊會盡快查看,並在 24 小時內回覆您。',
    team: `${BRAND} 團隊`,
    note: '本郵件為系統自動發送,請勿直接回覆。',
  },
  ja: {
    subject: `お問い合わせを受け付けました — ${BRAND}`,
    greeting: '{name} 様',
    line1: `${BRAND} にご関心をお寄せいただきありがとうございます。お問い合わせを受け付けました。`,
    line2: '担当者が内容を確認し、24時間以内にご返信いたします。',
    team: `${BRAND} チーム`,
    note: '本メールは自動送信です。ご返信いただいてもお答えできません。',
  },
  de: {
    subject: `Ihre Anfrage ist eingegangen — ${BRAND}`,
    greeting: 'Sehr geehrte(r) {name},',
    line1: `vielen Dank für Ihr Interesse an ${BRAND}. Wir haben Ihre Anfrage erhalten.`,
    line2: 'Unser Team meldet sich innerhalb von 24 Stunden bei Ihnen.',
    team: `Ihr ${BRAND} Team`,
    note: 'Dies ist eine automatische Bestätigung — bitte antworten Sie nicht auf diese E-Mail.',
  },
  es: {
    subject: `Hemos recibido su consulta — ${BRAND}`,
    greeting: 'Estimado/a {name}:',
    line1: `Gracias por su interés en ${BRAND}. Hemos recibido su consulta.`,
    line2: 'Nuestro equipo le responderá en un plazo de 24 horas.',
    team: `El equipo de ${BRAND}`,
    note: 'Este es un mensaje automático — por favor, no responda a este correo.',
  },
  fr: {
    subject: `Nous avons bien reçu votre demande — ${BRAND}`,
    greeting: 'Bonjour {name},',
    line1: `Merci de l'intérêt que vous portez à ${BRAND}. Nous avons bien reçu votre demande.`,
    line2: 'Notre équipe vous répondra sous 24 heures.',
    team: `L'équipe ${BRAND}`,
    note: 'Ceci est une confirmation automatique — merci de ne pas répondre à cet e-mail.',
  },
  nl: {
    subject: `We hebben uw aanvraag ontvangen — ${BRAND}`,
    greeting: 'Beste {name},',
    line1: `Bedankt voor uw interesse in ${BRAND}. We hebben uw aanvraag ontvangen.`,
    line2: 'Ons team neemt binnen 24 uur contact met u op.',
    team: `Het ${BRAND}-team`,
    note: 'Dit is een automatische bevestiging — gelieve niet op deze e-mail te antwoorden.',
  },
  pt: {
    subject: `Recebemos a sua consulta — ${BRAND}`,
    greeting: 'Prezado(a) {name},',
    line1: `Obrigado pelo seu interesse na ${BRAND}. Recebemos a sua consulta.`,
    line2: 'A nossa equipa responderá dentro de 24 horas.',
    team: `Equipa ${BRAND}`,
    note: 'Esta é uma confirmação automática — por favor, não responda a este e-mail.',
  },
  ru: {
    subject: `Мы получили ваш запрос — ${BRAND}`,
    greeting: 'Здравствуйте, {name}!',
    line1: `Благодарим вас за интерес к ${BRAND}. Мы получили ваш запрос.`,
    line2: 'Наша команда свяжется с вами в течение 24 часов.',
    team: `Команда ${BRAND}`,
    note: 'Это автоматическое подтверждение — пожалуйста, не отвечайте на это письмо.',
  },
  ko: {
    subject: `문의가 접수되었습니다 — ${BRAND}`,
    greeting: '{name} 님께,',
    line1: `${BRAND}에 관심을 가져 주셔서 감사합니다. 문의가 정상적으로 접수되었습니다.`,
    line2: '담당자가 내용을 확인한 후 24시간 이내에 회신드리겠습니다.',
    team: `${BRAND} 팀 드림`,
    note: '본 메일은 자동 발송된 확인 메일입니다. 회신하지 마시기 바랍니다.',
  },
  my: {
    subject: `သင့်စုံစမ်းမေးမြန်းမှုကို လက်ခံရရှိပါပြီ — ${BRAND}`,
    greeting: '{name} ခင်ဗျာ၊',
    line1: `${BRAND} ကို စိတ်ဝင်စားမှုအတွက် ကျေးဇူးတင်ပါသည်။ သင့်စုံစမ်းမေးမြန်းမှုကို လက်ခံရရှိပါပြီ။`,
    line2: 'ကျွန်ုပ်တို့အဖွဲ့မှ အသေးစိတ်စိစစ်ပြီး 24 နာရီအတွင်း ပြန်လည်ဆက်သွယ်ပါမည်။',
    team: `${BRAND} အဖွဲ့`,
    note: 'ဤအီးမေးလ်သည် အလိုအလျောက်ပေးပို့သော အတည်ပြုစာဖြစ်ပါသည် — ပြန်လည်ဖြေကြားရန် မလိုအပ်ပါ။',
  },
});

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

function pick(locale: string): AckStrings {
  return ACK[locale] ?? ACK[locale.split('-')[0]] ?? ACK.en;
}

/** 回执邮件主题（按 locale 本地化） */
export function buildAckEmailSubject(locale: string): string {
  return pick(locale).subject;
}

/** 回执邮件 HTML 正文（按 locale 本地化,name 经 HTML 转义） */
export function buildAckEmailHtml(name: string, locale: string): string {
  const s = pick(locale);
  const greeting = s.greeting.replace('{name}', escapeHtml(name));
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:24px;background:#f3f4f6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="padding:20px 24px;background:#111827;color:#ffffff;font-size:18px;font-weight:700;">
        ${BRAND}
      </div>
      <div style="padding:24px;color:#111827;font-size:15px;line-height:1.6;">
        <p style="margin:0 0 16px;font-weight:600;">${greeting}</p>
        <p style="margin:0 0 12px;">${escapeHtml(s.line1)}</p>
        <p style="margin:0 0 20px;">${escapeHtml(s.line2)}</p>
        <p style="margin:0;color:#374151;">${escapeHtml(s.team)}</p>
      </div>
      <div style="padding:14px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;">
        ${escapeHtml(s.note)}
      </div>
    </div>
  </body>
</html>`;
}

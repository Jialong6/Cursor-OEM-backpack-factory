/**
 * 联系跳转链接构建(WhatsApp / mailto)
 *
 * 背景:此前号码清洗只去空格/括号/横线(/[\s()-]/g),点号与 + 残留,
 * 工厂号 "+1 814.880.1463" 生成 wa.me/+1814.880.1463 —— WhatsApp 判定
 * 号码无效。wa.me 官方格式要求"国际格式纯数字"(不含 +、0 前缀、
 * 括号、横线、点)。统一收敛到本模块,Contact 区与预约页共用。
 */

/**
 * 展示格式号码 → wa.me 要求的纯数字
 *
 * @example toWhatsAppNumber('+1 814.880.1463') === '18148801463'
 */
export function toWhatsAppNumber(displayNumber: string): string {
  return displayNumber.replace(/\D/g, '');
}

/**
 * 构建 wa.me 链接,可选预填消息文本(URL 编码)
 */
export function buildWhatsAppHref(
  displayNumber: string,
  text?: string
): string {
  const base = `https://wa.me/${toWhatsAppNumber(displayNumber)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

interface MailtoOptions {
  readonly subject?: string;
  readonly body?: string;
}

/**
 * 构建 mailto 链接,可选预填主题与正文(URL 编码)
 *
 * 注:访客设备未配置默认邮件客户端时 mailto 点击可能无响应,
 * 调用方应同时明文展示邮箱地址作为兜底。
 */
export function buildMailtoHref(
  email: string,
  options: MailtoOptions = {}
): string {
  const params: string[] = [];
  if (options.subject) {
    params.push(`subject=${encodeURIComponent(options.subject)}`);
  }
  if (options.body) {
    params.push(`body=${encodeURIComponent(options.body)}`);
  }
  return params.length > 0
    ? `mailto:${email}?${params.join('&')}`
    : `mailto:${email}`;
}

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

/**
 * 展示格式号码 → 可拨的 tel: 链接
 *
 * 与 toWhatsAppNumber 同源的一个坑:站内原本各处自己写
 * `number.replace(/[\s()-]/g, '')`,点号留在原地。四条电话线路碰巧都不带点,
 * 所以一直没暴露;但页脚那个号是 "+1 814.880.1463",拼出来就是
 * tel:+1814.880.1463 —— RFC 3966 的 global-number 只允许开头一个 + 与数字,
 * 部分拨号盘直接拒绝。
 *
 * 只保留开头的加号:号码中间出现的加号是脏数据,留着同样不合法。
 *
 * @example toTelHref('+1 814.880.1463') === 'tel:+18148801463'
 */
export function toTelHref(displayNumber: string): string {
  const digits = displayNumber.replace(/\D/g, '');

  if (digits === '') {
    return '';
  }

  return `tel:${displayNumber.trimStart().startsWith('+') ? '+' : ''}${digits}`;
}

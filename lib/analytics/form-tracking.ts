/**
 * 询盘表单埋点的纯逻辑
 *
 * 「用户开始填表」这个信号有三个会误触发的来源,全都是 setValue,
 * 都会让 QuoteFormContext 的 watchedValues 在用户没碰键盘时就变:
 * - 草稿恢复(QuoteFormContext.tsx:130-155)
 * - Geo-IP 自动填国家(同文件 :158-162)
 * - 国家联动自动填电话区号(同文件 :164-172)
 *
 * 所以判定用「基线快照 + 只看用户真正会敲的字段」两道:基线吃掉草稿写入
 * 的初值,字段白名单挡住两个自动填充项。否则 form_start 会在页面加载瞬间
 * 就触发,整条漏斗的第一环直接失真。
 *
 * 本模块不得引入 'use client' 或任何 React 依赖。
 */

/**
 * 会被自动填充、因此不能作为「开始填表」信号的字段
 *
 * countryRegion 来自 Geo-IP,phoneCountryCode 跟着国家联动。
 */
export const AUTO_FILLED_FIELDS = Object.freeze([
  'countryRegion',
  'phoneCountryCode',
] as const);

/**
 * 只有这些字段的变化算「用户开始填表」
 *
 * 刻意不含 AUTO_FILLED_FIELDS 与 turnstileToken(后者由验证码组件写入)。
 */
export const USER_TYPED_FIELDS = Object.freeze([
  'name',
  'email',
  'companyBrandName',
  'phoneNumber',
  'subject',
  'message',
  'orderQuantity',
  'techPackAvailability',
] as const);

export type UserTypedField = (typeof USER_TYPED_FIELDS)[number];

/**
 * 提交失败的四条路径
 *
 * 现在它们在 QuoteFormContext 里全塌缩成同一个 submitStatus='error',
 * 分开之后才能回答「到底是谁挡住了询盘」。
 */
export const SUBMIT_FAILURE_REASONS = Object.freeze([
  /** zod 校验没过,压根没进 onSubmit */
  'validation',
  /** 附件上传失败早退,根本没发出 POST */
  'upload_failed',
  /** HTTP 到了服务端,但 success !== true */
  'server_rejected',
  /** fetch 抛错:离线、中途断网、DNS 失败 */
  'network_error',
] as const);

export type SubmitFailureReason = (typeof SUBMIT_FAILURE_REASONS)[number];

function readString(
  source: Readonly<Record<string, unknown>>,
  key: string
): string | null {
  const value = source[key];
  return typeof value === 'string' ? value : null;
}

/**
 * 相对基线是否出现了真实的用户输入
 *
 * @param values - 当前表单快照(QuoteFormContext 已有的 watchedValues)
 * @param baseline - 草稿恢复完成时的快照,用来吃掉草稿写入的初值
 */
export function hasUserInput(
  values: Readonly<Record<string, unknown>>,
  baseline: Readonly<Record<string, unknown>>
): boolean {
  return USER_TYPED_FIELDS.some((key) => {
    const current = readString(values, key);

    if (current === null || current.trim() === '') {
      return false;
    }

    return current !== readString(baseline, key);
  });
}

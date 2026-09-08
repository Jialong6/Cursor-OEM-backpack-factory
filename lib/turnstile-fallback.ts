/**
 * Turnstile 降级(备用防护)—— 前后端共享的纯模块
 *
 * 背景:缅甸等地运营商封锁 challenges.cloudflare.com,Turnstile 脚本根本加载不了,
 * 正常路径下表单会永远卡在"验证加载中"。客户端在脚本加载超时后提交哨兵 token,
 * 服务端识别到哨兵后不再调用 siteverify,改用三层廉价信号替代人机验证:
 *   1. 蜜罐字段 website 必须为空(真人看不到该字段)
 *   2. 表单停留时间在 [5s, 24h] 内(bot 通常秒级提交)
 *   3. 每 IP 限流(见 lib/rate-limit.ts)
 * 并在留言末尾追加标记,便于人工甄别。Turnstile 正常时链路完全不变。
 */

export const TURNSTILE_UNAVAILABLE_TOKEN = 'turnstile-unavailable';

/** 停留时间下限:低于此值视为脚本化提交 */
export const FALLBACK_MIN_DWELL_MS = 5_000;

/** 停留时间上限:超过一天的时间戳视为伪造/过期 */
export const FALLBACK_MAX_DWELL_MS = 24 * 60 * 60 * 1000;

export const FALLBACK_NOTE =
  '[Fallback verification: Turnstile unreachable on sender network]';

export type FallbackSignalResult =
  | { ok: true }
  | { ok: false; reason: 'honeypot' | 'timing' };

export interface FallbackSignalInput {
  /** 蜜罐字段值 */
  website?: string;
  /** 表单挂载时间戳(ms) */
  formStartedAt?: number;
  /** 当前时间(ms),可注入便于测试 */
  now?: number;
}

export function isFallbackToken(token: string): boolean {
  return token === TURNSTILE_UNAVAILABLE_TOKEN;
}

/**
 * 校验备用防护信号。蜜罐优先于停留时间:蜜罐命中是最强的 bot 证据。
 */
export function checkFallbackSignals(input: FallbackSignalInput): FallbackSignalResult {
  const now = input.now ?? Date.now();

  if (typeof input.website === 'string' && input.website.trim() !== '') {
    return { ok: false, reason: 'honeypot' };
  }

  if (typeof input.formStartedAt !== 'number' || !Number.isFinite(input.formStartedAt)) {
    return { ok: false, reason: 'timing' };
  }

  const dwell = now - input.formStartedAt;
  if (dwell < FALLBACK_MIN_DWELL_MS || dwell > FALLBACK_MAX_DWELL_MS) {
    return { ok: false, reason: 'timing' };
  }

  return { ok: true };
}

/** 在留言末尾追加降级标记(不改邮件模板即可在邮件里看到) */
export function appendFallbackNote(message: string | undefined): string {
  const body = (message ?? '').trim();
  return body ? `${body}\n\n${FALLBACK_NOTE}` : FALLBACK_NOTE;
}

/**
 * 内存滑动窗口限流器
 *
 * 用于 Turnstile 降级路径的兜底限流。状态存在函数实例内存里:
 * Vercel Fluid Compute 会复用实例,但实例之间不共享、冷启动会重置,
 * 因此这是"尽力而为"的防护,不是精确配额 —— 对降级路径足够,
 * 正常路径仍由 Turnstile 把关。key 数量有上限以限制内存占用。
 */

export interface RateLimiterOptions {
  /** 窗口内允许的最大次数 */
  limit: number;
  /** 窗口长度(ms) */
  windowMs: number;
  /** 最多跟踪的 key 数,超出时淘汰最早插入的 key */
  maxKeys?: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  /** 本次之后窗口内还剩多少次 */
  remaining: number;
  /** 被拒绝时,距最早一次记录过期还有多久(ms);放行时为 0 */
  retryAfterMs: number;
}

export interface RateLimiter {
  consume(key: string, now?: number): RateLimitDecision;
}

const DEFAULT_MAX_KEYS = 10_000;

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const { limit, windowMs, maxKeys = DEFAULT_MAX_KEYS } = options;
  const hits = new Map<string, readonly number[]>();

  return {
    consume(key, now = Date.now()) {
      const windowStart = now - windowMs;
      const recent = (hits.get(key) ?? []).filter((t) => t > windowStart);

      if (recent.length >= limit) {
        hits.set(key, recent);
        return {
          allowed: false,
          remaining: 0,
          retryAfterMs: Math.max(0, recent[0] + windowMs - now),
        };
      }

      // Map 保持插入顺序:先删再插,使本 key 成为最新;超限时淘汰最早的 key
      hits.delete(key);
      hits.set(key, [...recent, now]);
      while (hits.size > maxKeys) {
        const oldest = hits.keys().next().value;
        if (oldest === undefined) break;
        hits.delete(oldest);
      }

      return { allowed: true, remaining: limit - recent.length - 1, retryAfterMs: 0 };
    },
  };
}

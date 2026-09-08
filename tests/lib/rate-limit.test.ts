/**
 * 内存滑动窗口限流器验证(用于 Turnstile 降级路径)
 *
 * 约定:每个 key 在 windowMs 内最多 limit 次;now 可注入便于测试;
 * key 数量有上限,超出时淘汰最早的 key 以限制内存。
 */

import { describe, it, expect } from 'vitest';
import { createRateLimiter } from '@/lib/rate-limit';

describe('createRateLimiter', () => {
  it('窗口内前 limit 次放行,第 limit+1 次拒绝并给出 retryAfterMs', () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000 });
    const t0 = 1_000_000;
    expect(limiter.consume('ip-a', t0)).toMatchObject({ allowed: true, remaining: 2 });
    expect(limiter.consume('ip-a', t0 + 1_000)).toMatchObject({ allowed: true, remaining: 1 });
    expect(limiter.consume('ip-a', t0 + 2_000)).toMatchObject({ allowed: true, remaining: 0 });
    const denied = limiter.consume('ip-a', t0 + 3_000);
    expect(denied.allowed).toBe(false);
    expect(denied.remaining).toBe(0);
    expect(denied.retryAfterMs).toBe(57_000);
  });

  it('不同 key 互不影响', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });
    expect(limiter.consume('a', 0).allowed).toBe(true);
    expect(limiter.consume('b', 0).allowed).toBe(true);
    expect(limiter.consume('a', 1).allowed).toBe(false);
  });

  it('窗口滑过后旧记录过期,重新放行', () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 10_000 });
    limiter.consume('k', 0);
    limiter.consume('k', 5_000);
    expect(limiter.consume('k', 9_999).allowed).toBe(false);
    expect(limiter.consume('k', 10_001).allowed).toBe(true);
  });

  it('key 数量超过 maxKeys 时淘汰最早的 key', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000, maxKeys: 2 });
    limiter.consume('first', 0);
    limiter.consume('second', 1);
    limiter.consume('third', 2);
    expect(limiter.consume('first', 3).allowed).toBe(true);
    expect(limiter.consume('third', 4).allowed).toBe(false);
  });

  it('默认使用 Date.now()', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });
    expect(limiter.consume('now').allowed).toBe(true);
    expect(limiter.consume('now').allowed).toBe(false);
  });
});

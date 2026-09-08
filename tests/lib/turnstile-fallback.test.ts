/**
 * Turnstile 降级(备用防护)纯函数验证
 *
 * 背景:缅甸等地运营商封锁 challenges.cloudflare.com,Turnstile 脚本加载不了。
 * 客户端在脚本加载超时后提交哨兵 token,服务端改用三层廉价信号替代人机验证:
 * 蜜罐字段为空 + 表单停留时间合理 + 每 IP 限流(限流见 rate-limit.test.ts)。
 */

import { describe, it, expect } from 'vitest';
import {
  TURNSTILE_UNAVAILABLE_TOKEN,
  FALLBACK_MIN_DWELL_MS,
  FALLBACK_MAX_DWELL_MS,
  FALLBACK_NOTE,
  isFallbackToken,
  checkFallbackSignals,
  appendFallbackNote,
} from '@/lib/turnstile-fallback';

describe('isFallbackToken', () => {
  it('只识别哨兵 token', () => {
    expect(isFallbackToken(TURNSTILE_UNAVAILABLE_TOKEN)).toBe(true);
    expect(isFallbackToken('dev-skip-token')).toBe(false);
    expect(isFallbackToken('')).toBe(false);
    expect(isFallbackToken('0.real-turnstile-token')).toBe(false);
  });
});

describe('checkFallbackSignals', () => {
  const now = 1_800_000_000_000;

  it('蜜罐为空且停留时间在窗口内 → 通过', () => {
    expect(checkFallbackSignals({ website: '', formStartedAt: now - 30_000, now })).toEqual({ ok: true });
    expect(checkFallbackSignals({ formStartedAt: now - FALLBACK_MIN_DWELL_MS, now })).toEqual({ ok: true });
  });

  it('蜜罐非空 → honeypot', () => {
    expect(checkFallbackSignals({ website: 'http://spam.example', formStartedAt: now - 30_000, now })).toEqual({
      ok: false,
      reason: 'honeypot',
    });
  });

  it('停留时间过短、缺失或过长 → timing', () => {
    expect(checkFallbackSignals({ website: '', formStartedAt: now - 1_000, now })).toEqual({ ok: false, reason: 'timing' });
    expect(checkFallbackSignals({ website: '', now })).toEqual({ ok: false, reason: 'timing' });
    expect(
      checkFallbackSignals({ website: '', formStartedAt: now - FALLBACK_MAX_DWELL_MS - 1, now })
    ).toEqual({ ok: false, reason: 'timing' });
    expect(checkFallbackSignals({ website: '', formStartedAt: now + 60_000, now })).toEqual({ ok: false, reason: 'timing' });
  });

  it('蜜罐优先于停留时间判断', () => {
    expect(checkFallbackSignals({ website: 'x', formStartedAt: now - 1_000, now })).toEqual({ ok: false, reason: 'honeypot' });
  });
});

describe('appendFallbackNote', () => {
  it('在留言末尾追加标记,空留言也能标记', () => {
    expect(appendFallbackNote('Hello')).toBe(`Hello\n\n${FALLBACK_NOTE}`);
    expect(appendFallbackNote('')).toBe(FALLBACK_NOTE);
    expect(appendFallbackNote(undefined)).toBe(FALLBACK_NOTE);
  });
});

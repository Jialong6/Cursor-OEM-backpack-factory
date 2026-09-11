/**
 * Unit tests for lib/consent-signals.ts
 *
 * 同意模式的信号推送。GA4 走 Google Consent Mode v2,Clarity 走微软的
 * Consent API;两者都是「脚本先加载、默认拒绝、拿到同意后 update」。
 *
 * 做成接收 target 参数的纯函数,是为了不碰真实 window 也能测透 —— 脚本被
 * 广告拦截器挡掉、被墙、或还没加载完时,推送必须安静地失败而不是抛异常。
 */
import { describe, test, expect, vi } from 'vitest';
import {
  DENIED_CONSENT_STATE,
  GRANTED_CONSENT_STATE,
  pushGtagConsent,
  pushClarityConsent,
  pushConsentSignals,
  type ConsentTarget,
} from '../../lib/consent-signals';

function targetWithBoth(): ConsentTarget & {
  gtag: ReturnType<typeof vi.fn>;
  clarity: ReturnType<typeof vi.fn>;
} {
  return { gtag: vi.fn(), clarity: vi.fn() };
}

describe('consent state shapes', () => {
  test('the denied state turns off all four Consent Mode v2 signals', () => {
    expect(DENIED_CONSENT_STATE).toEqual({
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    });
  });

  test('granting only enables analytics storage, never the advertising ones', () => {
    expect(GRANTED_CONSENT_STATE.analytics_storage).toBe('granted');
    expect(GRANTED_CONSENT_STATE.ad_storage).toBe('denied');
    expect(GRANTED_CONSENT_STATE.ad_user_data).toBe('denied');
    expect(GRANTED_CONSENT_STATE.ad_personalization).toBe('denied');
  });
});

describe('pushGtagConsent', () => {
  test('sends a consent update with analytics granted', () => {
    const target = targetWithBoth();
    expect(pushGtagConsent(target, true)).toBe(true);
    expect(target.gtag).toHaveBeenCalledWith(
      'consent',
      'update',
      GRANTED_CONSENT_STATE
    );
  });

  test('sends a consent update with everything denied', () => {
    const target = targetWithBoth();
    expect(pushGtagConsent(target, false)).toBe(true);
    expect(target.gtag).toHaveBeenCalledWith(
      'consent',
      'update',
      DENIED_CONSENT_STATE
    );
  });

  test('reports failure when gtag is absent (script blocked or not loaded)', () => {
    expect(pushGtagConsent({}, true)).toBe(false);
  });

  test('reports failure when gtag is not callable', () => {
    expect(pushGtagConsent({ gtag: 'nope' } as unknown as ConsentTarget, true)).toBe(false);
  });

  test('swallows an exception thrown by gtag', () => {
    const target: ConsentTarget = {
      gtag: () => {
        throw new Error('boom');
      },
    };
    expect(() => pushGtagConsent(target, true)).not.toThrow();
    expect(pushGtagConsent(target, true)).toBe(false);
  });

  test('tolerates a null target', () => {
    expect(pushGtagConsent(null, true)).toBe(false);
  });
});

describe('pushClarityConsent', () => {
  test('sends the boolean consent signal', () => {
    const target = targetWithBoth();
    expect(pushClarityConsent(target, true)).toBe(true);
    expect(target.clarity).toHaveBeenCalledWith('consent', true);
  });

  test('sends a withdrawal', () => {
    const target = targetWithBoth();
    pushClarityConsent(target, false);
    expect(target.clarity).toHaveBeenCalledWith('consent', false);
  });

  test('reports failure when clarity is absent', () => {
    expect(pushClarityConsent({}, true)).toBe(false);
  });

  test('swallows an exception thrown by clarity', () => {
    const target: ConsentTarget = {
      clarity: () => {
        throw new Error('boom');
      },
    };
    expect(() => pushClarityConsent(target, true)).not.toThrow();
  });
});

describe('pushConsentSignals', () => {
  test('notifies both vendors', () => {
    const target = targetWithBoth();
    pushConsentSignals(target, true);

    expect(target.gtag).toHaveBeenCalledTimes(1);
    expect(target.clarity).toHaveBeenCalledTimes(1);
  });

  test('still notifies Clarity when gtag is missing', () => {
    const clarity = vi.fn();
    pushConsentSignals({ clarity }, true);
    expect(clarity).toHaveBeenCalledWith('consent', true);
  });

  test('does nothing and does not throw when neither vendor is present', () => {
    expect(() => pushConsentSignals({}, true)).not.toThrow();
  });
});

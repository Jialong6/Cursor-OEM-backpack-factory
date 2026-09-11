/**
 * 向第三方分析推送同意信号
 *
 * 两家厂商的同意模式都是「脚本先加载、默认拒绝、拿到同意后 update」:
 * - GA4:Google Consent Mode v2,默认拒绝时只发不写 cookie 的匿名 ping
 * - Clarity:微软 Consent API。自 2025-10-31 起,EEA/英国/瑞士的访客
 *   没有同意信号就不会被采集 —— 不做同意条并不能换来数据
 *
 * 做成接收 target 参数的函数而不是直接摸 window,一是能在 happy-dom 之外
 * 单测,二是强迫每一处调用都面对「脚本可能根本不存在」这件事:被广告拦截器
 * 挡掉、被墙、或还在加载中都属于常态,推送必须安静失败。
 *
 * 本模块不能引入 'use client' 或 next/server。
 */

/** Consent Mode v2 的四个信号 */
export interface GtagConsentState {
  ad_storage: 'granted' | 'denied';
  ad_user_data: 'granted' | 'denied';
  ad_personalization: 'granted' | 'denied';
  analytics_storage: 'granted' | 'denied';
}

/** 承载 gtag 与 clarity 的宿主对象(生产环境即 window) */
export interface ConsentTarget {
  gtag?: unknown;
  clarity?: unknown;
}

/**
 * 让 window 也满足 ConsentTarget
 *
 * ConsentTarget 的属性全是可选的,TypeScript 会把它当「弱类型」:传入一个
 * 一个属性都对不上的值会直接报错。两家厂商的脚本是在运行时往 window 上挂
 * 全局函数的,类型层面必须显式声明出来,调用方才能直接传 window。
 */
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

/** 默认状态:四个信号全部拒绝 */
export const DENIED_CONSENT_STATE: GtagConsentState = Object.freeze({
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
});

/**
 * 同意后的状态:只放开分析存储
 *
 * 本站不投放广告、不做再营销,三个广告类信号永远保持拒绝。这样隐私政策
 * 里「我们不会把你的数据用于广告」这句话在技术上是成立的。
 */
export const GRANTED_CONSENT_STATE: GtagConsentState = Object.freeze({
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'granted',
});

type Callable = (...args: unknown[]) => unknown;

function asCallable(value: unknown): Callable | null {
  return typeof value === 'function' ? (value as Callable) : null;
}

/**
 * 向 GA4 推送同意更新
 *
 * @returns 是否成功推送。false 表示 gtag 不可用,不是错误
 */
export function pushGtagConsent(
  target: ConsentTarget | null | undefined,
  granted: boolean
): boolean {
  const gtag = asCallable(target?.gtag);

  if (!gtag) {
    return false;
  }

  try {
    gtag('consent', 'update', granted ? GRANTED_CONSENT_STATE : DENIED_CONSENT_STATE);
    return true;
  } catch {
    return false;
  }
}

/**
 * 向 Clarity 推送同意信号
 *
 * @returns 是否成功推送。false 表示 clarity 不可用,不是错误
 */
export function pushClarityConsent(
  target: ConsentTarget | null | undefined,
  granted: boolean
): boolean {
  const clarity = asCallable(target?.clarity);

  if (!clarity) {
    return false;
  }

  try {
    clarity('consent', granted);
    return true;
  } catch {
    return false;
  }
}

/**
 * 一次性通知两家厂商
 *
 * 其中一家不可用不影响另一家 —— 中国访客那边两个都不会存在,欧洲访客
 * 可能只有其中一个被广告拦截器放行。
 */
export function pushConsentSignals(
  target: ConsentTarget | null | undefined,
  granted: boolean
): void {
  pushGtagConsent(target, granted);
  pushClarityConsent(target, granted);
}

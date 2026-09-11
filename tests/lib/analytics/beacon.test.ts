/**
 * Unit tests for lib/analytics/beacon.ts
 *
 * 传输层的两个要害:
 * 1. 页面卸载时不能丢。移动端 Safari 上 sendBeacon 是唯一能在 pagehide
 *    之后仍把请求送出去的手段,所以先 sendBeacon、失败才回落 fetch。
 * 2. 转化事件必须即时发。mailto: / tel: / wa.me 点击是导航,会把页面带离
 *    源站,pending 的防抖定时器直接死。
 *
 * happy-dom 的 sendBeacon 有实现且恒返回 true、内部转调 fetch,所以
 * 回落分支天然不可达 —— 必须单独造一个返回 false 的替身才能覆盖到。
 */
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  FLUSH_DEBOUNCE_MS,
  MAX_EVENTS_PER_BATCH,
  type InsightEnvelope,
} from '../../../lib/analytics/events';
import {
  __resetBeaconForTests,
  flush,
  getPageViewId,
  resetPageView,
  track,
  trackDwell,
} from '../../../lib/analytics/beacon';

let beaconSpy: ReturnType<typeof vi.fn>;
let fetchSpy: ReturnType<typeof vi.fn>;

/** 取出所有 sendBeacon 送出去的载荷 */
async function sentEnvelopes(): Promise<InsightEnvelope[]> {
  const payloads: InsightEnvelope[] = [];

  for (const call of beaconSpy.mock.calls) {
    const blob = call[1] as Blob;
    payloads.push(JSON.parse(await blob.text()) as InsightEnvelope);
  }

  return payloads;
}

function installBeacon(result: boolean): void {
  beaconSpy = vi.fn(() => result);
  Object.defineProperty(navigator, 'sendBeacon', {
    value: beaconSpy,
    configurable: true,
    writable: true,
  });
}

/**
 * happy-dom 的 navigator.webdriver 是硬编码的 true(Navigator.js:167),
 * 而 beacon 会据此判定为自动化浏览器、静默关掉全部上报。
 * 不覆盖它,这个文件里没有一个用例能跑通。
 */
function setWebdriver(value: boolean): void {
  Object.defineProperty(navigator, 'webdriver', { value, configurable: true });
}

beforeEach(() => {
  vi.useFakeTimers();
  setWebdriver(false);
  installBeacon(true);
  fetchSpy = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
  vi.stubGlobal('fetch', fetchSpy);
  __resetBeaconForTests();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  __resetBeaconForTests();
});

describe('pageViewId', () => {
  test('首次 track 时惰性生成', () => {
    expect(getPageViewId()).toBe('');
    track('page_view');
    expect(getPageViewId()).not.toBe('');
  });

  test('resetPageView 换新 id', () => {
    track('page_view');
    const first = getPageViewId();

    const second = resetPageView();

    expect(second).not.toBe(first);
    expect(getPageViewId()).toBe(second);
  });

  test('resetPageView 之前先把旧队列发走', async () => {
    track('cta_click', { cta: 'hero' });
    const oldId = getPageViewId();

    resetPageView();

    const sent = await sentEnvelopes();
    expect(sent).toHaveLength(1);
    expect(sent[0].pageViewId).toBe(oldId);
  });
});

describe('批量与即时', () => {
  test('普通事件先攒着,不立刻发', () => {
    track('scroll_depth', { pct: 25 });
    expect(beaconSpy).not.toHaveBeenCalled();
  });

  test('防抖窗口到点后发出', () => {
    track('scroll_depth', { pct: 25 });
    vi.advanceTimersByTime(FLUSH_DEBOUNCE_MS);
    expect(beaconSpy).toHaveBeenCalledTimes(1);
  });

  test('转化事件立刻发 —— 页面马上就要被导航带走了', () => {
    track('whatsapp_click', {}, { immediate: true });
    expect(beaconSpy).toHaveBeenCalledTimes(1);
  });

  test('队列攒满就发,不等防抖', () => {
    for (let i = 0; i < MAX_EVENTS_PER_BATCH; i++) {
      track('scroll_depth', { pct: i });
    }
    expect(beaconSpy).toHaveBeenCalledTimes(1);
  });

  test('空队列 flush 不发请求', () => {
    flush('test');
    expect(beaconSpy).not.toHaveBeenCalled();
  });
});

describe('载荷内容', () => {
  test('带上路径、语言、视口与相对时间戳', async () => {
    document.documentElement.lang = 'de';
    track('cta_click', { cta: 'hero' });
    flush('test');

    const [envelope] = await sentEnvelopes();

    expect(envelope.locale).toBe('de');
    expect(envelope.path).toBe(window.location.pathname);
    expect(envelope.viewport.w).toBeGreaterThan(0);
    expect(envelope.events[0].name).toBe('cta_click');
    expect(envelope.events[0].props).toEqual({ cta: 'hero' });
    expect(envelope.events[0].ts).toBeGreaterThanOrEqual(0);
  });

  test('板块停留数据随批次一起走', async () => {
    trackDwell([{ sectionId: 'faq', ms: 4_200, enterCount: 1, maxCoverage: 0.8 }]);
    flush('test');

    const [envelope] = await sentEnvelopes();

    expect(envelope.dwell).toHaveLength(1);
    expect(envelope.dwell[0].sectionId).toBe('faq');
  });

  test('seq 在同一 pageView 内递增', async () => {
    track('cta_click');
    flush('test');
    track('cta_click');
    flush('test');

    const sent = await sentEnvelopes();
    expect(sent[1].seq).toBeGreaterThan(sent[0].seq);
  });
});

describe('传输回落', () => {
  test('sendBeacon 返回 false 时改用 fetch keepalive', () => {
    installBeacon(false);

    track('whatsapp_click', {}, { immediate: true });

    expect(beaconSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(init.keepalive).toBe(true);
    expect(init.method).toBe('POST');
  });

  test('sendBeacon 抛异常时也回落,不影响页面', () => {
    Object.defineProperty(navigator, 'sendBeacon', {
      value: vi.fn(() => {
        throw new Error('blocked by extension');
      }),
      configurable: true,
      writable: true,
    });

    expect(() => track('phone_click', {}, { immediate: true })).not.toThrow();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  test('fetch 也失败时静默丢弃,绝不抛到页面上', () => {
    installBeacon(false);
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));

    expect(() => track('email_click', {}, { immediate: true })).not.toThrow();
  });
});

describe('页面生命周期', () => {
  test('标签页隐藏时立刻发走', () => {
    track('scroll_depth', { pct: 50 });

    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(beaconSpy).toHaveBeenCalledTimes(1);
  });

  test('pagehide 时发走', () => {
    track('scroll_depth', { pct: 75 });
    window.dispatchEvent(new Event('pagehide'));

    expect(beaconSpy).toHaveBeenCalledTimes(1);
  });

  test('重复初始化不会重复注册监听器', () => {
    track('page_view');
    resetPageView();
    track('page_view');
    flush('test');
    beaconSpy.mockClear();

    track('scroll_depth', { pct: 50 });
    window.dispatchEvent(new Event('pagehide'));

    // 监听器只注册一次,所以只发一次
    expect(beaconSpy).toHaveBeenCalledTimes(1);
  });
});

describe('不该上报的情况', () => {
  test('自动化浏览器不上报', () => {
    setWebdriver(true);

    track('cta_click', {}, { immediate: true });

    expect(beaconSpy).not.toHaveBeenCalled();
    expect(getPageViewId()).toBe('');
  });
});

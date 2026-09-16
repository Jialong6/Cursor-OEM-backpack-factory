/**
 * useSectionDwell —— IntersectionObserver 与停留状态机之间的接线
 *
 * 状态机本身已经在 tests/lib/analytics/dwell-accumulator.test.ts 里测透,
 * 这里只验证接线:板块扫得对不对、entry 翻译成 coverage/selfRatio 对不对、
 * 生命周期与路由切换时有没有按时 flush。
 *
 * pageKey 由外部传入而不是 hook 内部调 usePathname,就是为了这里能直接
 * rerender 换 key 来模拟路由切换,也不必 mock next/navigation。
 */
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { installIntersectionObserver, type FakeIntersectionObserver } from '../helpers/intersection-observer';
import { DEFAULT_IDLE_LIMIT_MS } from '../../lib/analytics/dwell-accumulator';
import { PAGE_FALLBACK_KEY } from '../../lib/analytics/section-targets';
import { useSectionDwell } from '../../hooks/useSectionDwell';
import { NAVBAR_HEIGHT } from '../../lib/navigation';

let io: FakeIntersectionObserver;
let onFlush: ReturnType<typeof vi.fn>;
let clock = 0;

function setNow(ms: number): void {
  clock = ms;
}

function sectionsHtml(ids: readonly string[]): string {
  return ids.map((id) => `<section id="${id}"></section>`).join('');
}

function el(id: string): Element {
  return document.getElementById(id) as Element;
}

/** 渲染 hook 并跑完那次用于等待 DOM 落地的 requestAnimationFrame */
function renderDwell(pageKey = '/en') {
  const view = renderHook((props: { pageKey: string }) => useSectionDwell({
    pageKey: props.pageKey,
    onFlush,
  }), { initialProps: { pageKey } });

  vi.advanceTimersByTime(32);
  return view;
}

beforeEach(() => {
  vi.useFakeTimers();
  clock = 0;
  vi.stubGlobal('performance', { now: () => clock });
  // happy-dom 没有 rAF 的稳定实现,统一走 timer,测试才能确定推进
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) =>
    setTimeout(() => cb(clock), 16) as unknown as number
  );
  vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));
  io = installIntersectionObserver();
  onFlush = vi.fn();
  document.body.innerHTML = '';
});

afterEach(() => {
  io.restore();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('板块扫描', () => {
  test('观测页面上的全部板块', () => {
    document.body.innerHTML = sectionsHtml(['banner', 'about', 'features', 'faq', 'contact']);
    renderDwell();

    expect(io.observed()).toHaveLength(5);
  });

  test('观测器的 rootMargin 扣掉导航栏高度', () => {
    document.body.innerHTML = sectionsHtml(['banner']);
    renderDwell();

    expect(io.lastInit()?.rootMargin).toBe(`-${NAVBAR_HEIGHT}px 0px 0px 0px`);
  });

  test('阈值梯子够密,高于视口的板块才不会整段滚动只回调两三次', () => {
    document.body.innerHTML = sectionsHtml(['banner']);
    renderDwell();

    const thresholds = io.lastInit()?.threshold as readonly number[];
    expect(thresholds.length).toBeGreaterThanOrEqual(8);
    expect(thresholds).toContain(0.05);
  });

  test('页面一个 section 都没有时退回观测 main', () => {
    document.body.innerHTML = '<main id="main-content"><article>post</article></main>';
    renderDwell();

    expect(io.observed()).toHaveLength(1);
    expect(io.observed()[0].tagName.toLowerCase()).toBe('main');
  });
});

describe('entry 翻译成停留时长', () => {
  test('铺满视口的板块开始计时', () => {
    document.body.innerHTML = sectionsHtml(['features']);
    const { unmount } = renderDwell();

    io.emit([{ target: el('features'), visibleHeight: 700, selfHeight: 1400, viewportHeight: 800 }]);
    setNow(6_000);
    unmount();

    expect(onFlush).toHaveBeenCalled();
    const entries = onFlush.mock.calls.at(-1)?.[0] as ReadonlyArray<{ sectionId: string; ms: number }>;
    expect(entries.find((e) => e.sectionId === 'features')?.ms).toBe(6_000);
  });

  test('高于视口的板块靠占屏比例够格 —— 自身露出比例只有一半', () => {
    document.body.innerHTML = sectionsHtml(['contact']);
    const { unmount } = renderDwell();

    // 两倍视口高:只露出自己的一半,却铺满了整个屏幕
    io.emit([{ target: el('contact'), visibleHeight: 800, selfHeight: 1600, viewportHeight: 800 }]);
    setNow(3_000);
    unmount();

    const entries = onFlush.mock.calls.at(-1)?.[0] as ReadonlyArray<{ sectionId: string }>;
    expect(entries.map((e) => e.sectionId)).toContain('contact');
  });

  test('只露一点点的板块不计时', () => {
    document.body.innerHTML = sectionsHtml(['blog']);
    const { unmount } = renderDwell();

    io.emit([{ target: el('blog'), visibleHeight: 60, selfHeight: 900, viewportHeight: 800 }]);
    setNow(9_000);
    unmount();

    const entries = (onFlush.mock.calls.at(-1)?.[0] ?? []) as ReadonlyArray<unknown>;
    expect(entries).toHaveLength(0);
  });

  test('滚走的板块停止计时,新板块接上', () => {
    document.body.innerHTML = sectionsHtml(['about', 'features']);
    const { unmount } = renderDwell();

    io.emit([{ target: el('about'), visibleHeight: 800, selfHeight: 900, viewportHeight: 800 }]);
    setNow(4_000);
    io.emit([
      { target: el('about'), isIntersecting: false, visibleHeight: 0, selfHeight: 900, viewportHeight: 800 },
      { target: el('features'), visibleHeight: 800, selfHeight: 900, viewportHeight: 800 },
    ]);
    setNow(10_000);
    unmount();

    const entries = onFlush.mock.calls.at(-1)?.[0] as ReadonlyArray<{ sectionId: string; ms: number }>;
    expect(entries.find((e) => e.sectionId === 'about')?.ms).toBe(4_000);
    expect(entries.find((e) => e.sectionId === 'features')?.ms).toBe(6_000);
  });
});

describe('暂停与空闲', () => {
  test('标签页隐藏期间不计时', () => {
    document.body.innerHTML = sectionsHtml(['faq']);
    const { unmount } = renderDwell();

    io.emit([{ target: el('faq'), visibleHeight: 800, selfHeight: 900, viewportHeight: 800 }]);

    setNow(2_000);
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    setNow(50_000);
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    setNow(53_000);
    unmount();

    const total = onFlush.mock.calls
      .flatMap((call) => call[0] as ReadonlyArray<{ sectionId: string; ms: number }>)
      .filter((e) => e.sectionId === 'faq')
      .reduce((sum, e) => sum + e.ms, 0);

    expect(total).toBe(5_000);
  });

  test('长时间没有任何操作时计时封顶', () => {
    document.body.innerHTML = sectionsHtml(['services']);
    const { unmount } = renderDwell();

    io.emit([{ target: el('services'), visibleHeight: 800, selfHeight: 900, viewportHeight: 800 }]);
    setNow(DEFAULT_IDLE_LIMIT_MS + 300_000);
    unmount();

    const total = onFlush.mock.calls
      .flatMap((call) => call[0] as ReadonlyArray<{ sectionId: string; ms: number }>)
      .filter((e) => e.sectionId === 'services')
      .reduce((sum, e) => sum + e.ms, 0);

    expect(total).toBe(DEFAULT_IDLE_LIMIT_MS);
  });

  test('滚动算用户活动,空闲窗口从那一刻重新开始', () => {
    document.body.innerHTML = sectionsHtml(['services']);
    const { unmount } = renderDwell();

    io.emit([{ target: el('services'), visibleHeight: 800, selfHeight: 900, viewportHeight: 800 }]);

    // 眼看要封顶时滚一下,空闲窗口重置
    const scrolledAt = DEFAULT_IDLE_LIMIT_MS - 1_000;
    setNow(scrolledAt);
    window.dispatchEvent(new Event('scroll'));

    // 之后再也没有操作,所以计时只能延续到「最后一次活动 + 空闲上限」
    setNow(DEFAULT_IDLE_LIMIT_MS * 4);
    unmount();

    const total = onFlush.mock.calls
      .flatMap((call) => call[0] as ReadonlyArray<{ sectionId: string; ms: number }>)
      .filter((e) => e.sectionId === 'services')
      .reduce((sum, e) => sum + e.ms, 0);

    expect(total).toBe(scrolledAt + DEFAULT_IDLE_LIMIT_MS);
  });
});

describe('心跳与路由切换', () => {
  test('长会话期间定期上报,不必等到页面关闭', () => {
    document.body.innerHTML = sectionsHtml(['features']);
    renderDwell();

    io.emit([{ target: el('features'), visibleHeight: 800, selfHeight: 900, viewportHeight: 800 }]);

    setNow(30_000);
    vi.advanceTimersByTime(30_000);

    expect(onFlush).toHaveBeenCalled();
  });

  test('路由切换时先把上一页的停留发走,再按新 DOM 重建观测', () => {
    document.body.innerHTML = sectionsHtml(['features']);
    const view = renderDwell('/en');

    io.emit([{ target: el('features'), visibleHeight: 800, selfHeight: 900, viewportHeight: 800 }]);
    setNow(7_000);

    document.body.innerHTML = sectionsHtml(['blogPost']);
    view.rerender({ pageKey: '/en/blog' });
    vi.advanceTimersByTime(32);

    const flushedBefore = onFlush.mock.calls
      .flatMap((call) => call[0] as ReadonlyArray<{ sectionId: string; ms: number }>)
      .filter((e) => e.sectionId === 'features');

    expect(flushedBefore.reduce((sum, e) => sum + e.ms, 0)).toBe(7_000);
    expect(io.observed().map((node) => node.id)).toEqual(['blogPost']);
  });

  test('卸载时断开观测器', () => {
    document.body.innerHTML = sectionsHtml(['features']);
    const { unmount } = renderDwell();

    unmount();

    expect(io.disconnectCount()).toBeGreaterThan(0);
  });

  test('没有任何停留时不调用 onFlush', () => {
    document.body.innerHTML = sectionsHtml(['features']);
    const { unmount } = renderDwell();

    unmount();

    expect(onFlush).not.toHaveBeenCalled();
  });
});

/**
 * 页面关闭时的交付
 *
 * 线上 18 次访问里有 3 次(17%)明明滚到了 75%,却一条板块停留都没入库。
 * 根因是本 hook 当初只挂了 visibilitychange:beacon 自己两条都挂,
 * 于是「只触发 pagehide 不触发 visibilitychange」的那些关闭路径
 * (移动端 Safari、进 bfcache)里,队列被发走了,而停留数据从没进过队列。
 *
 * 这一组用例就是那条数据缺口的回归测试。
 */
describe('页面关闭与 bfcache', () => {
  test('pagehide 时把停留交出去 —— 有些关闭路径不会触发 visibilitychange', () => {
    document.body.innerHTML = sectionsHtml(['costAdvantage']);
    renderDwell();

    io.emit([{ target: el('costAdvantage'), visibleHeight: 800, selfHeight: 900, viewportHeight: 800 }]);
    setNow(41_000);
    window.dispatchEvent(new Event('pagehide'));

    const entries = onFlush.mock.calls.at(-1)?.[0] as ReadonlyArray<{ sectionId: string; ms: number }>;
    expect(entries?.find((e) => e.sectionId === 'costAdvantage')?.ms).toBe(41_000);
  });

  test('告诉调用方这次 flush 的原因,调用方才能顺手把传输层也发走', () => {
    document.body.innerHTML = sectionsHtml(['contact']);
    renderDwell();

    io.emit([{ target: el('contact'), visibleHeight: 800, selfHeight: 900, viewportHeight: 800 }]);
    setNow(5_000);
    window.dispatchEvent(new Event('pagehide'));

    expect(onFlush.mock.calls.at(-1)?.[1]).toBe('pagehide');
  });

  test('躺在 bfcache 里的那段时间不算停留', () => {
    document.body.innerHTML = sectionsHtml(['features']);
    const { unmount } = renderDwell();

    io.emit([{ target: el('features'), visibleHeight: 800, selfHeight: 900, viewportHeight: 800 }]);

    // 看了 3 秒就切走
    setNow(3_000);
    window.dispatchEvent(new Event('pagehide'));

    // 在 bfcache 里躺了 10 分钟 —— performance.now() 期间照常走
    setNow(603_000);
    window.dispatchEvent(new Event('pageshow'));

    // 回来又看了 2 秒
    setNow(605_000);
    unmount();

    const total = onFlush.mock.calls
      .flatMap((call) => call[0] as ReadonlyArray<{ sectionId: string; ms: number }>)
      .filter((e) => e.sectionId === 'features')
      .reduce((sum, e) => sum + e.ms, 0);

    expect(total).toBe(5_000);
  });

  test('bfcache 恢复之后还能继续计时,不是就此停摆', () => {
    document.body.innerHTML = sectionsHtml(['about']);
    const { unmount } = renderDwell();

    io.emit([{ target: el('about'), visibleHeight: 800, selfHeight: 900, viewportHeight: 800 }]);
    setNow(1_000);
    window.dispatchEvent(new Event('pagehide'));

    setNow(2_000);
    window.dispatchEvent(new Event('pageshow'));
    setNow(9_000);
    unmount();

    const total = onFlush.mock.calls
      .flatMap((call) => call[0] as ReadonlyArray<{ sectionId: string; ms: number }>)
      .filter((e) => e.sectionId === 'about')
      .reduce((sum, e) => sum + e.ms, 0);

    expect(total).toBe(8_000);
  });

  test('卸载后 pagehide 不再触发 flush', () => {
    document.body.innerHTML = sectionsHtml(['faq']);
    const { unmount } = renderDwell();

    io.emit([{ target: el('faq'), visibleHeight: 800, selfHeight: 900, viewportHeight: 800 }]);
    setNow(4_000);
    unmount();
    onFlush.mockClear();

    window.dispatchEvent(new Event('pagehide'));

    expect(onFlush).not.toHaveBeenCalled();
  });
});

describe('兜底 key', () => {
  test('无 section 的页面上报哨兵 key,而不是 main 元素自己的 id', () => {
    document.body.innerHTML = '<main id="main-content"><article>post</article></main>';
    const { unmount } = renderDwell('/en/blog/us-tariff-myanmar-bags-2026');

    const main = document.getElementById('main-content') as Element;
    io.emit([{ target: main, visibleHeight: 800, selfHeight: 4000, viewportHeight: 800 }]);
    setNow(20_000);
    unmount();

    const entries = onFlush.mock.calls.at(-1)?.[0] as ReadonlyArray<{ sectionId: string }>;
    expect(entries.map((e) => e.sectionId)).toEqual([PAGE_FALLBACK_KEY]);
  });
});

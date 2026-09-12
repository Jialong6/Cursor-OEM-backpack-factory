/**
 * InsightTracker —— 第二期埋点的唯一生命周期挂载点
 *
 * 它自己不产出任何正确性逻辑,全部委托给已经单测过的纯模块。
 * 这里验证的是接线:页面浏览有没有按时开新身份、外链点击有没有被
 * 委托监听器捕获、站内锚点有没有被正确忽略(否则 cta_click 会翻倍)。
 */
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';

const { trackMock, trackDwellMock, resetPageViewMock, flushMock, dwellMock } = vi.hoisted(() => ({
  trackMock: vi.fn(),
  trackDwellMock: vi.fn(),
  resetPageViewMock: vi.fn(() => 'pv-new'),
  flushMock: vi.fn(),
  dwellMock: vi.fn(),
}));

vi.mock('@/lib/analytics/beacon', () => ({
  track: trackMock,
  trackDwell: trackDwellMock,
  resetPageView: resetPageViewMock,
  flush: flushMock,
  getPageViewId: () => 'pv-1',
}));

vi.mock('@/hooks/useSectionDwell', () => ({
  useSectionDwell: dwellMock,
}));

let pathname = '/en';
vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
}));

import InsightTracker from '@/components/analytics/InsightTracker';

function clickLink(html: string): void {
  document.body.innerHTML = html;
  const anchor = document.querySelector('a') as HTMLAnchorElement;
  anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}

beforeEach(() => {
  pathname = '/en';
  document.body.innerHTML = '';
  trackMock.mockClear();
  trackDwellMock.mockClear();
  resetPageViewMock.mockClear();
  flushMock.mockClear();
  dwellMock.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('渲染', () => {
  test('不产生任何 DOM', () => {
    const { container } = render(<InsightTracker />);
    expect(container.innerHTML).toBe('');
  });
});

describe('页面浏览', () => {
  test('挂载时上报一次,带上路径', () => {
    render(<InsightTracker />);

    expect(trackMock).toHaveBeenCalledWith('page_view', expect.objectContaining({ path: '/en' }));
  });

  test('路由切换时先换新身份再上报', () => {
    const view = render(<InsightTracker />);
    resetPageViewMock.mockClear();
    trackMock.mockClear();

    pathname = '/en/blog';
    view.rerender(<InsightTracker />);

    expect(resetPageViewMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith('page_view', expect.objectContaining({ path: '/en/blog' }));
  });

  test('把当前路径交给停留观测器作为 pageKey', () => {
    render(<InsightTracker />);

    expect(dwellMock).toHaveBeenCalledWith(
      expect.objectContaining({ pageKey: '/en' })
    );
  });

  test('bfcache 恢复时开一条全新的页面浏览', () => {
    render(<InsightTracker />);
    resetPageViewMock.mockClear();
    trackMock.mockClear();

    const event = new Event('pageshow') as PageTransitionEvent;
    Object.defineProperty(event, 'persisted', { value: true });
    window.dispatchEvent(event);

    expect(resetPageViewMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith('page_view', expect.objectContaining({ path: '/en' }));
  });

  test('普通的 pageshow 不重开身份', () => {
    render(<InsightTracker />);
    resetPageViewMock.mockClear();

    const event = new Event('pageshow') as PageTransitionEvent;
    Object.defineProperty(event, 'persisted', { value: false });
    window.dispatchEvent(event);

    expect(resetPageViewMock).not.toHaveBeenCalled();
  });
});

describe('外链点击的委托采集', () => {
  test.each([
    ['https://wa.me/18148801463', 'whatsapp_click'],
    ['mailto:jay@betterbagsmm.com', 'email_click'],
    ['tel:+8613061391463', 'phone_click'],
    ['https://www.google.com/maps/search/?api=1&query=x', 'map_click'],
  ])('%s 上报 %s', (href, expected) => {
    render(<InsightTracker />);
    trackMock.mockClear();

    clickLink(`<a href="${href}">go</a>`);

    expect(trackMock).toHaveBeenCalledWith(expected, expect.anything(), { immediate: true });
  });

  test('点到链接内部的子元素也算', () => {
    render(<InsightTracker />);
    trackMock.mockClear();

    document.body.innerHTML = '<a href="tel:+8613061391463"><span>call</span></a>';
    const span = document.querySelector('span') as HTMLElement;
    span.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(trackMock).toHaveBeenCalledWith('phone_click', expect.anything(), { immediate: true });
  });

  test('站内锚点不上报 —— 否则 cta_click 会被记两次', () => {
    render(<InsightTracker />);
    trackMock.mockClear();

    clickLink('<a href="#contact">Get a quote</a>');

    expect(trackMock).not.toHaveBeenCalled();
  });

  test('站内路径不上报', () => {
    render(<InsightTracker />);
    trackMock.mockClear();

    clickLink('<a href="/en/blog">Blog</a>');

    expect(trackMock).not.toHaveBeenCalled();
  });

  test('带上 data-analytics-label 作为维度', () => {
    render(<InsightTracker />);
    trackMock.mockClear();

    clickLink('<a href="tel:+959985670999" data-analytics-label="Burmese">call</a>');

    expect(trackMock).toHaveBeenCalledWith(
      'phone_click',
      { label: 'Burmese' },
      { immediate: true }
    );
  });

  test('绝不上报号码或邮箱本身', () => {
    render(<InsightTracker />);
    trackMock.mockClear();

    clickLink('<a href="tel:+8613061391463" data-analytics-label="Chinese">call</a>');

    const serialized = JSON.stringify(trackMock.mock.calls);
    expect(serialized).not.toContain('8613061391463');
  });

  test('卸载后不再采集', () => {
    const { unmount } = render(<InsightTracker />);
    unmount();
    trackMock.mockClear();

    clickLink('<a href="tel:+8613061391463">call</a>');

    expect(trackMock).not.toHaveBeenCalled();
  });
});

describe('停留数据接线', () => {
  test('onFlush 直接把增量交给 beacon', () => {
    render(<InsightTracker />);

    const options = dwellMock.mock.calls[0][0] as {
      onFlush: (entries: readonly unknown[]) => void;
    };
    const entries = [{ sectionId: 'faq', ms: 3_000, enterCount: 1, maxCoverage: 0.9 }];

    options.onFlush(entries);

    expect(trackDwellMock).toHaveBeenCalledWith(entries);
  });
});

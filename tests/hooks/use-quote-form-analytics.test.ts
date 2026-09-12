/**
 * useQuoteFormAnalytics —— 询盘表单埋点的时序与去噪
 *
 * 重点不在「有没有调 track」,而在两件容易出错的事:
 * 1. form_start 必须只在用户真正动手时触发一次。草稿恢复、Geo-IP 自动填国家、
 *    国家联动填区号三者都是 setValue,都会让表单快照在用户没碰键盘时就变。
 * 2. 提交失败的四条路径要分得开。它们此前全塌缩成同一个 submitStatus='error',
 *    分开之后才回答得了「到底是谁挡住了询盘」。
 */
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const { trackMock } = vi.hoisted(() => ({ trackMock: vi.fn() }));

vi.mock('@/lib/analytics/beacon', () => ({ track: trackMock }));

import { useQuoteFormAnalytics } from '@/hooks/useQuoteFormAnalytics';

function callsOf(name: string) {
  return trackMock.mock.calls.filter((call) => call[0] === name);
}

beforeEach(() => {
  trackMock.mockReset();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-12T00:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('form_start 的触发时机', () => {
  test('用户敲进第一个字段时触发一次', () => {
    const { result } = renderHook(() => useQuoteFormAnalytics());

    result.current.observeValues({ name: 'Klaus' });

    expect(callsOf('form_start')).toHaveLength(1);
  });

  test('之后无论怎么改都不再触发', () => {
    const { result } = renderHook(() => useQuoteFormAnalytics());

    result.current.observeValues({ name: 'K' });
    result.current.observeValues({ name: 'Kl' });
    result.current.observeValues({ name: 'Klaus', email: 'k@example.com' });

    expect(callsOf('form_start')).toHaveLength(1);
  });

  test('空表单不触发', () => {
    const { result } = renderHook(() => useQuoteFormAnalytics());

    result.current.observeValues({});
    result.current.observeValues({ name: '   ' });

    expect(callsOf('form_start')).toHaveLength(0);
  });

  test('草稿恢复写入的值不触发', () => {
    const { result } = renderHook(() => useQuoteFormAnalytics());
    const draft = { name: 'Klaus', email: 'k@example.com' };

    result.current.setBaseline(draft);
    result.current.observeValues(draft);

    expect(callsOf('form_start')).toHaveLength(0);
  });

  test('在草稿基础上真的改了才触发,并标明来自草稿', () => {
    const { result } = renderHook(() => useQuoteFormAnalytics());
    const draft = { name: 'Klaus' };

    result.current.setBaseline(draft);
    result.current.observeValues({ ...draft, message: 'Need 2000 pcs' });

    expect(callsOf('form_start')).toHaveLength(1);
    expect(callsOf('form_start')[0][1]).toMatchObject({ hadDraft: true });
  });

  test('Geo-IP 自动填国家、区号联动都不触发', () => {
    const { result } = renderHook(() => useQuoteFormAnalytics());

    result.current.observeValues({ countryRegion: 'DE' });
    result.current.observeValues({ countryRegion: 'DE', phoneCountryCode: '+49' });

    expect(callsOf('form_start')).toHaveLength(0);
  });
});

describe('填表耗时', () => {
  test('从首次真实输入算起,而不是从页面加载算起', () => {
    const { result } = renderHook(() => useQuoteFormAnalytics());

    // 访客先读了两分钟页面才开始填
    vi.advanceTimersByTime(120_000);
    result.current.observeValues({ name: 'Klaus' });

    vi.advanceTimersByTime(45_000);
    result.current.trackSubmitSuccess({ variant: 'inline', fileCount: 0 });

    expect(callsOf('form_submit')[0][1]).toMatchObject({ fillMs: 45_000 });
  });

  test('成功提交带上附件数与实例来源', () => {
    const { result } = renderHook(() => useQuoteFormAnalytics());

    result.current.observeValues({ name: 'Klaus' });
    result.current.trackSubmitSuccess({ variant: 'floating', fileCount: 3 });

    expect(callsOf('form_submit')[0][1]).toMatchObject({
      variant: 'floating',
      fileCount: 3,
    });
  });

  test('成功提交立刻发送,不攒批', () => {
    const { result } = renderHook(() => useQuoteFormAnalytics());
    result.current.trackSubmitSuccess({ variant: 'inline', fileCount: 0 });

    expect(callsOf('form_submit')[0][2]).toEqual({ immediate: true });
  });
});

describe('四条失败路径分得开', () => {
  test('附件上传失败:根本没发出 POST,带上失败文件数', () => {
    const { result } = renderHook(() => useQuoteFormAnalytics());

    result.current.trackSubmitFail({ variant: 'inline', reason: 'upload_failed', failedFiles: 2 });

    expect(callsOf('form_submit_fail')[0][1]).toMatchObject({
      reason: 'upload_failed',
      failedFiles: 2,
    });
  });

  test('服务端拒收:带上 HTTP 状态码,分得清 429 与 500', () => {
    const { result } = renderHook(() => useQuoteFormAnalytics());

    result.current.trackSubmitFail({ variant: 'inline', reason: 'server_rejected', status: 429 });

    expect(callsOf('form_submit_fail')[0][1]).toMatchObject({
      reason: 'server_rejected',
      status: 429,
    });
  });

  test('网络异常没有状态码', () => {
    const { result } = renderHook(() => useQuoteFormAnalytics());

    result.current.trackSubmitFail({ variant: 'inline', reason: 'network_error' });

    expect(callsOf('form_submit_fail')[0][1]).not.toHaveProperty('status');
  });

  test('被校验拦住:只报字段名,排序后输出', () => {
    const { result } = renderHook(() => useQuoteFormAnalytics());

    result.current.trackValidationBlocked(
      { phoneNumber: { type: 'required' }, email: { type: 'pattern' } } as never,
      'inline'
    );

    expect(callsOf('form_submit_fail')[0][1]).toMatchObject({
      reason: 'validation',
      fields: 'email,phoneNumber',
    });
  });

  test('被校验拦住时绝不上报用户填的值', () => {
    const { result } = renderHook(() => useQuoteFormAnalytics());

    result.current.trackValidationBlocked(
      { email: { type: 'pattern', message: 'not-an-email', ref: { value: 'klaus@secret.example' } } } as never,
      'inline'
    );

    expect(JSON.stringify(trackMock.mock.calls)).not.toContain('secret.example');
  });

  test('反复提交时累计尝试次数', () => {
    const { result } = renderHook(() => useQuoteFormAnalytics());

    result.current.trackValidationBlocked({ email: { type: 'required' } } as never, 'inline');
    result.current.trackSubmitFail({ variant: 'inline', reason: 'server_rejected', status: 400 });

    expect(callsOf('form_submit_fail')[1][1]).toMatchObject({ attempts: 2 });
  });

  test('成功之后尝试次数归零', () => {
    const { result } = renderHook(() => useQuoteFormAnalytics());

    result.current.trackSubmitFail({ variant: 'inline', reason: 'network_error' });
    result.current.trackSubmitSuccess({ variant: 'inline', fileCount: 0 });
    result.current.observeValues({ name: 'Second try' });
    result.current.trackSubmitFail({ variant: 'inline', reason: 'network_error' });

    expect(callsOf('form_submit_fail').at(-1)?.[1]).toMatchObject({ attempts: 1 });
  });
});

describe('文件相关的静默路径', () => {
  test('重复文件被静默丢弃时留下记录', () => {
    const { result } = renderHook(() => useQuoteFormAnalytics());

    result.current.trackFileReject('duplicate');

    expect(callsOf('file_reject')[0][1]).toMatchObject({ reason: 'duplicate' });
  });

  test('上传失败有单独事件', () => {
    const { result } = renderHook(() => useQuoteFormAnalytics());

    result.current.trackFileUploadFail();

    expect(callsOf('file_upload_fail')).toHaveLength(1);
  });
});

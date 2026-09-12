'use client';

import { useCallback, useEffect, useRef } from 'react';
import { track } from '@/lib/analytics/beacon';
import { hasUserInput, type SubmitFailureReason } from '@/lib/analytics/form-tracking';
import type { FieldErrors } from 'react-hook-form';

/**
 * 询盘表单的埋点
 *
 * 单独成 hook 而不是内联进 QuoteFormContext:后者已经 346 行,
 * 内联进去会顶破项目 400 行的约定。这样 Context 只多几行接线。
 *
 * 「开始填表」这个信号有三个会误触发的来源,全都是 setValue,
 * 都会让 watchedValues 在用户没碰键盘时就变:草稿恢复、Geo-IP 自动填国家、
 * 国家联动自动填电话区号。判定逻辑放在 lib/analytics/form-tracking.ts,
 * 那边用基线快照 + 用户字段白名单两道挡住,并有属性测试钉死。
 */

export type SubmitVariantName = 'inline' | 'floating';

export interface QuoteFormAnalytics {
  /** 草稿恢复完成时调用,把恢复出来的值设为基线 */
  setBaseline: (values: Readonly<Record<string, unknown>>) => void;
  /** 每次表单快照变化时调用,内部自行判定是否首次触发 */
  observeValues: (values: Readonly<Record<string, unknown>>) => void;
  trackSubmitSuccess: (info: { variant: SubmitVariantName; fileCount: number }) => void;
  trackSubmitFail: (info: {
    variant: SubmitVariantName;
    reason: SubmitFailureReason;
    status?: number;
    failedFiles?: number;
  }) => void;
  trackValidationBlocked: (
    errors: FieldErrors,
    variant: SubmitVariantName
  ) => void;
  trackFileReject: (reason: string) => void;
  trackFileUploadFail: () => void;
}

export function useQuoteFormAnalytics(): QuoteFormAnalytics {
  const baselineRef = useRef<Readonly<Record<string, unknown>>>({});
  const startedAtRef = useRef<number | null>(null);
  const attemptRef = useRef(0);

  const setBaseline = useCallback((values: Readonly<Record<string, unknown>>) => {
    baselineRef.current = { ...values };
  }, []);

  const observeValues = useCallback((values: Readonly<Record<string, unknown>>) => {
    if (startedAtRef.current !== null) {
      return;
    }

    if (!hasUserInput(values, baselineRef.current)) {
      return;
    }

    startedAtRef.current = Date.now();
    track('form_start', {
      // 从草稿续填与从零开始是两种人,分开看才有意义
      hadDraft: Object.keys(baselineRef.current).length > 0,
    });
  }, []);

  /**
   * 填表耗时
   *
   * 基线是「首次真实输入」而不是 Provider 挂载时刻 —— 后者是页面加载时刻,
   * 测出来是「阅读 + 填表」的总和,混进了滚过十个板块的时间。
   *
   * 副产物:填了一堆字段却只用了一两秒,基本可以断定是自动化脚本。
   * 这是个不需要任何设备存储的时间戳蜜罐。
   */
  const fillMs = (): number =>
    startedAtRef.current === null ? 0 : Date.now() - startedAtRef.current;

  const trackSubmitSuccess = useCallback<QuoteFormAnalytics['trackSubmitSuccess']>(
    ({ variant, fileCount }) => {
      track(
        'form_submit',
        { variant, fileCount, fillMs: fillMs(), attempts: attemptRef.current + 1 },
        { immediate: true }
      );
      startedAtRef.current = null;
      attemptRef.current = 0;
    },
    []
  );

  const trackSubmitFail = useCallback<QuoteFormAnalytics['trackSubmitFail']>(
    ({ variant, reason, status, failedFiles }) => {
      attemptRef.current += 1;
      track('form_submit_fail', {
        variant,
        reason,
        attempts: attemptRef.current,
        ...(status === undefined ? {} : { status }),
        ...(failedFiles === undefined ? {} : { failedFiles }),
      });
    },
    []
  );

  const trackValidationBlocked = useCallback<QuoteFormAnalytics['trackValidationBlocked']>(
    (errors, variant) => {
      attemptRef.current += 1;
      track('form_submit_fail', {
        variant,
        reason: 'validation',
        attempts: attemptRef.current,
        // 只报字段名,绝不报用户填的值
        fields: Object.keys(errors).sort().join(','),
      });
    },
    []
  );

  const trackFileReject = useCallback((reason: string) => {
    // 这两条路径现在对用户是黑箱:重复文件直接静默退出,校验失败只置个错误
    track('file_reject', { reason });
  }, []);

  const trackFileUploadFail = useCallback(() => {
    track('file_upload_fail', {});
  }, []);

  // 组件卸载时如果用户填了却没提交,这次「开始填表」仍然已经上报过,
  // 漏斗上会体现为 form_start 多于 form_submit —— 那正是要看的流失
  useEffect(() => () => {
    startedAtRef.current = null;
  }, []);

  return {
    setBaseline,
    observeValues,
    trackSubmitSuccess,
    trackSubmitFail,
    trackValidationBlocked,
    trackFileReject,
    trackFileUploadFail,
  };
}

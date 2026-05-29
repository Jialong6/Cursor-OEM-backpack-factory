'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';

/**
 * Cloudflare Turnstile 人机验证组件
 *
 * 直接集成官方脚本（explicit render 模式），不引入第三方 React 封装，
 * 规避 React 19 peer 依赖风险。脚本只加载一次（模块级单例），支持
 * 同页多实例（页底 inline + 浮窗 floating 各渲染一个）。
 *
 * siteKey 缺失时渲染未配置提示并自动给上层一个 dev token
 * （仅 NODE_ENV=development 时服务端会跳过验证）。
 */

type TurnstileRenderOptions = {
  sitekey: string;
  callback: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'flexible' | 'compact';
};

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: TurnstileRenderOptions) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const DEV_SKIP_TOKEN = 'dev-skip-token';

// 模块级单例：脚本只插入一次，多个 widget 实例共享同一次加载
let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null; // 允许后续重试
      reject(new Error('Failed to load Turnstile script'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

type TurnstileWidgetProps = {
  siteKey: string;
  /** 调用方递增此值可强制 widget 重置（提交成功后清空 token） */
  resetSignal?: number;
  onVerify: (token: string) => void;
  onError?: (message: string) => void;
};

export default function TurnstileWidget({
  siteKey,
  resetSignal = 0,
  onVerify,
  onError,
}: TurnstileWidgetProps) {
  const t = useTranslations('contact.form.humanVerification');
  const isConfigured = Boolean(siteKey);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onVerifyRef = useRef(onVerify);
  const onErrorRef = useRef(onError);
  onVerifyRef.current = onVerify;
  onErrorRef.current = onError;

  // 未配置：渲染提示并自动放行（仅 dev 服务端会接受 dev-skip-token）
  useEffect(() => {
    if (!isConfigured) {
      onVerifyRef.current(DEV_SKIP_TOKEN);
    }
  }, [isConfigured, resetSignal]);

  // 加载脚本并显式渲染 widget
  useEffect(() => {
    if (!isConfigured) return;
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => onVerifyRef.current(token),
          'error-callback': () => onErrorRef.current?.('error'),
          'expired-callback': () => onVerifyRef.current(''),
          theme: 'auto',
        });
      })
      .catch(() => onErrorRef.current?.('load-failed'));

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // widget 可能已被移除，忽略
        }
        widgetIdRef.current = null;
      }
    };
  }, [isConfigured, siteKey]);

  // 提交成功后重置（resetSignal 递增），清空已用过的 token
  useEffect(() => {
    if (resetSignal > 0 && widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {
        // 忽略重置异常
      }
    }
  }, [resetSignal]);

  if (!isConfigured) {
    return (
      <div
        role="region"
        aria-label={t('label')}
        className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800"
      >
        {t('notConfigured')}
      </div>
    );
  }

  return (
    <div role="region" aria-label={t('label')}>
      <div ref={containerRef} data-testid="turnstile-container" />
    </div>
  );
}

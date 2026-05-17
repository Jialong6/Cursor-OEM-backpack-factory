'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

type MCaptchaWidgetProps = {
  instanceUrl: string;
  siteKey: string;
  /** 调用方递增此值可强制 widget 重新挂载（提交成功后清空 token） */
  resetSignal?: number;
  onVerify: (token: string) => void;
  onError?: (message: string) => void;
};

const DEV_SKIP_TOKEN = 'dev-skip-token';

/**
 * mCaptcha iframe widget
 *
 * 通过 postMessage 接收 token，严格校验 origin。
 * 当 instanceUrl/siteKey 任一缺失时，渲染未配置提示并自动给上层一个 dev token（仅 dev 环境下服务端会跳过验证）。
 */
export default function MCaptchaWidget({
  instanceUrl,
  siteKey,
  resetSignal = 0,
  onVerify,
  onError,
}: MCaptchaWidgetProps) {
  const t = useTranslations('contact.form.humanVerification');
  const isConfigured = Boolean(instanceUrl && siteKey);

  const expectedOrigin = useMemo(() => {
    if (!instanceUrl) return '';
    try {
      return new URL(instanceUrl).origin;
    } catch {
      return '';
    }
  }, [instanceUrl]);

  const widgetSrc = useMemo(() => {
    if (!isConfigured) return '';
    return `${instanceUrl.replace(/\/$/, '')}/widget/?sitekey=${encodeURIComponent(siteKey)}`;
  }, [instanceUrl, siteKey, isConfigured]);

  const [isLoading, setIsLoading] = useState(true);
  const onVerifyRef = useRef(onVerify);
  const onErrorRef = useRef(onError);
  onVerifyRef.current = onVerify;
  onErrorRef.current = onError;

  // 未配置：渲染提示并自动放行（仅 dev 服务端会接受）
  useEffect(() => {
    if (!isConfigured) {
      onVerifyRef.current(DEV_SKIP_TOKEN);
    }
  }, [isConfigured, resetSignal]);

  // 监听 postMessage，仅接受来自 mCaptcha 实例 origin 的消息
  useEffect(() => {
    if (!isConfigured || !expectedOrigin) return;

    const handler = (event: MessageEvent) => {
      if (event.origin !== expectedOrigin) return;
      const data = event.data as { token?: unknown; error?: unknown } | null;
      if (!data || typeof data !== 'object') return;

      if (typeof data.token === 'string' && data.token.length > 0) {
        onVerifyRef.current(data.token);
        return;
      }
      if (typeof data.error === 'string') {
        onErrorRef.current?.(data.error);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [isConfigured, expectedOrigin]);

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
    <div role="region" aria-label={t('label')} className="relative">
      {isLoading && (
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500"
        >
          {t('placeholder')}
        </div>
      )}
      <iframe
        key={resetSignal}
        src={widgetSrc}
        title="mCaptcha Human Verification"
        sandbox="allow-scripts allow-same-origin allow-forms"
        onLoad={() => setIsLoading(false)}
        className="w-full h-20 border border-gray-300 rounded-lg bg-white"
      />
    </div>
  );
}

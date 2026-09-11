'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import type { ConsentDecision } from '@/lib/consent-storage';

/**
 * Cookie 同意条
 *
 * 只对 EEA / 英国 / 瑞士的访客出现。对美国、中东、东南亚这些不要求同意的
 * 市场弹条,只会白白损失询盘转化,所以地区判定在 AnalyticsGate 里完成,
 * 本组件只负责呈现。
 *
 * z-[60] 高于站内其余所有浮层(现有最高是 z-50 的语言横幅与浮窗表单):
 * 同一时刻只让访客做一个决定,选完之后其余浮层自然露出。
 */

interface ConsentBannerProps {
  onDecide: (decision: ConsentDecision) => void;
}

export default function ConsentBanner({ onDecide }: ConsentBannerProps) {
  const t = useTranslations('consent');
  const locale = useLocale();

  return (
    <div
      role="dialog"
      aria-label={t('label')}
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-[60] border-t border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur-sm"
    >
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-center text-sm text-gray-700 sm:text-left">
          {t('message')}{' '}
          <Link
            href={`/${locale}/privacy`}
            className="font-medium text-primary underline underline-offset-2 hover:no-underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {t('privacyLink')}
          </Link>
        </p>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => onDecide('denied')}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            {t('decline')}
          </button>

          <button
            type="button"
            onClick={() => onDecide('granted')}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {t('accept')}
          </button>
        </div>
      </div>
    </div>
  );
}

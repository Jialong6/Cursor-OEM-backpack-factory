'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { parseGeoCountry, shouldLoadThirdParty } from '@/lib/analytics-config';
import { requiresConsent } from '@/lib/consent-regions';
import { pushConsentSignals } from '@/lib/consent-signals';
import { clearConsent, readConsent, type ConsentState } from '@/lib/consent-storage';

/**
 * 隐私政策页上的「更改我的选择」入口
 *
 * 撤回同意必须和给出同意一样容易,这是 GDPR 的明文要求。这里独立于
 * AnalyticsGate 自己读状态:两者不共享 context,清除后直接整页重载,
 * 门禁会重新探测并弹出同意条。
 *
 * 不受管制的地区(以及中国大陆)看到的是一句说明而不是按钮 —— 那里
 * 本来就没有需要撤回的东西。
 */

interface ConsentChoiceState {
  ready: boolean;
  country: string;
  consent: ConsentState;
}

export default function ConsentResetButton() {
  const t = useTranslations('privacy');
  const [state, setState] = useState<ConsentChoiceState>({
    ready: false,
    country: '',
    consent: 'unset',
  });

  useEffect(() => {
    setState({
      ready: true,
      country: parseGeoCountry(document.cookie),
      consent: readConsent(),
    });
  }, []);

  const handleReset = useCallback(() => {
    clearConsent();
    pushConsentSignals(window, false);
    window.location.reload();
  }, []);

  if (!state.ready) {
    return null;
  }

  const applicable =
    shouldLoadThirdParty(state.country) && requiresConsent(state.country);

  if (!applicable) {
    return <p className="text-gray-700">{t('choiceUnavailable')}</p>;
  }

  const stateLabel =
    state.consent === 'granted'
      ? t('choiceGranted')
      : state.consent === 'denied'
        ? t('choiceDenied')
        : t('choiceUnset');

  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-gray-700">{t('choiceCurrent', { state: stateLabel })}</p>
      <button
        type="button"
        onClick={handleReset}
        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        {t('choiceReset')}
      </button>
    </div>
  );
}

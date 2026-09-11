'use client';

import { useCallback, useEffect, useState } from 'react';
import GoogleAnalytics from './GoogleAnalytics';
import ClarityScript from './ClarityScript';
import ConsentBanner from './ConsentBanner';
import {
  getClarityProjectId,
  getGaMeasurementId,
  parseGeoCountry,
  shouldLoadThirdParty,
} from '@/lib/analytics-config';
import { requiresConsent } from '@/lib/consent-regions';
import { pushConsentSignals } from '@/lib/consent-signals';
import {
  readConsent,
  writeConsent,
  type ConsentDecision,
  type ConsentState,
} from '@/lib/consent-storage';

/**
 * 第三方分析的两条地区门禁
 *
 * 门禁一(中国):CN 访客一律不加载。googletagmanager.com 被墙,clarity.ms
 *   同样不可靠。中文买家的行为数据由第二期的同源自建埋点覆盖。
 * 门禁二(EEA/英国/瑞士):脚本照常加载但默认拒绝,访客点同意后再 update。
 *   这是 Google 与微软官方的同意模式,能保住默认拒绝期间的匿名建模数据。
 *
 * 国家码来自中间件写入的 geo_cc cookie,同步读取、零额外请求,也不必让
 * app/[locale]/layout.tsx 调用 headers() 而丢掉 12 个 locale 的静态生成。
 *
 * 首帧一律不渲染任何脚本:cookie 与 localStorage 只在客户端存在,等挂载后
 * 再决定,避免服务端与客户端渲染结果不一致。
 */

interface GateState {
  /** 是否已完成客户端探测 */
  ready: boolean;
  /** 访客所在国家,空串表示未知 */
  country: string;
  /** 本次会话开始时读到的选择,决定内联脚本里的默认值 */
  initial: ConsentState;
  /** 当前选择,访客点击后更新 */
  current: ConsentState;
}

const INITIAL_STATE: GateState = {
  ready: false,
  country: '',
  initial: 'unset',
  current: 'unset',
};

export default function AnalyticsGate() {
  const [state, setState] = useState<GateState>(INITIAL_STATE);

  useEffect(() => {
    const country = parseGeoCountry(document.cookie);
    const stored = readConsent();

    setState({ ready: true, country, initial: stored, current: stored });
  }, []);

  const decide = useCallback((decision: ConsentDecision) => {
    writeConsent(decision);
    setState((previous) => ({ ...previous, current: decision }));
    pushConsentSignals(window, decision === 'granted');
  }, []);

  if (!state.ready) {
    return null;
  }

  if (!shouldLoadThirdParty(state.country)) {
    return null;
  }

  const measurementId = getGaMeasurementId();
  const projectId = getClarityProjectId();

  if (!measurementId && !projectId) {
    return null;
  }

  const consentRequired = requiresConsent(state.country);
  // 不受管制的地区默认视为已同意;受管制地区以本次会话开始时读到的选择为准,
  // 之后的变化通过 pushConsentSignals 推送 update,内联脚本不会重跑。
  const defaultGranted = !consentRequired || state.initial === 'granted';
  const showBanner = consentRequired && state.current === 'unset';

  return (
    <>
      <GoogleAnalytics
        measurementId={measurementId}
        defaultGranted={defaultGranted}
      />
      <ClarityScript projectId={projectId} defaultGranted={defaultGranted} />
      {showBanner ? <ConsentBanner onDecide={decide} /> : null}
    </>
  );
}

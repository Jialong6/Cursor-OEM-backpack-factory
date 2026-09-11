'use client';

import Script from 'next/script';

/**
 * Google Analytics 4,带 Consent Mode v2
 *
 * 加载顺序很关键:内联的 consent default 必须先于 gtag.js 把队列处理掉,
 * 否则「默认拒绝」等于没设。这里把内联脚本排在远程库之前,并让它自己建好
 * dataLayer 与 gtag 垫片,不依赖远程库的到达时机。
 *
 * 三个广告类信号恒为 denied:本站不投广告、不做再营销,这样隐私政策里
 * 「不会把你的数据用于广告」在技术上成立。
 *
 * 中国大陆访客不会渲染本组件(googletagmanager.com 被墙),由
 * AnalyticsGate 拦在上游。
 */

interface GoogleAnalyticsProps {
  /** G- 开头的 Measurement ID,空串表示未配置 */
  measurementId: string;
  /** 首屏默认是否放行分析存储。受管制地区为 false,等访客点同意后再 update */
  defaultGranted: boolean;
}

export default function GoogleAnalytics({
  measurementId,
  defaultGranted,
}: GoogleAnalyticsProps) {
  if (!measurementId) {
    return null;
  }

  const analyticsStorage = defaultGranted ? 'granted' : 'denied';

  return (
    <>
      <Script id="ga-consent-default" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){window.dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: '${analyticsStorage}',
  wait_for_update: 500
});
gtag('js', new Date());
gtag('config', '${measurementId}');`}
      </Script>
      <Script
        id="ga-base"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
    </>
  );
}

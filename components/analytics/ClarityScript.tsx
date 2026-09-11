'use client';

import Script from 'next/script';

/**
 * Microsoft Clarity,带 Consent API
 *
 * Clarity 补的是别处拿不到的那一块:滚动深度热力图、点击热力图、会话录像,
 * 也就是「哪些内容被看了多久、在哪里卡住」的直接证据。
 *
 * 微软自 2025-10-31 起对 EEA/英国/瑞士强制要求同意信号 —— 不发信号并不能
 * 换来数据,微软会在自己那侧停止采集。因此这里在 snippet 之后立刻表态,
 * 拿到同意再由 AnalyticsGate 推送 update。
 *
 * 脚本被墙或被拦截时,clarity 垫片只会把调用堆在队列里,不抛异常、不影响
 * 页面 —— 这一点与 TurnstileWidget 不同,那里必须靠超时兜底是因为验证码
 * 拿不到 token 就无法提交表单,而分析脚本缺席对访客毫无影响。
 */

interface ClarityScriptProps {
  /** Clarity 项目 ID,空串表示未配置 */
  projectId: string;
  /** 首屏默认是否已获得同意 */
  defaultGranted: boolean;
}

export default function ClarityScript({
  projectId,
  defaultGranted,
}: ClarityScriptProps) {
  if (!projectId) {
    return null;
  }

  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${projectId}");
window.clarity('consent', ${defaultGranted});`}
    </Script>
  );
}

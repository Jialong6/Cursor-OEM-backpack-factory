import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import AnalyticsGate from './AnalyticsGate';

/**
 * 全站分析脚本的唯一挂载点
 *
 * 分成两类,门禁待遇不同:
 * - Vercel Analytics 与 Speed Insights 不写 cookie、走首方 /_vercel/insights
 *   端点,不受防火墙影响也不触发同意义务,因此无条件加载。它们负责流量、
 *   来源、国家、设备,以及真实用户的 Core Web Vitals。
 * - GA4 与 Clarity 会写 cookie 且依赖被墙的域名,交由 AnalyticsGate 按地区
 *   决定加载与同意。
 *
 * 挂在 app/[locale]/layout.tsx 里 —— 那是全站唯一渲染 html/body 的根布局。
 */
export default function AnalyticsScripts() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
      <AnalyticsGate />
    </>
  );
}

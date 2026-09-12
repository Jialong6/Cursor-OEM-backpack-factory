import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import AnalyticsGate from './AnalyticsGate';
import InsightTracker from './InsightTracker';

/**
 * 全站分析脚本的唯一挂载点
 *
 * 分成两类,门禁待遇不同:
 * - Vercel Analytics 与 Speed Insights 不写 cookie、走首方 /_vercel/insights
 *   端点,不受防火墙影响也不触发同意义务,因此无条件加载。它们负责流量、
 *   来源、国家、设备,以及真实用户的 Core Web Vitals。
 * - GA4 与 Clarity 会写 cookie 且依赖被墙的域名,交由 AnalyticsGate 按地区
 *   决定加载与同意。
 * - InsightTracker 是自建的首方埋点:同源上报、客户端零设备存储(不碰
 *   cookie / localStorage / sessionStorage),因此同样无条件加载。它补的是
 *   前两者够不着的那块 —— 中文与缅甸买家的行为,以及每个板块被看了多久。
 *
 * 挂在 app/[locale]/layout.tsx 里 —— 那是全站唯一渲染 html/body 的根布局。
 */
export default function AnalyticsScripts() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
      <AnalyticsGate />
      <InsightTracker />
    </>
  );
}

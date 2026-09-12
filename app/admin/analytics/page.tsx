import type { Metadata } from 'next';
import {
  BarList,
  Funnel,
  MetricCard,
  Panel,
  SectionDwellList,
  SessionTable,
  toBarRows,
} from '@/components/admin/AdminPanels';
import { isAnalyticsDbConfigured } from '@/lib/analytics/db';
import { formatCount, formatDuration } from '@/lib/analytics/format';
import {
  fetchConversionEvents,
  fetchDevices,
  fetchFunnel,
  fetchLocales,
  fetchOverview,
  fetchRecentSessions,
  fetchScrollDepth,
  fetchSectionDwell,
  fetchTopCountries,
  fetchTopPaths,
  fetchTopReferrers,
} from '@/lib/analytics/queries';

/**
 * 访客行为看板(/admin/analytics)
 *
 * 鉴权在 middleware 顶部用 HTTP Basic 做掉了,这个页面本身只管查与渲染。
 *
 * 刻意放在 [locale] 之外:它不翻译、不进 sitemap、不该被任何人搜到。
 * lib/headers.ts 给 /admin 加了 noindex,app/robots.ts 也 Disallow 了。
 *
 * 服务端组件直查 Neon,不加图表库 —— 一个自用页面,表格加 CSS 宽度条够读。
 */

export const metadata: Metadata = {
  title: 'Analytics',
  robots: { index: false, follow: false },
};

// 每次打开都要看最新数据,不缓存
export const dynamic = 'force-dynamic';

const WINDOW_DAYS = 7;

function NotConfigured() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-neutral-900">Analytics</h1>
      <p className="mt-4 text-sm text-neutral-600">
        DATABASE_URL is not set, so there is nothing to query yet. Connect the Neon
        database in the Vercel project, then run{' '}
        <code className="rounded bg-neutral-100 px-1">npm run analytics:migrate</code>.
      </p>
    </main>
  );
}

export default async function AdminAnalyticsPage() {
  if (!isAnalyticsDbConfigured()) {
    return <NotConfigured />;
  }

  const [
    overview,
    sections,
    funnel,
    scrollDepth,
    conversions,
    countries,
    referrers,
    paths,
    devices,
    locales,
    sessions,
  ] = await Promise.all([
    fetchOverview(WINDOW_DAYS),
    fetchSectionDwell(WINDOW_DAYS),
    fetchFunnel(WINDOW_DAYS),
    fetchScrollDepth(WINDOW_DAYS),
    fetchConversionEvents(WINDOW_DAYS),
    fetchTopCountries(WINDOW_DAYS),
    fetchTopReferrers(WINDOW_DAYS),
    fetchTopPaths(WINDOW_DAYS),
    fetchDevices(WINDOW_DAYS),
    fetchLocales(WINDOW_DAYS),
    fetchRecentSessions(WINDOW_DAYS),
  ]);

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-neutral-900">Analytics</h1>
          <p className="mt-1 text-sm text-neutral-500">
            First-party data, last {WINDOW_DAYS} days. Visitors are identified by an
            irreversible daily fingerprint, so the same person cannot be followed across
            days.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard label="Visitors" value={formatCount(overview.visitors)} />
          <MetricCard label="Page views" value={formatCount(overview.pageViews)} />
          <MetricCard
            label="Average dwell"
            value={formatDuration(overview.avgDwellMs)}
            hint="Time actually spent looking, idle time excluded"
          />
          <MetricCard
            label="Shallow visits"
            value={`${overview.shallowPct}%`}
            hint="Saw one section or fewer"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel
            title="Time spent per section"
            description="Average across visits that saw the section. This answers which content actually gets read."
          >
            <SectionDwellList rows={sections} />
          </Panel>

          <Panel
            title="Enquiry funnel"
            description="Every step is measured against the same set of page views."
          >
            <Funnel rows={funnel} />
          </Panel>

          <Panel title="Scroll depth" description="Visits that reached each milestone.">
            <BarList rows={toBarRows(scrollDepth)} />
          </Panel>

          <Panel title="Conversion events">
            <BarList rows={toBarRows(conversions)} />
          </Panel>

          <Panel title="Countries">
            <BarList rows={toBarRows(countries)} />
          </Panel>

          <Panel title="Referrers">
            <BarList rows={toBarRows(referrers)} />
          </Panel>

          <Panel title="Pages">
            <BarList rows={toBarRows(paths)} />
          </Panel>

          <Panel title="Devices and languages">
            <div className="space-y-5">
              <BarList rows={toBarRows(devices)} />
              <BarList rows={toBarRows(locales)} />
            </div>
          </Panel>
        </div>

        <Panel
          title="Recent visits"
          description="No column here can point back to a specific person."
        >
          <SessionTable rows={sessions} />
        </Panel>
      </div>
    </main>
  );
}

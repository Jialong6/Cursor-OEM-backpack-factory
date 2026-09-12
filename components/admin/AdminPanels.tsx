import {
  barWidthPct,
  conversionPct,
  formatCount,
  formatDuration,
} from '@/lib/analytics/format';
import type { CountRow, FunnelRow, SectionDwellRow, SessionRow } from '@/lib/analytics/queries';

/**
 * 看板的展示组件
 *
 * 全部是服务端组件,零客户端 JS,也刻意不引图表库:
 * 一个自用的内部页面,server 渲染的表格加 CSS 宽度条已经够读,
 * 而少一个几百 KB 的依赖就少一份维护。
 *
 * /admin 不在 [locale] 下,所以这里的文案不走 i18n —— 只有一个人看。
 */

export function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-neutral-900">{value}</div>
      {hint ? <div className="mt-1 text-xs text-neutral-500">{hint}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
      {description ? (
        <p className="mt-1 text-xs text-neutral-500">{description}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-neutral-500">{children}</p>;
}

/** 通用的条形排行 */
export function BarList({
  rows,
  formatValue = formatCount,
}: {
  rows: readonly { label: string; value: number }[];
  formatValue?: (value: number) => string;
}) {
  if (rows.length === 0) {
    return <EmptyHint>No data yet.</EmptyHint>;
  }

  const max = Math.max(...rows.map((row) => row.value));

  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="truncate text-neutral-700">{row.label}</span>
            <span className="shrink-0 tabular-nums text-neutral-900">
              {formatValue(row.value)}
            </span>
          </div>
          <div className="mt-1 h-1.5 rounded bg-neutral-100">
            <div
              className="h-1.5 rounded bg-primary"
              style={{ width: `${barWidthPct(row.value, max)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** 板块停留时长排行:本期最主要的那个问题 */
export function SectionDwellList({ rows }: { rows: readonly SectionDwellRow[] }) {
  if (rows.length === 0) {
    return <EmptyHint>No section dwell recorded yet.</EmptyHint>;
  }

  const max = Math.max(...rows.map((row) => row.avgMs));

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.sectionId}>
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="truncate font-medium text-neutral-800">{row.sectionId}</span>
            <span className="shrink-0 tabular-nums text-neutral-900">
              {formatDuration(row.avgMs)}
              <span className="ml-2 text-xs text-neutral-500">
                {formatCount(row.views)} views
              </span>
            </span>
          </div>
          <div className="mt-1 h-1.5 rounded bg-neutral-100">
            <div
              className="h-1.5 rounded bg-primary"
              style={{ width: `${barWidthPct(row.avgMs, max)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

const FUNNEL_LABELS: Record<string, string> = {
  visited: 'Visited a page',
  reachedContact: 'Scrolled to the contact section',
  formStarted: 'Started filling the form',
  submitted: 'Submitted an enquiry',
};

export function Funnel({ rows }: { rows: readonly FunnelRow[] }) {
  const top = rows[0]?.count ?? 0;

  if (top === 0) {
    return <EmptyHint>No visits recorded in this window.</EmptyHint>;
  }

  return (
    <ol className="space-y-3">
      {rows.map((row, index) => {
        const previous = index === 0 ? row.count : rows[index - 1].count;

        return (
          <li key={row.step}>
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <span className="text-neutral-700">{FUNNEL_LABELS[row.step] ?? row.step}</span>
              <span className="shrink-0 tabular-nums text-neutral-900">
                {formatCount(row.count)}
                {index > 0 ? (
                  <span className="ml-2 text-xs text-neutral-500">
                    {conversionPct(row.count, previous)}% of previous
                  </span>
                ) : null}
              </span>
            </div>
            <div className="mt-1 h-2 rounded bg-neutral-100">
              <div
                className="h-2 rounded bg-primary"
                style={{ width: `${barWidthPct(row.count, top)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * 最近访问明细
 *
 * 这张表就是「哪些访客、什么设备打开了网页」的合规等价物:
 * 有国家、城市、设备、看了哪些板块多久,但没有任何一列能指回具体的人。
 */
export function SessionTable({ rows }: { rows: readonly SessionRow[] }) {
  if (rows.length === 0) {
    return <EmptyHint>No sessions recorded yet.</EmptyHint>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="py-2 pr-4 font-medium">When</th>
            <th className="py-2 pr-4 font-medium">Page</th>
            <th className="py-2 pr-4 font-medium">Where</th>
            <th className="py-2 pr-4 font-medium">Device</th>
            <th className="py-2 pr-4 font-medium">Dwell</th>
            <th className="py-2 pr-4 font-medium">Sections</th>
            <th className="py-2 font-medium">Events</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.map((row) => (
            <tr key={row.pageViewId}>
              <td className="py-2 pr-4 tabular-nums text-neutral-500">
                {new Date(row.lastSeenAt).toISOString().slice(5, 16).replace('T', ' ')}
              </td>
              <td className="py-2 pr-4 text-neutral-800">{row.path}</td>
              <td className="py-2 pr-4 text-neutral-600">
                {[row.country, row.city].filter(Boolean).join(' / ') || '-'}
              </td>
              <td className="py-2 pr-4 text-neutral-600">
                {row.deviceType} / {row.browser}
              </td>
              <td className="py-2 pr-4 tabular-nums text-neutral-900">
                {formatDuration(row.dwellMs)}
              </td>
              <td className="py-2 pr-4 tabular-nums text-neutral-600">{row.sections}</td>
              <td className="py-2 tabular-nums text-neutral-600">{row.events}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function toBarRows(rows: readonly CountRow[]): readonly { label: string; value: number }[] {
  return rows.map((row) => ({ label: row.label, value: row.count }));
}

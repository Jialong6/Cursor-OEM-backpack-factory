import { formatCount, formatDuration, conversionPct, deltaPct } from './analytics/format';
import type { CountRow, FunnelRow, Overview, SectionDwellRow } from './analytics/queries';

/**
 * 每周分析报告的邮件模板(纯函数,无副作用)
 *
 * 视觉参数照抄 lib/email-template.ts:深色标题条、640px 卡片、同一套灰阶。
 * escapeHtml 也是各自带一份 —— 站内两个既有模板就是这么做的,这里保持一致,
 * 不为了省十行而新造一个公共模块。
 */

const BRAND = 'Better Bags Myanmar';

const ESCAPE_MAP: Readonly<Record<string, string>> = Object.freeze({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
});

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPE_MAP[char] ?? char);
}

export interface WeeklyReportData {
  readonly current: Overview;
  readonly previous: Overview;
  readonly sections: readonly SectionDwellRow[];
  readonly funnel: readonly FunnelRow[];
  readonly countries: readonly CountRow[];
  readonly windowDays: number;
  readonly dashboardUrl: string;
}

/** 把环比变化渲染成一小段带方向的文字 */
function renderDelta(current: number, previous: number): string {
  const delta = deltaPct(current, previous);

  if (delta === null) {
    return '<span style="color:#9ca3af;">no prior week</span>';
  }

  const color = delta >= 0 ? '#15803d' : '#b91c1c';
  const sign = delta >= 0 ? '+' : '';

  return `<span style="color:${color};">${sign}${delta}%</span>`;
}

function renderMetricRow(label: string, value: string, delta: string): string {
  return `
    <tr>
      <td style="padding:8px 12px;font-weight:600;color:#374151;background:#f9fafb;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:8px 12px;color:#111827;">${value}</td>
      <td style="padding:8px 12px;color:#111827;text-align:right;">${delta}</td>
    </tr>`;
}

function renderSections(sections: readonly SectionDwellRow[]): string {
  if (sections.length === 0) {
    return '<p style="color:#9ca3af;margin:0;">No section dwell recorded.</p>';
  }

  const rows = sections
    .slice(0, 8)
    .map(
      (section) => `
      <tr>
        <td style="padding:6px 12px;color:#374151;">${escapeHtml(section.sectionId)}</td>
        <td style="padding:6px 12px;color:#111827;text-align:right;white-space:nowrap;">${escapeHtml(formatDuration(section.avgMs))}</td>
        <td style="padding:6px 12px;color:#9ca3af;text-align:right;white-space:nowrap;">${escapeHtml(formatCount(section.views))} views</td>
      </tr>`
    )
    .join('');

  return `<table style="width:100%;border-collapse:collapse;">${rows}</table>`;
}

const FUNNEL_LABELS: Readonly<Record<string, string>> = Object.freeze({
  visited: 'Visited a page',
  reachedContact: 'Scrolled to contact',
  formStarted: 'Started the form',
  submitted: 'Submitted an enquiry',
});

function renderFunnel(funnel: readonly FunnelRow[]): string {
  const rows = funnel
    .map((step, index) => {
      const previous = index === 0 ? step.count : funnel[index - 1].count;
      const rate =
        index === 0 ? '' : `${conversionPct(step.count, previous)}% of previous`;

      return `
      <tr>
        <td style="padding:6px 12px;color:#374151;">${escapeHtml(FUNNEL_LABELS[step.step] ?? step.step)}</td>
        <td style="padding:6px 12px;color:#111827;text-align:right;white-space:nowrap;">${escapeHtml(formatCount(step.count))}</td>
        <td style="padding:6px 12px;color:#9ca3af;text-align:right;white-space:nowrap;">${escapeHtml(rate)}</td>
      </tr>`;
    })
    .join('');

  return `<table style="width:100%;border-collapse:collapse;">${rows}</table>`;
}

function renderCountries(countries: readonly CountRow[]): string {
  if (countries.length === 0) {
    return '<p style="color:#9ca3af;margin:0;">No visits recorded.</p>';
  }

  return countries
    .slice(0, 6)
    .map(
      (country) =>
        `${escapeHtml(country.label)} <span style="color:#9ca3af;">${escapeHtml(formatCount(country.count))}</span>`
    )
    .join(' &middot; ');
}

function section(title: string, body: string): string {
  return `
    <h2 style="margin:24px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;">${escapeHtml(title)}</h2>
    ${body}`;
}

export function buildWeeklyReportSubject(data: WeeklyReportData): string {
  return `${BRAND} analytics: ${formatCount(data.current.visitors)} visitors, ${formatCount(
    data.funnel.find((step) => step.step === 'submitted')?.count ?? 0
  )} enquiries`;
}

export function buildWeeklyReportHtml(data: WeeklyReportData): string {
  const submitted = data.funnel.find((step) => step.step === 'submitted')?.count ?? 0;

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:24px;background:#f3f4f6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="padding:20px 24px;background:#111827;color:#ffffff;font-size:18px;font-weight:700;">
        Website analytics &middot; last ${data.windowDays} days
      </div>
      <div style="padding:24px;color:#111827;font-size:15px;line-height:1.6;">
        ${section(
          'Overview',
          `<table style="width:100%;border-collapse:collapse;">
            ${renderMetricRow('Visitors', escapeHtml(formatCount(data.current.visitors)), renderDelta(data.current.visitors, data.previous.visitors))}
            ${renderMetricRow('Page views', escapeHtml(formatCount(data.current.pageViews)), renderDelta(data.current.pageViews, data.previous.pageViews))}
            ${renderMetricRow('Average dwell', escapeHtml(formatDuration(data.current.avgDwellMs)), renderDelta(data.current.avgDwellMs, data.previous.avgDwellMs))}
            ${renderMetricRow('Enquiries', escapeHtml(formatCount(submitted)), '')}
          </table>`
        )}
        ${section('Time spent per section', renderSections(data.sections))}
        ${section('Enquiry funnel', renderFunnel(data.funnel))}
        ${section('Where visitors came from', `<p style="margin:0;">${renderCountries(data.countries)}</p>`)}
        <p style="margin:28px 0 0;">
          <a href="${escapeHtml(data.dashboardUrl)}" style="color:#111827;font-weight:600;">Open the dashboard</a>
        </p>
      </div>
      <div style="padding:14px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;">
        Visitors are counted by an irreversible daily fingerprint. Raw records are deleted after 180 days.
      </div>
    </div>
  </body>
</html>`;
}

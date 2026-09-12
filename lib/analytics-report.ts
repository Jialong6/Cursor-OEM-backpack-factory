import { Resend } from 'resend';
import {
  buildWeeklyReportHtml,
  buildWeeklyReportSubject,
  type WeeklyReportData,
} from './analytics-report-template';
import { BASE_URL } from './metadata';
import {
  fetchFunnel,
  fetchOverview,
  fetchSectionDwell,
  fetchTopCountries,
  type Overview,
} from './analytics/queries';

/**
 * 每周分析报告的组装与投递
 *
 * 形状照 lib/email.ts:每次调用内部 new Resend、缺 key 就软跳过、
 * 从不 throw,把「是不是致命」的判断留给路由层。
 */

const DEFAULT_REPORT_FROM = 'no-reply@betterbagsmm.com';
const DEFAULT_REPORT_TO = 'jay@betterbagsmm.com';

export interface SendReportResult {
  readonly success: boolean;
  /** true 表示因未配置 key 而跳过发送(非错误) */
  readonly skipped?: boolean;
  readonly error?: string;
}

/** 上一期的数据:用两倍窗口减去本期,省一轮查询 */
function derivePrevious(current: Overview, doubled: Overview): Overview {
  const pageViews = Math.max(0, doubled.pageViews - current.pageViews);

  return {
    visitors: Math.max(0, doubled.visitors - current.visitors),
    pageViews,
    // 平均值不能相减。用两期总量反推上一期的均值
    avgDwellMs:
      pageViews === 0
        ? 0
        : Math.max(
            0,
            Math.round(
              (doubled.avgDwellMs * doubled.pageViews -
                current.avgDwellMs * current.pageViews) /
                pageViews
            )
          ),
    shallowPct: doubled.shallowPct,
  };
}

export async function collectWeeklyReport(windowDays: number): Promise<WeeklyReportData> {
  const [current, doubled, sections, funnel, countries] = await Promise.all([
    fetchOverview(windowDays),
    fetchOverview(windowDays * 2),
    fetchSectionDwell(windowDays),
    fetchFunnel(windowDays),
    fetchTopCountries(windowDays),
  ]);

  return {
    current,
    previous: derivePrevious(current, doubled),
    sections,
    funnel,
    countries,
    windowDays,
    dashboardUrl: `${BASE_URL}/admin/analytics`,
  };
}

export async function sendWeeklyReport(
  data: WeeklyReportData
): Promise<SendReportResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return { success: true, skipped: true };
  }

  const to = process.env.ANALYTICS_REPORT_TO || process.env.CONTACT_EMAIL_TO || DEFAULT_REPORT_TO;
  const from = process.env.CONTACT_ACK_FROM || DEFAULT_REPORT_FROM;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      subject: buildWeeklyReportSubject(data),
      html: buildWeeklyReportHtml(data),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown email error';
    return { success: false, error: message };
  }
}

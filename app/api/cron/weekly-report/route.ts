import { NextResponse, type NextRequest } from 'next/server';
import { isAnalyticsDbConfigured } from '@/lib/analytics/db';
import { collectWeeklyReport, sendWeeklyReport } from '@/lib/analytics-report';
import { authorizeCron } from '@/lib/cron-auth';

/**
 * 每周分析报告(Vercel Cron 调用)
 *
 * 排期在 vercel.json。时区恒为 UTC —— 缅甸是 UTC+6:30,排期时要换算。
 *
 * Vercel 的定时投递是尽力而为,可能漏投也可能重投。这个端点按「最近 7 天」
 * 取数,所以重投只是把同一封信再发一次,数字不会算错;漏投则下周补上,
 * 因为窗口是滚动的,不存在「某一周永远丢了」。
 */

export const runtime = 'nodejs';

const WINDOW_DAYS = 7;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = authorizeCron(
    request.headers.get('authorization'),
    process.env.CRON_SECRET
  );

  if (!auth.authorized) {
    console.warn(`[cron] weekly-report rejected: ${auth.reason}`);
    return NextResponse.json({ success: false }, { status: 401 });
  }

  if (!isAnalyticsDbConfigured()) {
    return NextResponse.json({ success: true, skipped: 'no_database' });
  }

  try {
    const data = await collectWeeklyReport(WINDOW_DAYS);
    const result = await sendWeeklyReport(data);

    if (!result.success) {
      console.error('[cron] weekly-report send failed:', result.error);
      return NextResponse.json({ success: false }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      skipped: result.skipped ? 'no_resend_key' : undefined,
      visitors: data.current.visitors,
    });
  } catch (error) {
    console.error('[cron] weekly-report failed:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

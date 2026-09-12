import { NextResponse, type NextRequest } from 'next/server';
import { isAnalyticsDbConfigured } from '@/lib/analytics/db';
import { pruneOlderThan } from '@/lib/analytics/queries';
import { authorizeCron } from '@/lib/cron-auth';

/**
 * 保留期清理(Vercel Cron 调用)
 *
 * 180 天是对访客的公开承诺:12 个语言版的隐私政策里写着「分析记录 180 天后
 * 删除」。改这个数字要连带改那 12 份文案。
 *
 * 也是容量的保证:Neon 免费档只有 0.5 GB,没有这个任务迟早写满。
 *
 * 删除天然幂等,所以 Vercel 那边的重投不会有任何副作用。
 */

export const runtime = 'nodejs';

/** 与隐私政策里写给访客的天数保持一致 */
export const RETENTION_DAYS = 180;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = authorizeCron(
    request.headers.get('authorization'),
    process.env.CRON_SECRET
  );

  if (!auth.authorized) {
    console.warn(`[cron] prune rejected: ${auth.reason}`);
    return NextResponse.json({ success: false }, { status: 401 });
  }

  if (!isAnalyticsDbConfigured()) {
    return NextResponse.json({ success: true, skipped: 'no_database' });
  }

  try {
    const deleted = await pruneOlderThan(RETENTION_DAYS);

    // 生产环境会移除 console.log,用 warn 才看得见这条例行记录
    console.warn('[cron] prune deleted:', JSON.stringify(deleted));

    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    console.error('[cron] prune failed:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

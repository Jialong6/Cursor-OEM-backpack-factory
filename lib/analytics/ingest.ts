import { getDb } from './db';
import type { InsightEnvelope } from './events';
import type { InsightRequestContext } from './request-context';

/**
 * 把一个信封写进库
 *
 * ⚠️ 必须压成一条语句。Neon 的 HTTP 驱动是「一次调用一个网络往返」,
 * 而一个信封可能同时含一行 page_views、十几行 events 和几十行 section_dwell。
 * 逐条 INSERT 会变成几十个往返 —— 这是本期最容易写成性能灾难的地方。
 *
 * 幂等靠 ingested_batches 的认领:第一个 CTE 先用 (page_view_id, seq) 抢坑,
 * 后面每个 CTE 都带 WHERE EXISTS (SELECT 1 FROM claim)。抢不到就整批跳过,
 * 重放同一个请求不会重复计数。
 *
 * 明文 IP 到此为止:它只被用来即刻派生 visitorHash,从不作为参数出现在
 * 这条语句里。
 */

const INGEST_SQL = `
WITH claim AS (
  INSERT INTO ingested_batches (page_view_id, seq)
  VALUES ($1, $2)
  ON CONFLICT DO NOTHING
  RETURNING page_view_id
),
pv AS (
  INSERT INTO page_views (
    id, visitor_hash, path, locale, referrer_host,
    utm_source, utm_medium, utm_campaign,
    device_type, browser, os, viewport_w, viewport_h,
    country, region, city, timezone, last_seq
  )
  SELECT $1, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $2
  WHERE EXISTS (SELECT 1 FROM claim)
  ON CONFLICT (id) DO UPDATE SET
    last_seen_at = now(),
    last_seq = GREATEST(page_views.last_seq, EXCLUDED.last_seq),
    -- referrer 与 utm 只随首批发。后续批次是空串,不能拿空串覆盖掉已有的值
    referrer_host = CASE WHEN EXCLUDED.referrer_host <> '' THEN EXCLUDED.referrer_host ELSE page_views.referrer_host END,
    utm_source    = CASE WHEN EXCLUDED.utm_source    <> '' THEN EXCLUDED.utm_source    ELSE page_views.utm_source END,
    utm_medium    = CASE WHEN EXCLUDED.utm_medium    <> '' THEN EXCLUDED.utm_medium    ELSE page_views.utm_medium END,
    utm_campaign  = CASE WHEN EXCLUDED.utm_campaign  <> '' THEN EXCLUDED.utm_campaign  ELSE page_views.utm_campaign END
),
ev AS (
  INSERT INTO events (page_view_id, visitor_hash, name, path, locale, ts_ms, props)
  SELECT $1, $3, e.name, $4, $5, e.ts_ms, e.props
  FROM jsonb_to_recordset($19::jsonb) AS e(name text, ts_ms integer, props jsonb)
  WHERE EXISTS (SELECT 1 FROM claim)
)
INSERT INTO section_dwell (page_view_id, section_id, dwell_ms, enter_count, max_coverage)
SELECT $1, d.section_id, d.dwell_ms, d.enter_count, d.max_coverage
FROM jsonb_to_recordset($20::jsonb) AS d(section_id text, dwell_ms integer, enter_count integer, max_coverage real)
WHERE EXISTS (SELECT 1 FROM claim)
ON CONFLICT (page_view_id, section_id) DO UPDATE SET
  dwell_ms     = section_dwell.dwell_ms + EXCLUDED.dwell_ms,
  enter_count  = section_dwell.enter_count + EXCLUDED.enter_count,
  max_coverage = GREATEST(section_dwell.max_coverage, EXCLUDED.max_coverage),
  updated_at   = now()
`;

/** referrer 只留主机名。完整 URL 常常带着别人站内的查询参数 */
export function referrerHost(referrer: string | undefined): string {
  if (!referrer) {
    return '';
  }

  try {
    return new URL(referrer).host;
  } catch {
    return '';
  }
}

/** 上报里的字符串统一截断,防止有人构造超长字段撑爆行 */
function clamp(value: string | undefined, max: number): string {
  return (value ?? '').slice(0, max);
}

export interface IngestParams {
  readonly envelope: InsightEnvelope;
  readonly context: InsightRequestContext;
  readonly visitorHash: string;
}

/**
 * 落库
 *
 * 由调用方放进 after() 执行 —— 响应早就返回了,这里慢一点也不影响访客。
 */
export async function ingestEnvelope({
  envelope,
  context,
  visitorHash,
}: IngestParams): Promise<void> {
  const sql = getDb();

  const events = envelope.events.map((event) => ({
    name: event.name,
    ts_ms: Math.max(0, Math.round(event.ts)),
    props: event.props ?? {},
  }));

  const dwell = envelope.dwell.map((entry) => ({
    section_id: clamp(entry.sectionId, 120),
    dwell_ms: Math.max(0, Math.round(entry.ms)),
    enter_count: Math.max(0, Math.round(entry.enterCount)),
    max_coverage: Number.isFinite(entry.maxCoverage) ? entry.maxCoverage : 0,
  }));

  // 参数化调用走 sql.query;直接 sql(...) 那个重载是给标签模板用的
  await sql.query(INGEST_SQL, [
    clamp(envelope.pageViewId, 64),
    Math.max(0, Math.round(envelope.seq)),
    visitorHash,
    clamp(envelope.path, 512),
    clamp(envelope.locale, 16),
    clamp(referrerHost(envelope.referrer), 255),
    clamp(envelope.utm?.source, 128),
    clamp(envelope.utm?.medium, 128),
    clamp(envelope.utm?.campaign, 128),
    context.device.type,
    context.device.browser,
    context.device.os,
    Math.max(0, Math.round(envelope.viewport?.w ?? 0)),
    Math.max(0, Math.round(envelope.viewport?.h ?? 0)),
    context.geo.country,
    clamp(context.geo.region, 32),
    clamp(context.geo.city, 128),
    clamp(context.geo.timezone, 64),
    JSON.stringify(events),
    JSON.stringify(dwell),
  ]);
}

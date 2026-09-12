import { getDb } from './db';

/**
 * 看板与周报共用的聚合查询
 *
 * 全部接受一个「最近多少天」的窗口参数,由调用方决定。看板默认 7 天,
 * 周报按上一个完整周算。
 *
 * 每个函数都是一次独立往返 —— Neon 的 HTTP 驱动本来就一次调用一个往返,
 * 而看板是低频页面,没必要为它把几个不相关的聚合硬塞进一条语句。
 * 写入路径才需要那样做。
 */

export interface Overview {
  readonly visitors: number;
  readonly pageViews: number;
  readonly avgDwellMs: number;
  /** 只看了一个板块就走的比例,0-100 */
  readonly shallowPct: number;
}

export interface SectionDwellRow {
  readonly sectionId: string;
  readonly avgMs: number;
  readonly totalMs: number;
  readonly views: number;
}

export interface CountRow {
  readonly label: string;
  readonly count: number;
}

export interface FunnelRow {
  readonly step: string;
  readonly count: number;
}

export interface SessionRow {
  readonly pageViewId: string;
  readonly lastSeenAt: string;
  readonly path: string;
  readonly locale: string;
  readonly country: string;
  readonly city: string;
  readonly deviceType: string;
  readonly browser: string;
  readonly dwellMs: number;
  readonly sections: number;
  readonly events: number;
}

function since(days: number): string {
  return `${Math.max(1, Math.round(days))} days`;
}

export async function fetchOverview(days: number): Promise<Overview> {
  const rows = (await getDb().query(
    `
    WITH scoped AS (
      SELECT pv.id, pv.visitor_hash,
             COALESCE(SUM(sd.dwell_ms), 0) AS dwell_ms,
             COUNT(sd.section_id)          AS sections
      FROM page_views pv
      LEFT JOIN section_dwell sd ON sd.page_view_id = pv.id
      WHERE pv.last_seen_at > now() - $1::interval
      GROUP BY pv.id, pv.visitor_hash
    )
    SELECT
      COUNT(DISTINCT visitor_hash)                                   AS visitors,
      COUNT(*)                                                       AS page_views,
      COALESCE(ROUND(AVG(dwell_ms)), 0)                              AS avg_dwell_ms,
      COALESCE(ROUND(100.0 * AVG(CASE WHEN sections <= 1 THEN 1 ELSE 0 END)), 0) AS shallow_pct
    FROM scoped
    `,
    [since(days)]
  )) as Array<Record<string, string>>;

  const row = rows[0] ?? {};

  return {
    visitors: Number(row.visitors ?? 0),
    pageViews: Number(row.page_views ?? 0),
    avgDwellMs: Number(row.avg_dwell_ms ?? 0),
    shallowPct: Number(row.shallow_pct ?? 0),
  };
}

/**
 * 板块停留时长排行
 *
 * 这是本期最主要的那个问题:哪块内容真的被读了,哪块被一滑而过。
 * 按平均值排而不是总量 —— 总量会被「所有人都会经过的首屏」压倒。
 */
export async function fetchSectionDwell(days: number): Promise<readonly SectionDwellRow[]> {
  const rows = (await getDb().query(
    `
    SELECT sd.section_id,
           ROUND(AVG(sd.dwell_ms)) AS avg_ms,
           SUM(sd.dwell_ms)        AS total_ms,
           COUNT(*)                AS views
    FROM section_dwell sd
    JOIN page_views pv ON pv.id = sd.page_view_id
    WHERE pv.last_seen_at > now() - $1::interval
    GROUP BY sd.section_id
    HAVING COUNT(*) >= 3
    ORDER BY avg_ms DESC
    LIMIT 30
    `,
    [since(days)]
  )) as Array<Record<string, string>>;

  return rows.map((row) => ({
    sectionId: row.section_id,
    avgMs: Number(row.avg_ms ?? 0),
    totalMs: Number(row.total_ms ?? 0),
    views: Number(row.views ?? 0),
  }));
}

/**
 * 转化漏斗
 *
 * 四步都从 page_views 出发,分母一致才可比。
 */
export async function fetchFunnel(days: number): Promise<readonly FunnelRow[]> {
  const rows = (await getDb().query(
    `
    WITH scoped AS (
      SELECT id FROM page_views WHERE last_seen_at > now() - $1::interval
    )
    SELECT
      (SELECT COUNT(*) FROM scoped)                                              AS visited,
      (SELECT COUNT(DISTINCT sd.page_view_id) FROM section_dwell sd
        JOIN scoped s ON s.id = sd.page_view_id
        WHERE sd.section_id = 'contact')                                         AS reached_contact,
      (SELECT COUNT(DISTINCT e.page_view_id) FROM events e
        JOIN scoped s ON s.id = e.page_view_id
        WHERE e.name = 'form_start')                                             AS form_started,
      (SELECT COUNT(DISTINCT e.page_view_id) FROM events e
        JOIN scoped s ON s.id = e.page_view_id
        WHERE e.name = 'form_submit')                                            AS submitted
    `,
    [since(days)]
  )) as Array<Record<string, string>>;

  const row = rows[0] ?? {};

  return [
    { step: 'visited', count: Number(row.visited ?? 0) },
    { step: 'reachedContact', count: Number(row.reached_contact ?? 0) },
    { step: 'formStarted', count: Number(row.form_started ?? 0) },
    { step: 'submitted', count: Number(row.submitted ?? 0) },
  ];
}

/** 按任一 page_views 列做 Top N 计数 */
async function fetchTopBy(
  column: 'country' | 'referrer_host' | 'device_type' | 'browser' | 'locale' | 'path',
  days: number,
  limit = 15
): Promise<readonly CountRow[]> {
  const rows = (await getDb().query(
    `
    SELECT COALESCE(NULLIF(${column}, ''), '(unknown)') AS label, COUNT(*) AS count
    FROM page_views
    WHERE last_seen_at > now() - $1::interval
    GROUP BY label
    ORDER BY count DESC
    LIMIT ${Math.max(1, Math.round(limit))}
    `,
    [since(days)]
  )) as Array<Record<string, string>>;

  return rows.map((row) => ({ label: row.label, count: Number(row.count ?? 0) }));
}

export const fetchTopCountries = (days: number) => fetchTopBy('country', days);
export const fetchTopReferrers = (days: number) => fetchTopBy('referrer_host', days);
export const fetchTopPaths = (days: number) => fetchTopBy('path', days);
export const fetchDevices = (days: number) => fetchTopBy('device_type', days, 5);
export const fetchLocales = (days: number) => fetchTopBy('locale', days);

/** 滚动深度分布 */
export async function fetchScrollDepth(days: number): Promise<readonly CountRow[]> {
  const rows = (await getDb().query(
    `
    SELECT (props->>'pct') AS label, COUNT(DISTINCT page_view_id) AS count
    FROM events
    WHERE name = 'scroll_depth' AND occurred_at > now() - $1::interval
    GROUP BY label
    ORDER BY (label)::int
    `,
    [since(days)]
  )) as Array<Record<string, string>>;

  return rows.map((row) => ({ label: `${row.label}%`, count: Number(row.count ?? 0) }));
}

/** 转化事件计数 */
export async function fetchConversionEvents(days: number): Promise<readonly CountRow[]> {
  const rows = (await getDb().query(
    `
    SELECT name AS label, COUNT(*) AS count
    FROM events
    WHERE occurred_at > now() - $1::interval
      AND name IN (
        'cta_click', 'form_start', 'form_submit', 'form_submit_fail',
        'whatsapp_click', 'email_click', 'phone_click', 'map_click',
        'booking_success', 'booking_unavailable', 'language_switch'
      )
    GROUP BY name
    ORDER BY count DESC
    `,
    [since(days)]
  )) as Array<Record<string, string>>;

  return rows.map((row) => ({ label: row.label, count: Number(row.count ?? 0) }));
}

/** 最近的访问明细 */
export async function fetchRecentSessions(
  days: number,
  limit = 40
): Promise<readonly SessionRow[]> {
  const rows = (await getDb().query(
    `
    SELECT pv.id, pv.last_seen_at, pv.path, pv.locale, pv.country, pv.city,
           pv.device_type, pv.browser,
           COALESCE(SUM(sd.dwell_ms), 0) AS dwell_ms,
           COUNT(DISTINCT sd.section_id) AS sections,
           (SELECT COUNT(*) FROM events e WHERE e.page_view_id = pv.id) AS events
    FROM page_views pv
    LEFT JOIN section_dwell sd ON sd.page_view_id = pv.id
    WHERE pv.last_seen_at > now() - $1::interval
    GROUP BY pv.id
    ORDER BY pv.last_seen_at DESC
    LIMIT ${Math.max(1, Math.round(limit))}
    `,
    [since(days)]
  )) as Array<Record<string, string>>;

  return rows.map((row) => ({
    pageViewId: row.id,
    lastSeenAt: row.last_seen_at,
    path: row.path,
    locale: row.locale,
    country: row.country,
    city: row.city,
    deviceType: row.device_type,
    browser: row.browser,
    dwellMs: Number(row.dwell_ms ?? 0),
    sections: Number(row.sections ?? 0),
    events: Number(row.events ?? 0),
  }));
}

/** 删除保留期之外的原始数据。返回各表删掉的行数 */
export async function pruneOlderThan(days: number): Promise<Record<string, number>> {
  const sql = getDb();
  const interval = since(days);

  const pageViews = (await sql.query(
    `DELETE FROM page_views WHERE last_seen_at < now() - $1::interval RETURNING 1`,
    [interval]
  )) as unknown[];

  const events = (await sql.query(
    `DELETE FROM events WHERE occurred_at < now() - $1::interval RETURNING 1`,
    [interval]
  )) as unknown[];

  const dwell = (await sql.query(
    `DELETE FROM section_dwell WHERE updated_at < now() - $1::interval RETURNING 1`,
    [interval]
  )) as unknown[];

  const batches = (await sql.query(
    `DELETE FROM ingested_batches WHERE received_at < now() - $1::interval RETURNING 1`,
    [interval]
  )) as unknown[];

  return {
    pageViews: pageViews.length,
    events: events.length,
    sectionDwell: dwell.length,
    ingestedBatches: batches.length,
  };
}

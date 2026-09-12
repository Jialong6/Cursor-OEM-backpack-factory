-- 自建埋点的表结构
--
-- 三张表而不是计划里写的两张:板块停留单独成表,而不是塞进 page_views 的
-- 一个 JSONB 列。理由有两条 ——
--   1. 增量合并。同一次页面浏览会多次上报停留增量(心跳、切后台、路由切换),
--      独立表用 ON CONFLICT DO UPDATE SET dwell_ms = dwell_ms + EXCLUDED.dwell_ms
--      一句话就合并了;JSONB 要在 ON CONFLICT 里写一整段 jsonb_each_text +
--      UNION ALL + GROUP BY 的子查询,难读也难改。
--   2. 「板块停留时长排行」是本期最主要的那个问题,独立表上它就是一句
--      GROUP BY;JSONB 上要先展开。
--
-- 不设 ASN / 运营商列:本轮不接 IPinfo,硬塞几个永远为空的列只会让人困惑。
-- 将来要加是一条 ALTER TABLE 的事。
--
-- 不存明文 IP。visitor_hash 由「每日盐 + IP + UA」派生,跨天不可关联,
-- 详见 lib/analytics/visitor-hash.ts。

-- 每次页面浏览一行
CREATE TABLE IF NOT EXISTS page_views (
  id             text PRIMARY KEY,
  visitor_hash   char(64)    NOT NULL,
  first_seen_at  timestamptz NOT NULL DEFAULT now(),
  last_seen_at   timestamptz NOT NULL DEFAULT now(),
  path           text        NOT NULL,
  locale         text        NOT NULL DEFAULT '',
  referrer_host  text        NOT NULL DEFAULT '',
  utm_source     text        NOT NULL DEFAULT '',
  utm_medium     text        NOT NULL DEFAULT '',
  utm_campaign   text        NOT NULL DEFAULT '',
  device_type    text        NOT NULL DEFAULT 'desktop',
  browser        text        NOT NULL DEFAULT 'unknown',
  os             text        NOT NULL DEFAULT 'unknown',
  viewport_w     integer     NOT NULL DEFAULT 0,
  viewport_h     integer     NOT NULL DEFAULT 0,
  country        text        NOT NULL DEFAULT '',
  region         text        NOT NULL DEFAULT '',
  city           text        NOT NULL DEFAULT '',
  timezone       text        NOT NULL DEFAULT '',
  last_seq       integer     NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS page_views_last_seen_idx ON page_views (last_seen_at DESC);
CREATE INDEX IF NOT EXISTS page_views_visitor_idx   ON page_views (visitor_hash, last_seen_at);
CREATE INDEX IF NOT EXISTS page_views_path_idx      ON page_views (path, last_seen_at);

-- 每个离散动作一行
CREATE TABLE IF NOT EXISTS events (
  id           bigserial   PRIMARY KEY,
  page_view_id text        NOT NULL,
  visitor_hash char(64)    NOT NULL,
  occurred_at  timestamptz NOT NULL DEFAULT now(),
  name         text        NOT NULL,
  path         text        NOT NULL,
  locale       text        NOT NULL DEFAULT '',
  -- 相对该次页面浏览起点的毫秒。客户端墙钟不可信,真实时间用 occurred_at
  ts_ms        integer     NOT NULL DEFAULT 0,
  props        jsonb       NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS events_occurred_idx  ON events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS events_name_idx      ON events (name, occurred_at);
CREATE INDEX IF NOT EXISTS events_page_view_idx ON events (page_view_id);

-- 板块停留。同一次页面浏览的同一板块只有一行,增量累加上去
CREATE TABLE IF NOT EXISTS section_dwell (
  page_view_id text        NOT NULL,
  section_id   text        NOT NULL,
  dwell_ms     integer     NOT NULL DEFAULT 0,
  enter_count  integer     NOT NULL DEFAULT 0,
  max_coverage real        NOT NULL DEFAULT 0,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (page_view_id, section_id)
);

CREATE INDEX IF NOT EXISTS section_dwell_section_idx ON section_dwell (section_id, updated_at);
CREATE INDEX IF NOT EXISTS section_dwell_updated_idx ON section_dwell (updated_at DESC);

-- 已处理的批次,用来让重发幂等
--
-- sendBeacon 本身不会重试,所以这张表主要防的是有人录下一次请求再重放。
-- 每次写入先来这里认领,认领不到就整批跳过。
CREATE TABLE IF NOT EXISTS ingested_batches (
  page_view_id text        NOT NULL,
  seq          integer     NOT NULL,
  received_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (page_view_id, seq)
);

CREATE INDEX IF NOT EXISTS ingested_batches_received_idx ON ingested_batches (received_at DESC);

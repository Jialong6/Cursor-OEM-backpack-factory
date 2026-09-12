/**
 * 自建埋点的事件形状与阈值(纯模块,客户端与服务端共用)
 *
 * 服务端 app/api/insight/route.ts 从这里的类型派生 Zod schema,
 * 客户端 beacon 从这里取阈值 —— 两端共用同一个模块,形状永不漂移。
 *
 * 本模块不得引入 'use client'、next/server 或任何 DOM 类型。
 */
import { OUTBOUND_EVENT_NAMES } from './link-classifier';

/**
 * 上报端点
 *
 * 刻意避开 collect / track / analytics 这些词:广告拦截插件的默认规则表
 * 按路径关键词拦截,叫 insight 能明显降低被拦率。
 */
export const INSIGHT_ENDPOINT = '/api/insight';

/** 载荷版本号,将来形状变更时服务端据此兼容 */
export const INSIGHT_PAYLOAD_VERSION = 1;

/** 单批最多几个事件 */
export const MAX_EVENTS_PER_BATCH = 20;

/** 单批最多几条板块停留 */
export const MAX_DWELL_ENTRIES_PER_BATCH = 50;

/**
 * 单批序列化后的字节上限
 *
 * 留足余量,让服务端 16 KB 的截断永远碰不到 —— 那道闸门是防恶意构造的,
 * 不该被正常流量触发。
 */
export const MAX_BATCH_BYTES = 12_000;

/** 服务端拒收的请求体上限 */
export const SERVER_MAX_BODY_BYTES = 16_384;

/** 攒批的防抖窗口 */
export const FLUSH_DEBOUNCE_MS = 5_000;

/** 防抖的硬上限,免得一个话痨页面永远攒着不发 */
export const FLUSH_HARD_LIMIT_MS = 15_000;

/** 全部事件名 */
export const INSIGHT_EVENT_NAMES = Object.freeze([
  'page_view',
  'scroll_depth',
  'cta_click',
  'form_start',
  'form_submit',
  'form_submit_fail',
  'file_reject',
  'file_upload_fail',
  'booking_success',
  'booking_unavailable',
  'language_switch',
  ...OUTBOUND_EVENT_NAMES,
] as const);

export type InsightEventName = (typeof INSIGHT_EVENT_NAMES)[number];

/** 事件附带的维度。刻意限定为标量,复杂结构不进库 */
export type InsightProps = Readonly<Record<string, string | number | boolean>>;

export interface QueuedEvent {
  /** 入队那一刻的 pageViewId。盖在事件上而不是信封上,路由切换时归属才不会错 */
  readonly pageViewId: string;
  readonly name: InsightEventName;
  /** 相对该次页面浏览起点的毫秒。不信任客户端墙钟,真实时间由服务端盖 */
  readonly ts: number;
  readonly props: InsightProps;
}

export interface DwellPayloadEntry {
  readonly sectionId: string;
  readonly ms: number;
  readonly enterCount: number;
  readonly maxCoverage: number;
}

export interface InsightViewport {
  readonly w: number;
  readonly h: number;
}

/** 广告系列参数。只在落地那一刻的 URL 上取得到,所以随首个信封一起发 */
export interface InsightUtm {
  readonly source?: string;
  readonly medium?: string;
  readonly campaign?: string;
}

/** 一次 POST 的载荷 */
export interface InsightEnvelope {
  readonly v: number;
  readonly pageViewId: string;
  /** 该 pageView 内自增,服务端据此丢弃重发 */
  readonly seq: number;
  readonly path: string;
  readonly locale: string;
  readonly referrer?: string;
  readonly viewport: InsightViewport;
  readonly utm?: InsightUtm;
  readonly events: readonly QueuedEvent[];
  readonly dwell: readonly DwellPayloadEntry[];
}

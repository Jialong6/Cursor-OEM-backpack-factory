/**
 * 把队列里的事件与停留数据分包成一个个 POST 载荷(纯函数)
 *
 * 抽出来单独成模块,是为了让「不丢不重」这条属性能脱离 DOM 测透 ——
 * happy-dom 的 sendBeacon 恒返回 true 且内部转调 fetch,在传输那一层
 * 根本断言不出批次边界。
 *
 * 为什么按 pageViewId 分组:事件在入队时就盖了当时的 pageViewId,
 * 路由切换时上一页的事件必须仍挂在上一个 pageView 下。分组是这条
 * 归属保证的最后一环。
 *
 * 本模块不得引入 'use client'、next/server 或任何 DOM 类型。
 */
import {
  INSIGHT_PAYLOAD_VERSION,
  MAX_BATCH_BYTES,
  MAX_DWELL_ENTRIES_PER_BATCH,
  MAX_EVENTS_PER_BATCH,
  type DwellPayloadEntry,
  type InsightEnvelope,
  type InsightUtm,
  type InsightViewport,
  type QueuedEvent,
} from './events';

export interface BatchContext {
  /** 当前的 pageViewId。停留数据只会挂在它上面 */
  readonly pageViewId: string;
  readonly path: string;
  readonly locale: string;
  readonly referrer?: string;
  readonly viewport: InsightViewport;
  readonly utm?: InsightUtm;
}

/** 粗估一条事件序列化后的字节数。只用于分包决策,不需要精确 */
function estimateBytes(event: QueuedEvent): number {
  return JSON.stringify(event).length;
}

/** 保持输入顺序,按 pageViewId 分组 */
function groupByPageView(
  events: readonly QueuedEvent[]
): ReadonlyMap<string, readonly QueuedEvent[]> {
  const groups = new Map<string, QueuedEvent[]>();

  for (const event of events) {
    const bucket = groups.get(event.pageViewId);

    if (bucket) {
      bucket.push(event);
    } else {
      groups.set(event.pageViewId, [event]);
    }
  }

  return groups;
}

/**
 * 按数量与体积双重上限切分事件
 *
 * 单条事件本身就超过体积上限时,它独占一批 —— 再拆就得丢数据了,
 * 而服务端的 16 KB 闸门留了足够余量。
 */
function chunkEvents(events: readonly QueuedEvent[]): QueuedEvent[][] {
  const chunks: QueuedEvent[][] = [];
  let current: QueuedEvent[] = [];
  let bytes = 0;

  for (const event of events) {
    const size = estimateBytes(event);
    const wouldOverflow = current.length > 0 && (bytes + size > MAX_BATCH_BYTES);

    if (current.length >= MAX_EVENTS_PER_BATCH || wouldOverflow) {
      chunks.push(current);
      current = [];
      bytes = 0;
    }

    current.push(event);
    bytes += size;
  }

  if (current.length > 0) {
    chunks.push(current);
  }

  return chunks;
}

function chunkDwell(entries: readonly DwellPayloadEntry[]): DwellPayloadEntry[][] {
  const chunks: DwellPayloadEntry[][] = [];

  for (let i = 0; i < entries.length; i += MAX_DWELL_ENTRIES_PER_BATCH) {
    chunks.push([...entries.slice(i, i + MAX_DWELL_ENTRIES_PER_BATCH)]);
  }

  return chunks;
}

/**
 * 生成待发送的载荷序列
 *
 * @param events - 队列里的全部事件,可能横跨多个 pageView
 * @param dwell - 当前 pageView 的板块停留增量
 * @param context - 当前页面上下文
 * @param startSeq - 起始序号,同一 pageView 内自增,服务端据此丢弃重发
 */
export function buildBatches(
  events: readonly QueuedEvent[],
  dwell: readonly DwellPayloadEntry[],
  context: BatchContext,
  startSeq: number
): readonly InsightEnvelope[] {
  const batches: InsightEnvelope[] = [];
  let seq = startSeq;

  const makeEnvelope = (
    pageViewId: string,
    batchEvents: readonly QueuedEvent[],
    batchDwell: readonly DwellPayloadEntry[]
  ): InsightEnvelope => ({
    v: INSIGHT_PAYLOAD_VERSION,
    pageViewId,
    seq: seq++,
    path: context.path,
    locale: context.locale,
    ...(context.referrer ? { referrer: context.referrer } : {}),
    viewport: context.viewport,
    ...(context.utm ? { utm: context.utm } : {}),
    events: batchEvents,
    dwell: batchDwell,
  });

  // 停留数据只属于当前 pageView,先排队等着塞进它的第一批
  const dwellChunks = chunkDwell(dwell);
  let dwellIndex = 0;

  for (const [pageViewId, groupEvents] of groupByPageView(events)) {
    const isCurrent = pageViewId === context.pageViewId;

    for (const chunk of chunkEvents(groupEvents)) {
      const attached = isCurrent && dwellIndex < dwellChunks.length
        ? dwellChunks[dwellIndex++]
        : [];

      batches.push(makeEnvelope(pageViewId, chunk, attached));
    }
  }

  // 没搭上事件顺风车的停留数据自己单独发
  while (dwellIndex < dwellChunks.length) {
    batches.push(makeEnvelope(context.pageViewId, [], dwellChunks[dwellIndex++]));
  }

  return batches;
}

/**
 * Unit tests for lib/analytics/batching.ts
 *
 * 分包逻辑抽成纯函数,是为了让「不丢不重」这条属性能脱离 DOM 测透 ——
 * happy-dom 的 sendBeacon 恒返回 true 且内部转调 fetch,在那一层根本
 * 断言不出批次边界。
 */
import { describe, it, test, expect } from 'vitest';
import fc from 'fast-check';
import {
  buildBatches,
  type BatchContext,
} from '../../../lib/analytics/batching';
import {
  INSIGHT_EVENT_NAMES,
  INSIGHT_PAYLOAD_VERSION,
  MAX_BATCH_BYTES,
  MAX_DWELL_ENTRIES_PER_BATCH,
  MAX_EVENTS_PER_BATCH,
  type DwellPayloadEntry,
  type QueuedEvent,
} from '../../../lib/analytics/events';

const CONTEXT: BatchContext = Object.freeze({
  pageViewId: 'pv-1',
  path: '/en',
  locale: 'en',
  viewport: { w: 1440, h: 900 },
});

function makeEvent(index: number, pageViewId = 'pv-1'): QueuedEvent {
  return {
    pageViewId,
    name: 'cta_click',
    ts: index * 10,
    props: { cta: `source-${index}` },
  };
}

function makeDwell(index: number): DwellPayloadEntry {
  return {
    sectionId: `section-${index}`,
    ms: 1_000 + index,
    enterCount: 1,
    maxCoverage: 0.9,
  };
}

describe('buildBatches 基本行为', () => {
  test('没有任何内容时不产生批次', () => {
    expect(buildBatches([], [], CONTEXT, 1)).toEqual([]);
  });

  test('少量事件打成一个批次', () => {
    const batches = buildBatches([makeEvent(0), makeEvent(1)], [], CONTEXT, 1);

    expect(batches).toHaveLength(1);
    expect(batches[0].events).toHaveLength(2);
    expect(batches[0].v).toBe(INSIGHT_PAYLOAD_VERSION);
    expect(batches[0].pageViewId).toBe('pv-1');
    expect(batches[0].seq).toBe(1);
  });

  test('只有停留数据也会产生批次', () => {
    const batches = buildBatches([], [makeDwell(0)], CONTEXT, 1);

    expect(batches).toHaveLength(1);
    expect(batches[0].events).toEqual([]);
    expect(batches[0].dwell).toHaveLength(1);
  });

  test('事件数超上限时拆批', () => {
    const events = Array.from({ length: MAX_EVENTS_PER_BATCH + 5 }, (_, i) => makeEvent(i));
    const batches = buildBatches(events, [], CONTEXT, 1);

    expect(batches).toHaveLength(2);
    expect(batches[0].events).toHaveLength(MAX_EVENTS_PER_BATCH);
    expect(batches[1].events).toHaveLength(5);
  });

  test('停留条目超上限时拆批', () => {
    const dwell = Array.from({ length: MAX_DWELL_ENTRIES_PER_BATCH + 3 }, (_, i) => makeDwell(i));
    const batches = buildBatches([], dwell, CONTEXT, 1);

    expect(batches).toHaveLength(2);
    expect(batches[0].dwell).toHaveLength(MAX_DWELL_ENTRIES_PER_BATCH);
    expect(batches[1].dwell).toHaveLength(3);
  });

  test('seq 连续递增', () => {
    const events = Array.from({ length: MAX_EVENTS_PER_BATCH * 2 + 1 }, (_, i) => makeEvent(i));
    const batches = buildBatches(events, [], CONTEXT, 7);

    expect(batches.map((b) => b.seq)).toEqual([7, 8, 9]);
  });

  test('不同 pageViewId 的事件分到不同批次,归属不会串', () => {
    const events = [makeEvent(0, 'pv-old'), makeEvent(1, 'pv-1'), makeEvent(2, 'pv-old')];
    const batches = buildBatches(events, [], CONTEXT, 1);

    const byPageView = new Map(batches.map((b) => [b.pageViewId, b.events.length]));

    expect(byPageView.get('pv-old')).toBe(2);
    expect(byPageView.get('pv-1')).toBe(1);
  });

  test('停留数据只挂在当前 pageView 上', () => {
    const batches = buildBatches([makeEvent(0, 'pv-old')], [makeDwell(0)], CONTEXT, 1);
    const withDwell = batches.filter((b) => b.dwell.length > 0);

    expect(withDwell).toHaveLength(1);
    expect(withDwell[0].pageViewId).toBe('pv-1');
  });

  test('带上 referrer 时透传', () => {
    const batches = buildBatches([makeEvent(0)], [], { ...CONTEXT, referrer: 'google.com' }, 1);
    expect(batches[0].referrer).toBe('google.com');
  });
});

describe('Property: 不丢不重与体积上限', () => {
  const eventArb = fc.record({
    pageViewId: fc.constantFrom('pv-1', 'pv-old'),
    name: fc.constantFrom(...INSIGHT_EVENT_NAMES),
    ts: fc.integer({ min: 0, max: 600_000 }),
    props: fc.dictionary(
      fc.constantFrom('cta', 'source', 'via', 'pct'),
      fc.oneof(fc.string({ maxLength: 24 }), fc.integer(), fc.boolean()),
      { maxKeys: 3 }
    ),
  });

  it('属性:所有批次里的事件恰好等于输入,每条出现且仅出现一次', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 120 }), (events) => {
        const batches = buildBatches(events as readonly QueuedEvent[], [], CONTEXT, 1);
        const flat = batches.flatMap((batch) => batch.events);

        expect(flat).toHaveLength(events.length);

        // 多重集相等:按序列化后的字符串计数比对
        const count = (list: readonly QueuedEvent[]) => {
          const map = new Map<string, number>();
          for (const item of list) {
            const key = JSON.stringify(item);
            map.set(key, (map.get(key) ?? 0) + 1);
          }
          return map;
        };

        expect(count(flat)).toEqual(count(events as readonly QueuedEvent[]));
      }),
      { numRuns: 200 }
    );
  });

  it('属性:停留条目同样不丢不重', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            sectionId: fc.string({ minLength: 1, maxLength: 20 }),
            ms: fc.integer({ min: 0, max: 600_000 }),
            enterCount: fc.integer({ min: 0, max: 50 }),
            maxCoverage: fc.double({ min: 0, max: 1, noNaN: true }),
          }),
          { maxLength: 200 }
        ),
        (dwell) => {
          const batches = buildBatches([], dwell as readonly DwellPayloadEntry[], CONTEXT, 1);
          const flat = batches.flatMap((batch) => batch.dwell);

          expect(flat).toEqual(dwell);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('属性:每个批次要么在体积上限内,要么只含一个事件(无法再拆)', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 120 }), (events) => {
        const batches = buildBatches(events as readonly QueuedEvent[], [], CONTEXT, 1);

        for (const batch of batches) {
          const bytes = JSON.stringify(batch).length;

          if (bytes > MAX_BATCH_BYTES) {
            expect(batch.events.length).toBe(1);
          }
        }
      }),
      { numRuns: 200 }
    );
  });

  it('属性:seq 在所有批次内严格递增且不重复', () => {
    fc.assert(
      fc.property(
        fc.array(eventArb, { maxLength: 120 }),
        fc.integer({ min: 1, max: 1_000 }),
        (events, startSeq) => {
          const seqs = buildBatches(events as readonly QueuedEvent[], [], CONTEXT, startSeq).map(
            (batch) => batch.seq
          );

          for (let i = 1; i < seqs.length; i++) {
            expect(seqs[i]).toBeGreaterThan(seqs[i - 1]);
          }
          expect(new Set(seqs).size).toBe(seqs.length);
        }
      ),
      { numRuns: 200 }
    );
  });
});

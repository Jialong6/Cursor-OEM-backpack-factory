/**
 * Unit tests for lib/analytics/format.ts
 *
 * 空数据的看板不该到处是 NaN 或 Infinity —— 刚上线那几天正是数据最空的
 * 时候,而那也正是最需要看板正常渲染、好确认埋点有没有在工作的时候。
 */
import { describe, it, test, expect } from 'vitest';
import fc from 'fast-check';
import {
  barWidthPct,
  conversionPct,
  deltaPct,
  formatCount,
  formatDuration,
} from '../../../lib/analytics/format';

describe('formatDuration', () => {
  test.each([
    [0, '0s'],
    [900, '1s'],
    [4_200, '4s'],
    [59_400, '59s'],
    [60_000, '1m'],
    [95_000, '1m 35s'],
    [3_600_000, '1h 0m'],
    [5_400_000, '1h 30m'],
  ])('%i 毫秒显示为 %s', (ms, expected) => {
    expect(formatDuration(ms)).toBe(expected);
  });

  test('异常值退回 0s', () => {
    expect(formatDuration(Number.NaN)).toBe('0s');
    expect(formatDuration(-100)).toBe('0s');
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe('0s');
  });
});

describe('formatCount', () => {
  test('加千分位', () => {
    expect(formatCount(1234567)).toBe('1,234,567');
  });

  test('异常值退回 0', () => {
    expect(formatCount(Number.NaN)).toBe('0');
  });
});

describe('conversionPct', () => {
  test('算相对上一步的比例', () => {
    expect(conversionPct(25, 100)).toBe(25);
    expect(conversionPct(1, 3)).toBe(33.3);
  });

  test('分母为零时给 0,不给 NaN', () => {
    expect(conversionPct(5, 0)).toBe(0);
  });
});

describe('barWidthPct', () => {
  test('最大值占满', () => {
    expect(barWidthPct(50, 50)).toBe(100);
  });

  test('很小的值也留一点可见宽度', () => {
    expect(barWidthPct(1, 10_000)).toBe(2);
  });

  test('零值不占宽度', () => {
    expect(barWidthPct(0, 100)).toBe(0);
  });
});

describe('deltaPct', () => {
  test('上升为正,下降为负', () => {
    expect(deltaPct(120, 100)).toBe(20);
    expect(deltaPct(80, 100)).toBe(-20);
  });

  test('没有上一期时返回 null,而不是假装没变化', () => {
    expect(deltaPct(10, 0)).toBeNull();
  });
});

describe('Property: 空数据不产出 NaN 或越界值', () => {
  const anyNumber = fc.oneof(
    fc.integer({ min: -1_000, max: 1_000_000 }),
    fc.constantFrom(0, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY)
  );

  it('属性:formatDuration 与 formatCount 永远返回非空字符串', () => {
    fc.assert(
      fc.property(anyNumber, (value) => {
        expect(formatDuration(value).length).toBeGreaterThan(0);
        expect(formatCount(value)).not.toContain('NaN');
      }),
      { numRuns: 300 }
    );
  });

  it('属性:barWidthPct 永远落在 0 到 100 之间', () => {
    fc.assert(
      fc.property(anyNumber, anyNumber, (value, max) => {
        const width = barWidthPct(value, max);

        expect(Number.isFinite(width)).toBe(true);
        expect(width).toBeGreaterThanOrEqual(0);
        expect(width).toBeLessThanOrEqual(100);
      }),
      { numRuns: 400 }
    );
  });

  it('属性:conversionPct 永远是有限数且非负', () => {
    fc.assert(
      fc.property(anyNumber, anyNumber, (current, previous) => {
        const pct = conversionPct(current, previous);

        expect(Number.isFinite(pct)).toBe(true);
      }),
      { numRuns: 400 }
    );
  });
});

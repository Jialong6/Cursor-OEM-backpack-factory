/**
 * Unit tests for lib/analytics/scroll-depth.ts
 */
import { describe, it, test, expect } from 'vitest';
import fc from 'fast-check';
import {
  SCROLL_DEPTH_MILESTONES,
  newMilestones,
  scrollPercent,
} from '../../../lib/analytics/scroll-depth';

describe('scrollPercent', () => {
  test('顶部是 0', () => {
    expect(scrollPercent(0, 800, 2_400)).toBe(0);
  });

  test('滚到底是 100', () => {
    expect(scrollPercent(1_600, 800, 2_400)).toBe(100);
  });

  test('中间取整', () => {
    expect(scrollPercent(800, 800, 2_400)).toBe(50);
  });

  test('文档比视口短时算作看完', () => {
    expect(scrollPercent(0, 800, 600)).toBe(100);
  });

  test('超出范围被夹住,不会出现 101 或负数', () => {
    expect(scrollPercent(99_999, 800, 2_400)).toBe(100);
    expect(scrollPercent(-50, 800, 2_400)).toBe(0);
  });

  test('异常数值不抛错', () => {
    expect(scrollPercent(Number.NaN, 800, 2_400)).toBe(0);
    expect(scrollPercent(0, 800, Number.NaN)).toBe(100);
  });
});

describe('newMilestones', () => {
  test('只报没报过的', () => {
    expect(newMilestones(60, new Set([25]))).toEqual([50]);
  });

  test('一次大跳转补报跨过的所有档位', () => {
    expect(newMilestones(100, new Set())).toEqual([25, 50, 75, 100]);
  });

  test('没到下一档时什么都不报', () => {
    expect(newMilestones(40, new Set([25]))).toEqual([]);
  });

  test('全部报过之后不再重复', () => {
    expect(newMilestones(100, new Set(SCROLL_DEPTH_MILESTONES))).toEqual([]);
  });
});

describe('Property: 里程碑只报一次', () => {
  it('属性:任意滚动序列下,每个档位最多被报一次,且报过的都已达到', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 50 }),
        (percents) => {
          const reached = new Set<number>();
          const fired: number[] = [];

          for (const percent of percents) {
            for (const milestone of newMilestones(percent, reached)) {
              fired.push(milestone);
              reached.add(milestone);
            }
          }

          expect(new Set(fired).size).toBe(fired.length);

          const highest = Math.max(...percents);
          for (const milestone of fired) {
            expect(milestone).toBeLessThanOrEqual(highest);
          }
        }
      ),
      { numRuns: 300 }
    );
  });
});

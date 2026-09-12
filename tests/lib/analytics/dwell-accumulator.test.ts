/**
 * **Feature: backpack-oem-website, Property 17: 板块停留时长状态机**
 *
 * 这是第二期整个特性的正确性核心 ——「哪些内容浏览了多久」这个问题的答案
 * 全部由它产出。逻辑做成纯函数、时间从外部注入,才能在 happy-dom 里把
 * 「第 3 秒切后台、第 65 秒回来」这类时间线完整造出来。
 *
 * happy-dom 的 IntersectionObserver 虽然有类,但 observe() 是空实现、回调
 * 永不触发,所以 DOM 层测不出任何东西 —— 正确性必须在这一层钉死。
 *
 * 正确性属性:
 *   1. 单调非负      任意命令序列下,累计时长单调不减且非负
 *   2. flush 守恒    flush 的节奏对最终结果不可观测(这就是去重保证)
 *   3. 上界          所有板块之和不超过总墙钟时长(单活动方案才成立)
 *   4. 暂停零增长    全程暂停时总增量恒为 0
 *   5. 空闲封顶      无用户活动时,计入时长封顶在 idleLimitMs
 *   6. 无抖动        覆盖率差值始终在滞回内时,活动板块至多切换一次
 *   7. 判定单调      isViewed 对 coverage 与 selfRatio 都单调不减
 */
import { describe, it, test, expect } from 'vitest';
import fc from 'fast-check';
import {
  DEFAULT_IDLE_LIMIT_MS,
  MIN_SELF_RATIO,
  MIN_VIEWPORT_COVERAGE,
  SWITCH_MARGIN,
  applyVisibility,
  createDwellState,
  flushDwell,
  isViewed,
  markActivity,
  pickActive,
  setPaused,
  type DwellState,
  type SectionVisibility,
} from '../../../lib/analytics/dwell-accumulator';

// ---------------------------------------------------------------- 命令模型

type Command =
  | { readonly kind: 'visibility'; readonly sectionId: string; readonly coverage: number; readonly selfRatio: number }
  | { readonly kind: 'activity' }
  | { readonly kind: 'pause'; readonly paused: boolean }
  | { readonly kind: 'flush' };

interface Step {
  readonly at: number;
  readonly command: Command;
}

interface RunResult {
  readonly state: DwellState;
  /** 所有 flush 出来的毫秒之和,按板块归并 */
  readonly flushed: ReadonlyMap<string, number>;
  /** 每个板块的累计值随时间的快照序列,用于验证单调性 */
  readonly history: ReadonlyArray<ReadonlyMap<string, number>>;
}

/** 把一串带时间戳的命令喂给状态机,收集所有 flush 出来的增量 */
function run(
  steps: readonly Step[],
  startAt: number,
  options: { readonly skipFlush?: boolean; readonly idleLimitMs?: number } = {}
): RunResult {
  let state = createDwellState(startAt, { idleLimitMs: options.idleLimitMs });
  const flushed = new Map<string, number>();
  const history: Array<ReadonlyMap<string, number>> = [];

  const absorb = (entries: ReadonlyArray<{ sectionId: string; ms: number }>): void => {
    for (const entry of entries) {
      flushed.set(entry.sectionId, (flushed.get(entry.sectionId) ?? 0) + entry.ms);
    }
    history.push(new Map(flushed));
  };

  for (const step of steps) {
    const { command, at } = step;

    if (command.kind === 'visibility') {
      state = applyVisibility(state, at, command.sectionId, {
        coverage: command.coverage,
        selfRatio: command.selfRatio,
      });
    } else if (command.kind === 'activity') {
      state = markActivity(state, at);
    } else if (command.kind === 'pause') {
      state = setPaused(state, at, command.paused);
    } else if (!options.skipFlush) {
      const result = flushDwell(state, at);
      state = result.state;
      absorb(result.entries);
    }
  }

  // 收尾:把尾巴上的分段也结算掉,这样两种跑法可比
  const last = steps.length > 0 ? steps[steps.length - 1].at : startAt;
  const final = flushDwell(state, last);
  absorb(final.entries);

  return { state: final.state, flushed, history };
}

function totalMs(flushed: ReadonlyMap<string, number>): number {
  let sum = 0;
  for (const ms of flushed.values()) sum += ms;
  return sum;
}

// ---------------------------------------------------------------- 生成器

const SECTION_IDS = ['banner', 'about', 'features', 'faq', 'contact'] as const;

const visibilityCommand = fc.record({
  kind: fc.constant('visibility' as const),
  sectionId: fc.constantFrom(...SECTION_IDS),
  coverage: fc.double({ min: 0, max: 1, noNaN: true }),
  selfRatio: fc.double({ min: 0, max: 1, noNaN: true }),
});

const anyCommand: fc.Arbitrary<Command> = fc.oneof(
  { weight: 6, arbitrary: visibilityCommand },
  { weight: 2, arbitrary: fc.constant({ kind: 'activity' } as const) },
  { weight: 1, arbitrary: fc.record({ kind: fc.constant('pause' as const), paused: fc.boolean() }) },
  { weight: 2, arbitrary: fc.constant({ kind: 'flush' } as const) }
);

/** 命令 + 严格单调递增的时间戳 */
const stepsArb = (commandArb: fc.Arbitrary<Command> = anyCommand) =>
  fc
    .array(fc.tuple(commandArb, fc.integer({ min: 1, max: 5_000 })), {
      minLength: 1,
      maxLength: 40,
    })
    .map((pairs) => {
      let at = 1_000;
      return pairs.map(([command, delta]) => {
        at += delta;
        return { at, command } satisfies Step;
      });
    });

// ---------------------------------------------------------------- 属性

describe('Property 17.1: 累计时长单调非负', () => {
  it('任意命令序列下,每个板块的累计值都不会减少,也不会为负', () => {
    fc.assert(
      fc.property(stepsArb(), (steps) => {
        const { history } = run(steps, 1_000);

        for (let i = 1; i < history.length; i++) {
          const previous = history[i - 1];
          const current = history[i];

          for (const [sectionId, ms] of current) {
            expect(ms).toBeGreaterThanOrEqual(0);
            expect(ms).toBeGreaterThanOrEqual(previous.get(sectionId) ?? 0);
          }
        }
      }),
      { numRuns: 200 }
    );
  });
});

describe('Property 17.2: flush 守恒', () => {
  it('中途 flush 多少次都不影响总量 —— flush 节奏对结果不可观测', () => {
    fc.assert(
      fc.property(stepsArb(), (steps) => {
        const withFlushes = run(steps, 1_000);
        const withoutFlushes = run(steps, 1_000, { skipFlush: true });

        expect(totalMs(withFlushes.flushed)).toBe(totalMs(withoutFlushes.flushed));

        for (const sectionId of SECTION_IDS) {
          expect(withFlushes.flushed.get(sectionId) ?? 0).toBe(
            withoutFlushes.flushed.get(sectionId) ?? 0
          );
        }
      }),
      { numRuns: 200 }
    );
  });
});

describe('Property 17.3: 总量不超过墙钟时长', () => {
  it('所有板块停留之和不超过首末命令之间的真实时长', () => {
    fc.assert(
      fc.property(stepsArb(), (steps) => {
        const startAt = 1_000;
        const { flushed } = run(steps, startAt);
        const elapsed = steps[steps.length - 1].at - startAt;

        expect(totalMs(flushed)).toBeLessThanOrEqual(elapsed);
      }),
      { numRuns: 200 }
    );
  });
});

describe('Property 17.4: 暂停期间零增长', () => {
  it('全程暂停时,无论可见度怎么变,总增量恒为 0', () => {
    fc.assert(
      fc.property(stepsArb(visibilityCommand), (steps) => {
        let state = setPaused(createDwellState(1_000), 1_000, true);

        for (const step of steps) {
          const command = step.command;
          if (command.kind !== 'visibility') continue;
          state = applyVisibility(state, step.at, command.sectionId, {
            coverage: command.coverage,
            selfRatio: command.selfRatio,
          });
        }

        const { entries } = flushDwell(state, steps[steps.length - 1].at);
        const sum = entries.reduce((acc, entry) => acc + entry.ms, 0);

        expect(sum).toBe(0);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property 17.5: 空闲封顶', () => {
  it('两个时间点之间没有用户活动时,计入时长恰为 min(间隔, 空闲上限)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 400_000 }),
        fc.integer({ min: 1_000, max: 120_000 }),
        (gap, idleLimitMs) => {
          const start = 10_000;
          let state = createDwellState(start, { idleLimitMs });

          // 让 banner 成为活动板块,且此刻就是最后一次活动时刻
          state = applyVisibility(state, start, 'banner', { coverage: 1, selfRatio: 1 });
          state = markActivity(state, start);

          const { entries } = flushDwell(state, start + gap);
          const banner = entries.find((entry) => entry.sectionId === 'banner');

          expect(banner?.ms ?? 0).toBe(Math.min(gap, idleLimitMs));
        }
      ),
      { numRuns: 200 }
    );
  });

  it('默认空闲上限是 60 秒', () => {
    expect(DEFAULT_IDLE_LIMIT_MS).toBe(60_000);
  });
});

describe('Property 17.6: 滞回防抖动', () => {
  it('挑战者的优势始终不超过滞回时,活动板块至多切换一次', () => {
    const INCUMBENT_COVERAGE = 0.5;

    fc.assert(
      fc.property(
        // 挑战者在在位者上下 0.04 之间游走,优势永远够不到 SWITCH_MARGIN。
        // 注意在位者的覆盖率必须保持不变 —— 若两边都在动,某一帧「旧的挑战者
        // 覆盖率」减「新的在位者覆盖率」是可以越过滞回的,那就不是这条属性
        // 要描述的场景了。
        fc.array(
          fc.double({
            min: INCUMBENT_COVERAGE - 0.04,
            max: INCUMBENT_COVERAGE + 0.04,
            noNaN: true,
          }),
          { minLength: 2, maxLength: 30 }
        ),
        (challengerCoverages) => {
          let at = 0;
          let state = applyVisibility(createDwellState(0), 0, 'about', {
            coverage: INCUMBENT_COVERAGE,
            selfRatio: 1,
          });

          let switches = 1; // null -> 'about'
          let previousActive: string | null = state.activeId;

          for (const coverage of challengerCoverages) {
            at += 100;
            state = applyVisibility(state, at, 'features', { coverage, selfRatio: 1 });

            if (state.activeId !== previousActive) {
              switches++;
              previousActive = state.activeId;
            }
          }

          expect(switches).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('优势恰好等于滞回时不换人(边界属于在位者)', () => {
    const visibility = new Map<string, SectionVisibility>([
      ['about', { coverage: 0.5, selfRatio: 1 }],
      ['features', { coverage: 0.5 + SWITCH_MARGIN, selfRatio: 1 }],
    ]);

    expect(pickActive(visibility, 'about')).toBe('about');
  });
});

describe('Property 17.7: isViewed 对两个入参都单调不减', () => {
  it('变得更可见的板块不会突然不算在看', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        (coverage, selfRatio, dCoverage, dSelfRatio) => {
          const lower: SectionVisibility = { coverage, selfRatio };
          const higher: SectionVisibility = {
            coverage: Math.min(1, coverage + dCoverage),
            selfRatio: Math.min(1, selfRatio + dSelfRatio),
          };

          if (isViewed(lower)) {
            expect(isViewed(higher)).toBe(true);
          }
        }
      ),
      { numRuns: 300 }
    );
  });
});

// ---------------------------------------------------------------- 单元用例

describe('isViewed 的双条件', () => {
  test('高于视口的板块靠 coverage 够格,自身露出比例永远到不了门槛', () => {
    // 两倍视口高的 Contact:只露出一半自己,却铺满了整个屏幕
    expect(isViewed({ coverage: 1, selfRatio: 0.5 })).toBe(true);
  });

  test('很矮的板块靠 selfRatio 够格,占屏幕比例永远到不了门槛', () => {
    // 200px 的小卡片:完全露出,但只占屏幕两成
    expect(isViewed({ coverage: 0.2, selfRatio: 1 })).toBe(true);
  });

  test('两个条件都不满足时不算在看', () => {
    expect(isViewed({ coverage: 0.2, selfRatio: 0.3 })).toBe(false);
  });

  test('门槛取值', () => {
    expect(MIN_VIEWPORT_COVERAGE).toBe(0.35);
    expect(MIN_SELF_RATIO).toBe(0.6);
  });
});

describe('pickActive', () => {
  const fullyVisible = { coverage: 0.9, selfRatio: 1 };

  test('挑覆盖率最高的够格板块', () => {
    const visibility = new Map<string, SectionVisibility>([
      ['about', { coverage: 0.4, selfRatio: 1 }],
      ['features', fullyVisible],
    ]);

    expect(pickActive(visibility, null)).toBe('features');
  });

  test('不够格的板块不会被选中', () => {
    const visibility = new Map<string, SectionVisibility>([
      ['about', { coverage: 0.1, selfRatio: 0.1 }],
    ]);

    expect(pickActive(visibility, null)).toBeNull();
  });

  test('优势不足滞回时保持在位者', () => {
    const visibility = new Map<string, SectionVisibility>([
      ['about', { coverage: 0.5, selfRatio: 1 }],
      ['features', { coverage: 0.52, selfRatio: 1 }],
    ]);

    expect(pickActive(visibility, 'about')).toBe('about');
  });

  test('优势超过滞回时换人', () => {
    const visibility = new Map<string, SectionVisibility>([
      ['about', { coverage: 0.5, selfRatio: 1 }],
      ['features', { coverage: 0.7, selfRatio: 1 }],
    ]);

    expect(pickActive(visibility, 'about')).toBe('features');
  });

  test('在位者自己不再够格时立刻让位,不受滞回保护', () => {
    const visibility = new Map<string, SectionVisibility>([
      ['about', { coverage: 0, selfRatio: 0 }],
      ['features', { coverage: 0.4, selfRatio: 1 }],
    ]);

    expect(pickActive(visibility, 'about')).toBe('features');
  });
});

describe('切后台与恢复', () => {
  test('隐藏期间的时间不计入任何板块', () => {
    let state = createDwellState(0);
    state = applyVisibility(state, 0, 'features', { coverage: 1, selfRatio: 1 });

    state = setPaused(state, 5_000, true);     // 看了 5 秒后切走
    state = setPaused(state, 65_000, false);   // 一分钟后切回来

    const { entries } = flushDwell(state, 68_000);
    const features = entries.find((entry) => entry.sectionId === 'features');

    // 5 秒(切走前) + 3 秒(切回后),中间那 60 秒不算
    expect(features?.ms).toBe(8_000);
  });

  test('切回来算一次用户活动,空闲计时重新开始', () => {
    let state = createDwellState(0);
    state = applyVisibility(state, 0, 'features', { coverage: 1, selfRatio: 1 });
    state = setPaused(state, 1_000, true);
    state = setPaused(state, 100_000, false);

    // 切回来之后一直没操作,但空闲上限从切回那一刻起算
    const { entries } = flushDwell(state, 100_000 + DEFAULT_IDLE_LIMIT_MS + 5_000);
    const features = entries.find((entry) => entry.sectionId === 'features');

    expect(features?.ms).toBe(1_000 + DEFAULT_IDLE_LIMIT_MS);
  });
});

describe('flushDwell 的产出', () => {
  test('取走增量后清零,当前分段继续计时', () => {
    let state = createDwellState(0);
    state = applyVisibility(state, 0, 'faq', { coverage: 1, selfRatio: 1 });
    state = markActivity(state, 0);

    const first = flushDwell(state, 10_000);
    expect(first.entries.find((e) => e.sectionId === 'faq')?.ms).toBe(10_000);

    state = markActivity(first.state, 10_000);
    const second = flushDwell(state, 25_000);
    expect(second.entries.find((e) => e.sectionId === 'faq')?.ms).toBe(15_000);
  });

  test('没有任何停留时返回空数组', () => {
    const state = createDwellState(0);
    expect(flushDwell(state, 5_000).entries).toEqual([]);
  });

  test('带上进入次数与最大覆盖率', () => {
    let state = createDwellState(0);
    state = applyVisibility(state, 0, 'about', { coverage: 0.8, selfRatio: 1 });
    state = applyVisibility(state, 1_000, 'about', { coverage: 0.95, selfRatio: 1 });

    const { entries } = flushDwell(state, 2_000);
    const about = entries.find((entry) => entry.sectionId === 'about');

    expect(about?.enterCount).toBe(1);
    expect(about?.maxCoverage).toBeCloseTo(0.95, 5);
  });

  test('时钟回拨不产生负增量', () => {
    let state = createDwellState(10_000);
    state = applyVisibility(state, 10_000, 'about', { coverage: 1, selfRatio: 1 });

    const { entries } = flushDwell(state, 5_000);
    expect(entries.every((entry) => entry.ms >= 0)).toBe(true);
  });
});

/**
 * 板块停留时长状态机(纯函数,时间由外部注入)
 *
 * 为什么时间做成入参而不是内部调 performance.now():
 * 1. happy-dom 的 performance.now() 是真实墙钟,测试里造不出「第 3 秒切后台、
 *    第 65 秒回来」这种时间线;注入之后整条时间线由测试决定,fast-check 才能
 *    对任意单调递增序列做属性测试。
 * 2. 生产需要 performance.now()(单调,不受系统对时影响),测试需要假时钟,
 *    两者的差异被挡在模块之外。
 *
 * 为什么同一时刻只有一个板块计时(winner-takes-all):
 * 视口里常常同时露着两个板块。如果都计时,各板块停留之和会超过会话时长,
 * 「这个板块停了多少秒」就失去了可比性。只给视口占比最高的那个计时之后,
 * 所有板块之和不超过会话时长,可以直接读成「注意力份额」。
 *
 * 为什么用视口占比而不是 intersectionRatio:
 * intersectionRatio 是元素自身的露出比例。Contact / Blog / HeroBanner 都是
 * min-h-screen,自身露出比例永远到不了 50%;而一个 200px 的小卡片 ratio=1.0
 * 却只占屏幕两成。所以排序用 coverage(占视口的比例),selfRatio 只用来让
 * 矮板块够得着「在看」的门槛。
 *
 * 本模块不得引入 'use client' 或 next/server,也不得直接读取任何时间源。
 */

/** 够格「在看」所需的视口占比 */
export const MIN_VIEWPORT_COVERAGE = 0.35;

/** 矮板块的兜底门槛:自身露出到这个比例也算在看 */
export const MIN_SELF_RATIO = 0.6;

/**
 * 换人所需的覆盖率优势
 *
 * 没有这道滞回,两个板块在边界处会疯狂互抢,把进入次数刷成几十次。
 */
export const SWITCH_MARGIN = 0.05;

/**
 * 覆盖率比较的容差
 *
 * 覆盖率是两个浮点数相除得来的,0.5 + 0.05 在 IEEE 754 下是
 * 0.55000000000000004,直接和 SWITCH_MARGIN 比大小会在边界上随机翻面 ——
 * 而边界翻面正是滞回本身要消灭的抖动。小数点后 9 位以外的差异对
 * 「哪个板块占屏幕更多」没有任何意义,统一吃掉。
 */
const COMPARE_EPSILON = 1e-9;

/**
 * 空闲上限:最后一次用户活动之后最多再计这么久
 *
 * 取 60 秒而不是常见的 20/30 秒 —— FAQ 是长文本,认真读的人一分钟内一定会
 * 滚一次;而走开的标签页最多也只多算这一分钟。
 */
export const DEFAULT_IDLE_LIMIT_MS = 60_000;

/** 一个板块当前的可见程度 */
export interface SectionVisibility {
  /** 可见高度占可用视口高的比例,0-1 */
  readonly coverage: number;
  /** 可见高度占自身高度的比例,0-1 */
  readonly selfRatio: number;
}

/** 一个板块的累计数据 */
export interface SectionTotal {
  readonly ms: number;
  readonly enterCount: number;
  readonly maxCoverage: number;
}

export interface DwellState {
  readonly visibility: ReadonlyMap<string, SectionVisibility>;
  readonly activeId: string | null;
  /** 当前活动分段的起点 */
  readonly activeSince: number;
  readonly totals: ReadonlyMap<string, SectionTotal>;
  readonly lastActivityAt: number;
  readonly paused: boolean;
  readonly idleLimitMs: number;
}

/** flush 出来的一条增量 */
export interface DwellEntry {
  readonly sectionId: string;
  readonly ms: number;
  readonly enterCount: number;
  /**
   * 本次 flush 窗口内的最大覆盖率。这是最大值不是累加值,
   * 服务端合并时用 GREATEST 而不是 SUM。
   */
  readonly maxCoverage: number;
}

export interface FlushResult {
  readonly state: DwellState;
  readonly entries: readonly DwellEntry[];
}

const EMPTY_TOTAL: SectionTotal = Object.freeze({
  ms: 0,
  enterCount: 0,
  maxCoverage: 0,
});

/** 该可见度是否算「在看」。对 coverage 与 selfRatio 都单调不减 */
export function isViewed(visibility: SectionVisibility): boolean {
  return (
    visibility.coverage >= MIN_VIEWPORT_COVERAGE ||
    visibility.selfRatio >= MIN_SELF_RATIO
  );
}

/**
 * 挑出当前该计时的板块
 *
 * 取覆盖率最高且够格的那个;在位者只要还够格,就受 SWITCH_MARGIN 保护。
 * 在位者自己不再够格时立刻让位,不受保护 —— 否则滚出屏幕的板块会一直计时。
 */
export function pickActive(
  visibility: ReadonlyMap<string, SectionVisibility>,
  currentActive: string | null
): string | null {
  let best: string | null = null;
  let bestCoverage = -1;

  for (const [sectionId, value] of visibility) {
    if (!isViewed(value)) {
      continue;
    }
    if (value.coverage > bestCoverage) {
      best = sectionId;
      bestCoverage = value.coverage;
    }
  }

  if (best === null || currentActive === null || currentActive === best) {
    return best;
  }

  const incumbent = visibility.get(currentActive);

  if (!incumbent || !isViewed(incumbent)) {
    return best;
  }

  const advantage = bestCoverage - incumbent.coverage;

  return advantage > SWITCH_MARGIN + COMPARE_EPSILON ? best : currentActive;
}

export function createDwellState(
  now: number,
  options: { readonly idleLimitMs?: number } = {}
): DwellState {
  return {
    visibility: new Map(),
    activeId: null,
    activeSince: now,
    totals: new Map(),
    lastActivityAt: now,
    paused: false,
    idleLimitMs: options.idleLimitMs ?? DEFAULT_IDLE_LIMIT_MS,
  };
}

/**
 * 空闲回溯封顶
 *
 * 用「最后一次活动 + 上限」截断,而不是起一个定时器 —— 定时器会让测试
 * 变成异步且不可复现,而回溯封顶是纯计算,任意时间线都算得出确定结果。
 */
function creditUntil(state: DwellState, now: number): number {
  return Math.min(now, state.lastActivityAt + state.idleLimitMs);
}

/**
 * 结算当前分段并把起点推到 now
 *
 * 所有公开函数的第一步都调它,这样「累计值单调非负」「flush 守恒」
 * 「总量不超过墙钟」这几条属性是构造性成立的,而不是靠各处小心维护。
 */
function settle(state: DwellState, now: number): DwellState {
  if (state.activeId === null || state.paused) {
    return { ...state, activeSince: now };
  }

  // Math.max(0, ...) 防时钟回拨:任何情况下都不产生负增量
  const delta = Math.max(0, creditUntil(state, now) - state.activeSince);

  if (delta === 0) {
    return { ...state, activeSince: now };
  }

  const previous = state.totals.get(state.activeId) ?? EMPTY_TOTAL;
  const totals = new Map(state.totals);
  totals.set(state.activeId, { ...previous, ms: previous.ms + delta });

  return { ...state, totals, activeSince: now };
}

/** IntersectionObserver 回调翻译后的唯一入口 */
export function applyVisibility(
  state: DwellState,
  now: number,
  sectionId: string,
  next: SectionVisibility
): DwellState {
  const settled = settle(state, now);

  const visibility = new Map(settled.visibility);
  visibility.set(sectionId, next);

  const activeId = pickActive(visibility, settled.activeId);
  const totals = new Map(settled.totals);

  if (activeId !== null) {
    const previous = totals.get(activeId) ?? EMPTY_TOTAL;
    const coverage = visibility.get(activeId)?.coverage ?? 0;

    totals.set(activeId, {
      ms: previous.ms,
      // 只有在成为活动板块的那一刻才 +1,所以这是「被真正看了几次」
      enterCount: activeId === settled.activeId ? previous.enterCount : previous.enterCount + 1,
      maxCoverage: Math.max(previous.maxCoverage, coverage),
    });
  }

  return { ...settled, visibility, activeId, totals };
}

/** 任何用户活动都刷新空闲基线 */
export function markActivity(state: DwellState, now: number): DwellState {
  const settled = settle(state, now);
  return { ...settled, lastActivityAt: now };
}

/**
 * 标签页隐藏或恢复
 *
 * 恢复本身算一次用户活动:人切回来了,空闲计时理应从这一刻重新开始。
 */
export function setPaused(
  state: DwellState,
  now: number,
  paused: boolean
): DwellState {
  const settled = settle(state, now);

  if (paused) {
    return { ...settled, paused: true };
  }

  return { ...settled, paused: false, lastActivityAt: now };
}

/**
 * 取出增量并清零,当前分段带着新起点继续跑
 *
 * 这是「多次 flush 不重复计数」的不变量所在:无论 flush 多频繁,
 * 各次 flush 的毫秒之和恒等于总计入时长,flush 节奏对结果不可观测。
 */
export function flushDwell(state: DwellState, now: number): FlushResult {
  const settled = settle(state, now);

  const entries: DwellEntry[] = [];

  for (const [sectionId, total] of settled.totals) {
    if (total.ms === 0 && total.enterCount === 0) {
      continue;
    }
    entries.push({
      sectionId,
      ms: total.ms,
      enterCount: total.enterCount,
      maxCoverage: total.maxCoverage,
    });
  }

  return { state: { ...settled, totals: new Map() }, entries };
}

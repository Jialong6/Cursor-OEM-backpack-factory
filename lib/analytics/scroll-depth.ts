/**
 * 滚动深度的纯计算
 *
 * 抽出来是因为 happy-dom 里 documentElement.scrollHeight 恒为 0,
 * 在组件层根本造不出「滚到 75%」这种状态;而这套里程碑逻辑本身
 * (只报一次、跳过的档位要补报)是有真实出错空间的。
 */

/** 会上报的里程碑 */
export const SCROLL_DEPTH_MILESTONES = Object.freeze([25, 50, 75, 100] as const);

/**
 * 当前滚动进度,0-100 的整数
 *
 * 分母是「可滚动距离」而不是文档全高:文档比视口短时没有可滚动空间,
 * 此时应当直接算作看完 100%,而不是除以零。
 */
export function scrollPercent(
  scrollY: number,
  viewportHeight: number,
  documentHeight: number
): number {
  const scrollable = documentHeight - viewportHeight;

  if (!Number.isFinite(scrollable) || scrollable <= 0) {
    return 100;
  }

  const ratio = scrollY / scrollable;

  if (!Number.isFinite(ratio)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
}

/**
 * 本次滚动新达成了哪些里程碑
 *
 * 一次大幅跳转(例如点锚点直接滚到底)会同时跨过多个档位,全部补报 ——
 * 否则漏斗上会出现「到了 100% 却没到过 50%」这种自相矛盾的数据。
 */
export function newMilestones(
  percent: number,
  reached: ReadonlySet<number>
): readonly number[] {
  return SCROLL_DEPTH_MILESTONES.filter(
    (milestone) => percent >= milestone && !reached.has(milestone)
  );
}

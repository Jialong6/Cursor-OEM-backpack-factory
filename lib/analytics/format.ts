/**
 * 看板与周报共用的格式化(纯函数)
 *
 * 抽出来是因为「4200 毫秒」这种数字直接打在页面上没人读得懂,
 * 而周报邮件里要用同一套说法 —— 两处各写一遍迟早对不上。
 */

/**
 * 毫秒转成人读得懂的时长
 *
 * 一分钟以内只给秒;超过就给「分秒」。刻意不给毫秒精度:
 * 停留时长本来就有几百毫秒的观测误差,给到小数只会假装精确。
 */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) {
    return '0s';
  }

  const totalSeconds = Math.round(ms / 1000);

  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes < 60) {
    return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
  }

  const hours = Math.floor(minutes / 60);

  return `${hours}h ${minutes % 60}m`;
}

/** 千分位 */
export function formatCount(value: number): string {
  return Number.isFinite(value) ? Math.round(value).toLocaleString('en-US') : '0';
}

/**
 * 相对上一步的转化率,0-100
 *
 * 分母为零时返回 0 而不是 NaN —— 空数据的看板不该到处是 NaN。
 */
export function conversionPct(current: number, previous: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous <= 0) {
    return 0;
  }

  return Math.round((current / previous) * 1000) / 10;
}

/** 条形图的宽度百分比,最大值占满 */
export function barWidthPct(value: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0 || value <= 0) {
    return 0;
  }

  return Math.max(2, Math.min(100, Math.round((value / max) * 100)));
}

/** 环比变化,正数表示上升 */
export function deltaPct(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous <= 0) {
    return null;
  }

  return Math.round(((current - previous) / previous) * 1000) / 10;
}

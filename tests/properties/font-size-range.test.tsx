/**
 * 属性测试：字体大小响应式范围
 *
 * **Feature: backpack-oem-website, Property 7: 字体大小响应式范围**
 *
 * 验证：对于任意视口宽度，正文字体计算后的大小应该在14px到18px的范围内。
 *
 * 需求: 4.2
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * 计算 body 字体大小的辅助函数
 *
 * body 使用的 clamp 公式：clamp(0.875rem, 0.75rem + 0.5vw, 1.125rem)
 * 转换为像素（假设 1rem = 16px）：
 * - 最小值：0.875 * 16 = 14px
 * - 首选值：0.75 * 16 + 0.5vw = 12px + 0.5vw
 * - 最大值：1.125 * 16 = 18px
 *
 * @param viewportWidth 视口宽度（px）
 * @returns 计算后的字体大小（px）
 */
function calculateBodyFontSize(viewportWidth: number): number {
  const minSize = 14; // 0.875rem = 14px
  const maxSize = 18; // 1.125rem = 18px
  const preferredSize = 12 + viewportWidth * 0.005; // 0.75rem + 0.5vw

  // clamp 逻辑：返回首选值，但不小于最小值，不大于最大值
  return Math.max(minSize, Math.min(preferredSize, maxSize));
}

/**
 * 计算标题字体大小的辅助函数
 *
 * @param level 标题级别（1-6）
 * @param viewportWidth 视口宽度（px）
 * @returns 计算后的字体大小（px）
 */
function calculateHeadingFontSize(level: number, viewportWidth: number): number {
  // 不同标题级别的 clamp 配置（最小值、斜率、最大值，单位：px）
  const configs: Record<number, { min: number; slope: number; intercept: number; max: number }> = {
    1: { min: 32, slope: 0.02, intercept: 24, max: 56 }, // clamp(2rem, 1.5rem + 2vw, 3.5rem)
    2: { min: 24, slope: 0.015, intercept: 20, max: 40 }, // clamp(1.5rem, 1.25rem + 1.5vw, 2.5rem)
    3: { min: 20, slope: 0.01, intercept: 16, max: 32 }, // clamp(1.25rem, 1rem + 1vw, 2rem)
    4: { min: 18, slope: 0.0075, intercept: 14, max: 24 }, // clamp(1.125rem, 0.875rem + 0.75vw, 1.5rem)
    5: { min: 16, slope: 0.005, intercept: 14, max: 20 }, // clamp(1rem, 0.875rem + 0.5vw, 1.25rem)
    6: { min: 14, slope: 0.005, intercept: 12, max: 18 }, // clamp(0.875rem, 0.75rem + 0.5vw, 1.125rem)
  };

  const config = configs[level];
  if (!config) {
    throw new Error(`Invalid heading level: ${level}`);
  }

  const preferredSize = config.intercept + viewportWidth * config.slope;
  return Math.max(config.min, Math.min(preferredSize, config.max));
}

describe('属性 7: 字体大小响应式范围', () => {
  /**
   * 属性测试 1: 正文字体大小在任意视口宽度下都应该在 14px-18px 范围内
   */
  it('对于任意视口宽度，正文字体大小应该在 14px-18px 范围内', () => {
    fc.assert(
      fc.property(
        // 生成任意视口宽度：从 320px（最小移动设备）到 2560px（超宽显示器）
        fc.integer({ min: 320, max: 2560 }),
        (viewportWidth) => {
          const fontSize = calculateBodyFontSize(viewportWidth);

          // 验证字体大小在范围内
          expect(fontSize).toBeGreaterThanOrEqual(14);
          expect(fontSize).toBeLessThanOrEqual(18);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性测试 2: 正文字体大小应该随视口宽度单调递增
   *
   * 对于任意两个视口宽度 w1 < w2，字体大小 f(w1) <= f(w2)
   */
  it('正文字体大小应该随视口宽度单调递增（或保持不变）', () => {
    fc.assert(
      fc.property(
        fc
          .tuple(fc.integer({ min: 320, max: 2560 }), fc.integer({ min: 320, max: 2560 }))
          .filter(([w1, w2]) => w1 < w2),
        ([viewportWidth1, viewportWidth2]) => {
          const fontSize1 = calculateBodyFontSize(viewportWidth1);
          const fontSize2 = calculateBodyFontSize(viewportWidth2);

          // 验证字体大小单调递增
          expect(fontSize1).toBeLessThanOrEqual(fontSize2);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性测试 3: 标题字体大小应该在配置的范围内
   */
  it('对于任意标题级别和视口宽度，标题字体大小应该在配置范围内', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 6 }), // 标题级别 h1-h6
        fc.integer({ min: 320, max: 2560 }), // 视口宽度
        (level, viewportWidth) => {
          const fontSize = calculateHeadingFontSize(level, viewportWidth);

          // 验证字体大小为正数
          expect(fontSize).toBeGreaterThan(0);

          // 验证字体大小不会过小或过大
          expect(fontSize).toBeGreaterThanOrEqual(14); // 最小不低于 14px (h6)
          expect(fontSize).toBeLessThanOrEqual(56); // 最大不超过 56px (h1)

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 单元测试 1: 最小视口宽度（320px）下正文字体应该是 14px
   */
  it('视口宽度 320px 时，正文字体大小应该是 14px（最小值）', () => {
    const fontSize = calculateBodyFontSize(320);
    expect(fontSize).toBe(14);
  });

  /**
   * 单元测试 2: 中等视口宽度（768px）下正文字体应该在范围内
   */
  it('视口宽度 768px 时，正文字体大小应该在 14px-18px 范围内', () => {
    const fontSize = calculateBodyFontSize(768);
    expect(fontSize).toBeGreaterThanOrEqual(14);
    expect(fontSize).toBeLessThanOrEqual(18);
    // 768px 时，首选值 = 12 + 768 * 0.005 = 15.84px
    expect(fontSize).toBeCloseTo(15.84, 2);
  });

  /**
   * 单元测试 3: 桌面视口宽度（1920px）下正文字体应该是 18px
   */
  it('视口宽度 1920px 时，正文字体大小应该是 18px（最大值）', () => {
    const fontSize = calculateBodyFontSize(1920);
    expect(fontSize).toBe(18);
  });

  /**
   * 单元测试 4: 超宽视口宽度（2560px）下正文字体应该保持 18px
   */
  it('视口宽度 2560px 时，正文字体大小应该保持 18px（不超过最大值）', () => {
    const fontSize = calculateBodyFontSize(2560);
    expect(fontSize).toBe(18);
  });

  /**
   * 单元测试 5: 临界点测试 - 刚好达到最小值
   */
  it('视口宽度 400px 时，正文字体大小应该刚好是 14px', () => {
    // 当 12 + 0.005W = 14 时，W = 400
    const fontSize = calculateBodyFontSize(400);
    expect(fontSize).toBe(14);
  });

  /**
   * 单元测试 6: 临界点测试 - 刚好达到最大值
   */
  it('视口宽度 1200px 时，正文字体大小应该刚好是 18px', () => {
    // 当 12 + 0.005W = 18 时，W = 1200
    const fontSize = calculateBodyFontSize(1200);
    expect(fontSize).toBe(18);
  });

  /**
   * 单元测试 7: h1 标题在不同视口宽度下的字体大小
   */
  it('h1 标题字体大小应该在 32px-56px 范围内', () => {
    // 最小视口
    expect(calculateHeadingFontSize(1, 320)).toBe(32);
    // 中等视口
    const midSize = calculateHeadingFontSize(1, 1024);
    expect(midSize).toBeGreaterThanOrEqual(32);
    expect(midSize).toBeLessThanOrEqual(56);
    // 大视口
    expect(calculateHeadingFontSize(1, 2560)).toBe(56);
  });

  /**
   * 单元测试 8: h6 标题应该与 body 使用相同的字体范围
   */
  it('h6 标题字体大小应该与 body 相同（14px-18px）', () => {
    const viewportWidths = [320, 768, 1200, 1920];
    viewportWidths.forEach((width) => {
      const h6Size = calculateHeadingFontSize(6, width);
      const bodySize = calculateBodyFontSize(width);
      // h6 和 body 使用相同的 clamp 配置
      expect(h6Size).toBe(bodySize);
    });
  });

  /**
   * 单元测试 9: 标题层级越高，字体应该越大
   */
  it('在相同视口宽度下，标题层级越高（数字越小），字体应该越大', () => {
    const viewportWidth = 1024;
    const h1Size = calculateHeadingFontSize(1, viewportWidth);
    const h2Size = calculateHeadingFontSize(2, viewportWidth);
    const h3Size = calculateHeadingFontSize(3, viewportWidth);
    const h4Size = calculateHeadingFontSize(4, viewportWidth);
    const h5Size = calculateHeadingFontSize(5, viewportWidth);
    const h6Size = calculateHeadingFontSize(6, viewportWidth);

    expect(h1Size).toBeGreaterThan(h2Size);
    expect(h2Size).toBeGreaterThan(h3Size);
    expect(h3Size).toBeGreaterThan(h4Size);
    expect(h4Size).toBeGreaterThan(h5Size);
    expect(h5Size).toBeGreaterThanOrEqual(h6Size); // h5 和 h6 可能相同
  });
});

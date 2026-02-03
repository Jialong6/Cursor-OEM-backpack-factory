/**
 * 属性测试：动画时序和响应式断点
 *
 * 验证：
 * - 动画时长常量在 200-400ms 范围内
 * - isValidAnimationDuration 正确验证时长
 * - clampAnimationDuration 正确限制时长
 * - RESPONSIVE_BREAKPOINTS 覆盖 320-2560px
 * - AnimationVariant 类型完整
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  ANIMATION_DURATION,
  ANIMATION_EASING,
  RESPONSIVE_BREAKPOINTS,
  ANIMATION_VARIANTS,
  isValidAnimationDuration,
  clampAnimationDuration,
  type AnimationVariant,
} from '@/lib/animation'

describe('动画时序常量', () => {
  it('ANIMATION_DURATION 所有值应在 200-400ms 范围内', () => {
    const durations = Object.values(ANIMATION_DURATION) as number[]
    for (const duration of durations) {
      expect(duration).toBeGreaterThanOrEqual(200)
      expect(duration).toBeLessThanOrEqual(400)
    }
  })

  it('ANIMATION_DURATION 应包含 fast/default/slow 三个级别', () => {
    expect(ANIMATION_DURATION).toHaveProperty('fast')
    expect(ANIMATION_DURATION).toHaveProperty('default')
    expect(ANIMATION_DURATION).toHaveProperty('slow')
  })

  it('ANIMATION_DURATION 各级别应递增', () => {
    expect(ANIMATION_DURATION.fast).toBeLessThan(ANIMATION_DURATION.default)
    expect(ANIMATION_DURATION.default).toBeLessThan(ANIMATION_DURATION.slow)
  })

  it('ANIMATION_EASING 应是有效的 CSS 缓动函数', () => {
    expect(ANIMATION_EASING).toMatch(/^(ease|ease-in|ease-out|ease-in-out|cubic-bezier\(.+\))$/)
  })
})

describe('isValidAnimationDuration', () => {
  it('属性：200-400ms 范围内的值应返回 true', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 200, max: 400 }),
        (duration) => {
          expect(isValidAnimationDuration(duration)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('属性：小于 200ms 的值应返回 false', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 199 }),
        (duration) => {
          expect(isValidAnimationDuration(duration)).toBe(false)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('属性：大于 400ms 的值应返回 false', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 401, max: 5000 }),
        (duration) => {
          expect(isValidAnimationDuration(duration)).toBe(false)
        }
      ),
      { numRuns: 50 }
    )
  })
})

describe('clampAnimationDuration', () => {
  it('属性：任意输入都应返回 200-400ms 范围内的值', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 5000 }),
        (duration) => {
          const clamped = clampAnimationDuration(duration)
          expect(clamped).toBeGreaterThanOrEqual(200)
          expect(clamped).toBeLessThanOrEqual(400)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('属性：范围内的值应原样返回', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 200, max: 400 }),
        (duration) => {
          expect(clampAnimationDuration(duration)).toBe(duration)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('属性：小于 200 的值应被限制为 200', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 199 }),
        (duration) => {
          expect(clampAnimationDuration(duration)).toBe(200)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('属性：大于 400 的值应被限制为 400', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 401, max: 5000 }),
        (duration) => {
          expect(clampAnimationDuration(duration)).toBe(400)
        }
      ),
      { numRuns: 50 }
    )
  })
})

describe('RESPONSIVE_BREAKPOINTS', () => {
  it('应包含 xs 断点 (320px)', () => {
    expect(RESPONSIVE_BREAKPOINTS.xs).toBe(320)
  })

  it('应包含 3xl 断点 (2560px)', () => {
    expect(RESPONSIVE_BREAKPOINTS['3xl']).toBe(2560)
  })

  it('所有断点值应严格递增', () => {
    const values = Object.values(RESPONSIVE_BREAKPOINTS) as number[]
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1])
    }
  })

  it('所有断点值应为正整数', () => {
    const values = Object.values(RESPONSIVE_BREAKPOINTS) as number[]
    for (const value of values) {
      expect(value).toBeGreaterThan(0)
      expect(Number.isInteger(value)).toBe(true)
    }
  })
})

describe('ANIMATION_VARIANTS', () => {
  it('应包含 fade-up/fade-in/fade-left/fade-right 四种变体', () => {
    expect(ANIMATION_VARIANTS).toContain('fade-up')
    expect(ANIMATION_VARIANTS).toContain('fade-in')
    expect(ANIMATION_VARIANTS).toContain('fade-left')
    expect(ANIMATION_VARIANTS).toContain('fade-right')
  })

  it('所有变体名称应以 fade- 开头', () => {
    for (const variant of ANIMATION_VARIANTS) {
      expect(variant).toMatch(/^fade-/)
    }
  })
})

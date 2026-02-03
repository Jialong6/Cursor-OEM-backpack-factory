/**
 * 属性测试：滚动动画行为
 *
 * 验证：
 * - 初始状态不可见
 * - 可见后包含 visible 类
 * - reduced-motion 时返回空类名
 * - delay 类正确生成
 * - 所有变体都能正确工作
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { buildAnimationClassName } from '@/hooks/useScrollAnimation'
import { ANIMATION_VARIANTS, type AnimationVariant } from '@/lib/animation'

// 用于属性测试的变体 arbitrary
const variantArb = fc.constantFrom(...ANIMATION_VARIANTS) as fc.Arbitrary<AnimationVariant>
const delayArb = fc.constantFrom(0, 100, 200, 300, 400, 500)

describe('属性: 滚动动画类名生成', () => {
  it('属性: 初始状态 (isVisible=false) 时类名不包含 visible', () => {
    fc.assert(
      fc.property(
        variantArb,
        delayArb,
        (variant, delay) => {
          const className = buildAnimationClassName({
            variant,
            isVisible: false,
            delay: delay > 0 ? delay : undefined,
          })
          expect(className).not.toContain('visible')
          expect(className).toContain('scroll-animate')
        }
      ),
      { numRuns: 50 }
    )
  })

  it('属性: 可见状态 (isVisible=true) 时类名包含 visible', () => {
    fc.assert(
      fc.property(
        variantArb,
        (variant) => {
          const className = buildAnimationClassName({
            variant,
            isVisible: true,
          })
          expect(className).toContain('visible')
        }
      ),
      { numRuns: 50 }
    )
  })

  it('属性: reduced-motion 时始终返回空字符串', () => {
    fc.assert(
      fc.property(
        variantArb,
        fc.boolean(),
        delayArb,
        (variant, isVisible, delay) => {
          const className = buildAnimationClassName({
            variant,
            isVisible,
            delay: delay > 0 ? delay : undefined,
            reducedMotion: true,
          })
          expect(className).toBe('')
        }
      ),
      { numRuns: 50 }
    )
  })

  it('属性: disabled 时始终返回空字符串', () => {
    fc.assert(
      fc.property(
        variantArb,
        fc.boolean(),
        (variant, isVisible) => {
          const className = buildAnimationClassName({
            variant,
            isVisible,
            disabled: true,
          })
          expect(className).toBe('')
        }
      ),
      { numRuns: 50 }
    )
  })

  it('属性: 有 delay 时类名包含对应延迟类', () => {
    fc.assert(
      fc.property(
        variantArb,
        fc.constantFrom(100, 200, 300, 400, 500),
        (variant, delay) => {
          const className = buildAnimationClassName({
            variant,
            isVisible: false,
            delay,
          })
          expect(className).toContain(`delay-${delay}`)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('属性: 类名始终包含变体对应的特定类', () => {
    fc.assert(
      fc.property(
        variantArb,
        (variant) => {
          const className = buildAnimationClassName({
            variant,
            isVisible: false,
          })
          expect(className).toContain(`scroll-animate-${variant}`)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('属性: 无 delay 时类名不包含 delay- 前缀', () => {
    fc.assert(
      fc.property(
        variantArb,
        (variant) => {
          const className = buildAnimationClassName({
            variant,
            isVisible: false,
          })
          expect(className).not.toContain('delay-')
        }
      ),
      { numRuns: 50 }
    )
  })
})

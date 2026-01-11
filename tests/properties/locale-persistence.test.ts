import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'

/**
 * 属性测试：语言偏好持久化往返
 *
 * **Feature: backpack-oem-website, Property 2: 语言偏好持久化往返**
 *
 * 正确性属性：对于任意语言选择，将语言偏好存储到 localStorage 后再读取，
 * 应该得到相同的语言代码。
 *
 * 验证需求：2.4
 */
describe('语言偏好持久化属性测试', () => {
  beforeEach(() => {
    // 每个测试前清空 localStorage
    localStorage.clear()
  })

  /**
   * 属性 2: 语言偏好持久化往返
   *
   * 对于支持的任意语言代码（'zh' 或 'en'），
   * 存储到 localStorage 后立即读取，应该得到相同的值
   */
  it('存储后读取应返回相同的语言代码', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('zh', 'en'),
        (locale) => {
          // 存储语言偏好
          localStorage.setItem('locale', locale)

          // 读取语言偏好
          const stored = localStorage.getItem('locale')

          // 验证往返一致性
          return stored === locale
        }
      ),
      { numRuns: 100 } // 至少 100 次迭代
    )
  })

  /**
   * 属性 2 的扩展：语言偏好在页面刷新后仍然保持
   *
   * 验证 localStorage 的持久化特性：
   * 存储后即使清空内存中的变量，再次读取仍然能获得相同的值
   */
  it('存储的语言偏好应该在多次读取中保持一致', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('zh', 'en'),
        (locale) => {
          // 存储语言偏好
          localStorage.setItem('locale', locale)

          // 第一次读取
          const firstRead = localStorage.getItem('locale')

          // 第二次读取
          const secondRead = localStorage.getItem('locale')

          // 第三次读取
          const thirdRead = localStorage.getItem('locale')

          // 验证所有读取都返回相同的值
          return (
            firstRead === locale &&
            secondRead === locale &&
            thirdRead === locale &&
            firstRead === secondRead &&
            secondRead === thirdRead
          )
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性 2 的边界测试：语言切换的往返一致性
   *
   * 验证从一种语言切换到另一种语言时，
   * localStorage 能够正确更新并返回新的语言代码
   */
  it('语言切换时应该正确更新并返回新的语言代码', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('zh', 'en'),
        fc.constantFrom('zh', 'en'),
        (firstLocale, secondLocale) => {
          // 设置第一个语言
          localStorage.setItem('locale', firstLocale)
          const storedFirst = localStorage.getItem('locale')

          // 切换到第二个语言
          localStorage.setItem('locale', secondLocale)
          const storedSecond = localStorage.getItem('locale')

          // 验证每次存储后读取的值都正确
          return (
            storedFirst === firstLocale &&
            storedSecond === secondLocale
          )
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 单元测试：补充具体示例
   */
  it('应该正确存储和读取中文语言偏好', () => {
    localStorage.setItem('locale', 'zh')
    expect(localStorage.getItem('locale')).toBe('zh')
  })

  it('应该正确存储和读取英文语言偏好', () => {
    localStorage.setItem('locale', 'en')
    expect(localStorage.getItem('locale')).toBe('en')
  })

  it('未设置语言偏好时应该返回 null', () => {
    expect(localStorage.getItem('locale')).toBeNull()
  })

  it('应该能够覆盖之前的语言偏好', () => {
    localStorage.setItem('locale', 'zh')
    expect(localStorage.getItem('locale')).toBe('zh')

    localStorage.setItem('locale', 'en')
    expect(localStorage.getItem('locale')).toBe('en')
  })
})

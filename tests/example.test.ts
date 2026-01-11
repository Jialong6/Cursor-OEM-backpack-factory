import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * 示例测试套件：验证 Vitest + fast-check 环境配置
 */
describe('测试环境验证', () => {
  /**
   * 基础单元测试：验证 Vitest 正常工作
   */
  it('基础断言测试', () => {
    expect(1 + 1).toBe(2)
    expect('Hello').toBe('Hello')
    expect(true).toBeTruthy()
  })

  /**
   * 属性测试：验证 fast-check 正常工作
   * Property: 任意两个数字相加后的结果应该等于第二个数字加第一个数字（交换律）
   */
  it('属性测试：加法交换律', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return a + b === b + a
      })
    )
  })

  /**
   * 属性测试：验证字符串连接
   * Property: 字符串长度等于两个子串长度之和
   */
  it('属性测试：字符串连接长度', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (str1, str2) => {
        const combined = str1 + str2
        return combined.length === str1.length + str2.length
      })
    )
  })

  /**
   * 属性测试：验证数组操作
   * Property: 数组反转两次应该等于原数组
   */
  it('属性测试：数组反转幂等性', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), (arr) => {
        const reversed = [...arr].reverse().reverse()
        return JSON.stringify(reversed) === JSON.stringify(arr)
      })
    )
  })
})

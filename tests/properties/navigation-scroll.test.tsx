import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import * as fc from 'fast-check'
import Navbar from '@/components/layout/Navbar'
import { NextIntlClientProvider } from 'next-intl'

/**
 * 属性测试：导航锚点滚动
 *
 * **Feature: backpack-oem-website, Property 4: 导航锚点滚动**
 *
 * 正确性属性：对于任意有效的导航链接点击，点击后页面应该滚动到对应区块的位置，
 * 使该区块的顶部位于视口顶部附近（考虑导航栏高度偏移 80px）。
 *
 * 验证需求：3.2, 3.5
 */

// Mock next-intl hooks
vi.mock('next-intl', async () => {
  const actual = await vi.importActual('next-intl')
  return {
    ...actual,
    useTranslations: () => (key: string) => {
      const translations: Record<string, string> = {
        banner: '首页',
        about: '关于我们',
        features: '核心优势',
        services: '服务流程',
        faq: '常见问题',
        contact: '联系我们',
        blogs: '博客',
        switchTo: '切换到',
        english: 'English',
        chinese: '中文',
      }
      return translations[key] || key
    },
    useLocale: () => 'zh',
  }
})

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/zh',
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// 模拟翻译消息
const mockMessages = {
  nav: {
    banner: '首页',
    about: '关于我们',
    features: '核心优势',
    services: '服务流程',
    faq: '常见问题',
    contact: '联系我们',
    blogs: '博客',
  },
  language: {
    switchTo: '切换到',
    english: 'English',
    chinese: '中文',
  },
}

/**
 * 导航区块 ID 列表
 */
const sectionIds = ['banner', 'about', 'features', 'services', 'faq', 'contact', 'blogs']

describe('导航锚点滚动属性测试', () => {
  let mockScrollTo: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // 清理 DOM
    document.body.innerHTML = ''

    // Mock window.scrollTo
    mockScrollTo = vi.fn()
    window.scrollTo = mockScrollTo

    // Mock IntersectionObserver
    global.IntersectionObserver = class IntersectionObserver {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
      constructor() {
        // no-op
      }
    } as any

    // 重置 window.scrollY
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 0,
    })
  })

  /**
   * 辅助函数：创建模拟的区块元素
   */
  const createMockSections = (positions: number[]) => {
    sectionIds.forEach((id, index) => {
      const section = document.createElement('section')
      section.id = id

      // Mock offsetTop 属性
      Object.defineProperty(section, 'offsetTop', {
        configurable: true,
        get: () => positions[index] || 0,
      })

      document.body.appendChild(section)
    })
  }

  /**
   * 属性 4: 导航锚点滚动 - 滚动位置计算
   *
   * 对于任意区块的 offsetTop 位置（100-5000px），
   * 点击导航链接后，应该滚动到 offsetTop - 80px 的位置
   */
  it('点击导航链接应该滚动到正确的位置（考虑导航栏高度）', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 5000 }), // 任意区块位置
        fc.constantFrom(...sectionIds), // 任意区块 ID
        (offsetTop, sectionId) => {
          // 清理 DOM
          document.body.innerHTML = ''
          mockScrollTo.mockClear()

          // 创建模拟区块（所有区块相同位置，简化测试）
          const positions = sectionIds.map(() => offsetTop)
          createMockSections(positions)

          // 渲染 Navbar
          const { container, unmount } = render(
            <NextIntlClientProvider locale="zh" messages={mockMessages}>
              <Navbar />
            </NextIntlClientProvider>
          )

          // 查找对应的导航链接
          const navLink = container.querySelector(`a[href="#${sectionId}"]`)
          if (!navLink) {
            unmount()
            return false
          }

          // 点击导航链接
          fireEvent.click(navLink)

          // 验证：window.scrollTo 被调用，且滚动到正确位置
          const navbarHeight = 80
          const expectedScrollTop = offsetTop - navbarHeight

          // 检查 scrollTo 是否被调用
          if (mockScrollTo.mock.calls.length === 0) {
            unmount()
            return false
          }

          // 获取最后一次调用的参数
          const lastCall = mockScrollTo.mock.calls[mockScrollTo.mock.calls.length - 1]
          const scrollOptions = lastCall[0] as ScrollToOptions

          // 验证滚动位置
          const result = scrollOptions.top === expectedScrollTop && scrollOptions.behavior === 'smooth'

          unmount()
          return result
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性 4: 导航锚点滚动 - 多区块滚动一致性
   *
   * 对于任意一组区块位置，点击每个导航链接后，
   * 应该滚动到对应区块的位置（offsetTop - 80px）
   */
  it('点击不同导航链接应该滚动到对应区块位置', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 100, max: 5000 }), { minLength: 7, maxLength: 7 }), // 7 个区块的位置
        (positions) => {
          // 清理 DOM
          document.body.innerHTML = ''
          mockScrollTo.mockClear()

          // 创建模拟区块
          createMockSections(positions)

          // 渲染 Navbar
          const { container, unmount } = render(
            <NextIntlClientProvider locale="zh" messages={mockMessages}>
              <Navbar />
            </NextIntlClientProvider>
          )

          const navbarHeight = 80
          let allCorrect = true

          // 测试每个导航链接
          sectionIds.forEach((sectionId, index) => {
            const navLink = container.querySelector(`a[href="#${sectionId}"]`)
            if (!navLink) {
              allCorrect = false
              return
            }

            // 清除之前的调用记录
            mockScrollTo.mockClear()

            // 点击导航链接
            fireEvent.click(navLink)

            // 验证滚动位置
            const expectedScrollTop = positions[index] - navbarHeight

            if (mockScrollTo.mock.calls.length === 0) {
              allCorrect = false
              return
            }

            const lastCall = mockScrollTo.mock.calls[mockScrollTo.mock.calls.length - 1]
            const scrollOptions = lastCall[0] as ScrollToOptions

            if (
              scrollOptions.top !== expectedScrollTop ||
              scrollOptions.behavior !== 'smooth'
            ) {
              allCorrect = false
            }
          })

          unmount()
          return allCorrect
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性 4: 导航锚点滚动 - 边界情况
   *
   * 对于位于页面顶部的区块（offsetTop < 80px），
   * 应该滚动到 0 或负值（浏览器会自动处理为 0）
   */
  it('位于顶部的区块应该正确处理导航栏高度偏移', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 80 }), // 靠近顶部的位置
        (offsetTop) => {
          // 清理 DOM
          document.body.innerHTML = ''
          mockScrollTo.mockClear()

          const positions = sectionIds.map(() => offsetTop)
          createMockSections(positions)

          const { container, unmount } = render(
            <NextIntlClientProvider locale="zh" messages={mockMessages}>
              <Navbar />
            </NextIntlClientProvider>
          )

          const navLink = container.querySelector('a[href="#banner"]')
          if (!navLink) {
            unmount()
            return false
          }

          fireEvent.click(navLink)

          const navbarHeight = 80
          const expectedScrollTop = offsetTop - navbarHeight

          if (mockScrollTo.mock.calls.length === 0) {
            unmount()
            return false
          }

          const lastCall = mockScrollTo.mock.calls[mockScrollTo.mock.calls.length - 1]
          const scrollOptions = lastCall[0] as ScrollToOptions

          // 验证：计算结果应该是 offsetTop - 80（可能是负数）
          const result = scrollOptions.top === expectedScrollTop

          unmount()
          return result
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 单元测试：补充具体示例
   */
  it('点击首页链接应该滚动到 banner 区块', () => {
    createMockSections([0, 800, 1600, 2400, 3200, 4000, 4800])

    const { container } = render(
      <NextIntlClientProvider locale="zh" messages={mockMessages}>
        <Navbar />
      </NextIntlClientProvider>
    )

    const bannerLink = container.querySelector('a[href="#banner"]')
    expect(bannerLink).toBeTruthy()

    fireEvent.click(bannerLink!)

    expect(mockScrollTo).toHaveBeenCalledWith({
      top: -80, // 0 - 80
      behavior: 'smooth',
    })
  })

  it('点击关于我们链接应该滚动到 about 区块', () => {
    createMockSections([0, 800, 1600, 2400, 3200, 4000, 4800])

    const { container } = render(
      <NextIntlClientProvider locale="zh" messages={mockMessages}>
        <Navbar />
      </NextIntlClientProvider>
    )

    const aboutLink = container.querySelector('a[href="#about"]')
    expect(aboutLink).toBeTruthy()

    fireEvent.click(aboutLink!)

    expect(mockScrollTo).toHaveBeenCalledWith({
      top: 720, // 800 - 80
      behavior: 'smooth',
    })
  })

  it('点击核心优势链接应该滚动到 features 区块', () => {
    createMockSections([0, 800, 1600, 2400, 3200, 4000, 4800])

    const { container } = render(
      <NextIntlClientProvider locale="zh" messages={mockMessages}>
        <Navbar />
      </NextIntlClientProvider>
    )

    const featuresLink = container.querySelector('a[href="#features"]')
    expect(featuresLink).toBeTruthy()

    fireEvent.click(featuresLink!)

    expect(mockScrollTo).toHaveBeenCalledWith({
      top: 1520, // 1600 - 80
      behavior: 'smooth',
    })
  })

  it('点击联系我们链接应该滚动到 contact 区块', () => {
    createMockSections([0, 800, 1600, 2400, 3200, 4000, 4800])

    const { container } = render(
      <NextIntlClientProvider locale="zh" messages={mockMessages}>
        <Navbar />
      </NextIntlClientProvider>
    )

    const contactLink = container.querySelector('a[href="#contact"]')
    expect(contactLink).toBeTruthy()

    fireEvent.click(contactLink!)

    expect(mockScrollTo).toHaveBeenCalledWith({
      top: 3920, // 4000 - 80
      behavior: 'smooth',
    })
  })

  it('滚动行为应该始终是 smooth', () => {
    createMockSections([0, 1000, 2000, 3000, 4000, 5000, 6000])

    const { container } = render(
      <NextIntlClientProvider locale="zh" messages={mockMessages}>
        <Navbar />
      </NextIntlClientProvider>
    )

    // 测试所有导航链接
    sectionIds.forEach((sectionId) => {
      mockScrollTo.mockClear()

      const navLink = container.querySelector(`a[href="#${sectionId}"]`)
      if (navLink) {
        fireEvent.click(navLink)

        expect(mockScrollTo).toHaveBeenCalled()
        const lastCall = mockScrollTo.mock.calls[mockScrollTo.mock.calls.length - 1]
        const scrollOptions = lastCall[0] as ScrollToOptions

        expect(scrollOptions.behavior).toBe('smooth')
      }
    })
  })

  it('点击不存在的区块链接应该不触发滚动', () => {
    // 不创建任何区块元素
    const { container } = render(
      <NextIntlClientProvider locale="zh" messages={mockMessages}>
        <Navbar />
      </NextIntlClientProvider>
    )

    const bannerLink = container.querySelector('a[href="#banner"]')
    if (bannerLink) {
      fireEvent.click(bannerLink)

      // 因为目标元素不存在，不应该调用 scrollTo
      expect(mockScrollTo).not.toHaveBeenCalled()
    }
  })

  it('导航栏高度偏移应该是 80px', () => {
    createMockSections([1000, 2000, 3000, 4000, 5000, 6000, 7000])

    const { container } = render(
      <NextIntlClientProvider locale="zh" messages={mockMessages}>
        <Navbar />
      </NextIntlClientProvider>
    )

    const aboutLink = container.querySelector('a[href="#about"]')
    fireEvent.click(aboutLink!)

    const lastCall = mockScrollTo.mock.calls[mockScrollTo.mock.calls.length - 1]
    const scrollOptions = lastCall[0] as ScrollToOptions

    // 验证偏移量：2000 - 80 = 1920
    expect(scrollOptions.top).toBe(1920)
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import * as fc from 'fast-check'
import Navbar from '@/components/layout/Navbar'
import { NextIntlClientProvider } from 'next-intl'

/**
 * 属性测试：响应式汉堡菜单
 *
 * **Feature: backpack-oem-website, Property 6: 响应式汉堡菜单**
 *
 * 正确性属性：对于任意视口宽度，当宽度小于768px时汉堡菜单按钮应该可见且导航链接列表隐藏，
 * 当宽度大于等于768px时汉堡菜单按钮应该隐藏且导航链接列表可见。
 *
 * 验证需求：5.4
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

describe('响应式汉堡菜单属性测试', () => {
  beforeEach(() => {
    // 清理 DOM
    document.body.innerHTML = ''
    // 重置视口宽度
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  /**
   * 辅助函数：设置视口宽度并触发 resize 事件
   */
  const setViewportWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    })
    window.dispatchEvent(new Event('resize'))
  }

  /**
   * 辅助函数：检查元素是否通过 CSS 隐藏
   * 在 Tailwind 中，md:hidden 会在桌面端添加 display: none
   */
  const isHiddenByCSS = (element: HTMLElement, viewportWidth: number): boolean => {
    const classList = element.className

    // 检查 md:hidden（在 >= 768px 时隐藏）
    if (classList.includes('md:hidden') && viewportWidth >= 768) {
      return true
    }

    // 检查 hidden md:flex（在 < 768px 时隐藏）
    if (classList.includes('hidden') && classList.includes('md:flex') && viewportWidth < 768) {
      return true
    }

    return false
  }

  /**
   * 属性 6: 响应式汉堡菜单（移动端）
   *
   * 对于任意小于 768px 的视口宽度，
   * 汉堡菜单按钮应该可见（没有被 md:hidden 隐藏）
   */
  it('小于 768px 时汉堡菜单按钮应该可见', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 767 }), // 移动端宽度范围
        (width) => {
          setViewportWidth(width)

          const { container } = render(
            <NextIntlClientProvider locale="zh" messages={mockMessages}>
              <Navbar />
            </NextIntlClientProvider>
          )

          // 查找汉堡菜单按钮（通过 aria-label 或 aria-expanded）
          const hamburgerButton = container.querySelector('button.md\\:hidden, button[aria-label="Open menu"], button[aria-label="Close menu"]')

          // 验证：汉堡菜单按钮存在
          if (!hamburgerButton) {
            return false
          }

          // 验证：汉堡菜单按钮在移动端不应被隐藏
          const isHidden = isHiddenByCSS(hamburgerButton as HTMLElement, width)

          return !isHidden
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 属性 6: 响应式汉堡菜单（桌面端）
   *
   * 对于任意大于等于 768px 的视口宽度，
   * 导航链接列表应该可见，汉堡菜单按钮应该隐藏
   */
  it('大于等于 768px 时导航链接应该可见且汉堡菜单按钮应该隐藏', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 768, max: 1920 }), // 桌面端宽度范围
        (width) => {
          setViewportWidth(width)

          const { container } = render(
            <NextIntlClientProvider locale="zh" messages={mockMessages}>
              <Navbar />
            </NextIntlClientProvider>
          )

          // 查找汉堡菜单按钮（通过 aria-label 或 aria-expanded）
          const hamburgerButton = container.querySelector('button.md\\:hidden, button[aria-label="Open menu"], button[aria-label="Close menu"]')

          // 查找桌面端导航链接容器（包含 hidden md:flex 的 div）
          const desktopNav = container.querySelector('.hidden.md\\:flex')

          // 验证：汉堡菜单按钮应该被隐藏
          const hamburgerHidden = hamburgerButton
            ? isHiddenByCSS(hamburgerButton as HTMLElement, width)
            : true

          // 验证：桌面端导航链接应该可见
          const desktopNavVisible = desktopNav
            ? !isHiddenByCSS(desktopNav as HTMLElement, width)
            : false

          return hamburgerHidden && desktopNavVisible
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 单元测试：补充具体示例
   */
  it('320px 宽度（iPhone SE）时应该显示汉堡菜单', () => {
    setViewportWidth(320)

    const { container } = render(
      <NextIntlClientProvider locale="zh" messages={mockMessages}>
        <Navbar />
      </NextIntlClientProvider>
    )

    const hamburgerButton = container.querySelector('button.md\\:hidden, button[aria-label="Open menu"], button[aria-label="Close menu"]')
    expect(hamburgerButton).toBeTruthy()
    expect(hamburgerButton?.className).toContain('md:hidden')
  })

  it('768px 宽度（iPad 竖屏）时应该显示桌面导航', () => {
    setViewportWidth(768)

    const { container } = render(
      <NextIntlClientProvider locale="zh" messages={mockMessages}>
        <Navbar />
      </NextIntlClientProvider>
    )

    const desktopNav = container.querySelector('.hidden.md\\:flex')
    expect(desktopNav).toBeTruthy()
  })

  it('1920px 宽度（桌面显示器）时应该隐藏汉堡菜单', () => {
    setViewportWidth(1920)

    const { container } = render(
      <NextIntlClientProvider locale="zh" messages={mockMessages}>
        <Navbar />
      </NextIntlClientProvider>
    )

    const hamburgerButton = container.querySelector('button.md\\:hidden, button[aria-label="Open menu"], button[aria-label="Close menu"]')
    expect(hamburgerButton?.className).toContain('md:hidden')
  })
})

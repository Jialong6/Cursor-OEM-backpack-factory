/**
 * useAnchorScroll —— 六处「滚动到联系区」的唯一入口
 *
 * 收敛之前,站内有三处逐字相同的 handleScrollToContact、FAQ 的内联变体、
 * CostAdvantage 的纯 <a>(连偏移和平滑都没有)、以及浮窗那个目标不同的版本。
 * 直接往六处塞埋点等于把代码复制六份,还一定会有谁漏埋。
 *
 * 算法沿用现有 useSmoothScroll 的 offsetTop:本站唯一的定位祖先是
 * app/[locale]/page.tsx 的 <div className="relative">,它从文档 y=0 起
 * (Navbar 是 fixed,不占文档流),所以 offsetTop 与「文档绝对位置」等价。
 * 现有的 use-navigation 与 navigation-scroll 两个测试文件就是这条的守卫。
 */
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { NAVBAR_HEIGHT } from '@/lib/navigation'

const { trackMock } = vi.hoisted(() => ({ trackMock: vi.fn() }))

vi.mock('@/lib/analytics/beacon', () => ({
  track: trackMock,
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/de/blog',
}))

import { useAnchorScroll } from '@/hooks/useNavigation'

let scrollToMock: ReturnType<typeof vi.fn>

function addSection(id: string, offsetTop: number): void {
  const section = document.createElement('section')
  section.id = id
  Object.defineProperty(section, 'offsetTop', { value: offsetTop, configurable: true })
  document.body.appendChild(section)
}

function setHref(): { get: () => string } {
  let assigned = ''
  Object.defineProperty(window, 'location', {
    value: {
      ...window.location,
      set href(value: string) {
        assigned = value
      },
      get href() {
        return assigned
      },
    },
    configurable: true,
    writable: true,
  })
  return { get: () => assigned }
}

beforeEach(() => {
  document.body.innerHTML = ''
  trackMock.mockReset()
  scrollToMock = vi.fn()
  window.scrollTo = scrollToMock as unknown as typeof window.scrollTo
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('滚动行为', () => {
  test('滚到目标板块并减去导航栏高度', () => {
    addSection('contact', 2_400)
    const { result } = renderHook(() => useAnchorScroll())

    result.current('#contact')

    expect(scrollToMock).toHaveBeenCalledWith({
      top: 2_400 - NAVBAR_HEIGHT,
      behavior: 'smooth',
    })
  })

  test('接受不带井号的目标', () => {
    addSection('contact', 1_000)
    const { result } = renderHook(() => useAnchorScroll())

    result.current('contact')

    expect(scrollToMock).toHaveBeenCalledWith({
      top: 1_000 - NAVBAR_HEIGHT,
      behavior: 'smooth',
    })
  })

  test('可以传入自定义的导航栏高度', () => {
    addSection('contact', 1_000)
    const { result } = renderHook(() => useAnchorScroll(120))

    result.current('#contact')

    expect(scrollToMock).toHaveBeenCalledWith({ top: 880, behavior: 'smooth' })
  })

  test('浮窗用的另一个目标同样走这条路', () => {
    addSection('contact-form', 3_000)
    const { result } = renderHook(() => useAnchorScroll())

    result.current('#contact-form')

    expect(scrollToMock).toHaveBeenCalledWith({
      top: 3_000 - NAVBAR_HEIGHT,
      behavior: 'smooth',
    })
  })
})

describe('事件参数是可选的', () => {
  test('传了带 href 的元素事件时阻止默认跳转', () => {
    addSection('contact', 500)
    const preventDefault = vi.fn()
    const { result } = renderHook(() => useAnchorScroll())

    result.current('#contact', { preventDefault })

    expect(preventDefault).toHaveBeenCalledTimes(1)
  })

  test('button 场景不传事件也能工作', () => {
    addSection('contact', 500)
    const { result } = renderHook(() => useAnchorScroll())

    expect(() => result.current('#contact', null)).not.toThrow()
    expect(scrollToMock).toHaveBeenCalledTimes(1)
  })
})

describe('当前页面没有该板块时跳回首页锚点', () => {
  test('整页跳转,让浏览器原生处理 hash 滚动', () => {
    const location = setHref()
    const { result } = renderHook(() => useAnchorScroll())

    result.current('#contact')

    expect(scrollToMock).not.toHaveBeenCalled()
    expect(location.get()).toBe('/de#contact')
  })

  test('同样阻止默认跳转,避免浏览器先跳一次', () => {
    setHref()
    const preventDefault = vi.fn()
    const { result } = renderHook(() => useAnchorScroll())

    result.current('#contact', { preventDefault })

    expect(preventDefault).toHaveBeenCalledTimes(1)
  })
})

describe('减少动效偏好', () => {
  test('开启后不做平滑滚动', () => {
    addSection('contact', 900)
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          matches: query.includes('prefers-reduced-motion'),
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }) as unknown as MediaQueryList
    )

    const { result } = renderHook(() => useAnchorScroll())
    result.current('#contact')

    expect(scrollToMock).toHaveBeenCalledWith({
      top: 900 - NAVBAR_HEIGHT,
      behavior: 'auto',
    })
  })
})

describe('埋点', () => {
  test('带了来源就上报一次 cta_click,且立刻发送', () => {
    addSection('contact', 500)
    const { result } = renderHook(() => useAnchorScroll())

    result.current('#contact', null, { cta: 'hero_primary' })

    expect(trackMock).toHaveBeenCalledTimes(1)
    expect(trackMock).toHaveBeenCalledWith(
      'cta_click',
      { cta: 'hero_primary', target: 'contact' },
      { immediate: true }
    )
  })

  test('没带来源就不上报 —— 例如程序内部触发的滚动', () => {
    addSection('contact', 500)
    const { result } = renderHook(() => useAnchorScroll())

    result.current('#contact')

    expect(trackMock).not.toHaveBeenCalled()
  })

  test('目标不存在、要跳回首页时也算一次点击', () => {
    setHref()
    const { result } = renderHook(() => useAnchorScroll())

    result.current('#contact', null, { cta: 'faq' })

    expect(trackMock).toHaveBeenCalledTimes(1)
  })
})

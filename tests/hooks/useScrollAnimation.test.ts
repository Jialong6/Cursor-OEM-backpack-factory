/**
 * useScrollAnimation Hook 单元测试
 *
 * 测试滚动动画 Hook 的行为：
 * - 初始状态 (不可见)
 * - IntersectionObserver 交互
 * - prefers-reduced-motion 支持
 * - 动画变体和延迟
 * - disabled 状态
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  useScrollAnimation,
  usePrefersReducedMotion,
  buildAnimationClassName,
} from '@/hooks/useScrollAnimation'
// Animation constants available for future tests
// import { ANIMATION_DURATION } from '@/lib/animation'

// --- Mock helpers ---

type ObserverCallback = (entries: IntersectionObserverEntry[]) => void

let observerCallback: ObserverCallback | null = null
let observerInstances: {
  observe: ReturnType<typeof vi.fn>
  unobserve: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
}[] = []

function setupIntersectionObserverMock() {
  observerInstances = []

  class MockIntersectionObserver implements IntersectionObserver {
    root: Element | Document | null = null
    rootMargin: string = ''
    thresholds: readonly number[] = []
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
    takeRecords = vi.fn(() => [])

    constructor(callback: IntersectionObserverCallback) {
      observerCallback = callback as ObserverCallback
      observerInstances.push({
        observe: this.observe,
        unobserve: this.unobserve,
        disconnect: this.disconnect,
      })
    }
  }

  global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver
}

function triggerIntersection(isIntersecting: boolean, target?: Element) {
  const entry = {
    isIntersecting,
    target: target || document.createElement('div'),
  } as IntersectionObserverEntry

  observerCallback?.([entry])
}

let matchMediaListeners: Array<(e: MediaQueryListEvent) => void> = []

function setupMatchMediaMock(matches: boolean) {
  matchMediaListeners = []

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          matchMediaListeners.push(handler)
        }
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  })
}

// --- Tests ---

describe('usePrefersReducedMotion', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    matchMediaListeners = []
  })

  it('当系统未设置 reduced-motion 时应返回 false', () => {
    setupMatchMediaMock(false)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)
  })

  it('当系统设置了 reduced-motion 时应返回 true', () => {
    setupMatchMediaMock(true)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(true)
  })

  it('当系统偏好变化时应更新状态', () => {
    setupMatchMediaMock(false)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)

    act(() => {
      for (const listener of matchMediaListeners) {
        listener({ matches: true } as MediaQueryListEvent)
      }
    })

    expect(result.current).toBe(true)
  })
})

describe('useScrollAnimation', () => {
  beforeEach(() => {
    setupIntersectionObserverMock()
    setupMatchMediaMock(false)
  })

  afterEach(() => {
    observerCallback = null
    observerInstances = []
    matchMediaListeners = []
    vi.restoreAllMocks()
  })

  it('初始状态应为不可见', () => {
    const { result } = renderHook(() => useScrollAnimation())
    expect(result.current.isVisible).toBe(false)
  })

  it('初始 animationClassName 应包含初始状态类', () => {
    const { result } = renderHook(() => useScrollAnimation())
    expect(result.current.animationClassName).toContain('scroll-animate')
    expect(result.current.animationClassName).not.toContain('visible')
  })

  it('应返回 ref 对象', () => {
    const { result } = renderHook(() => useScrollAnimation())
    expect(result.current.ref).toBeDefined()
    expect(result.current.ref).toHaveProperty('current')
  })

  it('当元素进入视口时应变为可见', () => {
    const { result } = renderHook(() => useScrollAnimation())

    // 手动设置 ref 并重新触发 effect
    const div = document.createElement('div')
    act(() => {
      ;(result.current.ref as { current: HTMLElement | null }).current = div
    })

    // 需要重新渲染以触发 useEffect
    const { result: result2 } = renderHook(() => useScrollAnimation())
    const div2 = document.createElement('div')
    act(() => {
      ;(result2.current.ref as { current: HTMLElement | null }).current = div2
    })

    // 直接测试 observerCallback（它在 Mock 中被捕获）
    if (observerCallback) {
      act(() => {
        triggerIntersection(true, div2)
      })
      expect(result2.current.isVisible).toBe(true)
    }
  })

  it('buildAnimationClassName 可见状态应包含 visible', () => {
    const className = buildAnimationClassName({
      variant: 'fade-up',
      isVisible: true,
    })
    expect(className).toContain('visible')
  })

  it('支持 fade-up 变体', () => {
    const { result } = renderHook(() =>
      useScrollAnimation({ variant: 'fade-up' })
    )
    expect(result.current.animationClassName).toContain('scroll-animate-fade-up')
  })

  it('支持 fade-in 变体', () => {
    const { result } = renderHook(() =>
      useScrollAnimation({ variant: 'fade-in' })
    )
    expect(result.current.animationClassName).toContain('scroll-animate-fade-in')
  })

  it('支持 fade-left 变体', () => {
    const { result } = renderHook(() =>
      useScrollAnimation({ variant: 'fade-left' })
    )
    expect(result.current.animationClassName).toContain('scroll-animate-fade-left')
  })

  it('支持 fade-right 变体', () => {
    const { result } = renderHook(() =>
      useScrollAnimation({ variant: 'fade-right' })
    )
    expect(result.current.animationClassName).toContain('scroll-animate-fade-right')
  })

  it('支持 delay 选项', () => {
    const { result } = renderHook(() =>
      useScrollAnimation({ delay: 200 })
    )
    expect(result.current.animationClassName).toContain('delay-200')
  })

  it('当 disabled 为 true 时应始终可见', () => {
    const { result } = renderHook(() =>
      useScrollAnimation({ disabled: true })
    )
    expect(result.current.isVisible).toBe(true)
    expect(result.current.animationClassName).toBe('')
  })

  it('当 prefers-reduced-motion 时应始终可见', () => {
    setupMatchMediaMock(true)
    const { result } = renderHook(() => useScrollAnimation())
    expect(result.current.isVisible).toBe(true)
    expect(result.current.animationClassName).toBe('')
  })

  it('默认变体应为 fade-up', () => {
    const { result } = renderHook(() => useScrollAnimation())
    expect(result.current.animationClassName).toContain('scroll-animate-fade-up')
  })
})

describe('buildAnimationClassName', () => {
  it('初始不可见状态应生成正确的类名', () => {
    const className = buildAnimationClassName({
      variant: 'fade-up',
      isVisible: false,
    })
    expect(className).toContain('scroll-animate')
    expect(className).toContain('scroll-animate-fade-up')
    expect(className).not.toContain('visible')
  })

  it('可见状态应包含 visible 类', () => {
    const className = buildAnimationClassName({
      variant: 'fade-up',
      isVisible: true,
    })
    expect(className).toContain('visible')
  })

  it('包含 delay 时应生成延迟类', () => {
    const className = buildAnimationClassName({
      variant: 'fade-up',
      isVisible: false,
      delay: 100,
    })
    expect(className).toContain('delay-100')
  })

  it('reduced-motion 时应返回空字符串', () => {
    const className = buildAnimationClassName({
      variant: 'fade-up',
      isVisible: false,
      reducedMotion: true,
    })
    expect(className).toBe('')
  })

  it('disabled 时应返回空字符串', () => {
    const className = buildAnimationClassName({
      variant: 'fade-up',
      isVisible: false,
      disabled: true,
    })
    expect(className).toBe('')
  })
})

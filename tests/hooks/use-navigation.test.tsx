import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import * as fc from 'fast-check'
import {
  useScrollState,
  useActiveSection,
  useSmoothScroll,
  useMobileMenu,
} from '@/hooks/useNavigation'
import { NAVBAR_HEIGHT, SCROLL_THRESHOLD, SECTION_IDS } from '@/lib/navigation'

/**
 * Navigation Hooks property tests
 *
 * Tests for useScrollState, useActiveSection, useSmoothScroll, useMobileMenu
 */

/**
 * Helper to clear all child nodes from an element
 */
function clearElement(element: HTMLElement): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild)
  }
}

/**
 * Helper to create a section element
 */
function createSection(id: string, offsetTop?: number): HTMLElement {
  const section = document.createElement('section')
  section.id = id
  if (offsetTop !== undefined) {
    Object.defineProperty(section, 'offsetTop', {
      value: offsetTop,
      configurable: true,
    })
  }
  return section
}

describe('useScrollState', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 0,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return false when scrollY <= threshold', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: SCROLL_THRESHOLD }),
        (scrollY) => {
          Object.defineProperty(window, 'scrollY', { value: scrollY, configurable: true })

          const { result } = renderHook(() => useScrollState())

          // Trigger scroll event
          act(() => {
            window.dispatchEvent(new Event('scroll'))
          })

          return result.current === false
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should return true when scrollY > threshold', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: SCROLL_THRESHOLD + 1, max: 5000 }),
        (scrollY) => {
          Object.defineProperty(window, 'scrollY', { value: scrollY, configurable: true })

          const { result } = renderHook(() => useScrollState())

          act(() => {
            window.dispatchEvent(new Event('scroll'))
          })

          return result.current === true
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should support custom threshold', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 200 }), // custom threshold
        fc.integer({ min: 0, max: 500 }), // scrollY
        (threshold, scrollY) => {
          Object.defineProperty(window, 'scrollY', { value: scrollY, configurable: true })

          const { result } = renderHook(() => useScrollState(threshold))

          act(() => {
            window.dispatchEvent(new Event('scroll'))
          })

          const expected = scrollY > threshold
          return result.current === expected
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('useActiveSection', () => {
  let observerCallback: IntersectionObserverCallback | null = null

  beforeEach(() => {
    clearElement(document.body)

    // Mock IntersectionObserver as a class
    class MockIntersectionObserver implements IntersectionObserver {
      root: Element | Document | null = null
      rootMargin: string = ''
      thresholds: readonly number[] = []

      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback
      }

      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
      takeRecords = vi.fn(() => [])
    }

    global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver
  })

  afterEach(() => {
    observerCallback = null
    vi.restoreAllMocks()
  })

  it('should return default section initially', () => {
    const { result } = renderHook(() => useActiveSection())
    expect(result.current).toBe('banner')
  })

  it('should update when section intersects', () => {
    // Create mock sections
    SECTION_IDS.forEach((id) => {
      document.body.appendChild(createSection(id))
    })

    const { result } = renderHook(() => useActiveSection())

    // Simulate intersection
    const mockEntry = {
      isIntersecting: true,
      target: document.getElementById('about')!,
    } as IntersectionObserverEntry

    act(() => {
      observerCallback?.([mockEntry], {} as IntersectionObserver)
    })

    expect(result.current).toBe('about')
  })

  it('should only have one active section at a time', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SECTION_IDS),
        (sectionId) => {
          // Create mock sections
          clearElement(document.body)
          SECTION_IDS.forEach((id) => {
            document.body.appendChild(createSection(id))
          })

          const { result } = renderHook(() => useActiveSection())

          const mockEntry = {
            isIntersecting: true,
            target: document.getElementById(sectionId)!,
          } as IntersectionObserverEntry

          act(() => {
            observerCallback?.([mockEntry], {} as IntersectionObserver)
          })

          // The active section should match the intersecting section
          return result.current === sectionId
        }
      ),
      { numRuns: 50 }
    )
  })
})

describe('useSmoothScroll', () => {
  let mockScrollTo: ReturnType<typeof vi.fn>

  beforeEach(() => {
    clearElement(document.body)
    mockScrollTo = vi.fn()
    window.scrollTo = mockScrollTo
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should scroll to correct position with navbar offset', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 5000 }), // offsetTop
        fc.constantFrom(...SECTION_IDS),
        (offsetTop, sectionId) => {
          clearElement(document.body)
          mockScrollTo.mockClear()

          // Create section with offsetTop
          document.body.appendChild(createSection(sectionId, offsetTop))

          const { result } = renderHook(() => useSmoothScroll())

          const mockEvent = {
            preventDefault: vi.fn(),
          } as unknown as React.MouseEvent<HTMLAnchorElement>

          act(() => {
            result.current(mockEvent, `#${sectionId}`)
          })

          if (mockScrollTo.mock.calls.length === 0) return false

          const scrollOptions = mockScrollTo.mock.calls[0][0] as ScrollToOptions
          const expectedTop = offsetTop - NAVBAR_HEIGHT

          return (
            scrollOptions.top === expectedTop && scrollOptions.behavior === 'smooth'
          )
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should support custom navbar height', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 40, max: 120 }), // custom navbar height
        fc.integer({ min: 100, max: 5000 }), // offsetTop
        (navbarHeight, offsetTop) => {
          clearElement(document.body)
          mockScrollTo.mockClear()

          document.body.appendChild(createSection('test', offsetTop))

          const { result } = renderHook(() => useSmoothScroll(navbarHeight))

          const mockEvent = {
            preventDefault: vi.fn(),
          } as unknown as React.MouseEvent<HTMLAnchorElement>

          act(() => {
            result.current(mockEvent, '#test')
          })

          if (mockScrollTo.mock.calls.length === 0) return false

          const scrollOptions = mockScrollTo.mock.calls[0][0] as ScrollToOptions
          const expectedTop = offsetTop - navbarHeight

          return scrollOptions.top === expectedTop
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should always use smooth behavior', () => {
    document.body.appendChild(createSection('test', 500))

    const { result } = renderHook(() => useSmoothScroll())

    const mockEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.MouseEvent<HTMLAnchorElement>

    act(() => {
      result.current(mockEvent, '#test')
    })

    const scrollOptions = mockScrollTo.mock.calls[0][0] as ScrollToOptions
    expect(scrollOptions.behavior).toBe('smooth')
  })

  it('should not scroll if target element does not exist', () => {
    const { result } = renderHook(() => useSmoothScroll())

    const mockEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.MouseEvent<HTMLAnchorElement>

    act(() => {
      result.current(mockEvent, '#nonexistent')
    })

    expect(mockScrollTo).not.toHaveBeenCalled()
  })
})

describe('useMobileMenu', () => {
  beforeEach(() => {
    document.body.style.overflow = 'unset'
  })

  afterEach(() => {
    document.body.style.overflow = 'unset'
    vi.restoreAllMocks()
  })

  it('should initialize with closed state', () => {
    const { result } = renderHook(() => useMobileMenu())
    expect(result.current.isOpen).toBe(false)
  })

  it('should toggle menu state', () => {
    const { result } = renderHook(() => useMobileMenu())

    act(() => {
      result.current.toggle()
    })
    expect(result.current.isOpen).toBe(true)

    act(() => {
      result.current.toggle()
    })
    expect(result.current.isOpen).toBe(false)
  })

  it('should close menu', () => {
    const { result } = renderHook(() => useMobileMenu())

    act(() => {
      result.current.toggle()
    })
    expect(result.current.isOpen).toBe(true)

    act(() => {
      result.current.close()
    })
    expect(result.current.isOpen).toBe(false)
  })

  it('should close menu on ESC key', () => {
    const { result } = renderHook(() => useMobileMenu())

    act(() => {
      result.current.toggle()
    })
    expect(result.current.isOpen).toBe(true)

    act(() => {
      const escEvent = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(escEvent)
    })

    expect(result.current.isOpen).toBe(false)
  })

  it('should not close menu on other keys', () => {
    const { result } = renderHook(() => useMobileMenu())

    act(() => {
      result.current.toggle()
    })
    expect(result.current.isOpen).toBe(true)

    fc.assert(
      fc.property(
        fc.constantFrom('Enter', 'Tab', 'Space', 'ArrowUp', 'ArrowDown', 'a', 'b'),
        (key) => {
          act(() => {
            const keyEvent = new KeyboardEvent('keydown', { key })
            document.dispatchEvent(keyEvent)
          })

          // Menu should still be open
          return result.current.isOpen === true
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should lock body scroll when open', () => {
    const { result } = renderHook(() => useMobileMenu())

    act(() => {
      result.current.toggle()
    })

    expect(document.body.style.overflow).toBe('hidden')
  })

  it('should unlock body scroll when closed', () => {
    const { result } = renderHook(() => useMobileMenu())

    act(() => {
      result.current.toggle()
    })
    act(() => {
      result.current.close()
    })

    expect(document.body.style.overflow).toBe('unset')
  })

  it('should provide menuRef', () => {
    const { result } = renderHook(() => useMobileMenu())
    expect(result.current.menuRef).toBeDefined()
    expect(result.current.menuRef.current).toBeNull()
  })
})

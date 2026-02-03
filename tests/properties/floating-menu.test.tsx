import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import * as fc from 'fast-check'
import FloatingMenu, {
  FloatingMenuItem,
} from '@/components/layout/FloatingMenu'

/**
 * FloatingMenu property tests
 *
 * Key property: Position boundary validity
 */

describe('FloatingMenu', () => {
  let mockScrollTo: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockScrollTo = vi.fn()
    window.scrollTo = mockScrollTo

    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 0,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const defaultItems: FloatingMenuItem[] = [
    {
      id: 'top',
      icon: <span>Up</span>,
      label: 'Back to top',
      onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
    },
  ]

  it('should render with default props', () => {
    const { container } = render(<FloatingMenu items={defaultItems} />)
    const menu = container.firstChild as HTMLElement

    expect(menu).toBeTruthy()
    expect(menu.className).toContain('fixed')
  })

  it('should position at bottom-right by default', () => {
    const { container } = render(<FloatingMenu items={defaultItems} />)
    const menu = container.firstChild as HTMLElement

    expect(menu.className).toContain('bottom-')
    expect(menu.className).toContain('right-')
  })

  it('should position at bottom-left when specified', () => {
    const { container } = render(
      <FloatingMenu items={defaultItems} position="bottom-left" />
    )
    const menu = container.firstChild as HTMLElement

    expect(menu.className).toContain('bottom-')
    expect(menu.className).toContain('left-')
  })

  it('should render all menu items', () => {
    const items: FloatingMenuItem[] = [
      { id: 'item1', icon: <span>1</span>, label: 'Item 1', onClick: vi.fn() },
      { id: 'item2', icon: <span>2</span>, label: 'Item 2', onClick: vi.fn() },
      { id: 'item3', icon: <span>3</span>, label: 'Item 3', onClick: vi.fn() },
    ]

    const { container } = render(<FloatingMenu items={items} />)
    const buttons = container.querySelectorAll('button')

    expect(buttons.length).toBe(items.length)
  })

  it('should call onClick when item is clicked', () => {
    const mockOnClick = vi.fn()
    const items: FloatingMenuItem[] = [
      { id: 'test', icon: <span>Test</span>, label: 'Test', onClick: mockOnClick },
    ]

    const { container } = render(<FloatingMenu items={items} />)
    const button = container.querySelector('button')

    fireEvent.click(button!)

    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('should have valid position classes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('bottom-right', 'bottom-left') as fc.Arbitrary<
          'bottom-right' | 'bottom-left'
        >,
        (position) => {
          const { container, unmount } = render(
            <FloatingMenu items={defaultItems} position={position} />
          )
          const menu = container.firstChild as HTMLElement
          const className = menu.className

          const hasValidPosition =
            (position === 'bottom-right' &&
              className.includes('bottom-') &&
              className.includes('right-')) ||
            (position === 'bottom-left' &&
              className.includes('bottom-') &&
              className.includes('left-'))

          unmount()
          return hasValidPosition
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should be hidden by default when showOnScroll is true and page not scrolled', () => {
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })

    const { container } = render(
      <FloatingMenu items={defaultItems} showOnScroll={true} />
    )

    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })

    const menu = container.firstChild as HTMLElement

    expect(menu.className).toContain('opacity-0')
  })

  it('should be visible when showOnScroll is true and page is scrolled', () => {
    Object.defineProperty(window, 'scrollY', { value: 500, configurable: true })

    const { container } = render(
      <FloatingMenu items={defaultItems} showOnScroll={true} />
    )

    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })

    const menu = container.firstChild as HTMLElement

    expect(menu.className).toContain('opacity-100')
  })

  it('should always be visible when showOnScroll is false', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 5000 }),
        (scrollY) => {
          Object.defineProperty(window, 'scrollY', {
            value: scrollY,
            configurable: true,
          })

          const { container, unmount } = render(
            <FloatingMenu items={defaultItems} showOnScroll={false} />
          )

          act(() => {
            window.dispatchEvent(new Event('scroll'))
          })

          const menu = container.firstChild as HTMLElement
          const isVisible = menu.className.includes('opacity-100')

          unmount()
          return isVisible
        }
      ),
      { numRuns: 20 }
    )
  })

  it('should have proper accessibility attributes', () => {
    const { container } = render(<FloatingMenu items={defaultItems} />)
    const buttons = container.querySelectorAll('button')

    buttons.forEach((button) => {
      expect(button.getAttribute('aria-label')).toBeTruthy()
    })
  })

  it('should have focus styles on buttons', () => {
    const { container } = render(<FloatingMenu items={defaultItems} />)
    const button = container.querySelector('button')

    expect(button?.className).toContain('focus:')
  })

  it('should maintain z-index for visibility over content', () => {
    const { container } = render(<FloatingMenu items={defaultItems} />)
    const menu = container.firstChild as HTMLElement

    expect(menu.className).toContain('z-')
  })
})

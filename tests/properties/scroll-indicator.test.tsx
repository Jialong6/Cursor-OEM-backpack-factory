import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import * as fc from 'fast-check'
import ScrollIndicator from '@/components/layout/ScrollIndicator'

/**
 * ScrollIndicator property tests
 *
 * Key property: Progress value is always between 0-100%
 */

describe('ScrollIndicator', () => {
  beforeEach(() => {
    // Reset scroll position
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 0,
    })

    // Mock document dimensions
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      writable: true,
      configurable: true,
      value: 2000,
    })

    Object.defineProperty(document.documentElement, 'clientHeight', {
      writable: true,
      configurable: true,
      value: 800,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render with default props', () => {
    const { container } = render(<ScrollIndicator />)
    const indicator = container.firstChild as HTMLElement

    expect(indicator).toBeTruthy()
    expect(indicator.className).toContain('fixed')
  })

  it('should have progress between 0 and 100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 5000 }), // scrollY
        fc.integer({ min: 500, max: 10000 }), // scrollHeight
        fc.integer({ min: 300, max: 1200 }), // clientHeight
        (scrollY, scrollHeight, clientHeight) => {
          // Ensure scrollHeight > clientHeight (page is scrollable)
          const actualScrollHeight = Math.max(scrollHeight, clientHeight + 100)

          Object.defineProperty(window, 'scrollY', {
            value: scrollY,
            configurable: true,
          })
          Object.defineProperty(document.documentElement, 'scrollHeight', {
            value: actualScrollHeight,
            configurable: true,
          })
          Object.defineProperty(document.documentElement, 'clientHeight', {
            value: clientHeight,
            configurable: true,
          })

          const { container, unmount } = render(<ScrollIndicator />)

          // Trigger scroll event
          act(() => {
            window.dispatchEvent(new Event('scroll'))
          })

          // Find the progress bar inner element
          const progressBar = container.querySelector('[style*="width"]')

          if (!progressBar) {
            unmount()
            return true // If no progress bar, that's acceptable
          }

          const style = (progressBar as HTMLElement).style
          const widthStr = style.width || '0%'
          const width = parseFloat(widthStr)

          unmount()

          // Property: width should be between 0 and 100
          return width >= 0 && width <= 100
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should show 0% at top of page', () => {
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })

    const { container } = render(<ScrollIndicator />)

    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })

    const progressBar = container.querySelector('[style*="width"]')
    const width = parseFloat((progressBar as HTMLElement)?.style.width || '0')

    expect(width).toBe(0)
  })

  it('should show 100% at bottom of page', () => {
    // scrollY at bottom = scrollHeight - clientHeight
    Object.defineProperty(window, 'scrollY', { value: 1200, configurable: true })
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 2000,
      configurable: true,
    })
    Object.defineProperty(document.documentElement, 'clientHeight', {
      value: 800,
      configurable: true,
    })

    const { container } = render(<ScrollIndicator />)

    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })

    const progressBar = container.querySelector('[style*="width"]')
    const width = parseFloat((progressBar as HTMLElement)?.style.width || '0')

    expect(width).toBe(100)
  })

  it('should accept custom color', () => {
    const { container } = render(<ScrollIndicator color="bg-red-500" />)
    // The progress bar is the inner div with the style attribute
    const progressBar = container.querySelector('[style*="width"]')

    expect(progressBar?.className).toContain('bg-red-500')
  })

  it('should accept custom height', () => {
    const { container } = render(<ScrollIndicator height={6} />)
    const indicator = container.firstChild as HTMLElement

    expect(indicator.className).toContain('h-1.5')
  })

  it('should position at top by default', () => {
    const { container } = render(<ScrollIndicator />)
    const indicator = container.firstChild as HTMLElement

    expect(indicator.className).toContain('top-0')
  })

  it('should position at bottom when specified', () => {
    const { container } = render(<ScrollIndicator position="bottom" />)
    const indicator = container.firstChild as HTMLElement

    expect(indicator.className).toContain('bottom-0')
  })

  it('should update on scroll', () => {
    const { container } = render(<ScrollIndicator />)

    // Initial state
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })

    const progressBar = container.querySelector('[style*="width"]') as HTMLElement
    const initialWidth = parseFloat(progressBar?.style.width || '0')

    // Scroll to middle
    Object.defineProperty(window, 'scrollY', { value: 600, configurable: true })
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })

    const newWidth = parseFloat(progressBar?.style.width || '0')

    expect(newWidth).toBeGreaterThan(initialWidth)
  })

  it('should have proper z-index for visibility', () => {
    const { container } = render(<ScrollIndicator />)
    const indicator = container.firstChild as HTMLElement

    expect(indicator.className).toContain('z-')
  })
})

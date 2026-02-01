import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import * as fc from 'fast-check'
import React from 'react'

/**
 * Property 12: Touch Target Minimum Size
 *
 * WCAG 2.2 AA Success Criterion 2.5.8: Target Size (Minimum)
 * All interactive touch targets must be at least 44x44 CSS pixels.
 *
 * This property test validates that all Button component variants
 * and sizes maintain the minimum touch target requirement.
 */

// Mock next-intl
vi.mock('next-intl', async () => {
  const actual = await vi.importActual('next-intl')
  return {
    ...actual,
    useTranslations: () => {
      const t = (key: string) => {
        const translations: Record<string, string> = {
          'button.loading': 'Loading...',
        }
        return translations[key] || key
      }
      return t
    },
    useLocale: () => 'en',
  }
})

// Import Button component (will fail initially - RED phase)
import Button from '@/components/ui/Button'

// Type definitions for Button props
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

describe('Property 12: Touch Target Minimum Size (44x44px)', () => {
  /**
   * Core property test: All button size/variant combinations
   * must have minimum height of 44px for touch targets.
   */
  it('should ensure all button variants and sizes have min-height >= 44px', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ButtonSize>('sm', 'md', 'lg'),
        fc.constantFrom<ButtonVariant>('primary', 'secondary', 'outline', 'ghost'),
        (size, variant) => {
          const { container } = render(
            <Button size={size} variant={variant}>
              Test Button
            </Button>
          )
          const button = container.querySelector('button')
          expect(button).not.toBeNull()

          // Verify min-height class is present
          const minHeightClasses = ['min-h-[44px]', 'min-h-[48px]', 'min-h-[56px]']
          const hasMinHeight = minHeightClasses.some(cls =>
            button?.className.includes(cls)
          )

          expect(hasMinHeight).toBe(true)
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Small buttons must have exactly min-h-[44px]
   */
  it('should ensure small buttons have min-h-[44px] (WCAG minimum)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ButtonVariant>('primary', 'secondary', 'outline', 'ghost'),
        (variant) => {
          const { container } = render(
            <Button size="sm" variant={variant}>
              Small
            </Button>
          )
          const button = container.querySelector('button')
          expect(button?.className).toContain('min-h-[44px]')
          return true
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property: Medium buttons must have min-h-[48px]
   */
  it('should ensure medium buttons have min-h-[48px]', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ButtonVariant>('primary', 'secondary', 'outline', 'ghost'),
        (variant) => {
          const { container } = render(
            <Button size="md" variant={variant}>
              Medium
            </Button>
          )
          const button = container.querySelector('button')
          expect(button?.className).toContain('min-h-[48px]')
          return true
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property: Large buttons must have min-h-[56px]
   */
  it('should ensure large buttons have min-h-[56px]', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ButtonVariant>('primary', 'secondary', 'outline', 'ghost'),
        (variant) => {
          const { container } = render(
            <Button size="lg" variant={variant}>
              Large
            </Button>
          )
          const button = container.querySelector('button')
          expect(button?.className).toContain('min-h-[56px]')
          return true
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Unit test: Loading state should set aria-busy
   */
  it('should set aria-busy="true" when loading', () => {
    render(<Button isLoading>Loading</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-busy', 'true')
  })

  /**
   * Unit test: Disabled state should set aria-disabled
   */
  it('should set aria-disabled="true" when disabled', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).toBeDisabled()
  })

  /**
   * Unit test: Loading button should be disabled
   */
  it('should disable button when loading', () => {
    render(<Button isLoading>Submit</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  /**
   * Unit test: Button should have visible focus indicator
   */
  it('should have focus ring classes for keyboard navigation', () => {
    const { container } = render(<Button>Focusable</Button>)
    const button = container.querySelector('button')
    expect(button?.className).toContain('focus:ring-2')
    expect(button?.className).toContain('focus:ring-offset-2')
  })

  /**
   * Unit test: Button with icons should maintain touch target
   */
  it('should maintain touch target with left icon', () => {
    const LeftIcon = () => <span data-testid="left-icon">L</span>
    const { container } = render(
      <Button size="sm" leftIcon={<LeftIcon />}>
        With Icon
      </Button>
    )
    const button = container.querySelector('button')
    expect(button?.className).toContain('min-h-[44px]')
    expect(screen.getByTestId('left-icon')).toBeInTheDocument()
  })

  /**
   * Unit test: fullWidth button should span container width
   */
  it('should have w-full class when fullWidth is true', () => {
    const { container } = render(<Button fullWidth>Full Width</Button>)
    const button = container.querySelector('button')
    expect(button?.className).toContain('w-full')
  })

  /**
   * Property: Random button text should not affect touch target size
   */
  it('should maintain touch target regardless of text length', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.constantFrom<ButtonSize>('sm', 'md', 'lg'),
        (text, size) => {
          const { container } = render(
            <Button size={size}>{text}</Button>
          )
          const button = container.querySelector('button')
          const minHeightClasses = ['min-h-[44px]', 'min-h-[48px]', 'min-h-[56px]']
          const hasMinHeight = minHeightClasses.some(cls =>
            button?.className.includes(cls)
          )
          expect(hasMinHeight).toBe(true)
          return true
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Unit test: Default size should be 'md'
   */
  it('should use medium size by default', () => {
    const { container } = render(<Button>Default</Button>)
    const button = container.querySelector('button')
    expect(button?.className).toContain('min-h-[48px]')
  })

  /**
   * Unit test: Default variant should be 'primary'
   */
  it('should use primary variant by default', () => {
    const { container } = render(<Button>Default</Button>)
    const button = container.querySelector('button')
    expect(button?.className).toContain('bg-primary')
  })
})

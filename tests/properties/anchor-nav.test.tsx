import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import * as fc from 'fast-check'
import AnchorNav from '@/components/layout/AnchorNav'
import { SECTION_IDS, NAV_ITEMS } from '@/lib/navigation'
import { NextIntlClientProvider } from 'next-intl'

/**
 * AnchorNav property tests
 *
 * Key property: Click scroll consistency
 */

// Mock translations
const mockMessages = {
  nav: {
    banner: 'Home',
    about: 'About Us',
    features: 'Features',
    services: 'Services',
    faq: 'FAQ',
    contact: 'Contact',
    blog: 'Blog',
  },
}

const renderWithIntl = (component: React.ReactNode) => {
  return render(
    <NextIntlClientProvider locale="en" messages={mockMessages}>
      {component}
    </NextIntlClientProvider>
  )
}

describe('AnchorNav', () => {
  let mockOnNavClick: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnNavClick = vi.fn()
  })

  it('should render with default props', () => {
    const { container } = renderWithIntl(
      <AnchorNav activeSection="banner" onNavClick={mockOnNavClick} />
    )

    const nav = container.querySelector('nav')
    expect(nav).toBeTruthy()
  })

  it('should render all section indicators', () => {
    const { container } = renderWithIntl(
      <AnchorNav activeSection="banner" onNavClick={mockOnNavClick} />
    )

    // By default, dots variant shows NAV_ITEMS.length buttons
    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBe(NAV_ITEMS.length)
  })

  it('should highlight only the active section', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SECTION_IDS),
        (activeSection) => {
          const { container, unmount } = renderWithIntl(
            <AnchorNav
              activeSection={activeSection}
              onNavClick={mockOnNavClick}
              variant="dots"
            />
          )

          const buttons = container.querySelectorAll('button')
          let activeCount = 0

          buttons.forEach((button) => {
            // Active button has bg-primary, inactive has bg-neutral-300
            if (button.className.includes('bg-primary')) {
              activeCount++
            }
          })

          unmount()

          // Property: exactly one button should be active
          return activeCount === 1
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should call onNavClick with correct href when clicked', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...NAV_ITEMS),
        (navItem) => {
          mockOnNavClick.mockClear()

          const { container, unmount } = renderWithIntl(
            <AnchorNav
              activeSection="banner"
              onNavClick={mockOnNavClick}
              variant="dots"
            />
          )

          // Find button by aria-label containing the section key
          const buttons = container.querySelectorAll('button')
          const targetIndex = NAV_ITEMS.findIndex((item) => item.id === navItem.id)
          const targetButton = buttons[targetIndex]

          if (!targetButton) {
            unmount()
            return false
          }

          fireEvent.click(targetButton)

          const result =
            mockOnNavClick.mock.calls.length === 1 &&
            mockOnNavClick.mock.calls[0][1] === navItem.href

          unmount()
          return result
        }
      ),
      { numRuns: 20 }
    )
  })

  it('should support dots variant', () => {
    const { container } = renderWithIntl(
      <AnchorNav
        activeSection="banner"
        onNavClick={mockOnNavClick}
        variant="dots"
      />
    )

    const buttons = container.querySelectorAll('button')

    // Dots are small circles
    buttons.forEach((button) => {
      expect(button.className).toContain('rounded-full')
    })
  })

  it('should support lines variant', () => {
    const { container } = renderWithIntl(
      <AnchorNav
        activeSection="banner"
        onNavClick={mockOnNavClick}
        variant="lines"
      />
    )

    const buttons = container.querySelectorAll('button')

    // Lines have different width/height ratio
    buttons.forEach((button) => {
      expect(button.className).toContain('rounded')
    })
  })

  it('should support labels variant', () => {
    const { container } = renderWithIntl(
      <AnchorNav
        activeSection="banner"
        onNavClick={mockOnNavClick}
        variant="labels"
      />
    )

    // Labels variant shows text
    const textContent = container.textContent
    expect(textContent).toContain('Home')
  })

  it('should have proper accessibility attributes', () => {
    const { container } = renderWithIntl(
      <AnchorNav activeSection="banner" onNavClick={mockOnNavClick} />
    )

    const buttons = container.querySelectorAll('button')

    buttons.forEach((button) => {
      expect(button.getAttribute('aria-label')).toBeTruthy()
    })
  })

  it('should position on the right side of the viewport', () => {
    const { container } = renderWithIntl(
      <AnchorNav activeSection="banner" onNavClick={mockOnNavClick} />
    )

    const nav = container.querySelector('nav')
    expect(nav?.className).toContain('fixed')
    expect(nav?.className).toContain('right-')
  })

  it('should be vertically centered', () => {
    const { container } = renderWithIntl(
      <AnchorNav activeSection="banner" onNavClick={mockOnNavClick} />
    )

    const nav = container.querySelector('nav')
    expect(nav?.className).toContain('top-1/2')
  })

  it('should have consistent order of items', () => {
    const { container } = renderWithIntl(
      <AnchorNav
        activeSection="banner"
        onNavClick={mockOnNavClick}
        variant="labels"
      />
    )

    const buttons = container.querySelectorAll('button')

    // Verify order matches NAV_ITEMS
    buttons.forEach((button, index) => {
      const ariaLabel = button.getAttribute('aria-label')
      expect(ariaLabel).toContain(mockMessages.nav[NAV_ITEMS[index].key as keyof typeof mockMessages.nav])
    })
  })

  it('should be hidden on mobile screens', () => {
    const { container } = renderWithIntl(
      <AnchorNav activeSection="banner" onNavClick={mockOnNavClick} />
    )

    const nav = container.querySelector('nav')
    expect(nav?.className).toContain('hidden')
    expect(nav?.className).toContain('lg:flex')
  })
})

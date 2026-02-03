import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import * as fc from 'fast-check'
import DesktopNav from '@/components/layout/DesktopNav'
import { NAV_ITEMS, SECTION_IDS } from '@/lib/navigation'
import { NextIntlClientProvider } from 'next-intl'

/**
 * DesktopNav property tests
 *
 * Key property: Active state uniqueness - only one nav item can be active at a time
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

describe('DesktopNav', () => {
  let mockOnNavClick: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnNavClick = vi.fn()
  })

  it('should render all navigation items', () => {
    const { container } = renderWithIntl(
      <DesktopNav
        activeSection="banner"
        isScrolled={false}
        onNavClick={mockOnNavClick}
      />
    )

    NAV_ITEMS.forEach(({ href }) => {
      const link = container.querySelector(`a[href="${href}"]`)
      expect(link).toBeTruthy()
    })
  })

  it('should have exactly one active item at a time', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SECTION_IDS),
        fc.boolean(),
        (activeSection, isScrolled) => {
          const { container, unmount } = renderWithIntl(
            <DesktopNav
              activeSection={activeSection}
              isScrolled={isScrolled}
              onNavClick={mockOnNavClick}
            />
          )

          // Find all links
          const links = container.querySelectorAll('a')

          // Count active items by checking for active class patterns
          let activeCount = 0
          links.forEach((link) => {
            const classList = link.className
            // Active state has 'bg-primary/10' when scrolled or 'bg-white/30' when not scrolled
            if (
              classList.includes('bg-primary/10') ||
              classList.includes('bg-white/30')
            ) {
              activeCount++
            }
          })

          unmount()

          // Property: exactly one item should be active
          return activeCount === 1
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should highlight the correct section', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SECTION_IDS),
        (activeSection) => {
          const { container, unmount } = renderWithIntl(
            <DesktopNav
              activeSection={activeSection}
              isScrolled={true}
              onNavClick={mockOnNavClick}
            />
          )

          const activeLink = container.querySelector(`a[href="#${activeSection}"]`)

          if (!activeLink) {
            unmount()
            return false
          }

          // The active link should have the active class
          const result = activeLink.className.includes('bg-primary/10')

          unmount()
          return result
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should apply different styles based on scroll state', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SECTION_IDS),
        fc.boolean(),
        (activeSection, isScrolled) => {
          const { container, unmount } = renderWithIntl(
            <DesktopNav
              activeSection={activeSection}
              isScrolled={isScrolled}
              onNavClick={mockOnNavClick}
            />
          )

          const activeLink = container.querySelector(`a[href="#${activeSection}"]`)

          if (!activeLink) {
            unmount()
            return false
          }

          let result: boolean
          if (isScrolled) {
            // Scrolled: active should have bg-primary/10
            result = activeLink.className.includes('bg-primary/10')
          } else {
            // Not scrolled: active should have bg-white/30
            result = activeLink.className.includes('bg-white/30')
          }

          unmount()
          return result
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
            <DesktopNav
              activeSection="banner"
              isScrolled={false}
              onNavClick={mockOnNavClick}
            />
          )

          const link = container.querySelector(`a[href="${navItem.href}"]`)

          if (!link) {
            unmount()
            return false
          }

          fireEvent.click(link)

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

  it('should have proper accessibility attributes', () => {
    const { container } = renderWithIntl(
      <DesktopNav
        activeSection="banner"
        isScrolled={false}
        onNavClick={mockOnNavClick}
      />
    )

    const links = container.querySelectorAll('a')

    links.forEach((link) => {
      // Each link should have href
      expect(link.getAttribute('href')).toBeTruthy()
    })
  })

  it('should be hidden on mobile (md:flex)', () => {
    const { container } = renderWithIntl(
      <DesktopNav
        activeSection="banner"
        isScrolled={false}
        onNavClick={mockOnNavClick}
      />
    )

    const nav = container.firstChild as HTMLElement
    expect(nav.className).toContain('hidden')
    expect(nav.className).toContain('md:flex')
  })
})

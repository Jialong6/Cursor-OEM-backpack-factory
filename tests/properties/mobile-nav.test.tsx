import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import * as fc from 'fast-check'
import MobileNav from '@/components/layout/MobileNav'
import { NAV_ITEMS, SECTION_IDS } from '@/lib/navigation'
import { NextIntlClientProvider } from 'next-intl'
import React from 'react'

/**
 * MobileNav property tests
 *
 * 注意：抽屉通过 createPortal 渲染到 document.body（脱离 navbar 的 backdrop-filter
 * 包含块）。因此抽屉/遮罩/导航项用 document.querySelector 查询；汉堡按钮仍在
 * render 的 container 内，用 container 查询。tests/setup.ts 的 afterEach(cleanup)
 * 保证每个测试后 DOM 清理，document 查询互不串扰。
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

describe('MobileNav', () => {
  let mockOnToggle: ReturnType<typeof vi.fn>
  let mockOnClose: ReturnType<typeof vi.fn>
  let mockOnNavClick: ReturnType<typeof vi.fn>
  let menuRef: React.RefObject<HTMLDivElement | null>

  beforeEach(() => {
    mockOnToggle = vi.fn()
    mockOnClose = vi.fn()
    mockOnNavClick = vi.fn()
    menuRef = React.createRef<HTMLDivElement | null>()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render hamburger button', () => {
    const { container } = renderWithIntl(
      <MobileNav
        isOpen={false}
        onToggle={mockOnToggle}
        onClose={mockOnClose}
        activeSection="banner"
        isScrolled={false}
        onNavClick={mockOnNavClick}
        menuRef={menuRef}
      />
    )

    const button = container.querySelector('button')
    expect(button).toBeTruthy()
    expect(button?.getAttribute('aria-label')).toBeTruthy()
  })

  it('should render the drawer (portaled to body) when open', () => {
    renderWithIntl(
      <MobileNav
        isOpen={true}
        onToggle={mockOnToggle}
        onClose={mockOnClose}
        activeSection="banner"
        isScrolled={false}
        onNavClick={mockOnNavClick}
        menuRef={menuRef}
      />
    )

    // 抽屉 portal 到 document.body：开启时应存在
    const drawer = document.querySelector('[class*="fixed inset-0"]')
    expect(drawer).toBeTruthy()
  })

  it('should NOT render the drawer when closed (conditional render)', () => {
    renderWithIntl(
      <MobileNav
        isOpen={false}
        onToggle={mockOnToggle}
        onClose={mockOnClose}
        activeSection="banner"
        isScrolled={false}
        onNavClick={mockOnNavClick}
        menuRef={menuRef}
      />
    )

    // 条件渲染：关闭时抽屉不在 DOM 中
    const drawer = document.querySelector('[class*="fixed inset-0"]')
    expect(drawer).toBeFalsy()
  })

  it('should render all navigation items when open', () => {
    renderWithIntl(
      <MobileNav
        isOpen={true}
        onToggle={mockOnToggle}
        onClose={mockOnClose}
        activeSection="banner"
        isScrolled={false}
        onNavClick={mockOnNavClick}
        menuRef={menuRef}
      />
    )

    NAV_ITEMS.forEach(({ href }) => {
      const link = document.querySelector(`a[href="${href}"]`)
      expect(link).toBeTruthy()
    })
  })

  it('should call onToggle when hamburger button is clicked', () => {
    const { container } = renderWithIntl(
      <MobileNav
        isOpen={false}
        onToggle={mockOnToggle}
        onClose={mockOnClose}
        activeSection="banner"
        isScrolled={false}
        onNavClick={mockOnNavClick}
        menuRef={menuRef}
      />
    )

    const button = container.querySelector('button')
    fireEvent.click(button!)

    expect(mockOnToggle).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when backdrop is clicked', () => {
    renderWithIntl(
      <MobileNav
        isOpen={true}
        onToggle={mockOnToggle}
        onClose={mockOnClose}
        activeSection="banner"
        isScrolled={false}
        onNavClick={mockOnNavClick}
        menuRef={menuRef}
      />
    )

    // Click the backdrop (the div with bg-black/50)
    const backdrop = document.querySelector('[class*="bg-black/50"]')
    fireEvent.click(backdrop!)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should have exactly one active item at a time', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SECTION_IDS),
        fc.boolean(),
        (activeSection, isScrolled) => {
          const { unmount } = renderWithIntl(
            <MobileNav
              isOpen={true}
              onToggle={mockOnToggle}
              onClose={mockOnClose}
              activeSection={activeSection}
              isScrolled={isScrolled}
              onNavClick={mockOnNavClick}
              menuRef={menuRef}
            />
          )

          // Find all links in the menu drawer (portaled to body)
          const menuDrawer = document.querySelector('nav')
          if (!menuDrawer) {
            unmount()
            return false
          }

          const links = menuDrawer.querySelectorAll('a')

          // Count active items
          let activeCount = 0
          links.forEach((link) => {
            if (link.className.includes('bg-primary/10')) {
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
          const { unmount } = renderWithIntl(
            <MobileNav
              isOpen={true}
              onToggle={mockOnToggle}
              onClose={mockOnClose}
              activeSection={activeSection}
              isScrolled={false}
              onNavClick={mockOnNavClick}
              menuRef={menuRef}
            />
          )

          const activeLink = document.querySelector(`a[href="#${activeSection}"]`)

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

  it('should call onNavClick with correct href when nav item clicked', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...NAV_ITEMS),
        (navItem) => {
          mockOnNavClick.mockClear()

          const { unmount } = renderWithIntl(
            <MobileNav
              isOpen={true}
              onToggle={mockOnToggle}
              onClose={mockOnClose}
              activeSection="banner"
              isScrolled={false}
              onNavClick={mockOnNavClick}
              menuRef={menuRef}
            />
          )

          const link = document.querySelector(`a[href="${navItem.href}"]`)

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

  it('should have proper aria attributes on hamburger button', () => {
    fc.assert(
      fc.property(fc.boolean(), (isOpen) => {
        const { container, unmount } = renderWithIntl(
          <MobileNav
            isOpen={isOpen}
            onToggle={mockOnToggle}
            onClose={mockOnClose}
            activeSection="banner"
            isScrolled={false}
            onNavClick={mockOnNavClick}
            menuRef={menuRef}
          />
        )

        const button = container.querySelector('button')

        if (!button) {
          unmount()
          return false
        }

        // Should have aria-expanded matching isOpen state
        const ariaExpanded = button.getAttribute('aria-expanded')
        const result = ariaExpanded === String(isOpen)

        unmount()
        return result
      }),
      { numRuns: 10 }
    )
  })

  it('should animate hamburger icon based on open state', () => {
    fc.assert(
      fc.property(fc.boolean(), (isOpen) => {
        const { container, unmount } = renderWithIntl(
          <MobileNav
            isOpen={isOpen}
            onToggle={mockOnToggle}
            onClose={mockOnClose}
            activeSection="banner"
            isScrolled={false}
            onNavClick={mockOnNavClick}
            menuRef={menuRef}
          />
        )

        const button = container.querySelector('button')
        const spans = button?.querySelectorAll('span')

        if (!spans || spans.length < 3) {
          unmount()
          return false
        }

        // When open, first span should have rotate-45
        // When closed, first span should not have rotate-45
        const firstSpan = spans[0]
        const hasRotation = firstSpan.className.includes('rotate-45')

        unmount()
        return hasRotation === isOpen
      }),
      { numRuns: 10 }
    )
  })

  it('should only be visible on mobile (md:hidden)', () => {
    const { container } = renderWithIntl(
      <MobileNav
        isOpen={false}
        onToggle={mockOnToggle}
        onClose={mockOnClose}
        activeSection="banner"
        isScrolled={false}
        onNavClick={mockOnNavClick}
        menuRef={menuRef}
      />
    )

    const button = container.querySelector('button')
    expect(button?.className).toContain('md:hidden')
  })
})

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import * as fc from 'fast-check'
import Breadcrumb, { BreadcrumbItem } from '@/components/layout/Breadcrumb'

/**
 * Breadcrumb property tests
 *
 * Key property: Hierarchy order correctness
 */

describe('Breadcrumb', () => {
  const defaultItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'Backpacks' },
  ]

  it('should render with default props', () => {
    const { container } = render(<Breadcrumb items={defaultItems} />)
    const nav = container.querySelector('nav')

    expect(nav).toBeTruthy()
    expect(nav?.getAttribute('aria-label')).toBe('Breadcrumb')
  })

  it('should render all items in order', () => {
    const { container } = render(<Breadcrumb items={defaultItems} />)
    const items = container.querySelectorAll('li')

    expect(items.length).toBe(defaultItems.length)

    // Verify order
    items.forEach((item, index) => {
      expect(item.textContent).toContain(defaultItems[index].label)
    })
  })

  it('should render links for items with href', () => {
    const { container } = render(<Breadcrumb items={defaultItems} />)
    const links = container.querySelectorAll('a')

    // First two items have href
    expect(links.length).toBe(2)
    expect(links[0].getAttribute('href')).toBe('/')
    expect(links[1].getAttribute('href')).toBe('/products')
  })

  it('should not render link for last item (current page)', () => {
    const { container } = render(<Breadcrumb items={defaultItems} />)
    const items = container.querySelectorAll('li')
    const lastItem = items[items.length - 1]

    // Last item should have aria-current
    const currentElement = lastItem.querySelector('[aria-current="page"]')
    expect(currentElement).toBeTruthy()

    // Last item should not have a link
    const lastLink = lastItem.querySelector('a')
    expect(lastLink).toBeNull()
  })

  it('should maintain hierarchy order for any valid items', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            label: fc.string({ minLength: 1, maxLength: 20 }),
            href: fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
              nil: undefined,
            }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (items) => {
          const validItems = items.map((item, index) => ({
            label: item.label || `Item${index}`,
            href: index < items.length - 1 ? item.href || `/${index}` : undefined,
          }))

          const { container, unmount } = render(
            <Breadcrumb items={validItems} />
          )
          const renderedItems = container.querySelectorAll('li')

          // Property: items should be in the same order
          let orderCorrect = renderedItems.length === validItems.length
          if (orderCorrect) {
            renderedItems.forEach((item, index) => {
              if (!item.textContent?.includes(validItems[index].label)) {
                orderCorrect = false
              }
            })
          }

          unmount()
          return orderCorrect
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should use default separator', () => {
    const { container } = render(<Breadcrumb items={defaultItems} />)

    // Default separator is "/"
    const textContent = container.textContent
    expect(textContent).toContain('/')
  })

  it('should accept custom separator', () => {
    const { container } = render(
      <Breadcrumb items={defaultItems} separator={<span>&gt;</span>} />
    )

    const textContent = container.textContent
    expect(textContent).toContain('>')
  })

  it('should render separators between items', () => {
    const { container } = render(<Breadcrumb items={defaultItems} />)
    const items = container.querySelectorAll('li')

    // Each item except the last should be followed by a separator
    items.forEach((item, index) => {
      if (index < items.length - 1) {
        const separator = item.querySelector('[aria-hidden="true"]')
        expect(separator).toBeTruthy()
      }
    })
  })

  it('should have proper ARIA attributes', () => {
    const { container } = render(<Breadcrumb items={defaultItems} />)

    const nav = container.querySelector('nav')
    expect(nav?.getAttribute('aria-label')).toBe('Breadcrumb')

    const ol = container.querySelector('ol')
    expect(ol).toBeTruthy()
  })

  it('should handle single item', () => {
    const singleItem: BreadcrumbItem[] = [{ label: 'Home' }]
    const { container } = render(<Breadcrumb items={singleItem} />)

    const items = container.querySelectorAll('li')
    expect(items.length).toBe(1)

    const currentElement = container.querySelector('[aria-current="page"]')
    expect(currentElement).toBeTruthy()
  })

  it('should style current page differently', () => {
    const { container } = render(<Breadcrumb items={defaultItems} />)
    const currentElement = container.querySelector('[aria-current="page"]')

    expect(currentElement?.className).toContain('font-medium')
  })

  it('should style links with hover effect', () => {
    const { container } = render(<Breadcrumb items={defaultItems} />)
    const links = container.querySelectorAll('a')

    links.forEach((link) => {
      expect(link.className).toContain('hover:')
    })
  })
})

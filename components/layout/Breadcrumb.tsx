import Link from 'next/link'
import { ReactNode } from 'react'

/**
 * Breadcrumb item configuration
 */
export interface BreadcrumbItem {
  /** Display label for the breadcrumb item */
  label: string
  /** Optional href for linking (omit for current page) */
  href?: string
}

/**
 * Breadcrumb component props
 */
export interface BreadcrumbProps {
  /** Array of breadcrumb items in order */
  items: BreadcrumbItem[]
  /** Custom separator between items (default: "/") */
  separator?: ReactNode
}

/**
 * Breadcrumb navigation component
 *
 * Displays a hierarchical navigation path showing the user's location
 * within the site structure.
 *
 * Features:
 * - Semantic HTML (nav > ol > li)
 * - ARIA attributes for accessibility
 * - Links for all items except current page
 * - Customizable separator
 * - Hover styles on links
 */
export default function Breadcrumb({
  items,
  separator = <span className="mx-2 text-neutral-400">/</span>,
}: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex items-center flex-wrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={index} className="flex items-center">
              {isLast ? (
                // Current page (no link)
                <span
                  aria-current="page"
                  className="font-medium text-neutral-900"
                >
                  {item.label}
                </span>
              ) : (
                // Linked item
                <>
                  <Link
                    href={item.href || '#'}
                    className="text-neutral-600 hover:text-primary hover:underline transition-colors"
                  >
                    {item.label}
                  </Link>
                  <span aria-hidden="true">{separator}</span>
                </>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

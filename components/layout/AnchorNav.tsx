'use client'

import { useTranslations } from 'next-intl'
import { NAV_ITEMS } from '@/lib/navigation'

/**
 * AnchorNav component props
 */
export interface AnchorNavProps {
  /** Currently active section ID */
  activeSection: string
  /** Click handler for navigation */
  onNavClick: (e: React.MouseEvent<HTMLButtonElement>, href: string) => void
  /** Visual variant (default: dots) */
  variant?: 'dots' | 'lines' | 'labels'
}

/**
 * Side anchor navigation component
 *
 * Displays a vertical navigation indicator on the side of the viewport
 * showing the user's position in the page sections.
 *
 * Features:
 * - Three visual variants: dots, lines, labels
 * - Fixed positioning on right side
 * - Active section highlighting
 * - Hidden on mobile (< lg breakpoint)
 * - Accessible button labels
 */
export default function AnchorNav({
  activeSection,
  onNavClick,
  variant = 'dots',
}: AnchorNavProps) {
  const t = useTranslations('nav')

  /**
   * Handle button click by creating a synthetic anchor event
   */
  const handleClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    href: string
  ) => {
    onNavClick(e, href)
  }

  return (
    <nav
      className={`
        hidden lg:flex
        fixed right-4 top-1/2 -translate-y-1/2 z-40
        flex-col items-end gap-2
      `}
      aria-label="Page sections"
    >
      {NAV_ITEMS.map(({ id, href, key }) => {
        const isActive = activeSection === id
        const label = t(key)

        if (variant === 'dots') {
          return (
            <button
              key={id}
              onClick={(e) => handleClick(e, href)}
              aria-label={`Go to ${label}`}
              className={`
                w-3 h-3 rounded-full
                transition-all duration-200
                ${
                  isActive
                    ? 'bg-primary scale-125'
                    : 'bg-neutral-300 hover:bg-neutral-400'
                }
              `}
            />
          )
        }

        if (variant === 'lines') {
          return (
            <button
              key={id}
              onClick={(e) => handleClick(e, href)}
              aria-label={`Go to ${label}`}
              className={`
                w-6 h-1 rounded
                transition-all duration-200
                ${
                  isActive
                    ? 'bg-primary w-8'
                    : 'bg-neutral-300 hover:bg-neutral-400'
                }
              `}
            />
          )
        }

        // Labels variant
        return (
          <button
            key={id}
            onClick={(e) => handleClick(e, href)}
            aria-label={`Go to ${label}`}
            className={`
              text-sm px-3 py-1 rounded
              transition-all duration-200
              ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }
            `}
          >
            {label}
          </button>
        )
      })}
    </nav>
  )
}

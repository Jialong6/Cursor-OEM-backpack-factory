'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { NAV_ITEMS } from '@/lib/navigation'

/**
 * DesktopNav component props
 */
export interface DesktopNavProps {
  /** Currently active section ID */
  activeSection: string
  /** Whether the page has been scrolled */
  isScrolled: boolean
  /** Click handler for navigation links */
  onNavClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void
}

/**
 * Desktop navigation component
 *
 * Displays horizontal navigation links for screens >= 768px (md breakpoint).
 * Highlights the active section and adapts styling based on scroll state.
 *
 * Features:
 * - Active section highlighting
 * - Scroll-dependent styling (transparent vs solid background)
 * - Smooth scroll navigation
 * - Hidden on mobile (uses MobileNav instead)
 */
export default function DesktopNav({
  activeSection,
  isScrolled,
  onNavClick,
}: DesktopNavProps) {
  const t = useTranslations('nav')

  return (
    <div className="hidden md:flex items-center space-x-1">
      {NAV_ITEMS.map(({ id, href, key }) => (
        <Link
          key={id}
          href={href}
          onClick={(e) => onNavClick(e, href)}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium
            transition-all duration-200
            ${
              activeSection === id
                ? isScrolled
                  ? 'bg-primary/10 text-primary'
                  : 'bg-white/30 text-white backdrop-blur-sm'
                : isScrolled
                ? 'text-neutral-600 hover:bg-neutral-100'
                : 'text-white/90 hover:bg-white/20'
            }
          `}
        >
          {t(key)}
        </Link>
      ))}
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { NAV_ITEMS } from '@/lib/navigation'

/**
 * MobileNav component props
 */
export interface MobileNavProps {
  /** Whether the mobile menu is open */
  isOpen: boolean
  /** Toggle menu open/closed */
  onToggle: () => void
  /** Close the menu */
  onClose: () => void
  /** Currently active section ID */
  activeSection: string
  /** Whether the page has been scrolled */
  isScrolled: boolean
  /** Click handler for navigation links */
  onNavClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void
  /** Ref for the menu container (for focus trap) */
  menuRef: React.RefObject<HTMLDivElement | null>
}

/**
 * Mobile navigation component
 *
 * Displays hamburger menu button and slide-out drawer for screens < 768px.
 *
 * Features:
 * - Animated hamburger icon
 * - Slide-out drawer with backdrop
 * - Active section highlighting
 * - Click outside to close
 * - Accessible (aria-expanded, aria-label)
 */
export default function MobileNav({
  isOpen,
  onToggle,
  onClose,
  activeSection,
  isScrolled,
  onNavClick,
  menuRef,
}: MobileNavProps) {
  const t = useTranslations('nav')

  return (
    <>
      {/* Hamburger menu button */}
      <button
        onClick={onToggle}
        className="md:hidden p-2 rounded-lg transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        <div className="w-6 h-5 flex flex-col justify-between">
          {/* First line */}
          <span
            className={`
              block h-0.5 w-6 bg-current transition-all duration-300
              ${isScrolled ? 'bg-gray-900' : 'bg-white'}
              ${isOpen ? 'rotate-45 translate-y-2' : ''}
            `}
          />
          {/* Second line */}
          <span
            className={`
              block h-0.5 w-6 bg-current transition-all duration-300
              ${isScrolled ? 'bg-gray-900' : 'bg-white'}
              ${isOpen ? 'opacity-0' : 'opacity-100'}
            `}
          />
          {/* Third line */}
          <span
            className={`
              block h-0.5 w-6 bg-current transition-all duration-300
              ${isScrolled ? 'bg-gray-900' : 'bg-white'}
              ${isOpen ? '-rotate-45 -translate-y-2' : ''}
            `}
          />
        </div>
      </button>

      {/* Mobile menu drawer */}
      <div
        ref={menuRef}
        className={`
          md:hidden fixed inset-0 top-20 z-40
          transition-all duration-300 ease-in-out
          ${
            isOpen
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          }
        `}
      >
        {/* Backdrop
            移动端注意：不使用 backdrop-blur（backdrop-filter）。在 iOS Safari 上，
            position:fixed + opacity 过渡的容器内若含 backdrop-filter / transform 子元素，
            会触发合成 bug 导致背景层不绘制（菜单看起来透明）。用实心半透明黑即可。 */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Menu content
            同理移除面板的 transform/translate-x：transform 会让面板单独成为合成层，
            与外层 opacity 过渡叠加时在移动端不绘制白色背景。整屉靠外层 opacity 淡入淡出。 */}
        <div
          className="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-2xl"
        >
          <nav className="flex flex-col p-4 space-y-2">
            {NAV_ITEMS.map(({ id, href, key }) => (
              <Link
                key={id}
                href={href}
                onClick={(e) => onNavClick(e, href)}
                className={`
                  px-4 py-3 rounded-lg text-base font-medium
                  transition-all duration-200
                  ${
                    activeSection === id
                      ? 'bg-primary/10 text-primary'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }
                `}
              >
                {t(key)}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  )
}

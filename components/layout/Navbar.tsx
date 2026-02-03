'use client'

import Link from 'next/link'
import LanguageSwitcher from './LanguageSwitcher'
import DesktopNav from './DesktopNav'
import MobileNav from './MobileNav'
import {
  useScrollState,
  useActiveSection,
  useSmoothScroll,
  useMobileMenu,
} from '@/hooks/useNavigation'

/**
 * Fixed navigation bar component
 *
 * Features:
 * - Fixed position at viewport top (sticky)
 * - Background change on scroll (transparent to semi-transparent)
 * - Current section highlighting (Intersection Observer)
 * - Smooth scroll navigation
 * - Responsive hamburger menu (<768px)
 * - Keyboard navigation and focus management
 * - Integrated language switcher
 *
 * Requirements: 5.1, 5.2, 3.3, 3.4, 5.4, 5.5, 5.6
 */
export default function Navbar() {
  const isScrolled = useScrollState()
  const activeSection = useActiveSection()
  const smoothScroll = useSmoothScroll()
  const { isOpen, toggle, close, menuRef } = useMobileMenu()

  /**
   * Handle navigation click with mobile menu close
   */
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    smoothScroll(e, href)
    close()
  }

  return (
    <nav
      className={`
        fixed top-0 left-0 right-0 z-50
        transition-all duration-300 ease-in-out
        ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-lg'
            : 'bg-transparent'
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            href="#banner"
            onClick={(e) => handleNavClick(e, '#banner')}
            className="flex items-center space-x-2 group z-50"
          >
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
              <span className="text-white font-bold text-xl">BB</span>
            </div>
            <div className="hidden sm:block">
              <span
                className={`
                  text-xl font-bold transition-colors
                  ${isScrolled ? 'text-neutral-800' : 'text-white'}
                `}
              >
                Better Bags
              </span>
            </div>
          </Link>

          {/* Desktop navigation */}
          <DesktopNav
            activeSection={activeSection}
            isScrolled={isScrolled}
            onNavClick={handleNavClick}
          />

          {/* Right side: Language switcher + Hamburger menu button */}
          <div className="flex items-center gap-2 z-50">
            <LanguageSwitcher />
            <MobileNav
              isOpen={isOpen}
              onToggle={toggle}
              onClose={close}
              activeSection={activeSection}
              isScrolled={isScrolled}
              onNavClick={handleNavClick}
              menuRef={menuRef}
            />
          </div>
        </div>
      </div>
    </nav>
  )
}

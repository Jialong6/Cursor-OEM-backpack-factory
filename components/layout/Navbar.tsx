'use client'

import Link from 'next/link'
import Image from 'next/image'
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
            aria-label="Better Bags Myanmar"
            className="flex items-center group z-50 py-1"
          >
            <span
              className={`
                inline-flex items-center transition-all
                ${isScrolled ? '' : 'bg-white rounded-lg px-2.5 py-1.5 shadow-sm'}
              `}
            >
              <Image
                src="/logo.png"
                alt="Better Bags Myanmar"
                width={2481}
                height={1038}
                priority
                className="h-9 w-auto md:h-10 transition-transform group-hover:scale-105"
              />
            </span>
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

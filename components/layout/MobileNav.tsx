'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
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
 * 关键：抽屉通过 createPortal 渲染到 document.body。
 * 原因：滚动后 Navbar 会加 backdrop-blur（backdrop-filter）。按 CSS 规范，
 * backdrop-filter 会为 position:fixed 后代创建"包含块"——若抽屉留在 navbar 内，
 * 滚动后它会被困在 80px 高的导航条里，新版 iOS Safari 上背景层错乱不绘制（菜单透明）。
 * Portal 到 body 让抽屉真正相对视口 fixed，彻底规避该问题。
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

  // 仅客户端挂载后才用 createPortal（服务端无 document）
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <>
      {/* Hamburger menu button（留在 navbar 内） */}
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

      {/* Mobile menu drawer —— Portal 到 body，脱离 navbar 的 backdrop-filter 包含块。
          条件渲染（开才挂载），实心 bg-white 面板 + 实心 bg-black/50 遮罩，
          不用 backdrop-filter / transform / opacity 过渡，移动端绘制可靠。 */}
      {mounted &&
        isOpen &&
        createPortal(
          <div ref={menuRef} className="md:hidden fixed inset-0 top-20 z-40">
            {/* Backdrop：实心半透明黑 */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={onClose}
              aria-hidden="true"
            />

            {/* Menu content：实心白色面板 */}
            <div className="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-2xl">
              <nav className="flex flex-col p-4 space-y-2">
                {NAV_ITEMS.map(({ id, href, key }) => (
                  <Link
                    key={id}
                    href={href}
                    onClick={(e) => onNavClick(e, href)}
                    className={`
                      px-4 py-3 rounded-lg text-base font-medium
                      transition-colors duration-200
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
          </div>,
          document.body
        )}
    </>
  )
}

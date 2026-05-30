'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { NAVBAR_HEIGHT, SCROLL_THRESHOLD, SECTION_IDS } from '@/lib/navigation'

/**
 * Hook to track if page has scrolled past a threshold
 *
 * @param threshold - Scroll distance in pixels to trigger state change (default: SCROLL_THRESHOLD)
 * @returns true if scrollY > threshold, false otherwise
 */
export function useScrollState(threshold: number = SCROLL_THRESHOLD): boolean {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > threshold
      setIsScrolled(scrolled)
    }

    // Check initial state
    handleScroll()

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [threshold])

  return isScrolled
}

/**
 * Hook to track which section is currently visible
 *
 * Uses IntersectionObserver to detect when sections enter the viewport
 *
 * @param sectionIds - Array of section IDs to observe (default: SECTION_IDS)
 * @returns The ID of the currently active section
 */
export function useActiveSection(sectionIds: readonly string[] = SECTION_IDS): string {
  const [activeSection, setActiveSection] = useState(sectionIds[0] || 'banner')

  useEffect(() => {
    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0,
    }

    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id)
        }
      })
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)

    sectionIds.forEach((id) => {
      const element = document.getElementById(id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [sectionIds])

  return activeSection
}

/**
 * Hook that returns a smooth scroll handler function
 *
 * @param navbarHeight - Height of navbar for offset calculation (default: NAVBAR_HEIGHT)
 * @returns Click handler function for navigation links
 */
export function useSmoothScroll(
  navbarHeight: number = NAVBAR_HEIGHT
): (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void {
  const pathname = usePathname()

  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      // 非锚点（路径式）href 交给 next/Link 自行处理
      if (!href.startsWith('#')) return

      const targetId = href.slice(1)
      const targetElement = document.getElementById(targetId)

      if (targetElement) {
        // 当前页面存在该 section（首页）→ 平滑滚动
        e.preventDefault()
        const targetPosition = targetElement.offsetTop - navbarHeight

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        })
        return
      }

      // 当前页面没有该 section（如 blog / glossary 子路由）
      // → 跳到首页对应 section。用整页跳转让浏览器原生处理 hash 滚动
      // （App Router 的 router.push 切路由后不会自动滚到 hash）
      e.preventDefault()
      const locale = pathname.split('/')[1] || 'en'
      window.location.href = `/${locale}${href}`
    },
    [navbarHeight, pathname]
  )

  return handleNavClick
}

/**
 * Mobile menu state and behavior hook
 *
 * Provides:
 * - isOpen state
 * - toggle/close functions
 * - ESC key to close
 * - Body scroll lock when open
 * - menuRef for focus trap implementation
 */
export interface UseMobileMenuReturn {
  isOpen: boolean
  toggle: () => void
  close: () => void
  menuRef: React.RefObject<HTMLDivElement | null>
}

export function useMobileMenu(): UseMobileMenuReturn {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return { isOpen, toggle, close, menuRef }
}

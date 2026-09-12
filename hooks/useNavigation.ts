'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { NAVBAR_HEIGHT, SCROLL_THRESHOLD, SECTION_IDS } from '@/lib/navigation'
import { usePrefersReducedMotion } from '@/hooks/useScrollAnimation'
import { track } from '@/lib/analytics/beacon'

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
 * 滚动到锚点时可附带的埋点信息
 */
export interface AnchorScrollMeta {
  /** 点击来源。传了才上报 cta_click,没传表示是程序内部触发的滚动 */
  cta?: string
}

export type AnchorScrollHandler = (
  target: string,
  event?: { preventDefault: () => void } | null,
  meta?: AnchorScrollMeta
) => void

/**
 * 滚动到站内锚点的唯一入口
 *
 * 站内原本有六处各写一遍的实现:HeroBanner / Features / bento CTASection
 * 三处逐字相同,FAQ 是内联变体,CostAdvantage 是连偏移和平滑都没有的纯 <a>,
 * 浮窗那处目标是 #contact-form 且要先过拖动守卫。往六处分别塞埋点等于把
 * 代码复制六份,而且一定会有谁漏埋 —— 所以先收敛,再在这一个落点上报。
 *
 * 事件参数刻意做成可选且只要求 preventDefault:<button> 不需要传,
 * <a> 传进来阻止默认跳转,浮窗那种自己先拦过的传 null。三种形态共用一个函数。
 *
 * 位置计算沿用 offsetTop。本站唯一的定位祖先是 app/[locale]/page.tsx 的
 * <div className="relative">,它从文档 y=0 起(Navbar 是 fixed,不占文档流),
 * 因此 offsetTop 与文档绝对位置等价。若将来在它之上再套定位容器,
 * 这里要改成 getBoundingClientRect().top + window.scrollY。
 *
 * @param navbarHeight - 顶部固定导航的高度,滚动位置要减掉它
 */
export function useAnchorScroll(
  navbarHeight: number = NAVBAR_HEIGHT
): AnchorScrollHandler {
  const pathname = usePathname()
  const prefersReducedMotion = usePrefersReducedMotion()

  return useCallback(
    (target, event, meta) => {
      const targetId = target.startsWith('#') ? target.slice(1) : target

      if (meta?.cta) {
        // 立刻发送:点完往往紧接着一次滚动或导航,攒批会来不及
        track('cta_click', { cta: meta.cta, target: targetId }, { immediate: true })
      }

      const targetElement = document.getElementById(targetId)

      if (!targetElement) {
        // 当前页面没有该 section(如 blog / glossary 子路由)
        // → 跳到首页对应 section。用整页跳转让浏览器原生处理 hash 滚动
        // (App Router 的 router.push 切路由后不会自动滚到 hash)
        event?.preventDefault()
        const locale = pathname.split('/')[1] || 'en'
        window.location.href = `/${locale}#${targetId}`
        return
      }

      event?.preventDefault()

      window.scrollTo({
        top: targetElement.offsetTop - navbarHeight,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      })
    },
    [navbarHeight, pathname, prefersReducedMotion]
  )
}

/**
 * Hook that returns a smooth scroll handler function
 *
 * 现在是 useAnchorScroll 的薄适配器,签名一字未变 ——
 * Navbar / DesktopNav / MobileNav / Footer 以及它们的现有测试都不受影响。
 *
 * @param navbarHeight - Height of navbar for offset calculation (default: NAVBAR_HEIGHT)
 * @returns Click handler function for navigation links
 */
export function useSmoothScroll(
  navbarHeight: number = NAVBAR_HEIGHT
): (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void {
  const scrollToAnchor = useAnchorScroll(navbarHeight)

  return useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      // 非锚点（路径式）href 交给 next/Link 自行处理
      if (!href.startsWith('#')) return

      scrollToAnchor(href, e, { cta: 'nav' })
    },
    [scrollToAnchor]
  )
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

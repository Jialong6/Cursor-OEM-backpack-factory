'use client'

import { useEffect, useState, ReactNode } from 'react'

/**
 * Floating menu item configuration
 */
export interface FloatingMenuItem {
  /** Unique identifier */
  id: string
  /** Icon to display in the button */
  icon: ReactNode
  /** Accessible label for the button */
  label: string
  /** Click handler */
  onClick: () => void
}

/**
 * FloatingMenu component props
 */
export interface FloatingMenuProps {
  /** Array of menu items to display */
  items: FloatingMenuItem[]
  /** Position of the floating menu (default: bottom-right) */
  position?: 'bottom-right' | 'bottom-left'
  /** Only show when user has scrolled past threshold (default: false) */
  showOnScroll?: boolean
  /** Scroll threshold to show menu in pixels (default: 300) */
  scrollThreshold?: number
}

/**
 * Floating action menu component
 *
 * Displays floating action buttons for quick access to common actions
 * like scrolling back to top.
 *
 * Features:
 * - Configurable position (bottom-right, bottom-left)
 * - Optional show-on-scroll behavior
 * - Smooth fade transitions
 * - Accessible button labels
 * - Customizable icons
 */
export default function FloatingMenu({
  items,
  position = 'bottom-right',
  showOnScroll = false,
  scrollThreshold = 300,
}: FloatingMenuProps) {
  const [isVisible, setIsVisible] = useState(!showOnScroll)

  useEffect(() => {
    if (!showOnScroll) {
      setIsVisible(true)
      return
    }

    const handleScroll = () => {
      const scrolled = window.scrollY > scrollThreshold
      setIsVisible(scrolled)
    }

    // Initial check
    handleScroll()

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [showOnScroll, scrollThreshold])

  const positionClasses =
    position === 'bottom-right' ? 'bottom-6 right-6' : 'bottom-6 left-6'

  return (
    <div
      className={`
        fixed z-40
        ${positionClasses}
        flex flex-col gap-3
        transition-opacity duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
    >
      {items.map(({ id, icon, label, onClick }) => (
        <button
          key={id}
          onClick={onClick}
          aria-label={label}
          className={`
            w-12 h-12 rounded-full
            bg-primary text-white
            shadow-lg hover:shadow-xl
            flex items-center justify-center
            transition-all duration-200
            hover:scale-110
            focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
          `}
        >
          {icon}
        </button>
      ))}
    </div>
  )
}

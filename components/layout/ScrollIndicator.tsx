'use client'

import { useEffect, useState } from 'react'

/**
 * ScrollIndicator component props
 */
export interface ScrollIndicatorProps {
  /** Background color class for the progress bar (default: bg-primary) */
  color?: string
  /** Height in pixels (default: 4) - maps to Tailwind classes */
  height?: number
  /** Position of the indicator (default: top) */
  position?: 'top' | 'bottom'
}

/**
 * Height to Tailwind class mapping
 */
const heightClasses: Record<number, string> = {
  2: 'h-0.5',
  4: 'h-1',
  6: 'h-1.5',
  8: 'h-2',
}

/**
 * Scroll progress indicator component
 *
 * Displays a progress bar showing how far the user has scrolled through the page.
 *
 * Features:
 * - Real-time scroll progress tracking
 * - Customizable color, height, and position
 * - Fixed positioning for always-visible indicator
 * - Smooth width transitions
 */
export default function ScrollIndicator({
  color = 'bg-primary',
  height = 4,
  position = 'top',
}: ScrollIndicatorProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = document.documentElement.clientHeight
      const scrollY = window.scrollY

      // Calculate scroll progress (0-100)
      const maxScroll = scrollHeight - clientHeight
      if (maxScroll <= 0) {
        setProgress(0)
        return
      }

      const currentProgress = (scrollY / maxScroll) * 100
      // Clamp between 0 and 100
      setProgress(Math.min(100, Math.max(0, currentProgress)))
    }

    // Initial calculation
    handleScroll()

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const heightClass = heightClasses[height] || 'h-1'
  const positionClass = position === 'top' ? 'top-0' : 'bottom-0'

  return (
    <div
      className={`
        fixed left-0 right-0 z-50
        ${positionClass}
        ${heightClass}
        bg-gray-200/30
      `}
    >
      <div
        className={`
          ${heightClass}
          ${color}
          transition-all duration-150 ease-out
        `}
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

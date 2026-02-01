'use client'

import React, { useEffect, useState } from 'react'

/**
 * Toast Component
 *
 * Accessible notification toast with multiple types.
 * Compliant with WCAG 2.2 AA for keyboard and screen reader accessibility.
 *
 * Features:
 * - Four types: success, error, warning, info
 * - Auto-dismiss with configurable duration
 * - Manual close button (44x44px touch target)
 * - Proper ARIA live regions for screen readers
 * - Smooth enter/exit animations
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastData {
  id: string
  type: ToastType
  title: string
  description?: string
  /** Duration in ms before auto-dismiss. 0 = never auto-dismiss */
  duration?: number
  /** Show close button */
  closable?: boolean
}

export interface ToastProps extends ToastData {
  onClose: (id: string) => void
}

// Icon components for each toast type
const icons: Record<ToastType, React.ReactNode> = {
  success: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

// Style configurations for each type
const typeStyles: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-500',
    text: 'text-green-800',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-500',
    text: 'text-red-800',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: 'text-yellow-500',
    text: 'text-yellow-800',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-500',
    text: 'text-blue-800',
  },
}

/**
 * Single Toast Item
 */
export default function Toast({
  id,
  type,
  title,
  description,
  duration = 5000,
  closable = true,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const styles = typeStyles[type]

  // Determine ARIA live region politeness
  const ariaLive = type === 'error' ? 'assertive' : 'polite'

  // Handle auto-dismiss
  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true))

    // Auto-dismiss if duration > 0
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration])

  const handleClose = () => {
    setIsExiting(true)
    // Wait for exit animation before removing
    setTimeout(() => {
      onClose(id)
    }, 300)
  }

  return (
    <div
      role="alert"
      aria-live={ariaLive}
      aria-atomic="true"
      className={`
        pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg
        transition-all duration-300 ease-in-out
        ${styles.bg} ${styles.border}
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 ${styles.icon}`}>
            {icons[type]}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${styles.text}`}>
              {title}
            </p>
            {description && (
              <p className={`mt-1 text-sm ${styles.text} opacity-80`}>
                {description}
              </p>
            )}
          </div>

          {/* Close button - 44x44px touch target */}
          {closable && (
            <button
              type="button"
              onClick={handleClose}
              className={`
                flex-shrink-0 inline-flex items-center justify-center
                min-h-[44px] min-w-[44px] -m-2
                rounded-lg ${styles.text}
                hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2
                transition-colors duration-200
              `}
              aria-label="Close notification"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

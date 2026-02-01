'use client'

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import Toast, { ToastData, ToastType } from './Toast'

/**
 * Toast Provider and Hook
 *
 * Provides a context for managing toast notifications throughout the app.
 * Toasts are rendered in a fixed position container at the top-right of the viewport.
 */

interface ToastOptions {
  title: string
  description?: string
  duration?: number
  closable?: boolean
}

interface ToastContextValue {
  /** Show a success toast */
  success: (options: ToastOptions | string) => string
  /** Show an error toast */
  error: (options: ToastOptions | string) => string
  /** Show a warning toast */
  warning: (options: ToastOptions | string) => string
  /** Show an info toast */
  info: (options: ToastOptions | string) => string
  /** Dismiss a specific toast by ID */
  dismiss: (id: string) => void
  /** Dismiss all toasts */
  dismissAll: () => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

/**
 * Generate unique ID for toasts
 */
function generateId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Normalize options input
 */
function normalizeOptions(options: ToastOptions | string): ToastOptions {
  if (typeof options === 'string') {
    return { title: options }
  }
  return options
}

interface ToastProviderProps {
  children: React.ReactNode
  /** Maximum number of visible toasts */
  maxToasts?: number
  /** Default duration for toasts in ms */
  defaultDuration?: number
}

/**
 * Toast Provider Component
 *
 * Wrap your app with this provider to enable toast notifications.
 *
 * @example
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 */
export function ToastProvider({
  children,
  maxToasts = 5,
  defaultDuration = 5000,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  // Create a toast with given type
  const createToast = useCallback(
    (type: ToastType, options: ToastOptions | string): string => {
      const normalized = normalizeOptions(options)
      const id = generateId()

      const newToast: ToastData = {
        id,
        type,
        title: normalized.title,
        description: normalized.description,
        duration: normalized.duration ?? defaultDuration,
        closable: normalized.closable ?? true,
      }

      setToasts((prev) => {
        // Limit number of toasts
        const limited = prev.slice(-(maxToasts - 1))
        return [...limited, newToast]
      })

      return id
    },
    [defaultDuration, maxToasts]
  )

  // Dismiss a toast by ID
  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  // Dismiss all toasts
  const dismissAll = useCallback(() => {
    setToasts([])
  }, [])

  // Context value with memoized methods
  const contextValue = useMemo<ToastContextValue>(
    () => ({
      success: (options) => createToast('success', options),
      error: (options) => createToast('error', options),
      warning: (options) => createToast('warning', options),
      info: (options) => createToast('info', options),
      dismiss,
      dismissAll,
    }),
    [createToast, dismiss, dismissAll]
  )

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* Toast container - fixed position at top-right */}
      <div
        aria-label="Notifications"
        className="pointer-events-none fixed inset-0 z-50 flex flex-col items-end px-4 py-6 sm:p-6"
      >
        <div className="flex w-full flex-col items-end space-y-4">
          {toasts.map((toast) => (
            <Toast key={toast.id} {...toast} onClose={dismiss} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  )
}

/**
 * Hook to access toast methods
 *
 * @example
 * const toast = useToast()
 * toast.success('Operation completed!')
 * toast.error({ title: 'Error', description: 'Something went wrong' })
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return context
}

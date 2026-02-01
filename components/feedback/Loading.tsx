'use client'

import React from 'react'

/**
 * Loading Component
 *
 * Accessible loading indicators with multiple visual styles.
 * Compliant with WCAG 2.2 AA for screen reader accessibility.
 *
 * Features:
 * - Three types: spinner, dots, skeleton
 * - Multiple size presets
 * - Customizable colors
 * - Optional visible label
 * - Proper ARIA attributes for screen readers
 */

export type LoadingType = 'spinner' | 'dots' | 'skeleton'
export type LoadingSize = 'sm' | 'md' | 'lg'

export interface LoadingProps {
  /** Visual type of loading indicator */
  type?: LoadingType
  /** Size preset */
  size?: LoadingSize
  /** Custom color (Tailwind class or CSS color) */
  color?: string
  /** Accessible label for screen readers */
  label?: string
  /** Show visible label text */
  showLabel?: boolean
  /** Additional CSS classes */
  className?: string
}

// Size configurations for spinner
const spinnerSizes: Record<LoadingSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
}

// Size configurations for dots
const dotSizes: Record<LoadingSize, { dot: string; gap: string }> = {
  sm: { dot: 'h-1.5 w-1.5', gap: 'gap-1' },
  md: { dot: 'h-2.5 w-2.5', gap: 'gap-1.5' },
  lg: { dot: 'h-4 w-4', gap: 'gap-2' },
}

// Size configurations for skeleton
const skeletonSizes: Record<LoadingSize, string> = {
  sm: 'h-4',
  md: 'h-6',
  lg: 'h-10',
}

/**
 * Spinner Loading Indicator
 */
function Spinner({ size, color, className }: { size: LoadingSize; color?: string; className?: string }) {
  const sizeClass = spinnerSizes[size]
  const colorClass = color || 'text-primary'

  return (
    <svg
      className={`animate-spin ${sizeClass} ${colorClass} ${className || ''}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

/**
 * Dots Loading Indicator
 */
function Dots({ size, color, className }: { size: LoadingSize; color?: string; className?: string }) {
  const { dot, gap } = dotSizes[size]
  const colorClass = color || 'bg-primary'

  return (
    <div className={`flex items-center ${gap} ${className || ''}`} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`${dot} ${colorClass} rounded-full animate-pulse`}
          style={{
            animationDelay: `${i * 150}ms`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  )
}

/**
 * Skeleton Loading Indicator
 */
function Skeleton({ size, className }: { size: LoadingSize; className?: string }) {
  const heightClass = skeletonSizes[size]

  return (
    <div
      className={`${heightClass} w-full animate-pulse rounded bg-neutral-200 ${className || ''}`}
      aria-hidden="true"
    />
  )
}

/**
 * Loading Component
 *
 * @example
 * // Basic spinner
 * <Loading />
 *
 * @example
 * // Dots with label
 * <Loading type="dots" showLabel label="Loading data..." />
 *
 * @example
 * // Skeleton placeholder
 * <Loading type="skeleton" size="lg" />
 */
export default function Loading({
  type = 'spinner',
  size = 'md',
  color,
  label = 'Loading...',
  showLabel = false,
  className,
}: LoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`inline-flex items-center gap-2 ${className || ''}`}
    >
      {/* Visual indicator */}
      {type === 'spinner' && <Spinner size={size} color={color} />}
      {type === 'dots' && <Dots size={size} color={color} />}
      {type === 'skeleton' && <Skeleton size={size} />}

      {/* Visible label */}
      {showLabel && type !== 'skeleton' && (
        <span className="text-sm text-neutral-600">{label}</span>
      )}

      {/* Screen reader only label (when label not visible) */}
      {!showLabel && <span className="sr-only">{label}</span>}
    </div>
  )
}

/**
 * SkeletonText - Pre-built skeleton for text content
 */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`h-4 animate-pulse rounded bg-neutral-200 ${
              i === lines - 1 ? 'w-3/4' : 'w-full'
            }`}
            aria-hidden="true"
          />
        ))}
      </div>
      <span className="sr-only">Loading content...</span>
    </div>
  )
}

/**
 * SkeletonCard - Pre-built skeleton for card content
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`animate-pulse rounded-lg border border-neutral-200 bg-white p-4 ${className || ''}`}
    >
      {/* Image placeholder */}
      <div className="mb-4 h-40 w-full rounded bg-neutral-200" aria-hidden="true" />

      {/* Title */}
      <div className="mb-2 h-5 w-3/4 rounded bg-neutral-200" aria-hidden="true" />

      {/* Description lines */}
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-neutral-200" aria-hidden="true" />
        <div className="h-3 w-5/6 rounded bg-neutral-200" aria-hidden="true" />
      </div>

      <span className="sr-only">Loading card content...</span>
    </div>
  )
}

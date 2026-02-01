'use client'

import React, { forwardRef } from 'react'

/**
 * Button Component
 *
 * A fully accessible button component with multiple variants and sizes.
 * Compliant with WCAG 2.2 AA Success Criterion 2.5.8 (Touch Target Minimum).
 *
 * Features:
 * - All sizes maintain minimum 44x44px touch target
 * - Full keyboard accessibility with visible focus indicators
 * - Loading and disabled states with proper ARIA attributes
 * - Support for left/right icons
 * - Full width option for forms
 */

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant
  /** Size preset - all sizes meet 44px minimum touch target */
  size?: ButtonSize
  /** Show loading spinner and disable interaction */
  isLoading?: boolean
  /** Text shown when loading (replaces children) */
  loadingText?: string
  /** Icon displayed before children */
  leftIcon?: React.ReactNode
  /** Icon displayed after children */
  rightIcon?: React.ReactNode
  /** Stretch to full container width */
  fullWidth?: boolean
}

// Size configurations - all meet WCAG 2.2 AA 44px minimum
const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-[44px] px-4 py-2 text-sm gap-1.5',
  md: 'min-h-[48px] px-5 py-2.5 text-base gap-2',
  lg: 'min-h-[56px] px-6 py-3 text-lg gap-2.5',
}

// Variant styles
const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'bg-primary text-white',
    'hover:bg-primary-dark',
    'active:bg-primary-dark/90',
  ].join(' '),
  secondary: [
    'bg-neutral-100 text-neutral-800',
    'hover:bg-neutral-200',
    'active:bg-neutral-300',
  ].join(' '),
  outline: [
    'border-2 border-primary text-primary bg-transparent',
    'hover:bg-primary/10',
    'active:bg-primary/20',
  ].join(' '),
  ghost: [
    'text-primary bg-transparent',
    'hover:bg-primary/10',
    'active:bg-primary/20',
  ].join(' '),
}

// Base classes applied to all buttons
const baseClasses = [
  // Layout
  'inline-flex items-center justify-center',
  // Typography
  'font-medium',
  // Shape
  'rounded-lg',
  // Transitions
  'transition-colors duration-200',
  // Focus styles (keyboard accessibility)
  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
  // Disabled styles
  'disabled:opacity-50 disabled:cursor-not-allowed',
].join(' ')

/**
 * Loading Spinner SVG
 * Animated spinner shown during loading state
 */
function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className || 'h-5 w-5'}`}
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
 * Accessible Button Component
 *
 * @example
 * // Primary button (default)
 * <Button>Click me</Button>
 *
 * @example
 * // With loading state
 * <Button isLoading loadingText="Submitting...">Submit</Button>
 *
 * @example
 * // With icons
 * <Button leftIcon={<PlusIcon />} variant="outline">Add Item</Button>
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading

    // Combine all classes
    const buttonClasses = [
      baseClasses,
      sizeClasses[size],
      variantClasses[variant],
      fullWidth ? 'w-full' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={isDisabled}
        aria-disabled={isDisabled ? 'true' : undefined}
        aria-busy={isLoading ? 'true' : undefined}
        {...props}
      >
        {/* Loading spinner or left icon */}
        {isLoading ? (
          <LoadingSpinner
            className={size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'}
          />
        ) : leftIcon ? (
          <span className="shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        ) : null}

        {/* Button text */}
        <span>{isLoading && loadingText ? loadingText : children}</span>

        {/* Right icon (hidden during loading) */}
        {!isLoading && rightIcon && (
          <span className="shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button

/**
 * Navigation shared types and constants
 *
 * This module provides shared navigation configuration used across
 * Navbar, DesktopNav, MobileNav, and AnchorNav components.
 */

/**
 * Navigation item interface
 */
export interface NavItem {
  /** Unique identifier matching the section ID */
  readonly id: string
  /** Anchor href (e.g., '#about') */
  readonly href: string
  /** Translation key for the nav label */
  readonly key: string
}

/**
 * Navigation items configuration
 * Order determines display order in navigation
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'banner', href: '#banner', key: 'banner' },
  { id: 'about', href: '#about', key: 'about' },
  { id: 'features', href: '#features', key: 'features' },
  { id: 'services', href: '#services', key: 'services' },
  { id: 'faq', href: '#faq', key: 'faq' },
  { id: 'contact', href: '#contact', key: 'contact' },
  { id: 'blog', href: '#blog', key: 'blog' },
] as const

/**
 * Default navbar height in pixels
 * Used for scroll offset calculations
 */
export const NAVBAR_HEIGHT = 80

/**
 * Default scroll threshold for triggering navbar style change
 */
export const SCROLL_THRESHOLD = 20

/**
 * Extract section IDs from nav items
 */
export const SECTION_IDS = NAV_ITEMS.map((item) => item.id)

/**
 * Centralized color palette and color pair definitions
 * for WCAG AA compliance verification.
 */

/** Project color palette */
export const PALETTE = {
  // Brand
  primary: '#87A575',
  primaryLight: '#a3c293',
  primaryDark: '#6b8a5e',

  // Semantic
  deep: '#1A1A1A',
  milk: '#FAFAFA',

  // Neutral scale
  white: '#FFFFFF',
  neutral50: '#FAFAFA',
  neutral100: '#F5F5F5',
  neutral200: '#E5E5E5',
  neutral300: '#D4D4D4',
  neutral400: '#A3A3A3',
  neutral500: '#737373',
  neutral600: '#525252',
  neutral700: '#404040',
  neutral800: '#262626',
  neutral900: '#171717',

  // Legacy gray (Tailwind default gray)
  gray700: '#374151',
  gray900: '#111827',
} as const

export type TextType = 'normal' | 'large'

export interface ColorPair {
  foreground: string
  background: string
  usage: string
  textType: TextType
  minContrast: number
}

/**
 * All color combinations used in the project.
 * Each pair specifies the minimum contrast ratio required.
 * - normal text: 4.5:1 (WCAG AA)
 * - large text (>= 18px bold or >= 24px): 3:1 (WCAG AA)
 */
export const COLOR_PAIRS: readonly ColorPair[] = [
  // Hero / Banner - heavy weight
  { foreground: PALETTE.deep, background: PALETTE.white, usage: 'Hero heading on white', textType: 'large', minContrast: 3 },
  { foreground: PALETTE.deep, background: PALETTE.milk, usage: 'Hero heading on milk', textType: 'large', minContrast: 3 },
  { foreground: PALETTE.neutral600, background: PALETTE.white, usage: 'Hero description on white', textType: 'normal', minContrast: 4.5 },

  // About section - medium weight
  { foreground: PALETTE.neutral800, background: PALETTE.white, usage: 'About headings on white', textType: 'large', minContrast: 3 },
  { foreground: PALETTE.neutral600, background: PALETTE.white, usage: 'About body text on white', textType: 'normal', minContrast: 4.5 },
  { foreground: PALETTE.neutral500, background: PALETTE.white, usage: 'About subtitle on white', textType: 'normal', minContrast: 4.5 },

  // Features - medium weight
  { foreground: PALETTE.neutral800, background: PALETTE.neutral50, usage: 'Feature headings on neutral-50', textType: 'large', minContrast: 3 },

  // Services - light weight
  { foreground: PALETTE.neutral700, background: PALETTE.white, usage: 'Services headings on white', textType: 'large', minContrast: 3 },

  // Contact - heavy weight (conversion zone)
  { foreground: PALETTE.deep, background: PALETTE.white, usage: 'Contact heading on white', textType: 'large', minContrast: 3 },
  { foreground: PALETTE.neutral600, background: PALETTE.white, usage: 'Contact body on white', textType: 'normal', minContrast: 4.5 },
  { foreground: PALETTE.gray700, background: PALETTE.white, usage: 'Form labels on white', textType: 'normal', minContrast: 4.5 },

  // CTA section
  { foreground: PALETTE.deep, background: PALETTE.neutral100, usage: 'CTA heading on neutral-100', textType: 'large', minContrast: 3 },

  // TrustBadges (neutral-400 upgraded to neutral-600 for contrast on neutral-100)
  { foreground: PALETTE.neutral600, background: PALETTE.neutral100, usage: 'TrustBadges "+20 more" on neutral-100', textType: 'normal', minContrast: 4.5 },
  { foreground: PALETTE.neutral600, background: PALETTE.white, usage: 'TrustBadges brand names on white', textType: 'normal', minContrast: 4.5 },

  // Blog - subtle weight
  { foreground: PALETTE.neutral600, background: PALETTE.white, usage: 'Blog text on white', textType: 'normal', minContrast: 4.5 },

  // Buttons with white text on primary-dark (large text standard)
  // primary (#87A575) gives 2.74:1 - insufficient even for large text
  // primaryDark (#6b8a5e) gives 3.87:1 - passes large text AA (>= 3:1)
  { foreground: PALETTE.white, background: PALETTE.primaryDark, usage: 'Button text on primary-dark green', textType: 'large', minContrast: 3 },

  // FAQ
  { foreground: PALETTE.neutral700, background: PALETTE.white, usage: 'FAQ heading on white', textType: 'large', minContrast: 3 },
] as const

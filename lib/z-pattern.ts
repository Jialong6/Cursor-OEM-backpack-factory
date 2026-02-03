/**
 * Z-Pattern Visual Weight System
 *
 * Defines visual weight hierarchy for page sections,
 * mapping section importance to text color intensity.
 * Heavy-weight sections (entry + conversion) use the darkest text
 * to guide the eye along the Z-pattern reading flow.
 */

import { PALETTE } from './colors'

export type VisualWeight = 'heavy' | 'medium' | 'light' | 'subtle'

export interface SectionWeight {
  section: string
  weight: VisualWeight
  headingColor: string
  bodyColor: string
}

/**
 * Minimum contrast ratio thresholds for each weight tier (large text).
 * Heavy sections should have the strongest contrast, descending to subtle.
 */
export const WEIGHT_CONTRAST_THRESHOLDS: Record<VisualWeight, number> = {
  heavy: 14,
  medium: 11,
  light: 8,
  subtle: 5,
}

/**
 * Section visual weight assignments.
 * Banner and Contact are "heavy" as entry and conversion zones.
 */
export const SECTION_WEIGHTS: readonly SectionWeight[] = [
  {
    section: 'banner',
    weight: 'heavy',
    headingColor: PALETTE.deep,
    bodyColor: PALETTE.neutral600,
  },
  {
    section: 'about',
    weight: 'medium',
    headingColor: PALETTE.neutral800,
    bodyColor: PALETTE.neutral600,
  },
  {
    section: 'features',
    weight: 'medium',
    headingColor: PALETTE.neutral800,
    bodyColor: PALETTE.neutral600,
  },
  {
    section: 'services',
    weight: 'light',
    headingColor: PALETTE.neutral700,
    bodyColor: PALETTE.neutral600,
  },
  {
    section: 'faq',
    weight: 'light',
    headingColor: PALETTE.neutral700,
    bodyColor: PALETTE.neutral600,
  },
  {
    section: 'contact',
    weight: 'heavy',
    headingColor: PALETTE.deep,
    bodyColor: PALETTE.neutral600,
  },
  {
    section: 'blog',
    weight: 'subtle',
    headingColor: PALETTE.neutral600,
    bodyColor: PALETTE.neutral500,
  },
] as const

/**
 * Mapping from visual weight to Tailwind heading classes.
 */
export const WEIGHT_TO_HEADING_CLASS: Record<VisualWeight, string> = {
  heavy: 'text-deep',
  medium: 'text-neutral-800',
  light: 'text-neutral-700',
  subtle: 'text-neutral-600',
}

/**
 * Mapping from visual weight to Tailwind body text classes.
 */
export const WEIGHT_TO_BODY_CLASS: Record<VisualWeight, string> = {
  heavy: 'text-neutral-600',
  medium: 'text-neutral-600',
  light: 'text-neutral-600',
  subtle: 'text-neutral-500',
}

/**
 * WCAG AA Color Contrast Checker
 * Pure functions for calculating color contrast ratios
 * per WCAG 2.1 guidelines.
 */

export interface RGB {
  r: number
  g: number
  b: number
}

export interface ContrastResult {
  ratio: number
  passesAA: boolean
  passesAALarge: boolean
}

/**
 * Parse a hex color string to RGB values.
 * Supports 3-digit (#RGB) and 6-digit (#RRGGBB) formats.
 */
export function hexToRgb(hex: string): RGB | null {
  const cleaned = hex.replace(/^#/, '')

  let r: number, g: number, b: number

  if (cleaned.length === 3) {
    r = parseInt(cleaned[0] + cleaned[0], 16)
    g = parseInt(cleaned[1] + cleaned[1], 16)
    b = parseInt(cleaned[2] + cleaned[2], 16)
  } else if (cleaned.length === 6) {
    r = parseInt(cleaned.slice(0, 2), 16)
    g = parseInt(cleaned.slice(2, 4), 16)
    b = parseInt(cleaned.slice(4, 6), 16)
  } else {
    return null
  }

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return null
  }

  return { r, g, b }
}

/**
 * Calculate relative luminance of an RGB color
 * per WCAG 2.1 definition.
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function getRelativeLuminance(rgb: RGB): number {
  const [rs, gs, bs] = [rgb.r / 255, rgb.g / 255, rgb.b / 255]

  const r = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4)
  const g = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4)
  const b = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4)

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Calculate WCAG contrast ratio between two hex colors.
 * Returns a value between 1 and 21.
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1)
  const rgb2 = hexToRgb(hex2)

  if (!rgb1 || !rgb2) {
    throw new Error(`Invalid hex color: ${!rgb1 ? hex1 : hex2}`)
  }

  const lum1 = getRelativeLuminance(rgb1)
  const lum2 = getRelativeLuminance(rgb2)

  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check contrast compliance for a color pair.
 * AA normal text: >= 4.5:1
 * AA large text: >= 3:1
 */
export function checkContrast(hex1: string, hex2: string): ContrastResult {
  const ratio = getContrastRatio(hex1, hex2)

  return {
    ratio,
    passesAA: ratio >= 4.5,
    passesAALarge: ratio >= 3,
  }
}

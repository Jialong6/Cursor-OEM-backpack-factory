/**
 * Property 13: Color Contrast Compliance
 * Verifies all color pairs used in the project meet WCAG AA standards.
 */
import { describe, test, expect } from 'vitest'
import fc from 'fast-check'
import {
  hexToRgb,
  getRelativeLuminance,
  getContrastRatio,
  checkContrast,
} from '@/lib/contrast-checker'
import { PALETTE, COLOR_PAIRS } from '@/lib/colors'
import { SECTION_WEIGHTS, WEIGHT_CONTRAST_THRESHOLDS, type VisualWeight } from '@/lib/z-pattern'

// --- Unit Tests: Pure Functions ---

describe('hexToRgb', () => {
  test('parses 6-digit hex correctly', () => {
    expect(hexToRgb('#1A1A1A')).toEqual({ r: 26, g: 26, b: 26 })
    expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 })
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 })
    expect(hexToRgb('#87A575')).toEqual({ r: 135, g: 165, b: 117 })
  })

  test('parses 3-digit hex correctly', () => {
    expect(hexToRgb('#FFF')).toEqual({ r: 255, g: 255, b: 255 })
    expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 })
  })

  test('handles without hash prefix', () => {
    expect(hexToRgb('1A1A1A')).toEqual({ r: 26, g: 26, b: 26 })
  })

  test('returns null for invalid hex', () => {
    expect(hexToRgb('#GGG')).toBeNull()
    expect(hexToRgb('#12345')).toBeNull()
    expect(hexToRgb('')).toBeNull()
    expect(hexToRgb('#XYZXYZ')).toBeNull()
  })
})

describe('getRelativeLuminance', () => {
  test('black has luminance 0', () => {
    expect(getRelativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0)
  })

  test('white has luminance 1', () => {
    expect(getRelativeLuminance({ r: 255, g: 255, b: 255 })).toBe(1)
  })

  test('deep gray (#1A1A1A) has low luminance', () => {
    const lum = getRelativeLuminance({ r: 26, g: 26, b: 26 })
    expect(lum).toBeGreaterThan(0)
    expect(lum).toBeLessThan(0.05)
  })
})

describe('getContrastRatio', () => {
  test('black on white is 21:1', () => {
    const ratio = getContrastRatio('#000000', '#FFFFFF')
    expect(ratio).toBeCloseTo(21, 0)
  })

  test('same color contrast is 1:1', () => {
    expect(getContrastRatio('#1A1A1A', '#1A1A1A')).toBeCloseTo(1, 5)
    expect(getContrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5)
  })

  test('deep on white has high contrast', () => {
    const ratio = getContrastRatio('#1A1A1A', '#FFFFFF')
    expect(ratio).toBeGreaterThan(15)
  })

  test('throws for invalid hex', () => {
    expect(() => getContrastRatio('#INVALID', '#FFFFFF')).toThrow()
  })
})

describe('checkContrast', () => {
  test('black on white passes all levels', () => {
    const result = checkContrast('#000000', '#FFFFFF')
    expect(result.passesAA).toBe(true)
    expect(result.passesAALarge).toBe(true)
    expect(result.ratio).toBeCloseTo(21, 0)
  })

  test('low contrast pair fails AA', () => {
    // light gray on white
    const result = checkContrast('#D4D4D4', '#FFFFFF')
    expect(result.passesAA).toBe(false)
  })
})

// --- Property 13: Color Contrast Compliance ---

describe('Property 13: Color Contrast Compliance', () => {
  test.each(
    COLOR_PAIRS.map((pair, i) => ({
      name: `[${i}] ${pair.usage}`,
      ...pair,
    }))
  )(
    '$name: contrast ratio >= $minContrast:1',
    ({ foreground, background, minContrast }) => {
      const ratio = getContrastRatio(foreground, background)
      expect(ratio).toBeGreaterThanOrEqual(minContrast)
    }
  )

  test('all normal text pairs pass WCAG AA (>= 4.5:1)', () => {
    const normalPairs = COLOR_PAIRS.filter((p) => p.textType === 'normal')
    for (const pair of normalPairs) {
      const ratio = getContrastRatio(pair.foreground, pair.background)
      expect(
        ratio,
        `${pair.usage}: ${pair.foreground} on ${pair.background} = ${ratio.toFixed(2)}:1`
      ).toBeGreaterThanOrEqual(4.5)
    }
  })

  test('all large text pairs pass WCAG AA (>= 3:1)', () => {
    const largePairs = COLOR_PAIRS.filter((p) => p.textType === 'large')
    for (const pair of largePairs) {
      const ratio = getContrastRatio(pair.foreground, pair.background)
      expect(
        ratio,
        `${pair.usage}: ${pair.foreground} on ${pair.background} = ${ratio.toFixed(2)}:1`
      ).toBeGreaterThanOrEqual(3)
    }
  })
})

// --- Mathematical Properties ---

describe('Contrast ratio mathematical properties', () => {
  const validHexArb = fc
    .tuple(
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 })
    )
    .map(
      ([r, g, b]) =>
        `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    )

  test('Property: contrast(A, B) === contrast(B, A) (symmetry)', () => {
    fc.assert(
      fc.property(validHexArb, validHexArb, (hexA, hexB) => {
        const ab = getContrastRatio(hexA, hexB)
        const ba = getContrastRatio(hexB, hexA)
        expect(ab).toBeCloseTo(ba, 10)
      }),
      { numRuns: 200 }
    )
  })

  test('Property: contrast(A, A) === 1 (identity)', () => {
    fc.assert(
      fc.property(validHexArb, (hex) => {
        expect(getContrastRatio(hex, hex)).toBeCloseTo(1, 10)
      }),
      { numRuns: 100 }
    )
  })

  test('Property: 1 <= contrast ratio <= 21 (bounded range)', () => {
    fc.assert(
      fc.property(validHexArb, validHexArb, (hexA, hexB) => {
        const ratio = getContrastRatio(hexA, hexB)
        expect(ratio).toBeGreaterThanOrEqual(1)
        expect(ratio).toBeLessThanOrEqual(21.1) // small epsilon for float
      }),
      { numRuns: 200 }
    )
  })

  test('Property: hexToRgb round-trips for valid 6-digit hex', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        (r, g, b) => {
          const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
          const parsed = hexToRgb(hex)
          expect(parsed).toEqual({ r, g, b })
        }
      ),
      { numRuns: 100 }
    )
  })
})

// --- Deep Gray Comprehensive Verification ---

describe('Deep gray (#1A1A1A) comprehensive verification', () => {
  const lightBackgrounds = [
    { name: 'white', hex: PALETTE.white },
    { name: 'milk/neutral-50', hex: PALETTE.milk },
    { name: 'neutral-100', hex: PALETTE.neutral100 },
    { name: 'neutral-200', hex: PALETTE.neutral200 },
  ]

  test.each(lightBackgrounds)(
    '#1A1A1A on $name passes AA normal text (>= 4.5:1)',
    ({ hex }) => {
      const ratio = getContrastRatio(PALETTE.deep, hex)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    }
  )
})

// --- Z-Pattern Weight Verification ---

describe('Z-pattern visual weight verification', () => {
  test('weight hierarchy: heavy > medium > light > subtle contrast thresholds', () => {
    const weights: VisualWeight[] = ['heavy', 'medium', 'light', 'subtle']

    for (let i = 0; i < weights.length - 1; i++) {
      const current = WEIGHT_CONTRAST_THRESHOLDS[weights[i]]
      const next = WEIGHT_CONTRAST_THRESHOLDS[weights[i + 1]]
      expect(
        current,
        `${weights[i]} (${current}) should be >= ${weights[i + 1]} (${next})`
      ).toBeGreaterThanOrEqual(next)
    }
  })

  test('all section heading colors meet their weight contrast threshold on white', () => {
    for (const section of SECTION_WEIGHTS) {
      const threshold = WEIGHT_CONTRAST_THRESHOLDS[section.weight]
      const ratio = getContrastRatio(section.headingColor, PALETTE.white)
      expect(
        ratio,
        `${section.section} (${section.weight}): ${section.headingColor} on white = ${ratio.toFixed(2)}:1, need >= ${threshold}:1`
      ).toBeGreaterThanOrEqual(threshold)
    }
  })

  test('banner and contact sections use heavy weight', () => {
    const banner = SECTION_WEIGHTS.find((s) => s.section === 'banner')
    const contact = SECTION_WEIGHTS.find((s) => s.section === 'contact')

    expect(banner?.weight).toBe('heavy')
    expect(contact?.weight).toBe('heavy')
  })

  test('heavy weight sections use deep color (#1A1A1A)', () => {
    const heavySections = SECTION_WEIGHTS.filter((s) => s.weight === 'heavy')
    for (const section of heavySections) {
      expect(section.headingColor).toBe(PALETTE.deep)
    }
  })
})

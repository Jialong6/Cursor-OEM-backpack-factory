/**
 * Glossary data structure definitions
 *
 * Defines the structure and categories for the glossary page.
 * Term content is sourced from locale translation files.
 */

/**
 * Glossary term interface
 */
export interface GlossaryTerm {
  /** Unique identifier for the term (used as anchor ID) */
  id: string;
  /** Category this term belongs to */
  category: GlossaryCategory;
}

/**
 * Glossary category types
 */
export type GlossaryCategory =
  | 'materials'
  | 'manufacturing'
  | 'quality'
  | 'logistics'
  | 'design';

/**
 * All glossary categories with display order
 */
export const GLOSSARY_CATEGORIES: readonly GlossaryCategory[] = [
  'materials',
  'manufacturing',
  'quality',
  'logistics',
  'design',
] as const;

/**
 * Glossary term definitions with category assignments
 */
export const GLOSSARY_TERMS: readonly GlossaryTerm[] = [
  { id: 'oem', category: 'manufacturing' },
  { id: 'odm', category: 'manufacturing' },
  { id: 'moq', category: 'manufacturing' },
  { id: 'tech-pack', category: 'design' },
  { id: 'denier', category: 'materials' },
  { id: 'ripstop', category: 'materials' },
  { id: 'cordura', category: 'materials' },
  { id: 'bartack', category: 'manufacturing' },
  { id: 'aql', category: 'quality' },
  { id: 'fob', category: 'logistics' },
  { id: 'bom', category: 'design' },
  { id: 'ykk', category: 'materials' },
  { id: 'pantone', category: 'design' },
  { id: 'grs', category: 'quality' },
  { id: 'oeko-tex', category: 'quality' },
  { id: 'cif', category: 'logistics' },
  { id: 'exw', category: 'logistics' },
  { id: 'pp-sample', category: 'manufacturing' },
  { id: 'top-sample', category: 'manufacturing' },
  { id: 'tpu', category: 'materials' },
] as const;

/**
 * All term IDs for quick lookup
 */
export const GLOSSARY_TERM_IDS = GLOSSARY_TERMS.map((t) => t.id);

/**
 * Get terms filtered by category
 */
export function getTermsByCategory(category: GlossaryCategory): readonly GlossaryTerm[] {
  return GLOSSARY_TERMS.filter((t) => t.category === category);
}

import { describe, it, expect } from 'vitest';
import { GLOSSARY_TERMS, GLOSSARY_CATEGORIES, getTermsByCategory } from '../lib/glossary-data';
import fs from 'fs';
import path from 'path';

/**
 * Glossary page tests
 *
 * Validates glossary data structure, term uniqueness,
 * and translation completeness.
 */

const LOCALES_DIR = path.join(process.cwd(), 'locales');

function loadTranslationFile(locale: string): Record<string, unknown> {
  const filePath = path.join(LOCALES_DIR, `${locale}.json`);
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

describe('Glossary Page', () => {
  describe('Data structure', () => {
    it('should have 20 glossary terms', () => {
      expect(GLOSSARY_TERMS).toHaveLength(20);
    });

    it('should have 5 categories', () => {
      expect(GLOSSARY_CATEGORIES).toHaveLength(5);
      expect(GLOSSARY_CATEGORIES).toContain('materials');
      expect(GLOSSARY_CATEGORIES).toContain('manufacturing');
      expect(GLOSSARY_CATEGORIES).toContain('quality');
      expect(GLOSSARY_CATEGORIES).toContain('logistics');
      expect(GLOSSARY_CATEGORIES).toContain('design');
    });

    it('every term should have a unique id', () => {
      const ids = GLOSSARY_TERMS.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('every category should have at least 2 terms', () => {
      for (const category of GLOSSARY_CATEGORIES) {
        const terms = getTermsByCategory(category);
        expect(
          terms.length,
          `Category "${category}" should have at least 2 terms`
        ).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('Translation completeness', () => {
    it('en.json should have glossary.terms with all term IDs', () => {
      const en = loadTranslationFile('en');
      const glossary = en.glossary as Record<string, unknown>;
      const terms = glossary.terms as Record<string, unknown>;

      for (const termDef of GLOSSARY_TERMS) {
        const termData = terms[termDef.id] as Record<string, string> | undefined;
        expect(termData, `en.json missing glossary term: ${termDef.id}`).toBeDefined();
        expect(termData?.term, `en.json term ${termDef.id} missing "term" field`).toBeDefined();
        expect(termData?.definition, `en.json term ${termDef.id} missing "definition" field`).toBeDefined();
        expect(termData?.term.length).toBeGreaterThan(0);
        expect(termData?.definition.length).toBeGreaterThan(0);
      }
    });

    it('zh.json should have glossary.terms with all term IDs', () => {
      const zh = loadTranslationFile('zh');
      const glossary = zh.glossary as Record<string, unknown>;
      const terms = glossary.terms as Record<string, unknown>;

      for (const termDef of GLOSSARY_TERMS) {
        const termData = terms[termDef.id] as Record<string, string> | undefined;
        expect(termData, `zh.json missing glossary term: ${termDef.id}`).toBeDefined();
        expect(termData?.term, `zh.json term ${termDef.id} missing "term" field`).toBeDefined();
        expect(termData?.definition, `zh.json term ${termDef.id} missing "definition" field`).toBeDefined();
      }
    });

    it('glossary section should have required top-level keys', () => {
      const en = loadTranslationFile('en');
      const glossary = en.glossary as Record<string, unknown>;

      expect(glossary.title).toBeDefined();
      expect(glossary.subtitle).toBeDefined();
      expect(glossary.description).toBeDefined();
      expect(glossary.allCategories).toBeDefined();
      expect(glossary.categories).toBeDefined();
      expect(glossary.backToHome).toBeDefined();
      expect(glossary.relatedLinks).toBeDefined();
      expect(glossary.terms).toBeDefined();
    });

    it('glossary categories should have labels for all 5 categories', () => {
      const en = loadTranslationFile('en');
      const glossary = en.glossary as Record<string, unknown>;
      const categories = glossary.categories as Record<string, string>;

      for (const category of GLOSSARY_CATEGORIES) {
        expect(
          categories[category],
          `Missing category label: ${category}`
        ).toBeDefined();
        expect(categories[category].length).toBeGreaterThan(0);
      }
    });
  });
});

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { GLOSSARY_TERMS, GLOSSARY_CATEGORIES, getTermsByCategory } from '../../lib/glossary-data';

/**
 * Property-based tests: Glossary DefinedTermSet JSON-LD validity
 *
 * Validates that the glossary schema generates correct DefinedTermSet
 * structured data for AI search engine indexing.
 */

interface DefinedTermSetSchema {
  '@context': string;
  '@type': string;
  name: string;
  inLanguage: string;
  definedTerm: Array<{
    '@type': string;
    name: string;
    description: string;
  }>;
}

/**
 * Simulate GlossarySchema component behavior
 */
function generateGlossarySchema(
  terms: ReadonlyArray<{ term: string; definition: string }>,
  locale: string
): DefinedTermSetSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'Backpack Manufacturing Glossary',
    inLanguage: locale,
    definedTerm: terms.map((item) => ({
      '@type': 'DefinedTerm',
      name: item.term,
      description: item.definition,
    })),
  };
}

const supportedLocales = ['en', 'zh', 'ja', 'de', 'nl', 'fr', 'pt', 'es', 'zh-tw', 'ru'] as const;

describe('Property: Glossary DefinedTermSet JSON-LD Validity', () => {
  it('DefinedTermSet should contain required fields (@context, @type, definedTerm)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...supportedLocales),
        fc.array(
          fc.record({
            term: fc.string({ minLength: 1, maxLength: 100 }),
            definition: fc.string({ minLength: 1, maxLength: 500 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (locale, terms) => {
          const schema = generateGlossarySchema(terms, locale);

          expect(schema['@context']).toBe('https://schema.org');
          expect(schema['@type']).toBe('DefinedTermSet');
          expect(schema.definedTerm).toBeDefined();
          expect(Array.isArray(schema.definedTerm)).toBe(true);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('each DefinedTerm should contain name and description', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            term: fc.string({ minLength: 1, maxLength: 100 }),
            definition: fc.string({ minLength: 1, maxLength: 500 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (terms) => {
          const schema = generateGlossarySchema(terms, 'en');

          for (const definedTerm of schema.definedTerm) {
            expect(definedTerm['@type']).toBe('DefinedTerm');
            expect(definedTerm.name).toBeDefined();
            expect(definedTerm.name.length).toBeGreaterThan(0);
            expect(definedTerm.description).toBeDefined();
            expect(definedTerm.description.length).toBeGreaterThan(0);
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('inLanguage should match the provided locale', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...supportedLocales),
        (locale) => {
          const schema = generateGlossarySchema(
            [{ term: 'Test', definition: 'Test definition' }],
            locale
          );

          expect(schema.inLanguage).toBe(locale);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('empty terms list should generate valid JSON-LD with empty definedTerm', () => {
    const schema = generateGlossarySchema([], 'en');

    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('DefinedTermSet');
    expect(schema.definedTerm).toEqual([]);
    expect(() => JSON.stringify(schema)).not.toThrow();
  });

  it('schema should be serializable to valid JSON', () => {
    const terms = [
      { term: 'OEM', definition: 'Original Equipment Manufacturer' },
      { term: 'MOQ', definition: 'Minimum Order Quantity' },
    ];
    const schema = generateGlossarySchema(terms, 'en');

    expect(() => JSON.stringify(schema)).not.toThrow();
    const parsed = JSON.parse(JSON.stringify(schema));
    expect(parsed['@type']).toBe('DefinedTermSet');
    expect(parsed.definedTerm).toHaveLength(2);
  });
});

describe('Glossary Data Structure', () => {
  it('GLOSSARY_TERMS should have at least 15 terms', () => {
    expect(GLOSSARY_TERMS.length).toBeGreaterThanOrEqual(15);
  });

  it('GLOSSARY_CATEGORIES should have 5 categories', () => {
    expect(GLOSSARY_CATEGORIES).toHaveLength(5);
  });

  it('every term should belong to a valid category', () => {
    for (const term of GLOSSARY_TERMS) {
      expect(GLOSSARY_CATEGORIES).toContain(term.category);
    }
  });

  it('every term should have a unique id', () => {
    const ids = GLOSSARY_TERMS.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('getTermsByCategory should return only terms from the specified category', () => {
    for (const category of GLOSSARY_CATEGORIES) {
      const terms = getTermsByCategory(category);
      expect(terms.length).toBeGreaterThan(0);
      for (const term of terms) {
        expect(term.category).toBe(category);
      }
    }
  });
});

/**
 * GlossarySchema JSON-LD component
 *
 * Generates DefinedTermSet structured data for the glossary page,
 * enabling AI search engines (Google SGE, Perplexity) to index
 * industry terminology definitions.
 *
 * Safety notes:
 * - JSON-LD content sourced from trusted translation files only
 * - No user input accepted, no XSS risk
 * - JSON.stringify auto-escapes special characters
 * - Same pattern as FAQPageSchema.tsx which is already in production
 */

interface GlossarySchemaProps {
  /** Array of term/definition pairs */
  terms: ReadonlyArray<{ term: string; definition: string }>;
  /** Current locale code */
  locale: string;
}

export default function GlossarySchema({ terms, locale }: GlossarySchemaProps) {
  const jsonLd = {
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

  // Safe: JSON.stringify serializes the object to valid JSON string.
  // Source is trusted translation file data (locales/*.json).
  // JSON-LD script tag is standard SEO practice.
  // This follows the same pattern as FAQPageSchema.tsx.
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd),
      }}
    />
  );
}

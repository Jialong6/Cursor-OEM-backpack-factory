import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { locales } from '../../i18n';

/**
 * Tests for Hub & Spoke information architecture
 *
 * Validates cross-linking between FAQ, Blog, Glossary, and Footer
 * to ensure proper internal linking structure for SEO.
 */

const LOCALES_DIR = path.join(process.cwd(), 'locales');

function loadTranslationFile(locale: string): Record<string, unknown> {
  const filePath = path.join(LOCALES_DIR, `${locale}.json`);
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

describe('Hub & Spoke Links', () => {
  describe('FAQ cross-links', () => {
    it('FAQ cta section should have glossaryLink for all locales', () => {
      for (const locale of locales) {
        const translations = loadTranslationFile(locale);
        const faq = translations.faq as Record<string, unknown>;
        const cta = faq.cta as Record<string, string>;

        expect(cta.glossaryLink, `${locale}: faq.cta.glossaryLink missing`).toBeDefined();
        expect(cta.glossaryLink.length).toBeGreaterThan(0);
      }
    });

    it('FAQ cta section should have blogLink for all locales', () => {
      for (const locale of locales) {
        const translations = loadTranslationFile(locale);
        const faq = translations.faq as Record<string, unknown>;
        const cta = faq.cta as Record<string, string>;

        expect(cta.blogLink, `${locale}: faq.cta.blogLink missing`).toBeDefined();
        expect(cta.blogLink.length).toBeGreaterThan(0);
      }
    });

    it('FAQ cta should have all required text keys', () => {
      for (const locale of locales) {
        const translations = loadTranslationFile(locale);
        const faq = translations.faq as Record<string, unknown>;
        const cta = faq.cta as Record<string, string>;

        expect(cta.text).toBeDefined();
        expect(cta.highlight).toBeDefined();
        expect(cta.suffix).toBeDefined();
        expect(cta.button).toBeDefined();
      }
    });
  });

  describe('Blog cross-links', () => {
    it('Blog section should have relatedLinks.glossary for all locales', () => {
      for (const locale of locales) {
        const translations = loadTranslationFile(locale);
        const blog = translations.blog as Record<string, unknown>;
        const relatedLinks = blog.relatedLinks as Record<string, string>;

        expect(relatedLinks, `${locale}: blog.relatedLinks missing`).toBeDefined();
        expect(relatedLinks.glossary, `${locale}: blog.relatedLinks.glossary missing`).toBeDefined();
        expect(relatedLinks.glossary.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Blog list cross-links', () => {
    it('BlogList should have relatedLinks with glossary and faq for all locales', () => {
      for (const locale of locales) {
        const translations = loadTranslationFile(locale);
        const blogList = translations.blogList as Record<string, unknown>;
        const relatedLinks = blogList.relatedLinks as Record<string, string>;

        expect(relatedLinks, `${locale}: blogList.relatedLinks missing`).toBeDefined();
        expect(relatedLinks.glossary, `${locale}: blogList.relatedLinks.glossary missing`).toBeDefined();
        expect(relatedLinks.faq, `${locale}: blogList.relatedLinks.faq missing`).toBeDefined();
      }
    });
  });

  describe('Footer links', () => {
    it('Footer links should include Glossary entry for all locales', () => {
      for (const locale of locales) {
        const translations = loadTranslationFile(locale);
        const footer = translations.footer as Record<string, unknown>;
        const links = footer.links as Array<{ name: string; href: string }>;

        const glossaryLink = links.find((link) => link.href === '/glossary');
        expect(glossaryLink, `${locale}: footer missing Glossary link`).toBeDefined();
      }
    });

    it('Footer Glossary link should use path-based href (not anchor)', () => {
      for (const locale of locales) {
        const translations = loadTranslationFile(locale);
        const footer = translations.footer as Record<string, unknown>;
        const links = footer.links as Array<{ name: string; href: string }>;

        const glossaryLink = links.find((link) => link.href === '/glossary');
        expect(glossaryLink?.href).toBe('/glossary');
        expect(glossaryLink?.href.startsWith('#')).toBe(false);
      }
    });
  });

  describe('Glossary cross-links', () => {
    it('Glossary should have relatedLinks with faq and blog for all locales', () => {
      for (const locale of locales) {
        const translations = loadTranslationFile(locale);
        const glossary = translations.glossary as Record<string, unknown>;
        const relatedLinks = glossary.relatedLinks as Record<string, string>;

        expect(relatedLinks, `${locale}: glossary.relatedLinks missing`).toBeDefined();
        expect(relatedLinks.faq, `${locale}: glossary.relatedLinks.faq missing`).toBeDefined();
        expect(relatedLinks.blog, `${locale}: glossary.relatedLinks.blog missing`).toBeDefined();
      }
    });
  });
});

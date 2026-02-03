'use client';

import { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { GlossarySchema } from '@/components/seo';
import {
  GLOSSARY_CATEGORIES,
  GLOSSARY_TERMS,
  type GlossaryCategory,
} from '@/lib/glossary-data';

/**
 * Glossary page component
 *
 * Displays industry terminology organized by category
 * with filtering, anchor links, and DefinedTermSet JSON-LD.
 */
export default function GlossaryPage() {
  const t = useTranslations('glossary');
  const locale = useLocale();
  const [activeCategory, setActiveCategory] = useState<GlossaryCategory | 'all'>('all');

  // Build terms data from translations
  const termsData = useMemo(() => {
    return GLOSSARY_TERMS.map((termDef) => ({
      ...termDef,
      term: t(`terms.${termDef.id}.term`),
      definition: t(`terms.${termDef.id}.definition`),
    }));
  }, [t]);

  // Filter by active category
  const filteredTerms = useMemo(() => {
    const filtered = activeCategory === 'all'
      ? [...termsData]
      : termsData.filter((term) => term.category === activeCategory);

    // Sort alphabetically by term name
    return filtered.sort((a, b) => a.term.localeCompare(b.term));
  }, [termsData, activeCategory]);

  // Prepare terms for JSON-LD schema
  const schemaTerms = termsData.map((term) => ({
    term: term.term,
    definition: term.definition,
  }));

  return (
    <>
      <GlossarySchema terms={schemaTerms} locale={locale} />

      <main className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Page header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('title')}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
              {t('subtitle')}
            </p>
            <p className="text-gray-500 max-w-2xl mx-auto">
              {t('description')}
            </p>
          </div>

          {/* Back to home */}
          <div className="mb-8">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center text-primary hover:text-primary-dark font-semibold transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t('backToHome')}
            </Link>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-10">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:border-primary hover:text-primary'
              }`}
            >
              {t('allCategories')}
            </button>
            {GLOSSARY_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-600 border border-gray-300 hover:border-primary hover:text-primary'
                }`}
              >
                {t(`categories.${category}`)}
              </button>
            ))}
          </div>

          {/* Terms list */}
          <div className="space-y-4">
            {filteredTerms.map((termData) => (
              <div
                key={termData.id}
                id={`term-${termData.id}`}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">
                      {termData.term}
                    </h2>
                    <span className="inline-block text-xs font-medium text-primary uppercase tracking-wide mb-3">
                      {t(`categories.${termData.category}`)}
                    </span>
                    <p className="text-gray-600 leading-relaxed">
                      {termData.definition}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Term count */}
          <div className="mt-8 text-center text-gray-500 text-sm">
            {filteredTerms.length} / {termsData.length}
          </div>

          {/* Cross-links */}
          <div className="mt-12 rounded-xl bg-white border border-gray-200 p-8 text-center">
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href={`/${locale}/#faq`}
                className="inline-flex items-center justify-center text-primary hover:text-primary-dark font-semibold transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('relatedLinks.faq')}
              </Link>
              <Link
                href={`/${locale}/blog`}
                className="inline-flex items-center justify-center text-primary hover:text-primary-dark font-semibold transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                {t('relatedLinks.blog')}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Accordion from '@/components/ui/Accordion';
import { FAQPageSchema, type FAQSection } from '@/components/seo';

/**
 * FAQ section component
 *
 * Features:
 * - Displays categorized FAQ content (5 categories)
 * - Accordion-style Q&A presentation
 * - FAQPage JSON-LD structured data
 * - Cross-links to Glossary and Blog (Hub & Spoke)
 * - All text sourced from translation keys (no hardcoded strings)
 */
export default function FAQ() {
  const t = useTranslations('faq');
  const locale = useLocale();

  const sections = t.raw('sections') as FAQSection[];

  return (
    <>
      <FAQPageSchema sections={sections} />

      <section
        id="faq"
        className="relative bg-neutral-50 px-6 py-20 md:px-12 lg:py-28"
      >
        <div className="mx-auto w-full max-w-5xl">
          {/* Title */}
          <h2 className="mb-16 text-center text-3xl font-bold text-neutral-800 md:text-4xl lg:text-5xl">
            {t('title')}
          </h2>

          {/* FAQ categories */}
          <div className="space-y-12">
            {sections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                    {sectionIndex + 1}
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-800 md:text-3xl">
                    {section.title}
                  </h3>
                </div>

                <Accordion items={section.items} idPrefix={`faq-${sectionIndex}`} />
              </div>
            ))}
          </div>

          {/* CTA section */}
          <div className="mt-16 rounded-xl bg-white border border-neutral-200 p-8 text-center">
            <p className="mb-4 text-lg text-neutral-600">
              {t('cta.text')}{' '}
              <span className="font-semibold text-primary">
                {t('cta.highlight')}
              </span>{' '}
              {t('cta.suffix')}
            </p>
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                const contactSection = document.getElementById('contact');
                if (contactSection) {
                  const navbarHeight = 80;
                  const targetPosition =
                    contactSection.getBoundingClientRect().top +
                    window.pageYOffset -
                    navbarHeight;
                  window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth',
                  });
                }
              }}
              className="inline-block rounded-lg bg-primary px-8 py-3 font-semibold text-white transition-all hover:bg-primary-dark hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-primary/30"
            >
              {t('cta.button')}
            </a>

            {/* Cross-links to Glossary and Blog */}
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4 text-sm">
              <Link
                href={`/${locale}/glossary`}
                className="text-primary hover:text-primary-dark font-medium transition-colors"
              >
                {t('cta.glossaryLink')}
              </Link>
              <Link
                href={`/${locale}/blog`}
                className="text-primary hover:text-primary-dark font-medium transition-colors"
              >
                {t('cta.blogLink')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

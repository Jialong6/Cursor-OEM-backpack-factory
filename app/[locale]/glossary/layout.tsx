import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { type Locale } from '@/i18n';
import { generateGenericMetadata } from '@/lib/metadata';

/**
 * Glossary page Layout
 *
 * Configures SEO metadata for the glossary page (localized per locale).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'glossary' });
  return generateGenericMetadata(
    locale as Locale,
    `${t('title')} | Better Bags Myanmar`,
    t('description'),
    '/glossary'
  );
}

export default function GlossaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

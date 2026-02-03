import type { Metadata } from 'next';
import { generateGenericMetadata } from '@/lib/metadata';

/**
 * Glossary page Layout
 *
 * Configures SEO metadata for the glossary page.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateGenericMetadata(
    locale as 'en' | 'zh',
    'Backpack Manufacturing Glossary | Better Bags Myanmar',
    'Essential industry terms and definitions for OEM/ODM backpack production. Learn about materials, manufacturing processes, quality control, and logistics.',
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

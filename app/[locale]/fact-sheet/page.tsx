import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { locales, type Locale } from '@/i18n';
import { generateGenericMetadata } from '@/lib/metadata';
import FactSheet from '@/components/sections/FactSheet';
import { FactSheetSchema } from '@/components/seo';

/**
 * Fact Sheet 页(GEO / AI 搜索优化)
 *
 * 为生成式搜索引擎提供"确定、短、可引用"的公司事实页,每语言一个版本
 * (/{locale}/fact-sheet)。瘦异步 server 组件:数据取自 locales JSON 的
 * factSheet namespace,直出 SSR HTML + AboutPage JSON-LD。
 *
 * 元数据直接在本页文件生成(不建 layout.tsx —— glossary 用 layout 只因它是
 * client 页);canonical / hreflang / OG 由 generateGenericMetadata 统一产出。
 * generateStaticParams 由根布局覆盖,无需在此声明。
 */

/**
 * 将传入 locale 收敛为受支持的 Locale(非法回退 en),模式同 blog/layout。
 */
function resolveLocale(locale: string): Locale {
  return (locales.includes(locale as Locale) ? locale : 'en') as Locale;
}

/**
 * 生成 Fact Sheet 页元数据
 *
 * 需求 14.1(标题 ≤60)、14.2(描述 ≤150)、14.3(OG)、14.8(hreflang)
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = resolveLocale(locale);
  const t = await getTranslations({
    locale: validLocale,
    namespace: 'metadata.factSheet',
  });
  return generateGenericMetadata(
    validLocale,
    t('title'),
    t('description'),
    '/fact-sheet'
  );
}

/**
 * Fact Sheet 页面组件(async server)
 */
export default async function FactSheetPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale = resolveLocale(locale);
  const t = await getTranslations({
    locale: validLocale,
    namespace: 'factSheet',
  });

  const title = t('title');
  const intro = t('intro');
  const lastUpdated = t('lastUpdated');
  const facts = t.raw('facts') as ReadonlyArray<{
    label: string;
    value: string;
  }>;

  return (
    <>
      <FactSheetSchema locale={validLocale} name={title} description={intro} />
      <FactSheet
        title={title}
        intro={intro}
        lastUpdated={lastUpdated}
        facts={facts}
      />
    </>
  );
}

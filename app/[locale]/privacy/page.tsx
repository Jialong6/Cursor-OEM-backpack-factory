import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { locales, type Locale } from '@/i18n';
import { generateGenericMetadata } from '@/lib/metadata';
import { BreadcrumbSchema } from '@/components/seo';
import { FACTORY_INFO } from '@/lib/factory-info';
import { PRIVACY_DATE_MODIFIED } from '@/lib/content-dates';
import ConsentResetButton from '@/components/analytics/ConsentResetButton';

/**
 * 隐私政策页(/{locale}/privacy)
 *
 * 接入第三方分析的合规前提:同意条链到这里,访客也要能读到我们收集什么、
 * 为什么收集、保留多久、交给了哪些服务商。站点原先完全没有这个页面,
 * 而 12 个 locale 里有 5 个是欧盟语言 —— 这是个实打实的缺口。
 *
 * 瘦异步 server 组件,结构镜像 fact-sheet / virtual-factory-tour:文案
 * 全部来自 locales JSON 的 privacy 命名空间,页面本身不硬编码任何一句。
 * 唯一的客户端孤岛是「更改我的选择」按钮,它要读浏览器里的同意状态。
 * generateStaticParams 由根布局覆盖,无需在此声明。
 */

interface PrivacySection {
  heading: string;
  paragraphs: ReadonlyArray<string>;
}

/** 把传入 locale 收敛为受支持的 Locale(非法回退 en) */
function resolveLocale(locale: string): Locale {
  return (locales.includes(locale as Locale) ? locale : 'en') as Locale;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = resolveLocale(locale);
  const t = await getTranslations({
    locale: validLocale,
    namespace: 'metadata.privacy',
  });

  return generateGenericMetadata(
    validLocale,
    t('title'),
    t('description'),
    '/privacy'
  );
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale = resolveLocale(locale);
  const t = await getTranslations({ locale: validLocale, namespace: 'privacy' });
  const tNav = await getTranslations({ locale: validLocale, namespace: 'nav' });

  const title = t('title');
  const sections = t.raw('sections') as ReadonlyArray<PrivacySection>;

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: tNav('banner'), path: `/${validLocale}` },
          { name: title },
        ]}
      />

      <article className="container mx-auto max-w-3xl px-4 py-16 md:py-24">
        <header className="mb-10">
          <h1 className="mb-3 text-3xl font-bold text-gray-900 md:text-4xl">
            {title}
          </h1>
          <p className="text-sm text-gray-500">
            {t('lastUpdated', { date: PRIVACY_DATE_MODIFIED })}
          </p>
        </header>

        <p className="mb-10 text-base leading-relaxed text-gray-700">
          {t('intro')}
        </p>

        {sections.map((section) => (
          <section key={section.heading} className="mb-8">
            <h2 className="mb-3 text-xl font-semibold text-gray-900">
              {section.heading}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="mb-3 text-base leading-relaxed text-gray-700"
              >
                {paragraph}
              </p>
            ))}
          </section>
        ))}

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            {t('choiceHeading')}
          </h2>
          <ConsentResetButton />
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            {t('contactHeading')}
          </h2>
          <p className="text-base leading-relaxed text-gray-700">
            {t('contactBody', { email: FACTORY_INFO.email })}
          </p>
        </section>
      </article>
    </>
  );
}

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { locales, type Locale } from '@/i18n';
import { generateGenericMetadata } from '@/lib/metadata';
import VirtualTour from '@/components/sections/VirtualTour';
import CalTourEmbed from '@/components/booking/CalTourEmbed';
import { BreadcrumbSchema, VirtualTourSchema } from '@/components/seo';

/**
 * 虚拟看厂预约落地页(/{locale}/virtual-factory-tour)
 *
 * 访客自助预约 60 分钟线上看厂(Zoom / Google Meet 二选一):
 * - 文案区块服务端直出(SSR),每语言一个版本,SEO/GEO 落地页
 * - 预约日历为 Cal.com 嵌入(CalTourEmbed client island),可约时段
 *   Mon-Sat 07:30-17:00 Asia/Yangon 配置在 Cal.com 后台
 *   (见 docs/CAL_COM_SETUP.md),访客时区自动换算
 *
 * 瘦异步 server 组件,逐行镜像 fact-sheet 页模式:数据取自 locales JSON
 * 的 virtualTour namespace,直出 HTML + Service/BreadcrumbList JSON-LD。
 * generateStaticParams 由根布局覆盖,无需在此声明。
 */

/**
 * 将传入 locale 收敛为受支持的 Locale(非法回退 en),模式同 fact-sheet。
 */
function resolveLocale(locale: string): Locale {
  return (locales.includes(locale as Locale) ? locale : 'en') as Locale;
}

/**
 * 生成虚拟看厂页元数据(标题 ≤60、描述 ≤150,canonical/hreflang/OG
 * 由 generateGenericMetadata 统一产出)
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
    namespace: 'metadata.virtualTour',
  });
  return generateGenericMetadata(
    validLocale,
    t('title'),
    t('description'),
    '/virtual-factory-tour'
  );
}

/**
 * 虚拟看厂预约页面组件(async server)
 */
export default async function VirtualFactoryTourPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale = resolveLocale(locale);
  const t = await getTranslations({
    locale: validLocale,
    namespace: 'virtualTour',
  });
  const tNav = await getTranslations({
    locale: validLocale,
    namespace: 'nav',
  });

  const title = t('title');
  const intro = t('intro');
  const highlights = t.raw('highlights') as ReadonlyArray<string>;
  const whatYouSeeItems = t.raw('whatYouSee.items') as ReadonlyArray<{
    title: string;
    desc: string;
  }>;
  const howItWorksSteps = t.raw('howItWorks.steps') as ReadonlyArray<{
    title: string;
    desc: string;
  }>;
  const detailsItems = t.raw('details.items') as ReadonlyArray<{
    label: string;
    value: string;
  }>;

  return (
    <>
      <VirtualTourSchema
        locale={validLocale}
        name={title}
        description={intro}
      />
      <BreadcrumbSchema
        items={[
          { name: tNav('banner'), path: `/${validLocale}` },
          { name: title },
        ]}
      />
      <VirtualTour
        title={title}
        subtitle={t('subtitle')}
        intro={intro}
        highlights={highlights}
        whatYouSeeTitle={t('whatYouSee.title')}
        whatYouSeeItems={whatYouSeeItems}
        howItWorksTitle={t('howItWorks.title')}
        howItWorksSteps={howItWorksSteps}
        detailsTitle={t('details.title')}
        detailsItems={detailsItems}
        bookingTitle={t('booking.title')}
        bookingSlot={<CalTourEmbed />}
      />
    </>
  );
}

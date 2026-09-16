'use client';

import { useTranslations } from 'next-intl';
import { buildWhatsAppHref } from '@/lib/contact-links';

/**
 * 全站常驻的 WhatsApp 入口
 *
 * 为什么要有它(埋点数据,2026-09-12 起三天):
 * 首页 15 次落地 → 5 次滚过一半 → **2 次看到 contact 区** → 0 次开始填表。
 * 在此之前全站的 wa.me / tel: / mailto: 只存在于第 10 屏 contact 区的左栏,
 * 首屏一个都没有;而 /blog、/glossary、/fact-sheet、/virtual-factory-tour
 * 连报价浮窗都没有(它只挂在 app/[locale]/page.tsx),询盘入口为零。
 *
 * 为什么是 WhatsApp 而不是把表单改短:OEM 这行本来就是在 WhatsApp 上谈的,
 * 而那张表的 8 个必填项是用来筛掉无效询盘的,不该动。低门槛入口另开一条,
 * 两条路并存 —— 想认真报价的走表单,先问一句的走这里。
 *
 * 位置:报价浮窗固定在右上角(right: 16,top 可拖),所以这里走右下角,
 * 两者不抢地方。z-40 低于同意条的 z-[60]:欧盟访客先做同意选择。
 *
 * 埋点靠 InsightTracker 的委托监听器自动采集,本组件不需要任何 onClick ——
 * 只要挂上 data-analytics-label 即可,而且上报的只有这个标签,
 * 号码一个字符都不进库。
 */
export default function FloatingWhatsApp() {
  const t = useTranslations('floatingContact');
  const tContact = useTranslations('contact');

  return (
    <a
      href={buildWhatsAppHref(tContact('whatsapp.value'), t('prefill'))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('aria')}
      data-analytics-label="floating"
      className="fixed bottom-5 right-4 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-lg transition-shadow hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#25D366]/40 sm:right-6 sm:px-5"
    >
      {/* WhatsApp 官方字形。内联而不是走 next/image:一个 20px 的图标不值得
          多一次网络往返,而且它要在每个页面的首屏就可见 */}
      <svg
        className="h-6 w-6 flex-shrink-0"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.988 2.896 9.83 9.83 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.8 11.8 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.9 11.9 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413Z" />
      </svg>
      <span className="hidden text-sm font-semibold sm:inline">{t('label')}</span>
    </a>
  );
}

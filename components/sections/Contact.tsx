'use client';

import { useTranslations } from 'next-intl';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import TrustSignals from '@/components/content/TrustSignals';
import QuoteFormFields from '@/components/quote/QuoteFormFields';

/**
 * 联系我们区块组件
 *
 * 功能：
 * - 左栏：联系信息（地址、电话×4 语言、邮箱、WhatsApp）+ 信任信号
 * - 右栏：完整的 Get A Quote 表单（QuoteFormFields，与右下角浮窗共享状态）
 *
 * 注：表单的状态/提交/草稿/Geo 全部由 QuoteFormProvider 托管，
 * Provider 由 app/[locale]/page.tsx 在外层挂载。
 */
export default function Contact() {
  const t = useTranslations('contact');

  const titleAnim = useScrollAnimation({ variant: 'fade-up' });
  const formAnim = useScrollAnimation({ variant: 'fade-up', delay: 100 });

  return (
    <section id="contact" className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* 标题部分 */}
        <div ref={titleAnim.ref as React.RefObject<HTMLDivElement>} className={`text-center mb-12 ${titleAnim.animationClassName}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-deep mb-4">{t('title')}</h2>
          <p className="text-xl md:text-2xl text-primary font-semibold mb-2">{t('subtitle')}</p>
          <p className="text-neutral-600 max-w-2xl mx-auto">{t('intro')}</p>
        </div>

        <div ref={formAnim.ref as React.RefObject<HTMLDivElement>} className={`grid grid-cols-1 lg:grid-cols-3 gap-8 ${formAnim.animationClassName}`}>
          {/* 左侧：联系信息 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 地址 */}
            <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-neutral-800 mb-3">{t('address.label')}</h3>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Better+Bags+Myanmar"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('address.viewOnMap')}
                className="text-neutral-600 hover:text-primary hover:underline transition-colors inline-flex items-start gap-1"
              >
                <span>{t('address.value')}</span>
                <svg className="w-4 h-4 mt-0.5 shrink-0 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {/* 电话：按语言区分 4 个号码 */}
            <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-neutral-800 mb-3">{t('phone.label')}</h3>
              <div className="space-y-3">
                {(t.raw('phone.lines') as Array<{ lang: string; number: string; hours: string; person: string }>).map((line) => (
                  <div key={line.number} className="text-sm">
                    <div className="font-medium text-neutral-700">
                      {line.lang}
                      {line.person && <span className="text-neutral-500 font-normal"> · {line.person}</span>}
                    </div>
                    <a
                      href={`tel:${line.number.replace(/[\s()-]/g, '')}`}
                      className="text-primary hover:text-primary-dark font-medium block"
                    >
                      {line.number}
                    </a>
                    <div className="text-xs text-neutral-500 mt-0.5">{line.hours}</div>
                  </div>
                ))}
                <p className="text-xs text-neutral-500 italic pt-1 border-t border-neutral-200">
                  {t('phone.fallback')}
                </p>
              </div>
            </div>

            {/* 邮箱 */}
            <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-neutral-800 mb-3">{t('email.label')}</h3>
              <a href={`mailto:${t('email.value')}`} className="text-primary hover:text-primary-dark font-medium">
                {t('email.value')}
              </a>
            </div>

            {/* WhatsApp */}
            <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-neutral-800 mb-3">{t('whatsapp.label')}</h3>
              <a
                href={`https://wa.me/${t('whatsapp.value').replace(/[\s()-]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-dark font-medium"
              >
                {t('whatsapp.value')}
              </a>
            </div>

            {/* 信任信号 */}
            <TrustSignals />
          </div>

          {/* 右侧：表单（与右下角浮窗共享状态） */}
          <div className="lg:col-span-2">
            <div id="contact-form" className="bg-neutral-50 rounded-lg border border-neutral-200 p-6 md:p-8 scroll-mt-24">
              <h3 className="text-2xl font-bold text-neutral-800 mb-6">{t('form.title')}</h3>
              <QuoteFormFields variant="inline" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

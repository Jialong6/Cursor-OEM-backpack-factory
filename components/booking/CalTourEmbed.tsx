'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Cal, { getCalApi } from '@calcom/embed-react';
import { useLocale, useTranslations } from 'next-intl';
import { isValidLocale } from '@/i18n';
import { getCalLink, isEmbedHiddenLocale, toCalLocale } from '@/lib/cal-tour';
import { buildWhatsAppHref, buildMailtoHref } from '@/lib/contact-links';

/**
 * 虚拟看厂预约嵌入组件(Cal.com)
 *
 * 行为矩阵:
 * - 正常 locale + 已配置 NEXT_PUBLIC_CAL_LINK:渲染 Cal.com 预约窗口
 *   (访客时区自动换算、Zoom/Google Meet 自选),下方保留备选联系行
 * - zh:不加载 embed(app.cal.com 大陆可达性不可靠、Google Meet 大陆不可用),
 *   渲染 WhatsApp/邮件/联系表单替代卡
 * - my:embed 上方加"预约表单可能显示为英文"提示(Cal.com 不支持缅文,
 *   embed 界面语言由访客浏览器 Accept-Language 决定)
 * - 链接未配置:渲染替代卡,避免展示坏的 embed
 */

/** Cal.com embed 命名空间(区分同页多实例) */
const CAL_NAMESPACE = 'virtual-factory-tour';

/** 品牌色(tailwind primary DEFAULT),用于 embed 内部按钮与选中态 */
const CAL_BRAND_COLOR = '#87A575';

export default function CalTourEmbed() {
  const locale = useLocale();
  const t = useTranslations('virtualTour');
  const tContact = useTranslations('contact');

  const calLink = getCalLink();
  const showEmbed = calLink !== '' && !isEmbedHiddenLocale(locale);
  const showLanguageNote =
    showEmbed && isValidLocale(locale) && toCalLocale(locale) === null;

  useEffect(() => {
    if (!showEmbed) {
      return;
    }
    let cancelled = false;
    (async () => {
      const cal = await getCalApi({ namespace: CAL_NAMESPACE });
      if (cancelled) {
        return;
      }
      cal('ui', {
        theme: 'light',
        layout: 'month_view',
        hideEventTypeDetails: false,
        cssVarsPerTheme: {
          light: { 'cal-brand': CAL_BRAND_COLOR },
          dark: { 'cal-brand': CAL_BRAND_COLOR },
        },
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [showEmbed]);

  if (!showEmbed) {
    const whatsappDisplay = tContact('whatsapp.value');
    const emailAddress = tContact('email.value');
    const messageTemplate = t('fallback.messageTemplate');

    return (
      <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-8 text-center">
        <h3 className="text-xl font-semibold text-neutral-800 mb-3">
          {t('fallback.title')}
        </h3>
        <p className="text-neutral-600 mb-6 max-w-xl mx-auto">
          {t('fallback.desc')}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <a
            href={buildWhatsAppHref(whatsappDisplay, messageTemplate)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-all hover:bg-primary-dark focus:outline-none focus:ring-4 focus:ring-primary/30"
          >
            {t('fallback.whatsappCta')}
          </a>
          <a
            href={buildMailtoHref(emailAddress, {
              subject: t('fallback.emailSubject'),
              body: messageTemplate,
            })}
            className="inline-block rounded-lg border border-primary px-6 py-3 font-semibold text-primary transition-all hover:bg-primary hover:text-white focus:outline-none focus:ring-4 focus:ring-primary/30"
          >
            {t('fallback.emailCta')}
          </a>
          <Link
            href={`/${locale}#contact`}
            className="inline-block rounded-lg border border-neutral-300 px-6 py-3 font-semibold text-neutral-700 transition-all hover:border-primary hover:text-primary focus:outline-none focus:ring-4 focus:ring-primary/30"
          >
            {t('fallback.contactCta')}
          </Link>
        </div>
        {/* 明文兜底:访客设备没配邮件客户端/装 WhatsApp 时可直接复制 */}
        <p className="mt-5 text-sm text-neutral-500 select-all">
          {whatsappDisplay} · {emailAddress}
        </p>
      </div>
    );
  }

  return (
    <div>
      {showLanguageNote && (
        <p className="mb-4 rounded-lg bg-neutral-50 border border-neutral-200 px-4 py-3 text-sm text-neutral-600 text-center">
          {t('booking.languageNote')}
        </p>
      )}
      {/* 保留高度防 CLS:iframe 高度由 embed 内部事件自适应 */}
      <div className="min-h-[600px]">
        <Cal
          namespace={CAL_NAMESPACE}
          calLink={calLink}
          style={{ width: '100%', height: '100%', overflow: 'auto' }}
          config={{ layout: 'month_view', theme: 'light' }}
        />
      </div>
      <p className="mt-6 text-sm text-neutral-500 text-center">
        {t('alternative.text')}{' '}
        <Link
          href={`/${locale}#contact`}
          className="text-primary hover:text-primary-dark font-medium underline-offset-2 hover:underline"
        >
          {t('alternative.linkText')}
        </Link>
      </p>
    </div>
  );
}

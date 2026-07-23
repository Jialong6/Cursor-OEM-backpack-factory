'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { locales, localeConfig, type Locale } from '@/i18n';
import { buildLocaleHref } from '@/lib/locale-links';
import { setLangCookieClient } from '@/lib/lang-cookie-client';

/**
 * 页脚跨语言链接区块
 *
 * 语言切换器是条件挂载的 JS 下拉,SSR HTML 无跨语言 <a>,爬虫无法从
 * 页面发现其他语言版本(GSC「已发现-尚未编入索引」的非英语页缺内链)。
 * 此区块在每页静态 HTML 输出 12 个真实链接,指向当前页的对应语言版,
 * 与 head 中的 hreflang 集合互证。
 *
 * - prefetch 关闭:页脚滚入视口时不预取 11 个 RSC payload
 * - lang/hrefLang 用 BCP47 码(zh-Hans/zh-Hant),读屏发音正确(SC 3.1.2)
 * - 点击时写偏好 cookie,与 middleware 读取的 NEXT_LOCALE 对齐
 */
export default function FooterLanguageLinks() {
  const t = useTranslations('footer');
  const locale = useLocale() as Locale;
  const pathname = usePathname() ?? `/${locale}`;

  return (
    <nav aria-label={t('languages')} className="mt-8">
      <h3 className="text-white text-lg font-bold mb-4">{t('languages')}</h3>
      <ul className="flex flex-wrap gap-x-4 gap-y-2">
        {locales.map((target) => (
          <li key={target}>
            <Link
              href={buildLocaleHref(pathname, locale, target)}
              hrefLang={localeConfig[target].hreflang}
              lang={localeConfig[target].hreflang}
              prefetch={false}
              aria-current={target === locale ? 'true' : undefined}
              onClick={() => setLangCookieClient(target)}
              className="text-sm hover:text-primary transition-colors"
            >
              {localeConfig[target].nativeName}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

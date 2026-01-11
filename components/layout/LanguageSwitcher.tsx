'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { locales } from '@/i18n';

/**
 * 语言切换器组件
 *
 * 功能：
 * - 显示当前语言
 * - 点击切换到另一种语言
 * - 保持当前路径，只改变语言前缀
 * - 零布局偏移（Zero Layout Shift）
 */
export default function LanguageSwitcher() {
  const t = useTranslations('language');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  /**
   * 切换语言处理函数
   * 将当前路径的语言前缀替换为目标语言
   */
  const switchLocale = (newLocale: string) => {
    // 移除当前语言前缀
    const pathWithoutLocale = pathname.replace(`/${locale}`, '');

    // 添加新语言前缀
    const newPath = `/${newLocale}${pathWithoutLocale}`;

    // 导航到新路径
    router.push(newPath);
  };

  /**
   * 获取另一种语言
   */
  const otherLocale = locales.find((l) => l !== locale) || 'en';

  return (
    <button
      onClick={() => switchLocale(otherLocale)}
      className="group relative inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all duration-200 hover:scale-105"
      aria-label={`${t('switchTo')} ${otherLocale === 'en' ? t('english') : t('chinese')}`}
    >
      {/* 地球图标 */}
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
        />
      </svg>

      {/* 语言文本 */}
      <span className="font-medium">
        {otherLocale === 'en' ? 'English' : '中文'}
      </span>

      {/* 切换箭头 */}
      <svg
        className="w-4 h-4 transition-transform group-hover:translate-x-1"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 7l5 5m0 0l-5 5m5-5H6"
        />
      </svg>
    </button>
  );
}

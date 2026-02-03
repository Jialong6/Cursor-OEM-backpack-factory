'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { locales, localeConfig, type Locale } from '@/i18n';

/**
 * Cookie name for storing user language preference
 */
const LANG_COOKIE_NAME = 'NEXT_LOCALE';

/**
 * Cookie max age in seconds (1 year)
 */
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

/**
 * Language Switcher Dropdown Component
 *
 * Features:
 * - Displays current language with flag and native name
 * - Dropdown menu with all 10 supported languages
 * - Current language marked with checkmark
 * - Sets language preference cookie on selection
 * - Keyboard navigation (Escape to close)
 * - Click outside to close dropdown
 * - Zero Layout Shift design
 * - WCAG AA accessible with proper ARIA attributes
 */
export default function LanguageSwitcher() {
  const t = useTranslations('language');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentConfig = localeConfig[locale];

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  /**
   * Set language preference cookie (client-side)
   */
  const setLangCookie = (newLocale: Locale) => {
    const secure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    document.cookie = `${LANG_COOKIE_NAME}=${newLocale}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax${secure ? '; secure' : ''}`;
  };

  /**
   * Handle language selection
   */
  const handleSelectLocale = (newLocale: Locale) => {
    if (newLocale !== locale) {
      // Set cookie for preference persistence
      setLangCookie(newLocale);

      // Build new path with updated locale
      const pathWithoutLocale = pathname.replace(`/${locale}`, '');
      const newPath = `/${newLocale}${pathWithoutLocale}`;

      // Navigate to new locale path
      router.push(newPath);
    }
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative" onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('selectLanguage')}
        data-testid="language-switcher-trigger"
        className="group relative inline-flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all duration-200 hover:scale-105"
      >
        {/* Current Language Flag */}
        <span data-testid="current-flag" className="text-lg" aria-hidden="true">
          {currentConfig.flag}
        </span>

        {/* Current Language Name (hidden on mobile) */}
        <span data-testid="current-language" className="hidden sm:inline font-medium">
          {currentConfig.nativeName}
        </span>

        {/* Dropdown Arrow */}
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <ul
          role="listbox"
          aria-label={t('selectLanguage')}
          data-testid="language-dropdown"
          className="absolute right-0 mt-2 py-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-80 overflow-y-auto"
        >
          {locales.map((localeOption) => {
            const config = localeConfig[localeOption];
            const isCurrent = localeOption === locale;

            return (
              <li
                key={localeOption}
                role="option"
                aria-selected={isCurrent}
                data-testid={`language-option-${localeOption}`}
                onClick={() => handleSelectLocale(localeOption)}
                className={`flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors ${
                  isCurrent
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {/* Flag */}
                <span className="text-lg" aria-hidden="true">
                  {config.flag}
                </span>

                {/* Native Name */}
                <span className="flex-1">{config.nativeName}</span>

                {/* Checkmark for Current Language */}
                {isCurrent && (
                  <svg
                    data-testid={`checkmark-${localeOption}`}
                    className="w-5 h-5 text-blue-500 dark:text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

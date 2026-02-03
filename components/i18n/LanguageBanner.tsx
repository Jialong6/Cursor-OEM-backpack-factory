'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type Locale, localeConfig, defaultLocale } from '@/i18n';
import {
  LANG_COOKIE_NAME,
  COOKIE_MAX_AGE,
  AUTO_REDIRECT_COOKIE_NAME,
} from '@/lib/language-preference';

/**
 * Language Banner Component
 *
 * Displays a floating bottom banner when users are auto-redirected
 * to a non-English language version of the site.
 *
 * Features:
 * - Shows message in target language
 * - "Keep language" button to confirm current locale
 * - "Switch to English" button to redirect to English version
 * - Auto-dismisses after 10 seconds
 * - Keyboard accessible (ESC to close)
 * - Does not use modal or fullscreen overlay
 *
 * Requirements:
 * - Requirement 5: Language redirection banner
 */

/** Auto-dismiss timeout in milliseconds (10 seconds) */
const AUTO_DISMISS_TIMEOUT = 10000;

/** Session storage key for tracking if banner was shown */
const BANNER_SHOWN_KEY = 'lang_banner_shown';

interface LanguageBannerProps {
  /** Current locale from the page */
  locale: Locale;
}

/**
 * Set a cookie with proper attributes
 */
function setClientCookie(name: string, value: string, maxAge: number): void {
  const secure = process.env.NODE_ENV === 'production' ? '; secure' : '';
  document.cookie = `${name}=${value}; max-age=${maxAge}; path=/; samesite=lax${secure}`;
}

/**
 * Check if a cookie exists
 */
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

/**
 * Delete a cookie by name
 */
function deleteCookie(name: string): void {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * LanguageBanner Component
 *
 * Displays a non-intrusive bottom banner for language preference confirmation
 */
export default function LanguageBanner({ locale }: LanguageBannerProps) {
  const t = useTranslations('languageBanner');
  const router = useRouter();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  // Get native language name for display
  const languageName = localeConfig[locale]?.nativeName || locale;

  // Determine if banner should be shown
  useEffect(() => {
    // Don't show for English users
    if (locale === defaultLocale) {
      return;
    }

    // Check if this was an auto-redirect (set by middleware)
    const wasAutoRedirected = getCookie(AUTO_REDIRECT_COOKIE_NAME);
    if (!wasAutoRedirected) {
      return;
    }

    // Don't show if banner was already shown this session
    const bannerShown = sessionStorage.getItem(BANNER_SHOWN_KEY);
    if (bannerShown) {
      // Clean up the auto-redirect cookie
      deleteCookie(AUTO_REDIRECT_COOKIE_NAME);
      return;
    }

    // Show banner for auto-redirected non-English users
    setIsVisible(true);
    sessionStorage.setItem(BANNER_SHOWN_KEY, 'true');

    // Clean up the auto-redirect cookie after reading it
    deleteCookie(AUTO_REDIRECT_COOKIE_NAME);
  }, [locale]);

  // Auto-dismiss timer
  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, AUTO_DISMISS_TIMEOUT);

    return () => clearTimeout(timer);
  }, [isVisible]);

  // Keyboard accessibility - ESC to close
  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsVisible(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  /**
   * Close the banner
   */
  const handleClose = useCallback(() => {
    setIsVisible(false);
  }, []);

  /**
   * Keep the current language
   * Sets cookie and closes banner
   */
  const handleKeepLanguage = useCallback(() => {
    setClientCookie(LANG_COOKIE_NAME, locale, COOKIE_MAX_AGE);
    handleClose();
  }, [locale, handleClose]);

  /**
   * Switch to English
   * Sets English preference and redirects
   */
  const handleSwitchToEnglish = useCallback(() => {
    setClientCookie(LANG_COOKIE_NAME, defaultLocale, COOKIE_MAX_AGE);

    // Build English URL by replacing locale in path
    const pathWithoutLocale = pathname.replace(new RegExp(`^/${locale}`), '');
    const englishPath = `/${defaultLocale}${pathWithoutLocale || ''}`;

    router.push(englishPath);
    handleClose();
  }, [locale, pathname, router, handleClose]);

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-primary/95 backdrop-blur-sm text-white shadow-lg"
    >
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Message */}
        <p className="text-sm sm:text-base text-center sm:text-left">
          {t('message', { language: languageName })}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Keep Language Button */}
          <button
            type="button"
            onClick={handleKeepLanguage}
            className="px-4 py-2 text-sm font-medium bg-white/20 hover:bg-white/30 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary"
          >
            {t('keep', { language: languageName })}
          </button>

          {/* Switch to English Button */}
          <button
            type="button"
            onClick={handleSwitchToEnglish}
            className="px-4 py-2 text-sm font-medium bg-white text-primary hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary"
          >
            {t('switchToEnglish')}
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={handleClose}
            aria-label={t('close')}
            className="p-2 hover:bg-white/20 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

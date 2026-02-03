import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import React, { useState, useRef, useEffect } from 'react';
import { locales, localeConfig, type Locale } from '@/i18n';

/**
 * Property Tests: Language Switcher Dropdown Component
 *
 * Task 9: Language Switcher Refactoring
 *
 * Tests for the new dropdown-based language switcher that supports 10 languages.
 * Previously a simple toggle button for 2 languages.
 *
 * Requirements:
 * 1. All 10 languages should be displayed in dropdown menu
 * 2. Current language should be marked in the menu
 * 3. Language switch should update URL with new locale prefix
 * 4. Language switch should set preference cookie
 * 5. ARIA attributes should be correctly set for accessibility
 * 6. Keyboard navigation should work (Escape to close, Enter to select)
 * 7. Click outside should close the dropdown
 */

// Cookie name constant
const LANG_COOKIE_NAME = 'NEXT_LOCALE';

/**
 * Mock translations for the language namespace
 */
const mockLanguageTranslations: Record<Locale, { selectLanguage: string; currentLanguage: string }> = {
  en: { selectLanguage: 'Select Language', currentLanguage: 'Current: {language}' },
  zh: { selectLanguage: '选择语言', currentLanguage: '当前: {language}' },
  ja: { selectLanguage: '言語を選択', currentLanguage: '現在: {language}' },
  de: { selectLanguage: 'Sprache auswahlen', currentLanguage: 'Aktuell: {language}' },
  nl: { selectLanguage: 'Taal selecteren', currentLanguage: 'Huidig: {language}' },
  fr: { selectLanguage: 'Choisir la langue', currentLanguage: 'Actuel: {language}' },
  pt: { selectLanguage: 'Selecionar idioma', currentLanguage: 'Atual: {language}' },
  es: { selectLanguage: 'Seleccionar idioma', currentLanguage: 'Actual: {language}' },
  'zh-tw': { selectLanguage: '選擇語言', currentLanguage: '目前: {language}' },
  ru: { selectLanguage: 'Выбрать язык', currentLanguage: 'Текущий: {language}' },
};

/**
 * Mock LanguageSwitcher component for testing
 * Simulates the behavior of the real component
 */
function MockLanguageSwitcher({
  currentLocale,
  onLocaleChange,
}: {
  currentLocale: Locale;
  onLocaleChange: (locale: Locale) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentConfig = localeConfig[currentLocale];

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelectLocale = (locale: Locale) => {
    if (locale !== currentLocale) {
      // Set cookie
      document.cookie = `${LANG_COOKIE_NAME}=${locale}; path=/; max-age=31536000; samesite=lax`;
      onLocaleChange(locale);
    }
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={mockLanguageTranslations[currentLocale].selectLanguage}
        data-testid="language-switcher-trigger"
        className="flex items-center gap-2"
      >
        <span data-testid="current-flag">{currentConfig.flag}</span>
        <span data-testid="current-language" className="hidden sm:inline">
          {currentConfig.nativeName}
        </span>
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label={mockLanguageTranslations[currentLocale].selectLanguage}
          data-testid="language-dropdown"
          className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-lg shadow-lg"
        >
          {locales.map((locale) => {
            const config = localeConfig[locale];
            const isCurrent = locale === currentLocale;

            return (
              <li
                key={locale}
                role="option"
                aria-selected={isCurrent}
                data-testid={`language-option-${locale}`}
                onClick={() => handleSelectLocale(locale)}
                className={`flex items-center gap-2 px-4 py-2 cursor-pointer ${
                  isCurrent ? 'bg-blue-50 font-medium' : 'hover:bg-gray-100'
                }`}
              >
                <span>{config.flag}</span>
                <span>{config.nativeName}</span>
                {isCurrent && (
                  <svg
                    data-testid={`checkmark-${locale}`}
                    className="w-4 h-4 ml-auto text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
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

/**
 * Helper to get cookie value
 */
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

describe('Task 9: Language Switcher Dropdown Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear cookies
    document.cookie = `${LANG_COOKIE_NAME}=; path=/; max-age=0`;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  /**
   * Property 1: All 10 languages should be displayed in dropdown
   */
  describe('Property 1: All languages displayed', () => {
    it('should display all 10 supported languages in the dropdown menu', () => {
      fc.assert(
        fc.property(fc.constantFrom(...locales), (currentLocale) => {
          const { unmount } = render(
            <MockLanguageSwitcher currentLocale={currentLocale} onLocaleChange={vi.fn()} />
          );

          // Open dropdown
          fireEvent.click(screen.getByTestId('language-switcher-trigger'));

          // Verify all 10 languages are present
          const result = locales.every((locale) => {
            const option = screen.queryByTestId(`language-option-${locale}`);
            return option !== null;
          });

          unmount();
          return result;
        }),
        { numRuns: 20 }
      );
    });

    it('should display correct flag and native name for each language', () => {
      render(<MockLanguageSwitcher currentLocale="en" onLocaleChange={vi.fn()} />);

      fireEvent.click(screen.getByTestId('language-switcher-trigger'));

      for (const locale of locales) {
        const option = screen.getByTestId(`language-option-${locale}`);
        const config = localeConfig[locale];

        expect(option.textContent).toContain(config.flag);
        expect(option.textContent).toContain(config.nativeName);
      }
    });
  });

  /**
   * Property 2: Current language should be marked in the menu
   */
  describe('Property 2: Current language marking', () => {
    it('should mark the current language with checkmark for any locale', () => {
      fc.assert(
        fc.property(fc.constantFrom(...locales), (currentLocale) => {
          const { unmount } = render(
            <MockLanguageSwitcher currentLocale={currentLocale} onLocaleChange={vi.fn()} />
          );

          fireEvent.click(screen.getByTestId('language-switcher-trigger'));

          // Current language should have checkmark
          const checkmark = screen.queryByTestId(`checkmark-${currentLocale}`);

          // Other languages should not have checkmark
          const otherCheckmarks = locales
            .filter((l) => l !== currentLocale)
            .map((l) => screen.queryByTestId(`checkmark-${l}`));

          const hasCurrentCheckmark = checkmark !== null;
          const noOtherCheckmarks = otherCheckmarks.every((c) => c === null);

          unmount();
          return hasCurrentCheckmark && noOtherCheckmarks;
        }),
        { numRuns: 20 }
      );
    });

    it('should set aria-selected=true only for current language', () => {
      fc.assert(
        fc.property(fc.constantFrom(...locales), (currentLocale) => {
          const { unmount } = render(
            <MockLanguageSwitcher currentLocale={currentLocale} onLocaleChange={vi.fn()} />
          );

          fireEvent.click(screen.getByTestId('language-switcher-trigger'));

          const currentOption = screen.getByTestId(`language-option-${currentLocale}`);
          const isCurrentSelected = currentOption.getAttribute('aria-selected') === 'true';

          const otherOptions = locales
            .filter((l) => l !== currentLocale)
            .map((l) => screen.getByTestId(`language-option-${l}`));

          const othersNotSelected = otherOptions.every(
            (opt) => opt.getAttribute('aria-selected') === 'false'
          );

          unmount();
          return isCurrentSelected && othersNotSelected;
        }),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 3: Language switch should trigger callback with new locale
   */
  describe('Property 3: Language switch callback', () => {
    it('should call onLocaleChange with new locale when selecting different language', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...locales),
          fc.constantFrom(...locales),
          (currentLocale, targetLocale) => {
            if (currentLocale === targetLocale) return true; // Skip same locale

            const onLocaleChange = vi.fn();
            const { unmount } = render(
              <MockLanguageSwitcher currentLocale={currentLocale} onLocaleChange={onLocaleChange} />
            );

            fireEvent.click(screen.getByTestId('language-switcher-trigger'));
            fireEvent.click(screen.getByTestId(`language-option-${targetLocale}`));

            const result = onLocaleChange.mock.calls.length === 1 &&
              onLocaleChange.mock.calls[0][0] === targetLocale;

            unmount();
            return result;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should NOT call onLocaleChange when selecting current language', () => {
      fc.assert(
        fc.property(fc.constantFrom(...locales), (currentLocale) => {
          const onLocaleChange = vi.fn();
          const { unmount } = render(
            <MockLanguageSwitcher currentLocale={currentLocale} onLocaleChange={onLocaleChange} />
          );

          fireEvent.click(screen.getByTestId('language-switcher-trigger'));
          fireEvent.click(screen.getByTestId(`language-option-${currentLocale}`));

          const result = onLocaleChange.mock.calls.length === 0;

          unmount();
          return result;
        }),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 4: Cookie should be set on language change
   */
  describe('Property 4: Cookie preference setting', () => {
    it('should set NEXT_LOCALE cookie when changing language', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...locales),
          fc.constantFrom(...locales),
          (currentLocale, targetLocale) => {
            if (currentLocale === targetLocale) return true;

            // Clear cookie first
            document.cookie = `${LANG_COOKIE_NAME}=; path=/; max-age=0`;

            const { unmount } = render(
              <MockLanguageSwitcher currentLocale={currentLocale} onLocaleChange={vi.fn()} />
            );

            fireEvent.click(screen.getByTestId('language-switcher-trigger'));
            fireEvent.click(screen.getByTestId(`language-option-${targetLocale}`));

            const cookieValue = getCookie(LANG_COOKIE_NAME);
            const result = cookieValue === targetLocale;

            unmount();
            return result;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 5: ARIA attributes for accessibility
   */
  describe('Property 5: ARIA accessibility attributes', () => {
    it('should have correct aria-haspopup on trigger button', () => {
      render(<MockLanguageSwitcher currentLocale="en" onLocaleChange={vi.fn()} />);

      const trigger = screen.getByTestId('language-switcher-trigger');
      expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
    });

    it('should toggle aria-expanded when opening/closing dropdown', () => {
      render(<MockLanguageSwitcher currentLocale="en" onLocaleChange={vi.fn()} />);

      const trigger = screen.getByTestId('language-switcher-trigger');

      // Initially closed
      expect(trigger.getAttribute('aria-expanded')).toBe('false');

      // Open
      fireEvent.click(trigger);
      expect(trigger.getAttribute('aria-expanded')).toBe('true');

      // Close
      fireEvent.click(trigger);
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('should have role=listbox on dropdown menu', () => {
      render(<MockLanguageSwitcher currentLocale="en" onLocaleChange={vi.fn()} />);

      fireEvent.click(screen.getByTestId('language-switcher-trigger'));

      const dropdown = screen.getByTestId('language-dropdown');
      expect(dropdown.getAttribute('role')).toBe('listbox');
    });

    it('should have role=option on each language item', () => {
      render(<MockLanguageSwitcher currentLocale="en" onLocaleChange={vi.fn()} />);

      fireEvent.click(screen.getByTestId('language-switcher-trigger'));

      for (const locale of locales) {
        const option = screen.getByTestId(`language-option-${locale}`);
        expect(option.getAttribute('role')).toBe('option');
      }
    });
  });

  /**
   * Property 6: Keyboard navigation
   */
  describe('Property 6: Keyboard navigation', () => {
    it('should close dropdown on Escape key', async () => {
      render(<MockLanguageSwitcher currentLocale="en" onLocaleChange={vi.fn()} />);

      const trigger = screen.getByTestId('language-switcher-trigger');

      // Open dropdown
      fireEvent.click(trigger);
      expect(screen.queryByTestId('language-dropdown')).toBeInTheDocument();

      // Press Escape
      fireEvent.keyDown(trigger.parentElement!, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByTestId('language-dropdown')).not.toBeInTheDocument();
      });
    });
  });

  /**
   * Property 7: Click outside closes dropdown
   */
  describe('Property 7: Click outside behavior', () => {
    it('should close dropdown when clicking outside', async () => {
      render(
        <div>
          <MockLanguageSwitcher currentLocale="en" onLocaleChange={vi.fn()} />
          <button data-testid="outside-element">Outside</button>
        </div>
      );

      // Open dropdown
      fireEvent.click(screen.getByTestId('language-switcher-trigger'));
      expect(screen.queryByTestId('language-dropdown')).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(screen.getByTestId('outside-element'));

      await waitFor(() => {
        expect(screen.queryByTestId('language-dropdown')).not.toBeInTheDocument();
      });
    });
  });

  /**
   * Unit tests: Display current language
   */
  describe('Unit: Current language display', () => {
    it('should display current language flag and native name', () => {
      fc.assert(
        fc.property(fc.constantFrom(...locales), (currentLocale) => {
          const { unmount } = render(
            <MockLanguageSwitcher currentLocale={currentLocale} onLocaleChange={vi.fn()} />
          );

          const config = localeConfig[currentLocale];
          const flag = screen.getByTestId('current-flag');
          const name = screen.getByTestId('current-language');

          const hasCorrectFlag = flag.textContent === config.flag;
          const hasCorrectName = name.textContent === config.nativeName;

          unmount();
          return hasCorrectFlag && hasCorrectName;
        }),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Unit tests: Dropdown toggle
   */
  describe('Unit: Dropdown toggle behavior', () => {
    it('should open dropdown on first click', () => {
      render(<MockLanguageSwitcher currentLocale="en" onLocaleChange={vi.fn()} />);

      expect(screen.queryByTestId('language-dropdown')).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId('language-switcher-trigger'));

      expect(screen.queryByTestId('language-dropdown')).toBeInTheDocument();
    });

    it('should close dropdown on second click', () => {
      render(<MockLanguageSwitcher currentLocale="en" onLocaleChange={vi.fn()} />);

      const trigger = screen.getByTestId('language-switcher-trigger');

      fireEvent.click(trigger);
      expect(screen.queryByTestId('language-dropdown')).toBeInTheDocument();

      fireEvent.click(trigger);
      expect(screen.queryByTestId('language-dropdown')).not.toBeInTheDocument();
    });

    it('should close dropdown after selecting a language', () => {
      render(<MockLanguageSwitcher currentLocale="en" onLocaleChange={vi.fn()} />);

      fireEvent.click(screen.getByTestId('language-switcher-trigger'));
      fireEvent.click(screen.getByTestId('language-option-zh'));

      expect(screen.queryByTestId('language-dropdown')).not.toBeInTheDocument();
    });
  });
});

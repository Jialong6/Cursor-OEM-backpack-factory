'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  POPULAR_COUNTRY_CODES,
  getLocalizedCountries,
  getCountryByCode,
  getFlagEmoji,
  type LocalizedCountry,
} from '@/lib/countries';

export interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  id: string;
  locale: string;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  errorId?: string;
  isLoading?: boolean;
  loadingText?: string;
  required?: boolean;
  /** 搜索框占位符(由调用方传入翻译) */
  searchPlaceholder?: string;
  /** 无匹配结果文案 */
  noResultsText?: string;
  /** 常用区分组标题 */
  popularLabel?: string;
  /** 全部国家分组标题 */
  allLabel?: string;
}

interface SortedCountries {
  popular: LocalizedCountry[];
  others: LocalizedCountry[];
  all: LocalizedCountry[];
}

function buildSortedCountries(locale: string): SortedCountries {
  const localized = getLocalizedCountries(locale);
  const popular: LocalizedCountry[] = [];
  const others: LocalizedCountry[] = [];

  localized.forEach((country) => {
    if (POPULAR_COUNTRY_CODES.includes(country.code)) {
      popular.push(country);
    } else {
      others.push(country);
    }
  });

  popular.sort(
    (a, b) =>
      POPULAR_COUNTRY_CODES.indexOf(a.code) - POPULAR_COUNTRY_CODES.indexOf(b.code)
  );
  others.sort((a, b) => a.name.localeCompare(b.name, locale));

  return { popular, others, all: [...popular, ...others] };
}

function matchCountry(country: LocalizedCountry, query: string): boolean {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (country.name.toLowerCase().includes(q)) return true;
  if (country.code.toLowerCase().includes(q)) return true;
  if (country.dialCode.toLowerCase().includes(q)) return true;
  if (q.startsWith('+') && country.dialCode.toLowerCase().startsWith(q)) return true;
  return false;
}

/**
 * 国家选择 Combobox(可搜索)
 *
 * 完全自实现的 ARIA combobox,无第三方依赖。
 * - 触发按钮(role="combobox")显示当前选中国家(或 placeholder)
 * - 弹层包含搜索框 + Popular / All 两组列表,选项 role="option"
 * - 键盘:ArrowUp/ArrowDown 移动焦点;Enter 选中;Escape 关闭
 * - 模糊匹配:名称 / 代码 / 国际区号
 */
export default function CountrySelect({
  value,
  onChange,
  id,
  locale,
  placeholder = 'Select a country',
  disabled = false,
  hasError = false,
  errorId,
  isLoading = false,
  loadingText = 'Detecting...',
  required = false,
  searchPlaceholder = 'Search country or dial code',
  noResultsText = 'No matching country',
  popularLabel = 'Popular',
  allLabel = 'All countries',
}: CountrySelectProps) {
  const sorted = useMemo(() => buildSortedCountries(locale), [locale]);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const listboxRef = useRef<HTMLUListElement | null>(null);

  const listboxId = `${id}-listbox`;
  const searchId = `${id}-search`;
  const reactId = useId();

  const selectedCountry = useMemo(() => {
    if (!value) return undefined;
    return sorted.all.find((c) => c.code === value);
  }, [value, sorted.all]);

  const filteredAll = useMemo(
    () => sorted.all.filter((c) => matchCountry(c, query)),
    [sorted.all, query]
  );

  const showGroups = query.trim().length === 0;

  const flatList: LocalizedCountry[] = showGroups
    ? [...sorted.popular, ...sorted.others]
    : filteredAll;

  const isDisabled = disabled || isLoading;

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const t = window.setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
      return () => window.clearTimeout(t);
    } else {
      setQuery('');
      setActiveIndex(-1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setActiveIndex(flatList.length > 0 ? 0 : -1);
  }, [query, isOpen, flatList.length]);

  useEffect(() => {
    if (!isOpen) return;
    if (activeIndex < 0) return;
    const el = document.getElementById(`${reactId}-opt-${activeIndex}`);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, isOpen, reactId]);

  const handleSelect = (country: LocalizedCountry) => {
    onChange(country.code);
    setIsOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isDisabled) return;
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      window.setTimeout(() => triggerRef.current?.focus(), 0);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (flatList.length === 0 ? -1 : (i + 1) % flatList.length));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) =>
        flatList.length === 0 ? -1 : (i - 1 + flatList.length) % flatList.length
      );
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const target = flatList[activeIndex];
      if (target) handleSelect(target);
      return;
    }

    if (e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  const displayLabel = isLoading
    ? loadingText
    : selectedCountry
      ? `${getFlagEmoji(selectedCountry.code)} ${selectedCountry.name} (${selectedCountry.dialCode})`
      : placeholder;

  const activeDescendantId =
    isOpen && activeIndex >= 0 ? `${reactId}-opt-${activeIndex}` : undefined;

  return (
    <div ref={rootRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-required={required ? 'true' : undefined}
        aria-invalid={hasError ? 'true' : undefined}
        aria-describedby={hasError && errorId ? errorId : undefined}
        aria-activedescendant={activeDescendantId}
        disabled={isDisabled}
        onClick={() => !isDisabled && setIsOpen((v) => !v)}
        className={`flex w-full items-center justify-between px-4 py-2 border rounded-lg text-left focus:ring-2 focus:ring-primary focus:border-transparent ${
          hasError ? 'border-red-500' : 'border-gray-300'
        } ${isDisabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'}`}
      >
        <span className={`truncate ${!selectedCountry && !isLoading ? 'text-gray-400' : ''}`}>
          {displayLabel}
        </span>
        <svg
          className={`ml-2 h-4 w-4 shrink-0 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <input
              ref={searchInputRef}
              id={searchId}
              type="text"
              role="searchbox"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-controls={listboxId}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <ul
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            aria-label={placeholder}
            className="max-h-72 overflow-y-auto py-1"
          >
            {flatList.length === 0 ? (
              <li role="presentation" className="px-4 py-3 text-sm text-gray-500">
                {noResultsText}
              </li>
            ) : showGroups ? (
              <>
                {sorted.popular.length > 0 && (
                  <li role="presentation" className="px-3 pt-1 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {popularLabel}
                  </li>
                )}
                {sorted.popular.map((country, idx) => (
                  <Option
                    key={country.code}
                    country={country}
                    index={idx}
                    isActive={idx === activeIndex}
                    isSelected={value === country.code}
                    reactId={reactId}
                    onSelect={handleSelect}
                  />
                ))}
                {sorted.others.length > 0 && (
                  <li role="presentation" className="mt-1 px-3 pt-2 pb-1 border-t border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {allLabel}
                  </li>
                )}
                {sorted.others.map((country, idx) => {
                  const fullIndex = sorted.popular.length + idx;
                  return (
                    <Option
                      key={country.code}
                      country={country}
                      index={fullIndex}
                      isActive={fullIndex === activeIndex}
                      isSelected={value === country.code}
                      reactId={reactId}
                      onSelect={handleSelect}
                    />
                  );
                })}
              </>
            ) : (
              filteredAll.map((country, idx) => (
                <Option
                  key={country.code}
                  country={country}
                  index={idx}
                  isActive={idx === activeIndex}
                  isSelected={value === country.code}
                  reactId={reactId}
                  onSelect={handleSelect}
                />
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

interface OptionProps {
  country: LocalizedCountry;
  index: number;
  isActive: boolean;
  isSelected: boolean;
  reactId: string;
  onSelect: (country: LocalizedCountry) => void;
}

function Option({ country, index, isActive, isSelected, reactId, onSelect }: OptionProps) {
  return (
    <li
      id={`${reactId}-opt-${index}`}
      role="option"
      aria-selected={isSelected}
      data-value={country.code}
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect(country);
      }}
      className={`flex cursor-pointer items-center justify-between px-4 py-2 text-sm ${
        isActive ? 'bg-primary/10 text-primary' : 'text-gray-800 hover:bg-gray-50'
      } ${isSelected ? 'font-semibold' : ''}`}
    >
      <span className="flex items-center gap-2">
        <span aria-hidden="true">{getFlagEmoji(country.code)}</span>
        <span>{country.name}</span>
      </span>
      <span className="ml-3 text-xs text-gray-500">{country.dialCode}</span>
    </li>
  );
}

export { getCountryByCode };

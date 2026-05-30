'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  POPULAR_COUNTRY_CODES,
  getLocalizedCountries,
  getFlagEmoji,
  type LocalizedCountry,
} from '@/lib/countries';

export interface PhonePrefixSelectProps {
  /** 当前选中国家的 ISO 3166-1 alpha-2 代码("CN"/"US"/"CA" 等),空字符串 = 未选 */
  value: string;
  onChange: (countryCode: string) => void;
  id: string;
  locale: string;
  disabled?: boolean;
  hasError?: boolean;
  errorId?: string;
  ariaLabel?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
  popularLabel?: string;
  allLabel?: string;
}

function buildSorted(locale: string): {
  popular: LocalizedCountry[];
  others: LocalizedCountry[];
  all: LocalizedCountry[];
} {
  const localized = getLocalizedCountries(locale);
  const popular: LocalizedCountry[] = [];
  const others: LocalizedCountry[] = [];
  localized.forEach((c) => {
    if (POPULAR_COUNTRY_CODES.includes(c.code)) popular.push(c);
    else others.push(c);
  });
  popular.sort(
    (a, b) =>
      POPULAR_COUNTRY_CODES.indexOf(a.code) - POPULAR_COUNTRY_CODES.indexOf(b.code)
  );
  others.sort((a, b) => a.name.localeCompare(b.name, locale));
  return { popular, others, all: [...popular, ...others] };
}

function matchEntry(c: LocalizedCountry, q: string): boolean {
  if (!q) return true;
  const lower = q.trim().toLowerCase();
  if (!lower) return true;
  if (c.name.toLowerCase().includes(lower)) return true;
  if (c.code.toLowerCase().includes(lower)) return true;
  if (c.dialCode.toLowerCase().includes(lower)) return true;
  return false;
}

/**
 * 国际电话区号选择器
 *
 * 紧凑版本的 country combobox,只显示国旗 + 区号,弹层提供搜索 + 国家名。
 * 与 CountrySelect 共用同一份数据源。
 */
export default function PhonePrefixSelect({
  value,
  onChange,
  id,
  locale,
  disabled = false,
  hasError = false,
  errorId,
  ariaLabel = 'Phone country code',
  placeholder = 'Code',
  searchPlaceholder = 'Search country or dial code',
  noResultsText = 'No matching country',
  popularLabel = 'Popular',
  allLabel = 'All countries',
}: PhonePrefixSelectProps) {
  const sorted = useMemo(() => buildSorted(locale), [locale]);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const reactId = useId();

  const listboxId = `${id}-listbox`;

  const selected = useMemo(
    () => (value ? sorted.all.find((c) => c.code === value) : undefined),
    [value, sorted.all]
  );

  const filteredAll = useMemo(
    () => sorted.all.filter((c) => matchEntry(c, query)),
    [sorted.all, query]
  );
  const showGroups = query.trim().length === 0;
  const flatList: LocalizedCountry[] = showGroups
    ? [...sorted.popular, ...sorted.others]
    : filteredAll;

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const t = window.setTimeout(() => searchRef.current?.focus(), 0);
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
    if (!isOpen || activeIndex < 0) return;
    const el = document.getElementById(`${reactId}-opt-${activeIndex}`);
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [activeIndex, isOpen, reactId]);

  const handleSelect = (c: LocalizedCountry) => {
    onChange(c.code);
    setIsOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
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
    if (e.key === 'Tab') setIsOpen(false);
  };

  const triggerLabel = selected
    ? `${getFlagEmoji(selected.code)} ${selected.dialCode}`
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
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-activedescendant={activeDescendantId}
        aria-invalid={hasError ? 'true' : undefined}
        aria-describedby={hasError && errorId ? errorId : undefined}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((v) => !v)}
        className={`flex w-full items-center gap-1 px-3 py-2 border rounded-lg text-left focus:ring-2 focus:ring-primary focus:border-transparent ${
          hasError ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'}`}
      >
        <span className={`truncate ${!selected ? 'text-gray-400' : ''}`}>{triggerLabel}</span>
        <svg
          className={`ml-auto h-4 w-4 shrink-0 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-30 mt-1 w-72 max-w-[90vw] rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <input
              ref={searchRef}
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
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel}
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
                {sorted.popular.map((c, idx) => (
                  <PrefixOption
                    key={c.code}
                    country={c}
                    index={idx}
                    isActive={idx === activeIndex}
                    isSelected={selected?.code === c.code}
                    reactId={reactId}
                    onSelect={handleSelect}
                  />
                ))}
                {sorted.others.length > 0 && (
                  <li role="presentation" className="mt-1 px-3 pt-2 pb-1 border-t border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {allLabel}
                  </li>
                )}
                {sorted.others.map((c, idx) => {
                  const fullIndex = sorted.popular.length + idx;
                  return (
                    <PrefixOption
                      key={c.code}
                      country={c}
                      index={fullIndex}
                      isActive={fullIndex === activeIndex}
                      isSelected={selected?.code === c.code}
                      reactId={reactId}
                      onSelect={handleSelect}
                    />
                  );
                })}
              </>
            ) : (
              filteredAll.map((c, idx) => (
                <PrefixOption
                  key={c.code}
                  country={c}
                  index={idx}
                  isActive={idx === activeIndex}
                  isSelected={selected?.code === c.code}
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

interface PrefixOptionProps {
  country: LocalizedCountry;
  index: number;
  isActive: boolean;
  isSelected: boolean;
  reactId: string;
  onSelect: (c: LocalizedCountry) => void;
}

function PrefixOption({ country, index, isActive, isSelected, reactId, onSelect }: PrefixOptionProps) {
  return (
    <li
      id={`${reactId}-opt-${index}`}
      role="option"
      aria-selected={isSelected}
      data-code={country.code}
      data-dial={country.dialCode}
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect(country);
      }}
      className={`flex cursor-pointer items-center justify-between px-4 py-2 text-sm ${
        isActive ? 'bg-primary/10 text-primary' : 'text-gray-800 hover:bg-gray-50'
      } ${isSelected ? 'font-semibold' : ''}`}
    >
      <span className="flex items-center gap-2 truncate">
        <span aria-hidden="true">{getFlagEmoji(country.code)}</span>
        <span className="truncate">{country.name}</span>
      </span>
      <span className="ml-3 text-xs text-gray-500">{country.dialCode}</span>
    </li>
  );
}

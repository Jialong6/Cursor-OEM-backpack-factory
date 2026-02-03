'use client';

import { useMemo } from 'react';
import {
  POPULAR_COUNTRY_CODES,
  getLocalizedCountries,
  type LocalizedCountry,
} from '@/lib/countries';

/**
 * CountrySelect 组件属性接口
 */
export interface CountrySelectProps {
  /** 当前选中的国家代码 */
  value: string;
  /** 选择变化时的回调 */
  onChange: (value: string) => void;
  /** 元素 ID */
  id: string;
  /** 语言代码 */
  locale: string;
  /** 占位符文本 */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否有错误 */
  hasError?: boolean;
  /** 错误消息元素 ID */
  errorId?: string;
  /** 是否正在加载 */
  isLoading?: boolean;
  /** 加载中显示的文本 */
  loadingText?: string;
  /** 是否必填 */
  required?: boolean;
}

/**
 * 国家选择下拉组件
 *
 * 特性：
 * - 热门国家置顶显示
 * - 支持中英文国家名称
 * - 完整 ARIA 支持
 * - Loading 状态显示
 * - 错误状态样式
 *
 * @example
 * ```tsx
 * <CountrySelect
 *   id="country"
 *   value={country}
 *   onChange={setCountry}
 *   locale="zh"
 *   placeholder="请选择国家"
 * />
 * ```
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
}: CountrySelectProps) {
  // 获取本地化国家列表并按热门程度排序
  const sortedCountries = useMemo(() => {
    const localized = getLocalizedCountries(locale);

    // 分离热门国家和其他国家
    const popular: LocalizedCountry[] = [];
    const others: LocalizedCountry[] = [];

    localized.forEach((country) => {
      if (POPULAR_COUNTRY_CODES.includes(country.code)) {
        popular.push(country);
      } else {
        others.push(country);
      }
    });

    // 热门国家按 POPULAR_COUNTRY_CODES 顺序排列
    popular.sort(
      (a, b) => POPULAR_COUNTRY_CODES.indexOf(a.code) - POPULAR_COUNTRY_CODES.indexOf(b.code)
    );

    // 其他国家按名称字母排序
    others.sort((a, b) => a.name.localeCompare(b.name, locale));

    return { popular, others };
  }, [locale]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  const isDisabled = disabled || isLoading;

  return (
    <select
      id={id}
      value={value}
      onChange={handleChange}
      disabled={isDisabled}
      aria-required={required ? 'true' : undefined}
      aria-invalid={hasError ? 'true' : undefined}
      aria-describedby={hasError && errorId ? errorId : undefined}
      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
        hasError ? 'border-red-500' : 'border-gray-300'
      } ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
    >
      {/* 占位符或加载状态 */}
      <option value="" disabled>
        {isLoading ? loadingText : placeholder}
      </option>

      {/* 热门国家 */}
      {sortedCountries.popular.map((country) => (
        <option key={country.code} value={country.code}>
          {country.name}
        </option>
      ))}

      {/* 分隔符 */}
      <option disabled>──────────</option>

      {/* 其他国家 */}
      {sortedCountries.others.map((country) => (
        <option key={country.code} value={country.code}>
          {country.name}
        </option>
      ))}
    </select>
  );
}

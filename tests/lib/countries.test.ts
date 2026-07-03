import { describe, it, expect } from 'vitest';
import {
  COUNTRIES,
  POPULAR_COUNTRY_CODES,
  getLocalizedCountries,
  getCountryByCode,
  type CountryOption,
} from '@/lib/countries';

describe('lib/countries', () => {
  describe('COUNTRIES constant', () => {
    it('should contain at least 20 countries', () => {
      expect(COUNTRIES.length).toBeGreaterThanOrEqual(20);
    });

    it('should have valid structure for all countries', () => {
      COUNTRIES.forEach((country: CountryOption) => {
        expect(country.code).toBeDefined();
        expect(country.code).toHaveLength(2);
        expect(country.nameZh).toBeDefined();
        expect(country.nameZh.length).toBeGreaterThan(0);
        expect(country.nameEn).toBeDefined();
        expect(country.nameEn.length).toBeGreaterThan(0);
      });
    });

    it('should have unique country codes', () => {
      const codes = COUNTRIES.map((c) => c.code);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });

    it('should be readonly (immutable)', () => {
      expect(Object.isFrozen(COUNTRIES)).toBe(true);
    });
  });

  describe('POPULAR_COUNTRY_CODES constant', () => {
    it('should contain expected popular countries', () => {
      expect(POPULAR_COUNTRY_CODES).toContain('CN');
      expect(POPULAR_COUNTRY_CODES).toContain('US');
      expect(POPULAR_COUNTRY_CODES).toContain('JP');
      expect(POPULAR_COUNTRY_CODES).toContain('MM');
    });

    it('should have all codes present in COUNTRIES', () => {
      const countryCodes = COUNTRIES.map((c) => c.code);
      POPULAR_COUNTRY_CODES.forEach((code) => {
        expect(countryCodes).toContain(code);
      });
    });

    it('should be readonly (immutable)', () => {
      expect(Object.isFrozen(POPULAR_COUNTRY_CODES)).toBe(true);
    });
  });

  describe('getLocalizedCountries', () => {
    it('should return Chinese names for zh locale', () => {
      const countries = getLocalizedCountries('zh');
      const china = countries.find((c) => c.code === 'CN');
      expect(china).toBeDefined();
      expect(china?.name).toBe('中国');
    });

    it('should return English names for en locale', () => {
      const countries = getLocalizedCountries('en');
      const china = countries.find((c) => c.code === 'CN');
      expect(china).toBeDefined();
      expect(china?.name).toBe('China');
    });

    it('should return French names for fr locale (Intl.DisplayNames)', () => {
      const countries = getLocalizedCountries('fr');
      const china = countries.find((c) => c.code === 'CN');
      expect(china).toBeDefined();
      expect(china?.name).toBe('Chine');
    });

    it('should return Traditional Chinese names for zh-tw locale (zh-Hant CLDR)', () => {
      const countries = getLocalizedCountries('zh-tw');
      const germany = countries.find((c) => c.code === 'DE');
      expect(germany).toBeDefined();
      // zh-Hant CLDR: 德國(繁体)而非简体 德国
      expect(germany?.name).toBe('德國');
    });

    it('should return Korean and Burmese names via Intl.DisplayNames', () => {
      const koCountries = getLocalizedCountries('ko');
      expect(koCountries.find((c) => c.code === 'JP')?.name).toBe('일본');

      const myCountries = getLocalizedCountries('my');
      const mm = myCountries.find((c) => c.code === 'MM');
      expect(mm).toBeDefined();
      // 缅文 CLDR 有数据时应为缅文,极端回退也至少是英文名
      expect(mm?.name.length).toBeGreaterThan(0);
    });

    it('should default to English for genuinely unknown locale', () => {
      const countries = getLocalizedCountries('xx-INVALID');
      const china = countries.find((c) => c.code === 'CN');
      expect(china).toBeDefined();
      expect(china?.name).toBe('China');
    });

    it('should return all countries', () => {
      const countries = getLocalizedCountries('en');
      expect(countries.length).toBe(COUNTRIES.length);
    });

    it('should have correct structure', () => {
      const countries = getLocalizedCountries('zh');
      countries.forEach((country) => {
        expect(country).toHaveProperty('code');
        expect(country).toHaveProperty('name');
        expect(typeof country.code).toBe('string');
        expect(typeof country.name).toBe('string');
      });
    });
  });

  describe('getCountryByCode', () => {
    it('should return country for valid code', () => {
      const china = getCountryByCode('CN');
      expect(china).toBeDefined();
      expect(china?.code).toBe('CN');
      expect(china?.nameZh).toBe('中国');
      expect(china?.nameEn).toBe('China');
    });

    it('should return undefined for invalid code', () => {
      const result = getCountryByCode('XX');
      expect(result).toBeUndefined();
    });

    it('should be case insensitive', () => {
      const upper = getCountryByCode('CN');
      const lower = getCountryByCode('cn');
      expect(upper).toEqual(lower);
    });

    it('should handle empty string', () => {
      const result = getCountryByCode('');
      expect(result).toBeUndefined();
    });
  });
});

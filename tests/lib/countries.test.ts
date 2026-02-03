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

    it('should default to English for unknown locale', () => {
      const countries = getLocalizedCountries('fr');
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

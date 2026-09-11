/**
 * Unit tests for lib/consent-regions.ts
 *
 * 判定访客所在国家是否受 ePrivacy/GDPR 同意要求约束:
 * - 欧洲经济区 30 国(欧盟 27 + 冰岛/列支敦士登/挪威)
 * - 英国(脱欧后 UK GDPR + PECR 仍要求同意)
 * - 瑞士(FADP;且微软 Clarity 的强制同意名单含瑞士)
 */
import { describe, test, expect } from 'vitest';
import {
  CONSENT_REQUIRED_COUNTRIES,
  EU_MEMBER_COUNTRIES,
  requiresConsent,
} from '../../lib/consent-regions';

describe('EU_MEMBER_COUNTRIES', () => {
  test('contains exactly the 27 EU member states', () => {
    expect(EU_MEMBER_COUNTRIES).toHaveLength(27);
  });

  test('has no duplicate entries', () => {
    expect(new Set(EU_MEMBER_COUNTRIES).size).toBe(EU_MEMBER_COUNTRIES.length);
  });

  test('does not contain the UK (left the EU in 2020)', () => {
    expect(EU_MEMBER_COUNTRIES).not.toContain('GB');
  });
});

describe('CONSENT_REQUIRED_COUNTRIES', () => {
  test('is EU 27 plus the 3 non-EU EEA states plus GB and CH', () => {
    expect(CONSENT_REQUIRED_COUNTRIES).toHaveLength(32);
  });

  test('every entry is an uppercase ISO 3166-1 alpha-2 code', () => {
    for (const code of CONSENT_REQUIRED_COUNTRIES) {
      expect(code).toMatch(/^[A-Z]{2}$/);
    }
  });
});

describe('requiresConsent', () => {
  test('returns true for every EU member state', () => {
    for (const code of EU_MEMBER_COUNTRIES) {
      expect(requiresConsent(code)).toBe(true);
    }
  });

  test.each(['IS', 'LI', 'NO'])('returns true for non-EU EEA state %s', (code) => {
    expect(requiresConsent(code)).toBe(true);
  });

  test.each(['GB', 'CH'])('returns true for %s', (code) => {
    expect(requiresConsent(code)).toBe(true);
  });

  test.each(['US', 'MM', 'CN', 'JP', 'KR', 'BR', 'AU', 'IN'])(
    'returns false for non-regulated country %s',
    (code) => {
      expect(requiresConsent(code)).toBe(false);
    }
  );

  test('is case insensitive', () => {
    expect(requiresConsent('de')).toBe(true);
    expect(requiresConsent('De')).toBe(true);
    expect(requiresConsent('us')).toBe(false);
  });

  test('trims surrounding whitespace', () => {
    expect(requiresConsent(' DE ')).toBe(true);
  });

  test('returns false for empty, null and undefined (country unknown)', () => {
    expect(requiresConsent('')).toBe(false);
    expect(requiresConsent(null)).toBe(false);
    expect(requiresConsent(undefined)).toBe(false);
  });

  test('returns false for malformed input instead of throwing', () => {
    expect(requiresConsent('DEU')).toBe(false);
    expect(requiresConsent('D')).toBe(false);
    expect(requiresConsent('__proto__')).toBe(false);
  });
});

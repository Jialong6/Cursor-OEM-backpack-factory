/**
 * Unit tests for lib/consent-storage.ts
 *
 * 同意选择存 localStorage 而非 cookie:存储「同意与否」这件事本身属于
 * 严格必要,不需要先取得同意。读写必须全程容错 —— Safari 无痕模式和
 * 「阻止跨站跟踪」下访问 localStorage 会直接抛异常,不能让同意条崩掉整页。
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  readConsent,
  writeConsent,
  clearConsent,
} from '../../lib/consent-storage';

/** 会在每次访问时抛异常的 Storage 替身(模拟无痕模式) */
const throwingStorage = {
  getItem: () => {
    throw new Error('SecurityError: access denied');
  },
  setItem: () => {
    throw new Error('SecurityError: access denied');
  },
  removeItem: () => {
    throw new Error('SecurityError: access denied');
  },
} as unknown as Storage;

beforeEach(() => {
  window.localStorage.clear();
});

describe('readConsent', () => {
  test('returns unset when nothing has been stored', () => {
    expect(readConsent(window.localStorage)).toBe('unset');
  });

  test('returns the stored decision', () => {
    writeConsent('granted', window.localStorage);
    expect(readConsent(window.localStorage)).toBe('granted');

    writeConsent('denied', window.localStorage);
    expect(readConsent(window.localStorage)).toBe('denied');
  });

  test('returns unset when the stored payload is not valid JSON', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'not-json{');
    expect(readConsent(window.localStorage)).toBe('unset');
  });

  test('returns unset when the stored decision is unrecognised', () => {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ v: CONSENT_VERSION, d: 'maybe', t: Date.now() })
    );
    expect(readConsent(window.localStorage)).toBe('unset');
  });

  test('returns unset when the stored version is older, so consent is re-asked', () => {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ v: CONSENT_VERSION - 1, d: 'granted', t: Date.now() })
    );
    expect(readConsent(window.localStorage)).toBe('unset');
  });

  test('returns unset instead of throwing when storage access is denied', () => {
    expect(() => readConsent(throwingStorage)).not.toThrow();
    expect(readConsent(throwingStorage)).toBe('unset');
  });

  test('returns unset when storage is unavailable entirely', () => {
    expect(readConsent(null)).toBe('unset');
  });
});

describe('writeConsent', () => {
  test('persists a decision that readConsent can recover', () => {
    expect(writeConsent('granted', window.localStorage)).toBe(true);
    expect(readConsent(window.localStorage)).toBe('granted');
  });

  test('stores the current version and a timestamp', () => {
    const before = Date.now();
    writeConsent('denied', window.localStorage);

    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    expect(raw).not.toBeNull();

    const parsed = JSON.parse(raw as string);
    expect(parsed.v).toBe(CONSENT_VERSION);
    expect(parsed.d).toBe('denied');
    expect(parsed.t).toBeGreaterThanOrEqual(before);
  });

  test('returns false instead of throwing when storage access is denied', () => {
    expect(() => writeConsent('granted', throwingStorage)).not.toThrow();
    expect(writeConsent('granted', throwingStorage)).toBe(false);
  });

  test('returns false when storage is unavailable entirely', () => {
    expect(writeConsent('granted', null)).toBe(false);
  });
});

describe('clearConsent', () => {
  test('removes a stored decision', () => {
    writeConsent('granted', window.localStorage);
    clearConsent(window.localStorage);
    expect(readConsent(window.localStorage)).toBe('unset');
  });

  test('does not throw when storage access is denied', () => {
    expect(() => clearConsent(throwingStorage)).not.toThrow();
  });
});

describe('default storage resolution', () => {
  test('falls back to window.localStorage when no storage is passed', () => {
    writeConsent('granted');
    expect(readConsent()).toBe('granted');
  });

  test('does not throw when window.localStorage itself throws', () => {
    const spy = vi
      .spyOn(window.localStorage, 'getItem')
      .mockImplementation(() => {
        throw new Error('SecurityError');
      });

    expect(() => readConsent()).not.toThrow();
    expect(readConsent()).toBe('unset');

    spy.mockRestore();
  });
});

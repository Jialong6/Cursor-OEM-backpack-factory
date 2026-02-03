import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormDraft } from '@/hooks/useFormDraft';

// Mock sessionStorage with actual storage behavior
let mockStore: Record<string, string> = {};

const mockSessionStorage = {
  getItem: vi.fn((key: string) => mockStore[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockStore[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStore[key];
  }),
  clear: vi.fn(() => {
    mockStore = {};
  }),
  get length() {
    return Object.keys(mockStore).length;
  },
  key: vi.fn((index: number) => Object.keys(mockStore)[index] || null),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

interface TestFormData {
  name: string;
  email: string;
  message: string;
  secretToken?: string;
  [key: string]: string | undefined;
}

describe('useFormDraft', () => {
  const STORAGE_KEY = 'test-form-draft';

  beforeEach(() => {
    vi.useFakeTimers();
    mockStore = {};
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('saveDraft', () => {
    it('should save data to sessionStorage', async () => {
      const { result } = renderHook(() =>
        useFormDraft<TestFormData>({
          key: STORAGE_KEY,
          debounceMs: 100,
        })
      );

      act(() => {
        result.current.saveDraft({ name: 'John', email: 'john@example.com' });
      });

      // Wait for debounce
      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(mockSessionStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(
        mockSessionStorage.setItem.mock.calls[mockSessionStorage.setItem.mock.calls.length - 1][1]
      );
      expect(savedData.data.name).toBe('John');
      expect(savedData.data.email).toBe('john@example.com');
    });

    it('should debounce saves', () => {
      const { result } = renderHook(() =>
        useFormDraft<TestFormData>({
          key: STORAGE_KEY,
          debounceMs: 500,
        })
      );

      act(() => {
        result.current.saveDraft({ name: 'A' });
        result.current.saveDraft({ name: 'B' });
        result.current.saveDraft({ name: 'C' });
      });

      // Before debounce completes
      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();

      // After debounce
      act(() => {
        vi.advanceTimersByTime(600);
      });

      // Should only save once with final value
      expect(mockSessionStorage.setItem).toHaveBeenCalledTimes(1);
    });

    it('should exclude sensitive fields', async () => {
      const { result } = renderHook(() =>
        useFormDraft<TestFormData>({
          key: STORAGE_KEY,
          debounceMs: 100,
          excludeFields: ['secretToken'],
        })
      );

      act(() => {
        result.current.saveDraft({
          name: 'John',
          secretToken: 'secret123',
        });
      });

      act(() => {
        vi.advanceTimersByTime(150);
      });

      const savedData = JSON.parse(
        mockSessionStorage.setItem.mock.calls[mockSessionStorage.setItem.mock.calls.length - 1][1]
      );
      expect(savedData.data.name).toBe('John');
      expect(savedData.data.secretToken).toBeUndefined();
    });

    it('should save timestamp with draft', async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const { result } = renderHook(() =>
        useFormDraft<TestFormData>({
          key: STORAGE_KEY,
          debounceMs: 100,
        })
      );

      act(() => {
        result.current.saveDraft({ name: 'John' });
      });

      act(() => {
        vi.advanceTimersByTime(150);
      });

      const savedData = JSON.parse(
        mockSessionStorage.setItem.mock.calls[mockSessionStorage.setItem.mock.calls.length - 1][1]
      );
      // Timestamp should be close to now (within debounce time)
      expect(savedData.timestamp).toBeGreaterThanOrEqual(now);
      expect(savedData.timestamp).toBeLessThanOrEqual(now + 200);
    });
  });

  describe('restoreDraft', () => {
    it('should restore saved draft', () => {
      const draftData = {
        data: { name: 'John', email: 'john@example.com' },
        timestamp: Date.now(),
      };
      // Pre-populate mockStore before rendering hook
      mockStore[STORAGE_KEY] = JSON.stringify(draftData);

      const { result } = renderHook(() =>
        useFormDraft<TestFormData>({
          key: STORAGE_KEY,
        })
      );

      const restored = result.current.restoreDraft();

      expect(restored).toEqual(draftData.data);
    });

    it('should return null when no draft exists', () => {
      // mockStore is already empty from beforeEach

      const { result } = renderHook(() =>
        useFormDraft<TestFormData>({
          key: STORAGE_KEY,
        })
      );

      const restored = result.current.restoreDraft();

      expect(restored).toBeNull();
    });

    it('should return null for expired draft', () => {
      const expiredTimestamp = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
      const draftData = {
        data: { name: 'John' },
        timestamp: expiredTimestamp,
      };
      mockStore[STORAGE_KEY] = JSON.stringify(draftData);

      const { result } = renderHook(() =>
        useFormDraft<TestFormData>({
          key: STORAGE_KEY,
          expiresIn: 24 * 60 * 60 * 1000, // 24 hours
        })
      );

      const restored = result.current.restoreDraft();

      expect(restored).toBeNull();
    });

    it('should return draft when not expired', () => {
      const recentTimestamp = Date.now() - 1 * 60 * 60 * 1000; // 1 hour ago
      const draftData = {
        data: { name: 'John' },
        timestamp: recentTimestamp,
      };
      mockStore[STORAGE_KEY] = JSON.stringify(draftData);

      const { result } = renderHook(() =>
        useFormDraft<TestFormData>({
          key: STORAGE_KEY,
          expiresIn: 24 * 60 * 60 * 1000, // 24 hours
        })
      );

      const restored = result.current.restoreDraft();

      expect(restored).toEqual(draftData.data);
    });

    it('should handle corrupted data gracefully', () => {
      mockStore[STORAGE_KEY] = 'invalid-json';

      const { result } = renderHook(() =>
        useFormDraft<TestFormData>({
          key: STORAGE_KEY,
        })
      );

      const restored = result.current.restoreDraft();

      expect(restored).toBeNull();
    });
  });

  describe('clearDraft', () => {
    it('should remove draft from storage', () => {
      const { result } = renderHook(() =>
        useFormDraft<TestFormData>({
          key: STORAGE_KEY,
        })
      );

      act(() => {
        result.current.clearDraft();
      });

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    });

    it('should update hasDraft to false', () => {
      const draftData = {
        data: { name: 'John' },
        timestamp: Date.now(),
      };
      mockStore[STORAGE_KEY] = JSON.stringify(draftData);

      const { result } = renderHook(() =>
        useFormDraft<TestFormData>({
          key: STORAGE_KEY,
        })
      );

      expect(result.current.hasDraft).toBe(true);

      act(() => {
        result.current.clearDraft();
      });

      expect(result.current.hasDraft).toBe(false);
    });
  });

  describe('hasDraft', () => {
    it('should be true when valid draft exists', () => {
      const draftData = {
        data: { name: 'John' },
        timestamp: Date.now(),
      };
      mockStore[STORAGE_KEY] = JSON.stringify(draftData);

      const { result } = renderHook(() =>
        useFormDraft<TestFormData>({
          key: STORAGE_KEY,
        })
      );

      expect(result.current.hasDraft).toBe(true);
    });

    it('should be false when no draft exists', () => {
      // mockStore is already empty from beforeEach

      const { result } = renderHook(() =>
        useFormDraft<TestFormData>({
          key: STORAGE_KEY,
        })
      );

      expect(result.current.hasDraft).toBe(false);
    });

    it('should be false when draft is expired', () => {
      const expiredTimestamp = Date.now() - 25 * 60 * 60 * 1000;
      const draftData = {
        data: { name: 'John' },
        timestamp: expiredTimestamp,
      };
      mockStore[STORAGE_KEY] = JSON.stringify(draftData);

      const { result } = renderHook(() =>
        useFormDraft<TestFormData>({
          key: STORAGE_KEY,
          expiresIn: 24 * 60 * 60 * 1000,
        })
      );

      expect(result.current.hasDraft).toBe(false);
    });
  });
});

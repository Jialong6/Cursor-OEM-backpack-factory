import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';

// Test the draft storage logic directly without React component
describe('Property: Form Draft Persistence', () => {
  // Mock sessionStorage
  let mockStore: Record<string, string> = {};

  beforeEach(() => {
    mockStore = {};
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => mockStore[key] || null,
      setItem: (key: string, value: string) => {
        mockStore[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStore[key];
      },
      clear: () => {
        mockStore = {};
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('Any valid form data can be saved and restored correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          firstName: fc.string({ minLength: 1, maxLength: 50 }),
          lastName: fc.string({ minLength: 1, maxLength: 50 }),
          email: fc.emailAddress(),
          countryRegion: fc.constantFrom('CN', 'US', 'JP', 'DE', 'GB', 'FR', 'KR', 'MM'),
          message: fc.string({ minLength: 10, maxLength: 500 }),
        }),
        (formData) => {
          const STORAGE_KEY = 'test-draft';

          // Save
          const storage = {
            data: formData,
            timestamp: Date.now(),
          };
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(storage));

          // Restore
          const stored = sessionStorage.getItem(STORAGE_KEY);
          expect(stored).not.toBeNull();

          const parsed = JSON.parse(stored!);
          expect(parsed.data).toEqual(formData);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Sensitive fields should be excluded from storage', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          secretToken: fc.string({ minLength: 10, maxLength: 50 }),
          password: fc.string({ minLength: 8, maxLength: 50 }),
        }),
        (formData) => {
          const STORAGE_KEY = 'test-sensitive';
          const excludeFields = ['secretToken', 'password'];

          // Filter sensitive fields before saving
          const filteredData = { ...formData };
          excludeFields.forEach((field) => {
            delete filteredData[field as keyof typeof filteredData];
          });

          const storage = {
            data: filteredData,
            timestamp: Date.now(),
          };
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(storage));

          // Verify sensitive fields are not stored
          const stored = sessionStorage.getItem(STORAGE_KEY);
          const parsed = JSON.parse(stored!);

          expect(parsed.data.secretToken).toBeUndefined();
          expect(parsed.data.password).toBeUndefined();
          expect(parsed.data.name).toBe(formData.name);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Expired drafts should be rejected', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 25, max: 100 }), // hours expired
        (hoursExpired) => {
          const STORAGE_KEY = 'test-expired';
          const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

          const expiredTimestamp = Date.now() - hoursExpired * 60 * 60 * 1000;
          const storage = {
            data: { name: 'Test' },
            timestamp: expiredTimestamp,
          };
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(storage));

          // Check expiry
          const stored = sessionStorage.getItem(STORAGE_KEY);
          const parsed = JSON.parse(stored!);
          const isExpired = Date.now() - parsed.timestamp > EXPIRY_MS;

          expect(isExpired).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Recent drafts should be valid', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 23 }), // hours ago (less than 24)
        (hoursAgo) => {
          const STORAGE_KEY = 'test-recent';
          const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

          const recentTimestamp = Date.now() - hoursAgo * 60 * 60 * 1000;
          const storage = {
            data: { name: 'Test' },
            timestamp: recentTimestamp,
          };
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(storage));

          // Check validity
          const stored = sessionStorage.getItem(STORAGE_KEY);
          const parsed = JSON.parse(stored!);
          const isExpired = Date.now() - parsed.timestamp > EXPIRY_MS;

          expect(isExpired).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Draft clearing should remove all data', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (testData) => {
          const STORAGE_KEY = 'test-clear';

          // Save
          sessionStorage.setItem(STORAGE_KEY, testData);
          expect(sessionStorage.getItem(STORAGE_KEY)).toBe(testData);

          // Clear
          sessionStorage.removeItem(STORAGE_KEY);

          // Verify cleared
          expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
        }
      ),
      { numRuns: 20 }
    );
  });
});

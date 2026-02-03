import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGeoCountry } from '@/hooks/useGeoCountry';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useGeoCountry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('successful detection', () => {
    it('should return country info on successful API call', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { countryCode: 'CN', countryName: 'China' },
          }),
      });

      const { result } = renderHook(() => useGeoCountry());

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.countryCode).toBe('CN');
      expect(result.current.countryName).toBe('China');
      expect(result.current.error).toBeNull();
    });

    it('should call /api/geo endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { countryCode: 'US', countryName: 'United States' },
          }),
      });

      renderHook(() => useGeoCountry());

      expect(mockFetch).toHaveBeenCalledWith('/api/geo');
    });
  });

  describe('error handling', () => {
    it('should handle API error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Country not detected',
          }),
      });

      const { result } = renderHook(() => useGeoCountry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.countryCode).toBeNull();
      expect(result.current.countryName).toBeNull();
      expect(result.current.error).toBe('Country not detected');
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useGeoCountry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.countryCode).toBeNull();
      expect(result.current.countryName).toBeNull();
      expect(result.current.error).toBe('Failed to detect country');
    });

    it('should handle non-OK response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Not found',
          }),
      });

      const { result } = renderHook(() => useGeoCountry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.countryCode).toBeNull();
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('loading state', () => {
    it('should start with isLoading true', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { countryCode: 'JP', countryName: 'Japan' },
          }),
      });

      const { result } = renderHook(() => useGeoCountry());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.countryCode).toBeNull();
      expect(result.current.countryName).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should set isLoading to false after completion', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { countryCode: 'DE', countryName: 'Germany' },
          }),
      });

      const { result } = renderHook(() => useGeoCountry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('caching', () => {
    it('should only fetch once per mount', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { countryCode: 'FR', countryName: 'France' },
          }),
      });

      const { result, rerender } = renderHook(() => useGeoCountry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      rerender();

      // Should still only have called fetch once
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});

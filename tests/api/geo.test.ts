import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/geo/route';
import { NextRequest } from 'next/server';

function createMockRequest(headers: Record<string, string> = {}): NextRequest {
  const headerEntries = Object.entries(headers);
  const mockHeaders = new Headers();
  headerEntries.forEach(([key, value]) => {
    mockHeaders.set(key, value);
  });

  return {
    headers: mockHeaders,
    url: 'http://localhost:3000/api/geo',
    method: 'GET',
  } as unknown as NextRequest;
}

describe('GET /api/geo', () => {
  describe('successful country detection', () => {
    it('should return country info when x-vercel-ip-country header is present', async () => {
      const request = createMockRequest({ 'x-vercel-ip-country': 'CN' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.countryCode).toBe('CN');
      expect(data.data.countryName).toBeDefined();
    });

    it('should return country info when cf-ipcountry header is present', async () => {
      const request = createMockRequest({ 'cf-ipcountry': 'US' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.countryCode).toBe('US');
    });

    it('should return country info when x-country header is present', async () => {
      const request = createMockRequest({ 'x-country': 'JP' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.countryCode).toBe('JP');
    });

    it('should prioritize x-vercel-ip-country over other headers', async () => {
      const request = createMockRequest({
        'x-vercel-ip-country': 'CN',
        'cf-ipcountry': 'US',
        'x-country': 'JP',
      });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.countryCode).toBe('CN');
    });

    it('should return both countryCode and countryName for known countries', async () => {
      const request = createMockRequest({ 'x-vercel-ip-country': 'DE' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.countryCode).toBe('DE');
      expect(data.data.countryName).toBe('Germany');
    });
  });

  describe('error handling', () => {
    it('should return 404 when no country headers are present', async () => {
      const request = createMockRequest({});
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should return 404 for unknown country code', async () => {
      const request = createMockRequest({ 'x-vercel-ip-country': 'XX' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });

    it('should handle empty country code', async () => {
      const request = createMockRequest({ 'x-vercel-ip-country': '' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe('case handling', () => {
    it('should handle lowercase country codes', async () => {
      const request = createMockRequest({ 'x-vercel-ip-country': 'cn' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.countryCode).toBe('CN');
    });
  });
});

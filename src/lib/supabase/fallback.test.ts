import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withTimeout, getSupavisorPoolerUrl, fetchWithFallback } from './fallback';

describe('Supabase Fallback & Timeout Utilities', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('withTimeout', () => {
    it('should resolve normally if operation finishes within timeout', async () => {
      const fastPromise = new Promise((resolve) => setTimeout(() => resolve('success'), 100));
      const result = await withTimeout(fastPromise, 500);
      expect(result).toBe('success');
    });

    it('should reject with timeout error if operation exceeds timeout limit', async () => {
      const slowPromise = new Promise((resolve) => setTimeout(() => resolve('slow'), 1000));
      await expect(withTimeout(slowPromise, 100, 'Custom timeout error')).rejects.toThrow(
        'Custom timeout error'
      );
    });
  });

  describe('getSupavisorPoolerUrl', () => {
    it('should format Postgres URL port from 5432 to Supavisor pooler port 6543', () => {
      const postgresUrl = 'postgres://user:pass@db.example.com:5432/postgres';
      const pooledUrl = getSupavisorPoolerUrl(postgresUrl);
      expect(pooledUrl).toBe('postgres://user:pass@db.example.com:6543/postgres');
    });

    it('should assign port 6543 if port is omitted in PostgreSQL URL', () => {
      const postgresUrl = 'postgres://user:pass@db.example.com/postgres';
      const pooledUrl = getSupavisorPoolerUrl(postgresUrl);
      expect(pooledUrl).toContain(':6543');
    });

    it('should return original value for non-postgres URLs or invalid URLs', () => {
      expect(getSupavisorPoolerUrl('https://example.com')).toBe('https://example.com');
      expect(getSupavisorPoolerUrl('invalid-url-string')).toBe('invalid-url-string');
    });
  });

  describe('fetchWithFallback', () => {
    it('should return primary query result when primary database query succeeds', async () => {
      const mockPrimaryClient = { name: 'primary' };
      const mockQueryFn = vi.fn().mockImplementation(async (client) => {
        expect(client).toBe(mockPrimaryClient);
        return { data: [{ id: 1, name: 'Item 1' }], error: null };
      });

      const result = await fetchWithFallback(mockQueryFn, {
        timeoutMs: 2000,
        primaryClient: mockPrimaryClient,
      });
      expect(result).toEqual({ data: [{ id: 1, name: 'Item 1' }], error: null });
      expect(mockQueryFn).toHaveBeenCalledTimes(1);
    });

    it('should fail over to fallback database if primary query fails and fallbackUrl is provided', async () => {
      let attempt = 0;
      const mockPrimaryClient = { name: 'primary' };
      const mockQueryFn = vi.fn().mockImplementation(async (client) => {
        attempt++;
        if (attempt === 1) {
          expect(client).toBe(mockPrimaryClient);
          throw new Error('Primary connection refused');
        }
        return { data: [{ id: 2, name: 'Fallback Item' }], error: null };
      });

      const result = await fetchWithFallback(mockQueryFn, {
        timeoutMs: 2000,
        fallbackUrl: 'https://fallback-neon-db.supabase.co',
        fallbackKey: 'fallback_key',
        primaryClient: mockPrimaryClient,
      });
      expect(result).toEqual({ data: [{ id: 2, name: 'Fallback Item' }], error: null });
      expect(mockQueryFn).toHaveBeenCalledTimes(2);
    });

    it('should rethrow error if primary query fails and no fallback URL is configured', async () => {
      const mockPrimaryClient = { name: 'primary' };
      const mockQueryFn = vi.fn().mockRejectedValue(new Error('Primary DB Down'));

      await expect(
        fetchWithFallback(mockQueryFn, { timeoutMs: 1000, fallbackUrl: '', primaryClient: mockPrimaryClient })
      ).rejects.toThrow('Primary DB Down');
    });
  });
});

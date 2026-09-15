import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  withTimeout,
  getSupabasePoolerUrl,
  fetchWithFallback,
  isEdgeConfigCircuitBreakerTripped,
  DEFAULT_TIMEOUT_MS,
  SUPAVISOR_TRANSACTION_PORT,
} from './fallback';

describe('Supabase Database Fallback & Resilience Utilities', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('withTimeout', () => {
    it('should resolve successfully if operation finishes within timeout', async () => {
      const result = await withTimeout(
        async () => 'fast result',
        1000,
        'Fast Operation'
      );
      expect(result).toBe('fast result');
    });

    it('should reject with a timeout error if operation exceeds timeout limit', async () => {
      const slowPromise = new Promise((resolve) => setTimeout(resolve, 500));

      await expect(
        withTimeout(slowPromise, 50, 'Slow Operation')
      ).rejects.toThrow('[TimeoutEnforcement] Slow Operation exceeded strict limit of 50ms');
    });

    it('should handle raw promises as well as async functions', async () => {
      const promise = Promise.resolve('raw promise');
      const result = await withTimeout(promise, 1000);
      expect(result).toBe('raw promise');
    });
  });

  describe('getSupabasePoolerUrl', () => {
    it('should format postgres connection URL to use Supavisor port 6543', () => {
      const raw = 'postgres://postgres.xxx:5432/postgres';
      const poolerUrl = getSupabasePoolerUrl(raw);
      expect(poolerUrl).toContain(`:${SUPAVISOR_TRANSACTION_PORT}/`);
    });

    it('should format postgresql connection URL to use Supavisor port 6543', () => {
      const raw = 'postgresql://user:pass@db.example.com:5432/main';
      const poolerUrl = getSupabasePoolerUrl(raw);
      expect(poolerUrl).toContain(`:${SUPAVISOR_TRANSACTION_PORT}/`);
    });

    it('should return standard URL or default fallback URL if format is http/https', () => {
      const raw = 'https://xyz.supabase.co';
      const poolerUrl = getSupabasePoolerUrl(raw);
      expect(poolerUrl).toBe('https://xyz.supabase.co');
    });
  });

  describe('fetchWithFallback', () => {
    it('should return data from primary query on success', async () => {
      const mockQueryFn = vi.fn().mockResolvedValue([{ id: 1, name: 'Stock A' }]);

      const data = await fetchWithFallback(mockQueryFn, {
        primaryUrl: 'https://primary.supabase.co',
        primaryKey: 'primary-key',
      });

      expect(data).toEqual([{ id: 1, name: 'Stock A' }]);
      expect(mockQueryFn).toHaveBeenCalledTimes(1);
    });

    it('should initiate fallback protocol and invoke onFallback when primary fails', async () => {
      const mockQueryFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Primary DB Connection Lost'))
        .mockResolvedValueOnce([{ id: 2, name: 'Fallback Data' }]);

      const onFallback = vi.fn();

      const data = await fetchWithFallback(mockQueryFn, {
        primaryUrl: 'https://primary.supabase.co',
        primaryKey: 'primary-key',
        fallbackUrl: 'https://fallback-neon.db.com',
        fallbackKey: 'fallback-key',
        onFallback,
      });

      expect(onFallback).toHaveBeenCalledTimes(1);
      expect(onFallback).toHaveBeenCalledWith(expect.any(Error));
      expect(data).toEqual([{ id: 2, name: 'Fallback Data' }]);
      expect(mockQueryFn).toHaveBeenCalledTimes(2);
    });

    it('should return staticFallback payload if provided when primary and secondary both fail', async () => {
      const mockQueryFn = vi.fn().mockRejectedValue(new Error('Network Unreachable'));

      const staticFallback = [{ symbol: 'SET50', price: 1000 }];

      const data = await fetchWithFallback(mockQueryFn, {
        primaryUrl: 'https://primary.supabase.co',
        primaryKey: 'primary-key',
        staticFallback,
      });

      expect(data).toEqual(staticFallback);
    });

    it('should rethrow error if primary fails and no fallback URL or static fallback is provided', async () => {
      const mockQueryFn = vi.fn().mockRejectedValue(new Error('Fatal DB Crash'));

      await expect(
        fetchWithFallback(mockQueryFn, {
          primaryUrl: 'https://primary.supabase.co',
          primaryKey: 'primary-key',
        })
      ).rejects.toThrow('Fatal DB Crash');
    });
  });

  describe('isEdgeConfigCircuitBreakerTripped', () => {
    it('should return false if no Edge Config URL is configured', async () => {
      const isTripped = await isEdgeConfigCircuitBreakerTripped();
      expect(isTripped).toBe(false);
    });

    it('should return true if Edge Config flag maintenance_mode is set to true', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ maintenance_mode: true }),
      } as Response);

      const isTripped = await isEdgeConfigCircuitBreakerTripped('https://edge-config.vercel.com/ecfg_xxx');
      expect(isTripped).toBe(true);
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://edge-config.vercel.com/ecfg_xxx',
        expect.objectContaining({ headers: { 'Cache-Control': 'no-cache' } })
      );
    });

    it('should return true if Edge Config flag use_static_fallback is set to true', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: { use_static_fallback: true } }),
      } as Response);

      const isTripped = await isEdgeConfigCircuitBreakerTripped('https://edge-config.vercel.com/ecfg_xxx');
      expect(isTripped).toBe(true);
    });

    it('should return false if Edge Config flags are normal/false', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ maintenance_mode: false, use_static_fallback: false }),
      } as Response);

      const isTripped = await isEdgeConfigCircuitBreakerTripped('https://edge-config.vercel.com/ecfg_xxx');
      expect(isTripped).toBe(false);
    });

    it('should gracefully return false if Edge Config network fetch fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

      const isTripped = await isEdgeConfigCircuitBreakerTripped('https://edge-config.vercel.com/ecfg_xxx');
      expect(isTripped).toBe(false);
    });
  });
});

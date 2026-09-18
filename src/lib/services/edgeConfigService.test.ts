import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getEdgeConfigFlag,
  isMaintenanceMode,
  useStaticFallback,
  isCircuitTripped,
  tripCircuitBreaker,
} from './edgeConfigService';

describe('Edge Config Service & Circuit Breaker', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getEdgeConfigFlag', () => {
    it('should return defaultValue if EDGE_CONFIG environment variable is not defined', async () => {
      delete process.env.EDGE_CONFIG;
      const result = await getEdgeConfigFlag('maintenance_mode', false);
      expect(result).toBe(false);
    });

    it('should fetch and return flag value if EDGE_CONFIG is configured and request succeeds', async () => {
      process.env.EDGE_CONFIG = 'https://edge-config.vercel.com/ecfg_test?token=secret';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ value: true }),
      });
      globalThis.fetch = mockFetch as any;

      const result = await getEdgeConfigFlag('maintenance_mode', false);
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://edge-config.vercel.com/ecfg_test/item/maintenance_mode?token=secret',
        expect.objectContaining({
          headers: { Accept: 'application/json' },
        })
      );
    });

    it('should return defaultValue if HTTP response is not ok', async () => {
      process.env.EDGE_CONFIG = 'https://edge-config.vercel.com/ecfg_test?token=secret';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });
      globalThis.fetch = mockFetch as any;

      const result = await getEdgeConfigFlag('unknown_flag', 'default_val');
      expect(result).toBe('default_val');
    });

    it('should return defaultValue if network fetch throws an error', async () => {
      process.env.EDGE_CONFIG = 'https://edge-config.vercel.com/ecfg_test?token=secret';

      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      globalThis.fetch = mockFetch as any;

      const result = await getEdgeConfigFlag('maintenance_mode', false);
      expect(result).toBe(false);
    });
  });

  describe('isMaintenanceMode & useStaticFallback', () => {
    it('should correctly evaluate maintenance mode status', async () => {
      delete process.env.EDGE_CONFIG;
      const maintenance = await isMaintenanceMode();
      expect(maintenance).toBe(false);
    });

    it('should correctly evaluate static fallback status', async () => {
      delete process.env.EDGE_CONFIG;
      const fallback = await useStaticFallback();
      expect(fallback).toBe(false);
    });
  });

  describe('isCircuitTripped', () => {
    it('should return false by default when unconfigured', async () => {
      delete process.env.EDGE_CONFIG;
      const tripped = await isCircuitTripped('database_queries');
      expect(tripped).toBe(false);
    });
  });

  describe('tripCircuitBreaker', () => {
    it('should return false if VERCEL_API_TOKEN or VERCEL_EDGE_CONFIG_ID is missing', async () => {
      delete process.env.VERCEL_API_TOKEN;
      delete process.env.VERCEL_EDGE_CONFIG_ID;

      const success = await tripCircuitBreaker('stock_api', true);
      expect(success).toBe(false);
    });

    it('should make PATCH request to Vercel API if credentials are present', async () => {
      process.env.VERCEL_API_TOKEN = 'test_token';
      process.env.VERCEL_EDGE_CONFIG_ID = 'ecfg_12345';
      process.env.VERCEL_TEAM_ID = 'team_abc';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ok' }),
      });
      globalThis.fetch = mockFetch as any;

      const success = await tripCircuitBreaker('ai_chat', true);
      expect(success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.vercel.com/v1/edge-config/ecfg_12345/items?teamId=team_abc',
        expect.objectContaining({
          method: 'PATCH',
          headers: {
            Authorization: 'Bearer test_token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: [
              {
                operation: 'upsert',
                key: 'circuit_tripped_ai_chat',
                value: true,
              },
            ],
          }),
        })
      );
    });
  });
});

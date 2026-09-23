import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getEdgeConfigState, tripCircuitBreaker } from './edgeConfigService';

describe('Edge Config Circuit Breaker Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('getEdgeConfigState', () => {
    it('returns default state when EDGE_CONFIG is unassigned', async () => {
      delete process.env.EDGE_CONFIG;
      const state = await getEdgeConfigState();
      expect(state).toEqual({
        maintenance_mode: false,
        use_static_fallback: false,
        disabled_features: [],
      });
    });

    it('fetches items and parses circuit breaker flags accurately when EDGE_CONFIG is set', async () => {
      process.env.EDGE_CONFIG = 'https://edge-config.vercel.com/ecfg_test123?token=secret123';

      const mockResponse = {
        maintenance_mode: true,
        use_static_fallback: false,
        disabled_features: ['ai_chat', 'yfinance'],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as any);

      const state = await getEdgeConfigState();

      expect(fetch).toHaveBeenCalledWith(
        'https://edge-config.vercel.com/ecfg_test123/items?token=secret123',
        expect.objectContaining({
          method: 'GET',
          headers: { Accept: 'application/json' },
        })
      );
      expect(state.maintenance_mode).toBe(true);
      expect(state.use_static_fallback).toBe(false);
      expect(state.disabled_features).toEqual(['ai_chat', 'yfinance']);
    });

    it('handles network failure gracefully and returns default state', async () => {
      process.env.EDGE_CONFIG = 'https://edge-config.vercel.com/ecfg_test123?token=secret123';

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const state = await getEdgeConfigState();
      expect(state).toEqual({
        maintenance_mode: false,
        use_static_fallback: false,
        disabled_features: [],
      });
    });
  });

  describe('tripCircuitBreaker', () => {
    it('returns false when VERCEL_API_TOKEN or EDGE_CONFIG_ID is missing', async () => {
      delete process.env.VERCEL_API_TOKEN;
      delete process.env.EDGE_CONFIG_ID;

      const result = await tripCircuitBreaker('maintenance_mode', true);
      expect(result).toBe(false);
    });

    it('sends PATCH request to Vercel API to update circuit breaker item', async () => {
      process.env.VERCEL_API_TOKEN = 'vtl_12345';
      process.env.EDGE_CONFIG_ID = 'ecfg_67890';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ok' }),
      } as any);

      const result = await tripCircuitBreaker('use_static_fallback', true);

      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.vercel.com/v1/edge-config/ecfg_67890/items',
        expect.objectContaining({
          method: 'PATCH',
          headers: {
            Authorization: 'Bearer vtl_12345',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: [
              {
                operation: 'upsert',
                key: 'use_static_fallback',
                value: true,
              },
            ],
          }),
        })
      );
    });
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getEdgeConfigState,
  isFeatureDisabled,
  tripCircuitBreaker,
} from './edgeConfigService';

describe('edgeConfigService', () => {
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
    it('returns default operational state when EDGE_CONFIG env is missing', async () => {
      delete process.env.EDGE_CONFIG;
      const state = await getEdgeConfigState();

      expect(state).toEqual({
        maintenance_mode: false,
        use_static_fallback: false,
        disabled_features: [],
        egress_budget_guard: false,
      });
    });

    it('fetches and parses edge config state when EDGE_CONFIG is set', async () => {
      process.env.EDGE_CONFIG = 'https://edge-config.vercel.com/ecfg_test123?token=secret_token';

      const mockData = {
        maintenance_mode: true,
        use_static_fallback: true,
        disabled_features: ['ai_chat', 'telegram_broadcast'],
        egress_budget_guard: true,
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const state = await getEdgeConfigState();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://edge-config.vercel.com/ecfg_test123/items?token=secret_token',
        expect.objectContaining({
          method: 'GET',
          headers: { Accept: 'application/json' },
        })
      );
      expect(state.maintenance_mode).toBe(true);
      expect(state.use_static_fallback).toBe(true);
      expect(state.disabled_features).toEqual(['ai_chat', 'telegram_broadcast']);
      expect(state.egress_budget_guard).toBe(true);
    });

    it('gracefully handles fetch failure and returns default state', async () => {
      process.env.EDGE_CONFIG = 'https://edge-config.vercel.com/ecfg_test123?token=secret_token';

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const state = await getEdgeConfigState();
      expect(state.maintenance_mode).toBe(false);
      expect(state.disabled_features).toEqual([]);
    });

    it('gracefully handles network exception and returns default state', async () => {
      process.env.EDGE_CONFIG = 'https://edge-config.vercel.com/ecfg_test123?token=secret_token';

      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network offline'));

      const state = await getEdgeConfigState();
      expect(state.maintenance_mode).toBe(false);
      expect(state.disabled_features).toEqual([]);
    });
  });

  describe('isFeatureDisabled', () => {
    it('correctly checks if feature is disabled', async () => {
      process.env.EDGE_CONFIG = 'https://edge-config.vercel.com/ecfg_test123?token=secret_token';

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          disabled_features: ['ai_chat'],
        }),
      } as Response);

      const isAiDisabled = await isFeatureDisabled('ai_chat');
      expect(isAiDisabled).toBe(true);
    });

    it('returns false if feature is not disabled', async () => {
      delete process.env.EDGE_CONFIG;
      const isAiDisabled = await isFeatureDisabled('ai_chat');
      expect(isAiDisabled).toBe(false);
    });
  });

  describe('tripCircuitBreaker', () => {
    it('returns false if VERCEL_API_TOKEN or EDGE_CONFIG_ID is missing', async () => {
      delete process.env.VERCEL_API_TOKEN;
      delete process.env.EDGE_CONFIG_ID;

      const success = await tripCircuitBreaker('maintenance_mode', true);
      expect(success).toBe(false);
    });

    it('sends PATCH request to Vercel API and returns true on success', async () => {
      process.env.VERCEL_API_TOKEN = 'mock_vercel_token';
      process.env.EDGE_CONFIG_ID = 'ecfg_12345';

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' }),
      } as Response);

      const success = await tripCircuitBreaker('maintenance_mode', true);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.vercel.com/v1/edge-config/ecfg_12345/items',
        expect.objectContaining({
          method: 'PATCH',
          headers: {
            Authorization: 'Bearer mock_vercel_token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: [
              {
                operation: 'upsert',
                key: 'maintenance_mode',
                value: true,
              },
            ],
          }),
        })
      );
      expect(success).toBe(true);
    });
  });
});

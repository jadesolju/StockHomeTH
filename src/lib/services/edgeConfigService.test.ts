import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getEdgeConfigFlag,
  isMaintenanceMode,
  isStaticFallbackEnabled,
  tripCircuitBreaker,
  resetCircuitBreaker,
  clearLocalFlagOverrides,
} from './edgeConfigService';

describe('EdgeConfigService Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearLocalFlagOverrides();
    delete process.env.MAINTENANCE_MODE;
    delete process.env.USE_STATIC_FALLBACK;
    delete process.env.EDGE_CONFIG;
    delete process.env.VERCEL_EDGE_CONFIG;
  });

  it('should return default value when Edge Config connection is missing and no env var set', async () => {
    const isMaint = await isMaintenanceMode();
    expect(isMaint).toBe(false);

    const customFlag = await getEdgeConfigFlag('custom_feature', 'default_val');
    expect(customFlag).toBe('default_val');
  });

  it('should read boolean flag from environment variables if set', async () => {
    process.env.MAINTENANCE_MODE = 'true';
    expect(await isMaintenanceMode()).toBe(true);

    process.env.USE_STATIC_FALLBACK = '1';
    expect(await isStaticFallbackEnabled()).toBe(true);
  });

  it('should override flags via tripCircuitBreaker and reset with resetCircuitBreaker', async () => {
    expect(await isMaintenanceMode()).toBe(false);

    await tripCircuitBreaker('maintenance_mode', 'Primary DB Down');
    expect(await isMaintenanceMode()).toBe(true);

    await resetCircuitBreaker('maintenance_mode');
    expect(await isMaintenanceMode()).toBe(false);
  });

  it('should fetch flag value from Edge Config REST API if EDGE_CONFIG is set', async () => {
    process.env.EDGE_CONFIG = 'https://edge-config.vercel.com/ecfg_test?token=secret_token_123';

    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: true }),
    } as Response);

    const isStatic = await getEdgeConfigFlag('use_static_fallback', false);
    expect(isStatic).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://edge-config.vercel.com/ecfg_test/item/use_static_fallback?token=secret_token_123',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('should fall back to default value if fetch times out or fails', async () => {
    process.env.EDGE_CONFIG = 'https://edge-config.vercel.com/ecfg_test/item/slow_key';

    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => ({ value: true }) } as Response), 2000))
    );

    const result = await getEdgeConfigFlag('slow_key', false);
    expect(result).toBe(false);
  });
});

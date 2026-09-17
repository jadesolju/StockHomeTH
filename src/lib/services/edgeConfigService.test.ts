import { describe, it, expect, beforeEach } from 'vitest';
import {
  getEdgeConfigFlags,
  isMaintenanceMode,
  shouldUseStaticFallback,
  isCircuitTripped,
  recordCircuitFailure,
  recordCircuitSuccess,
  resetCircuitBreaker,
} from './edgeConfigService';

describe('Vercel Edge Config & Circuit Breaker Service', () => {
  beforeEach(() => {
    resetCircuitBreaker();
    delete process.env.MAINTENANCE_MODE;
    delete process.env.USE_STATIC_FALLBACK;
    delete process.env.DISABLE_AI_CHAT;
    delete process.env.EDGE_CONFIG;
  });

  describe('getEdgeConfigFlags', () => {
    it('should return default flags when no env vars or Edge Config URL are configured', async () => {
      const flags = await getEdgeConfigFlags();
      expect(flags.maintenance_mode).toBe(false);
      expect(flags.use_static_fallback).toBe(false);
      expect(flags.disable_ai_chat).toBe(false);
      expect(flags.circuit_tripped).toBe(false);
    });

    it('should respect environment variable overrides', async () => {
      process.env.MAINTENANCE_MODE = 'true';
      process.env.USE_STATIC_FALLBACK = 'true';
      resetCircuitBreaker();

      const flags = await getEdgeConfigFlags();
      expect(flags.maintenance_mode).toBe(true);
      expect(flags.use_static_fallback).toBe(true);
    });
  });

  describe('isMaintenanceMode & shouldUseStaticFallback', () => {
    it('should accurately report maintenance mode status', async () => {
      expect(await isMaintenanceMode()).toBe(false);
      process.env.MAINTENANCE_MODE = 'true';
      resetCircuitBreaker();
      expect(await isMaintenanceMode()).toBe(true);
    });

    it('should trigger static fallback when explicitly flagged or circuit is tripped', async () => {
      expect(await shouldUseStaticFallback()).toBe(false);

      // Record 3 failures to trip the circuit breaker
      recordCircuitFailure();
      recordCircuitFailure();
      recordCircuitFailure();

      expect(isCircuitTripped()).toBe(true);
      expect(await shouldUseStaticFallback()).toBe(true);
    });
  });

  describe('Circuit Breaker Transitions', () => {
    it('should trip circuit breaker after 3 consecutive failures and recover on success', () => {
      expect(isCircuitTripped()).toBe(false);

      recordCircuitFailure();
      expect(isCircuitTripped()).toBe(false);

      recordCircuitFailure();
      expect(isCircuitTripped()).toBe(false);

      recordCircuitFailure();
      expect(isCircuitTripped()).toBe(true);

      // Record success to reset circuit
      recordCircuitSuccess();
      expect(isCircuitTripped()).toBe(false);
    });
  });
});

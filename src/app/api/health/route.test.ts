import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import * as edgeConfigService from '@/lib/services/edgeConfigService';
import * as fallbackModule from '@/lib/supabase/fallback';

vi.mock('@/lib/services/edgeConfigService');

describe('GET /api/health System Health Endpoint', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(fallbackModule, 'fetchWithFallback').mockResolvedValue({ status: 'healthy' } as any);
  });

  it('should return 200 OK with status ok when system and edge config are fully operational', async () => {
    vi.spyOn(edgeConfigService, 'getEdgeConfigState').mockResolvedValue({
      maintenance_mode: false,
      use_static_fallback: false,
      disabled_features: [],
    });

    const response = await GET();
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.circuit_breaker.tripped).toBe(false);
    expect(data.services.edge_config).toBe('healthy');
    expect(data.services.fallback_system).toBe('active');
  });

  it('should return 503 Service Unavailable with status degraded when circuit breaker is tripped', async () => {
    vi.spyOn(edgeConfigService, 'getEdgeConfigState').mockResolvedValue({
      maintenance_mode: true,
      use_static_fallback: false,
      disabled_features: [],
    });

    const response = await GET();
    expect(response.status).toBe(503);

    const data = await response.json();
    expect(data.status).toBe('degraded');
    expect(data.circuit_breaker.tripped).toBe(true);
    expect(data.circuit_breaker.maintenance_mode).toBe(true);
  });

  it('should gracefully handle Edge Config timeout or error and return status with degraded edge_config', async () => {
    vi.spyOn(edgeConfigService, 'getEdgeConfigState').mockRejectedValue(new Error('Edge config unreachable'));

    const response = await GET();
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.services.edge_config).toBe('degraded');
  });
});

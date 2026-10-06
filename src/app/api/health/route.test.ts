import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

// Mock dependencies
vi.mock('@/lib/supabase/fallback', () => ({
  fetchWithFallback: vi.fn(),
  withTimeout: vi.fn((promise: Promise<any>) => promise),
}));

vi.mock('@/lib/services/edgeConfigService', () => ({
  getEdgeConfigState: vi.fn(),
}));

import { fetchWithFallback } from '@/lib/supabase/fallback';
import { getEdgeConfigState } from '@/lib/services/edgeConfigService';

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 OK with status "ok" when database and Edge Config are healthy', async () => {
    (fetchWithFallback as any).mockResolvedValue(true);
    (getEdgeConfigState as any).mockResolvedValue({
      maintenance_mode: false,
      use_static_fallback: false,
      disabled_features: [],
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.services.database.status).toBe('healthy');
    expect(data.services.database.poolerPort).toBe(6543);
    expect(data.services.database.timeoutLimitMs).toBe(5000);
    expect(data.services.edgeConfig.maintenance_mode).toBe(false);
    expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
  });

  it('should return status "degraded" when database probe fails', async () => {
    (fetchWithFallback as any).mockRejectedValue(new Error('Connection timeout'));
    (getEdgeConfigState as any).mockResolvedValue({
      maintenance_mode: false,
      use_static_fallback: false,
      disabled_features: [],
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('degraded');
    expect(data.services.database.status).toBe('unhealthy');
    expect(data.services.database.message).toContain('Connection timeout');
  });

  it('should return 503 with status "maintenance" when Edge Config maintenance mode is active', async () => {
    (fetchWithFallback as any).mockResolvedValue(true);
    (getEdgeConfigState as any).mockResolvedValue({
      maintenance_mode: true,
      use_static_fallback: false,
      disabled_features: ['ai_chat'],
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('maintenance');
    expect(data.services.edgeConfig.maintenance_mode).toBe(true);
    expect(data.services.edgeConfig.disabled_features).toContain('ai_chat');
  });
});

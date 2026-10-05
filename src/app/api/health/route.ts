import { NextResponse } from 'next/server';
import { getEdgeConfigState } from '@/lib/services/edgeConfigService';
import { withTimeout, fetchWithFallback } from '@/lib/supabase/fallback';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Health Check API Endpoint
 * Provides system operational health status, database fallback check, circuit breaker state, and fallback readiness.
 * Exempt from middleware maintenance guards so health checkers can monitor system status.
 */
export async function GET() {
  const timestamp = new Date().toISOString();

  let edgeConfigState = { maintenance_mode: false, use_static_fallback: false };
  let edgeConfigHealthy = true;
  let databaseHealthy = true;
  let fallbackActive = false;

  try {
    const state = await withTimeout(getEdgeConfigState(), 2000, 'Edge Config check timeout');
    if (state) {
      edgeConfigState = {
        maintenance_mode: Boolean(state.maintenance_mode),
        use_static_fallback: Boolean(state.use_static_fallback),
      };
    }
  } catch {
    edgeConfigHealthy = false;
  }

  // Probe database resilience using fetchWithFallback
  try {
    await fetchWithFallback(
      async (client) => {
        if (!client || typeof client.from !== 'function') return { status: 'mock' };
        return await client.from('stock_pool').select('ticker').limit(1);
      },
      { timeoutMs: 3000 }
    );
  } catch {
    databaseHealthy = false;
    fallbackActive = true;
  }

  const isCircuitBreakerTripped = edgeConfigState.maintenance_mode || edgeConfigState.use_static_fallback;

  const responsePayload = {
    status: isCircuitBreakerTripped || !databaseHealthy ? 'degraded' : 'ok',
    timestamp,
    circuit_breaker: {
      tripped: isCircuitBreakerTripped,
      maintenance_mode: edgeConfigState.maintenance_mode,
      use_static_fallback: edgeConfigState.use_static_fallback,
    },
    services: {
      edge_config: edgeConfigHealthy ? 'healthy' : 'degraded',
      database: databaseHealthy ? 'healthy' : 'fallback_engaged',
      fallback_system: fallbackActive ? 'fallback_engaged' : 'active',
    },
  };

  const statusCode = isCircuitBreakerTripped ? 503 : 200;

  return NextResponse.json(responsePayload, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

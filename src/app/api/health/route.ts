import { NextResponse } from 'next/server';
import { fetchWithFallback, withTimeout } from '@/lib/supabase/fallback';
import { getEdgeConfigState } from '@/lib/services/edgeConfigService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Health Check API Route for System Monitoring and Fallback Status
 *
 * Excluded from Edge Config maintenance interception in middleware to allow
 * external uptime monitors (e.g., Vercel, Datadog, UptimeRobot) to assess system health.
 */
export async function GET() {
  const startTime = Date.now();

  let dbStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  let dbMessage = 'Primary database connected via Supavisor pooler (port 6543)';
  let primaryDbLatencyMs = -1;
  let usedFallback = false;

  // 1. Probe Database Resilience & Connection
  try {
    const dbStartTime = Date.now();
    await fetchWithFallback(
      async (client) => {
        // Lightweight probe query
        const { error } = await client.from('app_settings').select('key').limit(1);
        if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
          // Ignore missing table error if schema not initialized yet
          console.warn('[Health Check] DB probe non-fatal warning:', error.message);
        }
        return true;
      },
      {
        timeoutMs: 5000,
      }
    );
    primaryDbLatencyMs = Date.now() - dbStartTime;
  } catch (err: any) {
    dbStatus = 'unhealthy';
    dbMessage = `Database probe failed: ${err?.message || String(err)}`;
  }

  // 2. Fetch Vercel Edge Config State
  let edgeConfigState = {
    maintenance_mode: false,
    use_static_fallback: false,
    disabled_features: [] as string[],
  };

  try {
    edgeConfigState = await withTimeout(
      getEdgeConfigState(),
      2000,
      'Edge Config probe timed out'
    );
  } catch (err: any) {
    console.warn('[Health Check] Edge Config fetch warning:', err?.message || String(err));
  }

  // 3. Determine Overall System Status
  let overallStatus: 'ok' | 'degraded' | 'maintenance' = 'ok';
  if (edgeConfigState.maintenance_mode || edgeConfigState.use_static_fallback) {
    overallStatus = 'maintenance';
  } else if (dbStatus !== 'healthy') {
    overallStatus = 'degraded';
  }

  const totalDurationMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      durationMs: totalDurationMs,
      services: {
        database: {
          status: dbStatus,
          message: dbMessage,
          poolerPort: 6543,
          latencyMs: primaryDbLatencyMs,
          usedFallback,
          timeoutLimitMs: 5000,
        },
        edgeConfig: {
          status: 'active',
          maintenance_mode: edgeConfigState.maintenance_mode,
          use_static_fallback: edgeConfigState.use_static_fallback,
          disabled_features: edgeConfigState.disabled_features,
        },
      },
      environment: process.env.NODE_ENV || 'development',
    },
    {
      status: overallStatus === 'maintenance' ? 503 : overallStatus === 'degraded' ? 200 : 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Health-Check': overallStatus,
      },
    }
  );
}

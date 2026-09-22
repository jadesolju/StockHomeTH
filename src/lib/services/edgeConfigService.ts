import { withTimeout } from '@/lib/supabase/fallback';

// In-memory circuit breaker & flag overrides for runtime failover / testing
const localFlagsOverride = new Map<string, any>();

/**
 * Retrieves a feature flag or configuration value from Vercel Edge Config
 * with strict timeout protection and fallback to environment variables or in-memory state.
 */
export async function getEdgeConfigFlag<T = boolean>(
  key: string,
  defaultValue: T
): Promise<T> {
  // 1. Check in-memory override first (for active circuit breaker trips / local testing)
  if (localFlagsOverride.has(key)) {
    return localFlagsOverride.get(key) as T;
  }

  // 2. Check environment variable fallback (e.g. MAINTENANCE_MODE, USE_STATIC_FALLBACK)
  const envKey = key.toUpperCase();
  if (process.env[envKey] !== undefined) {
    const envVal = process.env[envKey];
    if (typeof defaultValue === 'boolean') {
      return (envVal === 'true' || envVal === '1') as unknown as T;
    }
    return envVal as unknown as T;
  }

  const edgeConfigConnectionString =
    process.env.EDGE_CONFIG || process.env.VERCEL_EDGE_CONFIG || '';

  if (!edgeConfigConnectionString) {
    return defaultValue;
  }

  // 3. Attempt Vercel Edge Config REST lookup with strict 1000ms timeout
  try {
    let urlObj: URL;
    if (edgeConfigConnectionString.startsWith('http')) {
      urlObj = new URL(edgeConfigConnectionString);
      if (!urlObj.pathname.includes('/item/')) {
        const basePath = urlObj.pathname.replace(/\/$/, '');
        urlObj.pathname = `${basePath}/item/${key}`;
      }
    } else {
      const configId = edgeConfigConnectionString.replace(/^ecfg_/, '');
      urlObj = new URL(`https://edge-config.vercel.com/${configId}/item/${key}`);
    }

    const url = urlObj.toString();

    const fetchPromise = fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    }).then(async (res) => {
      if (!res.ok) return defaultValue;
      const data = await res.json();
      return (data?.value ?? data ?? defaultValue) as T;
    });

    return await withTimeout(fetchPromise, 1000, `Edge Config fetch timed out for key: ${key}`);
  } catch (err: any) {
    console.warn(`[EdgeConfigService] Failed to fetch flag '${key}': ${err?.message || err}. Using default.`);
    return defaultValue;
  }
}

/**
 * Checks if system maintenance mode is currently active via Edge Config or environment flags.
 */
export async function isMaintenanceMode(): Promise<boolean> {
  return await getEdgeConfigFlag<boolean>('maintenance_mode', false);
}

/**
 * Checks if static fallback mode is enabled to bypass dynamic database operations.
 */
export async function isStaticFallbackEnabled(): Promise<boolean> {
  return await getEdgeConfigFlag<boolean>('use_static_fallback', false);
}

/**
 * Programmatically trips a circuit breaker flag to dynamically disable features
 * or enforce static fallback mode when database/downstream errors occur.
 */
export async function tripCircuitBreaker(
  flagName: string,
  reason: string = 'Database or downstream health failure'
): Promise<boolean> {
  console.warn(`[Circuit Breaker Tripped] Flag '${flagName}' activated. Reason: ${reason}`);
  localFlagsOverride.set(flagName, true);

  // If Vercel API access token is available, attempt remote Edge Config update
  const vercelApiToken = process.env.VERCEL_API_TOKEN;
  const edgeConfigId = process.env.EDGE_CONFIG_ID;

  if (vercelApiToken && edgeConfigId) {
    try {
      const updatePromise = fetch(`https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${vercelApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              operation: 'upsert',
              key: flagName,
              value: true,
            },
          ],
        }),
      });

      await withTimeout(updatePromise, 2000, 'Remote Edge Config trip update timed out');
    } catch (err: any) {
      console.error(`[Circuit Breaker] Failed to update remote Edge Config item '${flagName}':`, err?.message || err);
    }
  }

  return true;
}

/**
 * Resets a circuit breaker flag back to false / normal operation.
 */
export async function resetCircuitBreaker(flagName: string): Promise<boolean> {
  localFlagsOverride.set(flagName, false);
  return true;
}

/**
 * Clears all local flag overrides (useful for testing resets).
 */
export function clearLocalFlagOverrides(): void {
  localFlagsOverride.clear();
}

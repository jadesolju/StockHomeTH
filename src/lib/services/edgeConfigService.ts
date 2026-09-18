/**
 * Edge Config Service & Dynamic Circuit Breaker Management
 * Provides near-zero latency Edge Config flag evaluation and automated circuit tripping for Next.js & Vercel Edge.
 */

export interface EdgeConfigFlags {
  maintenance_mode?: boolean;
  use_static_fallback?: boolean;
  circuit_tripped?: boolean;
  [key: string]: any;
}

/**
 * Retrieves a dynamic configuration flag from Vercel Edge Config.
 * Safely falls back to `defaultValue` if EDGE_CONFIG environment variable is missing,
 * network request fails, or operation times out.
 */
export async function getEdgeConfigFlag<T>(key: string, defaultValue: T): Promise<T> {
  const edgeConfigUrl = process.env.EDGE_CONFIG;
  if (!edgeConfigUrl) {
    return defaultValue;
  }

  let timeoutId: NodeJS.Timeout | null = null;
  try {
    // Vercel Edge Config REST endpoint format: <EDGE_CONFIG_URL>/item/<key>
    let url: string;
    try {
      const parsedUrl = new URL(edgeConfigUrl);
      if (!parsedUrl.pathname.includes('/item/')) {
        parsedUrl.pathname = `${parsedUrl.pathname.replace(/\/$/, '')}/item/${key}`;
      }
      url = parsedUrl.toString();
    } catch {
      const baseUrl = edgeConfigUrl.replace(/\/$/, '');
      url = baseUrl.includes('/item/') ? baseUrl : `${baseUrl}/item/${key}`;
    }

    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 1500); // Strict 1500ms timeout for Edge flags

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return defaultValue;
    }

    const data = await response.json();
    if (data === null || data === undefined) {
      return defaultValue;
    }

    return (typeof data === 'object' && 'value' in data ? data.value : data) as T;
  } catch (error: any) {
    console.warn(`[EdgeConfigService] Error fetching flag '${key}', using fallback:`, error?.message || error);
    return defaultValue;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Checks whether the system is currently in global Maintenance Mode.
 */
export async function isMaintenanceMode(): Promise<boolean> {
  return await getEdgeConfigFlag<boolean>('maintenance_mode', false);
}

/**
 * Checks whether static fallback mode is enabled for dynamic DB routes.
 */
export async function useStaticFallback(): Promise<boolean> {
  return await getEdgeConfigFlag<boolean>('use_static_fallback', false);
}

/**
 * Checks if the circuit breaker is tripped globally or for a specific feature.
 */
export async function isCircuitTripped(featureKey?: string): Promise<boolean> {
  if (featureKey) {
    const featureTripped = await getEdgeConfigFlag<boolean>(`circuit_tripped_${featureKey}`, false);
    if (featureTripped) return true;
  }
  return await getEdgeConfigFlag<boolean>('circuit_tripped', false);
}

/**
 * Programmatically triggers or resets a circuit breaker state in Vercel Edge Config via Vercel REST API.
 * Returns boolean indicating whether update API call was dispatched successfully.
 */
export async function tripCircuitBreaker(featureKey: string, tripState: boolean = true): Promise<boolean> {
  const vercelApiToken = process.env.VERCEL_API_TOKEN;
  const vercelEdgeConfigId = process.env.VERCEL_EDGE_CONFIG_ID;
  const vercelTeamId = process.env.VERCEL_TEAM_ID;

  if (!vercelApiToken || !vercelEdgeConfigId) {
    console.warn(
      `[EdgeConfigService] Missing VERCEL_API_TOKEN or VERCEL_EDGE_CONFIG_ID. Simulated circuit trip for '${featureKey}' to ${tripState}.`
    );
    return false;
  }

  try {
    let endpoint = `https://api.vercel.com/v1/edge-config/${vercelEdgeConfigId}/items`;
    if (vercelTeamId) {
      endpoint += `?teamId=${vercelTeamId}`;
    }

    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${vercelApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            operation: 'upsert',
            key: featureKey ? `circuit_tripped_${featureKey}` : 'circuit_tripped',
            value: tripState,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error(`[EdgeConfigService] Failed to update Edge Config items: ${response.status} ${response.statusText}`);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error(`[EdgeConfigService] Error updating circuit breaker state:`, error?.message || error);
    return false;
  }
}

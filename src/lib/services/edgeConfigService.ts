export interface EdgeConfigState {
  maintenance_mode: boolean;
  use_static_fallback: boolean;
  disabled_features: string[];
  [key: string]: any;
}

const DEFAULT_STATE: EdgeConfigState = {
  maintenance_mode: false,
  use_static_fallback: false,
  disabled_features: [],
};

/**
 * Fetches the current Edge Config state from Vercel Edge Config endpoint
 * or returns default operational state if Edge Config environment variable is unassigned.
 */
export async function getEdgeConfigState(): Promise<EdgeConfigState> {
  const edgeConfigUrl = process.env.EDGE_CONFIG;

  if (!edgeConfigUrl) {
    return DEFAULT_STATE;
  }

  try {
    // Standard Vercel Edge Config item retrieval URL
    // EDGE_CONFIG URL format: https://edge-config.vercel.com/ecfg_xxx?token=yyy
    const itemsUrl = edgeConfigUrl.includes('/items')
      ? edgeConfigUrl
      : `${edgeConfigUrl.replace(/\?.*$/, '')}/items${edgeConfigUrl.includes('?') ? edgeConfigUrl.substring(edgeConfigUrl.indexOf('?')) : ''}`;

    const res = await fetch(itemsUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 10 }, // Revalidate every 10 seconds in Next.js ISR
    });

    if (!res.ok) {
      console.warn(`[EdgeConfigService] Failed to fetch edge config (${res.status}): ${res.statusText}`);
      return DEFAULT_STATE;
    }

    const items = await res.json();
    return {
      maintenance_mode: Boolean(items.maintenance_mode ?? false),
      use_static_fallback: Boolean(items.use_static_fallback ?? false),
      disabled_features: Array.isArray(items.disabled_features) ? items.disabled_features : [],
      ...items,
    };
  } catch (err: any) {
    console.error('[EdgeConfigService] Error fetching Edge Config state:', err?.message || err);
    return DEFAULT_STATE;
  }
}

/**
 * Trips a circuit breaker flag inside Vercel Edge Config via the Vercel REST API.
 * Requires VERCEL_API_TOKEN and EDGE_CONFIG_ID environment variables.
 */
export async function tripCircuitBreaker(
  flagKey: string,
  value: boolean | any,
  options?: { vercelToken?: string; edgeConfigId?: string; teamId?: string }
): Promise<boolean> {
  const token = options?.vercelToken || process.env.VERCEL_API_TOKEN;
  const edgeConfigId = options?.edgeConfigId || process.env.EDGE_CONFIG_ID;
  const teamId = options?.teamId || process.env.VERCEL_TEAM_ID;

  if (!token || !edgeConfigId) {
    console.warn('[EdgeConfigService] Missing VERCEL_API_TOKEN or EDGE_CONFIG_ID. Skipping remote circuit breaker trip.');
    return false;
  }

  try {
    const teamParam = teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';
    const endpoint = `https://api.vercel.com/v1/edge-config/${encodeURIComponent(edgeConfigId)}/items${teamParam}`;

    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            operation: 'upsert',
            key: flagKey,
            value: value,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[EdgeConfigService] Failed to trip circuit breaker key '${flagKey}' (${response.status}):`, errText);
      return false;
    }

    console.log(`[EdgeConfigService] Successfully updated circuit breaker key '${flagKey}' to:`, value);
    return true;
  } catch (err: any) {
    console.error(`[EdgeConfigService] Error tripping circuit breaker '${flagKey}':`, err?.message || err);
    return false;
  }
}

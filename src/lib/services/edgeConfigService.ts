/**
 * Vercel Edge Config & Circuit Breaker Service
 * Handles near-zero latency (<1ms) dynamic switch flag evaluation
 * for system maintenance, database failover, and static fallback interception.
 */

export interface EdgeConfigFlags {
  maintenance_mode: boolean;
  use_static_fallback: boolean;
  circuit_tripped: boolean;
  disable_ai_chat: boolean;
  lastUpdated?: string;
}

interface CircuitBreakerState {
  consecutiveFailures: number;
  lastFailureTime: number;
  isTripped: boolean;
}

const FAILURE_THRESHOLD = 3;
const RESET_TIMEOUT_MS = 30_000; // 30s before trying reset
const CACHE_TTL_MS = 5_000; // 5s in-memory TTL for Edge Config reads

let cachedFlags: EdgeConfigFlags | null = null;
let lastCacheTime = 0;

let circuitState: CircuitBreakerState = {
  consecutiveFailures: 0,
  lastFailureTime: 0,
  isTripped: false,
};

/**
 * Retrieves the current Edge Config flags.
 * Uses environment variable overrides and in-memory TTL cache for near-zero latency.
 */
export async function getEdgeConfigFlags(): Promise<EdgeConfigFlags> {
  const now = Date.now();

  if (cachedFlags && now - lastCacheTime < CACHE_TTL_MS) {
    return {
      ...cachedFlags,
      circuit_tripped: isCircuitTripped(),
    };
  }

  // Evaluate Environment & Circuit Breaker State
  const envMaintenance = process.env.MAINTENANCE_MODE === 'true';
  const envStaticFallback = process.env.USE_STATIC_FALLBACK === 'true';
  const envDisableAi = process.env.DISABLE_AI_CHAT === 'true';

  let remoteFlags: Partial<EdgeConfigFlags> = {};

  // If Vercel EDGE_CONFIG URL is configured, fetch JSON payload with 1000ms timeout
  if (process.env.EDGE_CONFIG) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);

      const res = await fetch(process.env.EDGE_CONFIG, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        remoteFlags = {
          maintenance_mode: Boolean(json.items?.maintenance_mode ?? json.maintenance_mode),
          use_static_fallback: Boolean(json.items?.use_static_fallback ?? json.use_static_fallback),
          disable_ai_chat: Boolean(json.items?.disable_ai_chat ?? json.disable_ai_chat),
        };
      }
    } catch {
      // Fallback silently to env vars if Edge Config endpoint is unreachable
    }
  }

  const flags: EdgeConfigFlags = {
    maintenance_mode: envMaintenance || Boolean(remoteFlags.maintenance_mode),
    use_static_fallback: envStaticFallback || Boolean(remoteFlags.use_static_fallback),
    disable_ai_chat: envDisableAi || Boolean(remoteFlags.disable_ai_chat),
    circuit_tripped: isCircuitTripped(),
    lastUpdated: new Date(now).toISOString(),
  };

  cachedFlags = flags;
  lastCacheTime = now;

  return flags;
}

/**
 * Returns true if system maintenance mode is explicitly active.
 */
export async function isMaintenanceMode(): Promise<boolean> {
  const flags = await getEdgeConfigFlags();
  return flags.maintenance_mode;
}

/**
 * Returns true if static fallback is required (either explicitly flagged or circuit tripped).
 */
export async function shouldUseStaticFallback(): Promise<boolean> {
  const flags = await getEdgeConfigFlags();
  return flags.use_static_fallback || flags.circuit_tripped;
}

/**
 * Evaluates whether the automatic circuit breaker is currently tripped.
 */
export function isCircuitTripped(): boolean {
  if (!circuitState.isTripped) return false;

  // Auto-recovery test window after RESET_TIMEOUT_MS
  if (Date.now() - circuitState.lastFailureTime > RESET_TIMEOUT_MS) {
    circuitState.isTripped = false;
    circuitState.consecutiveFailures = 0;
    return false;
  }

  return true;
}

/**
 * Records a database/operation failure to potentially trip the circuit breaker.
 */
export function recordCircuitFailure(): void {
  circuitState.consecutiveFailures += 1;
  circuitState.lastFailureTime = Date.now();

  if (circuitState.consecutiveFailures >= FAILURE_THRESHOLD) {
    circuitState.isTripped = true;
    console.warn(
      `[Circuit Breaker] Tripped after ${circuitState.consecutiveFailures} consecutive failures. Bypassing primary DB.`
    );
  }
}

/**
 * Records a successful database/operation to reset the circuit breaker.
 */
export function recordCircuitSuccess(): void {
  circuitState.consecutiveFailures = 0;
  circuitState.isTripped = false;
}

/**
 * Manually resets the circuit breaker state and invalidates cached flags.
 */
export function resetCircuitBreaker(): void {
  circuitState = {
    consecutiveFailures: 0,
    lastFailureTime: 0,
    isTripped: false,
  };
  cachedFlags = null;
  lastCacheTime = 0;
}

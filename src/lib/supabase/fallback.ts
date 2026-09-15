import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_TIMEOUT_MS = 5000;
export const SUPAVISOR_TRANSACTION_PORT = 6543;

export interface FetchWithFallbackOptions<T = any> {
  timeoutMs?: number;
  primaryUrl?: string;
  primaryKey?: string;
  fallbackUrl?: string;
  fallbackKey?: string;
  staticFallback?: T;
  onFallback?: (error: Error) => void;
}

/**
 * Enforces a strict timeout limit (default 5000ms) onto any asynchronous promise or workflow.
 * Safely handles late rejections from late-running background execution promises.
 */
export async function withTimeout<T>(
  promiseOrFn: Promise<T> | (() => Promise<T>),
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  label: string = 'Operation'
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;

  const executionPromise = typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn;

  // Prevent UnhandledPromiseRejection crashes if executionPromise rejects after the timeout races first
  executionPromise.catch(() => {});

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`[TimeoutEnforcement] ${label} exceeded strict limit of ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([executionPromise, timeoutPromise]);
    return result;
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

/**
 * Formats a Supabase / PostgreSQL connection URL to route via Supavisor Connection Pooler Port 6543.
 */
export function getSupabasePoolerUrl(rawUrl?: string): string {
  const targetUrl =
    rawUrl ||
    process.env.SUPABASE_POOLER_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    '';

  if (!targetUrl) return '';

  try {
    const parsed = new URL(targetUrl);
    // If it's a standard DB URL (postgres:// or postgresql://), update port to 6543
    if (parsed.protocol === 'postgres:' || parsed.protocol === 'postgresql:') {
      parsed.port = String(SUPAVISOR_TRANSACTION_PORT);
      return parsed.toString();
    }
    return targetUrl;
  } catch {
    return targetUrl;
  }
}

/**
 * Multi-Database Failover Pattern:
 * Executes a query against the primary Supabase client (Supavisor connection pooler).
 * If the primary instance fails or times out (5000ms limit), it falls back to a secondary database instance
 * (e.g. Standby replica, Neon Postgres DB) or static fallback.
 */
export async function fetchWithFallback<T>(
  queryFn: (client: SupabaseClient) => Promise<T>,
  options: FetchWithFallbackOptions<T> = {}
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const rawPrimaryUrl =
    options.primaryUrl ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;

  const primaryKey =
    options.primaryKey ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!rawPrimaryUrl || !primaryKey) {
    throw new Error(
      '[DatabaseFailover] Missing Supabase configuration: SUPABASE_URL and SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are required.'
    );
  }

  const primaryUrl = getSupabasePoolerUrl(rawPrimaryUrl);

  const rawFallbackUrl =
    options.fallbackUrl ||
    process.env.NEON_DATABASE_URL ||
    process.env.SUPABASE_FALLBACK_URL;

  const fallbackUrl = rawFallbackUrl ? getSupabasePoolerUrl(rawFallbackUrl) : undefined;
  const fallbackKey = options.fallbackKey || primaryKey;

  // Attempt Primary Query
  try {
    const primaryClient = createClient(primaryUrl, primaryKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    return await withTimeout(
      () => queryFn(primaryClient),
      timeoutMs,
      'Primary Supabase Query'
    );
  } catch (primaryError: any) {
    const err = primaryError instanceof Error ? primaryError : new Error(String(primaryError));
    console.warn(
      `[DatabaseFailover] Primary database failure or timeout (${err.message}). Initiating fallback protocol...`
    );

    if (options.onFallback) {
      try {
        options.onFallback(err);
      } catch (e) {
        console.error('[DatabaseFailover] Error in onFallback callback:', e);
      }
    }

    // Attempt Secondary Fallback DB if configured
    if (fallbackUrl) {
      try {
        const fallbackClient = createClient(fallbackUrl, fallbackKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        return await withTimeout(
          () => queryFn(fallbackClient),
          timeoutMs,
          'Fallback Database Query'
        );
      } catch (fallbackError: any) {
        console.error(
          '[DatabaseFailover] Secondary fallback database query failed:',
          fallbackError?.message || fallbackError
        );
      }
    }

    // Return static fallback if provided
    if (options.staticFallback !== undefined) {
      console.info('[DatabaseFailover] Serving static fallback payload.');
      return options.staticFallback;
    }

    throw err;
  }
}

/**
 * Checks Vercel Edge Config flags to determine if the circuit breaker is tripped.
 * Tripped flags (e.g. maintenance_mode: true or use_static_fallback: true) force
 * API routes to serve static cached data immediately without waiting for database operations.
 */
export async function isEdgeConfigCircuitBreakerTripped(
  edgeConfigUrl?: string
): Promise<boolean> {
  const url = edgeConfigUrl || process.env.EDGE_CONFIG;
  if (!url) {
    return false;
  }

  try {
    const res = await withTimeout(
      fetch(url, { headers: { 'Cache-Control': 'no-cache' } }),
      2000,
      'Vercel Edge Config Check'
    );

    if (!res.ok) {
      return false;
    }

    const data = await res.json();
    if (data && typeof data === 'object') {
      const items = data.items || data;
      return Boolean(items.maintenance_mode || items.use_static_fallback || items.circuit_breaker_tripped);
    }

    return false;
  } catch (err: any) {
    console.warn('[CircuitBreaker] Failed to inspect Edge Config flag, defaulting to active:', err?.message);
    return false;
  }
}

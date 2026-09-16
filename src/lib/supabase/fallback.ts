import { createClient } from '@supabase/supabase-js';

// Polyfill WebSocket in Node.js server/test runtime to prevent @supabase/realtime-js from crashing
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class DummyWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;
    readyState = 3;
    addEventListener() {}
    removeEventListener() {}
    send() {}
    close() {}
  } as any;
}

const PRIMARY_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const PRIMARY_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

/**
 * Enforces a strict timeout limit on asynchronous operations.
 * Defaults to 5000ms.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 5000,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } finally {
    clearTimeout(timeoutId!);
  }
}

/**
 * Formats a PostgreSQL connection string to use Supavisor connection pooler port (6543)
 * in transaction mode for serverless/edge environments.
 */
export function getSupavisorPoolerUrl(postgresConnectionString: string): string {
  if (!postgresConnectionString) return postgresConnectionString;
  try {
    // Check if it's a PostgreSQL connection URI (e.g. postgres:// or postgresql://)
    if (!postgresConnectionString.startsWith('postgres://') && !postgresConnectionString.startsWith('postgresql://')) {
      return postgresConnectionString;
    }
    const url = new URL(postgresConnectionString);
    // Switch port to 6543 for Supavisor transaction pooler if default 5432 or unassigned
    if (url.port === '5432' || !url.port) {
      url.port = '6543';
    }
    return url.toString();
  } catch {
    return postgresConnectionString;
  }
}

/**
 * Executes a query using the primary Supabase client.
 * If the primary operation fails or times out (5000ms limit), seamlessly falls back
 * to the fallback database client (e.g. Standby replica / Neon Postgres).
 */
export async function fetchWithFallback<T>(
  queryFn: (client: any) => Promise<T>,
  options: { timeoutMs?: number; fallbackUrl?: string; fallbackKey?: string; primaryClient?: any } = {}
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 5000;
  const fallbackUrl =
    options.fallbackUrl ||
    process.env.NEON_DATABASE_URL ||
    process.env.SUPABASE_FALLBACK_URL ||
    '';
  const fallbackKey = options.fallbackKey || PRIMARY_KEY;

  const primaryClient = options.primaryClient || (PRIMARY_URL && PRIMARY_KEY ? createClient(PRIMARY_URL, PRIMARY_KEY) : null);

  if (!primaryClient) {
    throw new Error('Supabase client or credentials (URL/Key) not configured.');
  }

  try {
    return await withTimeout(
      queryFn(primaryClient),
      timeoutMs,
      `Primary database query timed out after ${timeoutMs}ms`
    );
  } catch (error: any) {
    console.error(
      '[Supabase Fallback] Primary database failure, initiating fallback protocol...',
      error?.message || error
    );

    if (!fallbackUrl) {
      console.warn('[Supabase Fallback] No FALLBACK_URL / NEON_DATABASE_URL defined.');
      throw error;
    }

    try {
      const fallbackClient = createClient(fallbackUrl, fallbackKey);
      return await withTimeout(
        queryFn(fallbackClient),
        timeoutMs,
        `Fallback database query timed out after ${timeoutMs}ms`
      );
    } catch (fallbackError: any) {
      console.error(
        '[Supabase Fallback] Fallback database query failed:',
        fallbackError?.message || fallbackError
      );
      throw fallbackError;
    }
  }
}

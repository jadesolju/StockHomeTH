import { createClient, SupabaseClient } from '@supabase/supabase-js';

const PRIMARY_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const PRIMARY_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const FALLBACK_URL = process.env.NEON_DATABASE_URL || process.env.SUPABASE_FALLBACK_URL || '';

/**
 * Executes a Promise-returning function with a strict timeout.
 */
export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
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
 * Multi-Database Failover Pattern (Node.js / Next.js Edge & Server)
 * Attempts query using Primary Supabase Client. If failure or timeout occurs,
 * falls back to Standby Replica / Alternative Database (e.g. Neon Postgres).
 */
export async function fetchWithFallback<T>(
  queryFn: (client: SupabaseClient) => Promise<T>,
  options: { timeoutMs?: number } = {}
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 5000;
  const primaryClient = createClient(PRIMARY_URL, PRIMARY_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    return await withTimeout(queryFn(primaryClient), timeoutMs);
  } catch (error: any) {
    console.error('Primary database failure, initiating fallback protocol...', error?.message || error);

    if (!FALLBACK_URL) {
      console.warn('FALLBACK_URL (NEON_DATABASE_URL / SUPABASE_FALLBACK_URL) is not configured.');
      throw error;
    }

    try {
      const fallbackClient = createClient(FALLBACK_URL, PRIMARY_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      return await withTimeout(queryFn(fallbackClient), timeoutMs);
    } catch (fallbackError: any) {
      console.error('Fallback database operation also failed:', fallbackError?.message || fallbackError);
      throw fallbackError;
    }
  }
}

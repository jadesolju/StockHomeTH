const VALID_TICKER_REGEX = /^[A-Z0-9.\-=^]{1,20}$/i;
const ALLOWED_INTERVALS = new Set([
  '1m', '2m', '5m', '15m', '30m', '60m', '90m',
  '1h', '1d', '5d', '1wk', '1mo', '3mo'
]);

export function sanitizeSymbol(symbol: unknown): string | null {
  if (typeof symbol !== 'string') return null;
  const trimmed = symbol.trim().toUpperCase();
  if (!trimmed || !VALID_TICKER_REGEX.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export function sanitizeInterval(interval: unknown): string {
  if (typeof interval !== 'string') return '1d';
  const trimmed = interval.trim().toLowerCase();
  return ALLOWED_INTERVALS.has(trimmed) ? trimmed : '1d';
}

export function sanitizeWorkers(workers: unknown): number {
  const parsed = typeof workers === 'number' ? Math.floor(workers) : parseInt(String(workers), 10);
  if (isNaN(parsed) || parsed < 1) return 8;
  return Math.min(parsed, 32);
}

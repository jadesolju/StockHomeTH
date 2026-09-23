import { fetchLiveStocksFromYFinance, fetchSingleStockYFinance } from './yfinanceBridge';
import { fetchStockFromPool, StockPoolItem } from './stockPoolService';
import type { StockFundamental } from '../schemas/marketSchema';

export async function fetchLiveStockFundamentals(): Promise<StockFundamental[]> {
  return await fetchLiveStocksFromYFinance();
}

/**
 * Multi-Layer Resilient Stock Resolver:
 * Layer 1: Live Primary API (Yahoo Finance with 2.5s strict timeout)
 * Layer 2: StockHomeTH Supabase Persistent Pool (< 20ms)
 * Layer 3: In-Memory Pre-cached Universe (Zero Rejection Guarantee)
 */
export async function fetchStockMultiLayer(
  ticker: string,
  market?: string,
  forceLive = false
): Promise<StockPoolItem | null> {
  const cleanTicker = ticker.replace(/\.BK$/i, '').toUpperCase().trim();
  if (!cleanTicker) return null;

  // Layer 1: High-Speed Direct Live API Relay (5s timeout race for forceLive)
  try {
    const livePromise = fetchSingleStockYFinance(cleanTicker, market, forceLive);
    const timeoutDuration = forceLive ? 5000 : 2500;
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), timeoutDuration)
    );

    const liveResult = await Promise.race([livePromise, timeoutPromise]);
    if (liveResult && liveResult.price > 0) {
      return {
        ...liveResult,
        analysisStatus: 'completed',
        lastFetchedAt: new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn(`[stockDataService] Layer 1 live fetch failed for ${cleanTicker}:`, err);
  }

  // Layer 2: StockHomeTH Supabase Persistent Pool
  try {
    const poolResult = await fetchStockFromPool(cleanTicker);
    if (poolResult && poolResult.price > 0) {
      return poolResult;
    }
  } catch (err) {
    console.warn(`[stockDataService] Layer 2 pool fetch failed for ${cleanTicker}:`, err);
  }

  // Layer 3: Fallback through cached universe
  return await fetchSingleStockYFinance(cleanTicker, market, false);
}

export async function fetchStockByTicker(ticker: string, market?: string, forceLive = false): Promise<StockFundamental | null> {
  return await fetchStockMultiLayer(ticker, market, forceLive);
}

export async function fetchStocksParallel(symbols: string[], interval = '1d', workers = 8) {
  try {
    const symbolsParam = encodeURIComponent(symbols.join(','));
    const isClient = typeof window !== 'undefined';
    const baseUrl = isClient
      ? ''
      : (process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://127.0.0.1:3000'));
    
    const res = await fetch(`${baseUrl}/api/stocks/parallel?symbols=${symbolsParam}&interval=${interval}&workers=${workers}`, {
      next: { revalidate: 30 }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[stockDataService] Parallel fetch error:', err);
  }
  return null;
}



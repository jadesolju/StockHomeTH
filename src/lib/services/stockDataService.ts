import { fetchLiveStocksFromYFinance, fetchSingleStockYFinance } from './yfinanceBridge';
import type { StockFundamental } from '../schemas/marketSchema';

export async function fetchLiveStockFundamentals(): Promise<StockFundamental[]> {
  return await fetchLiveStocksFromYFinance();
}

export async function fetchStockByTicker(ticker: string, market?: string, forceLive = false): Promise<StockFundamental | null> {
  return await fetchSingleStockYFinance(ticker, market, forceLive);
}

export async function fetchStocksParallel(symbols: string[], interval = '1d', workers = 8) {
  try {
    const symbolsParam = encodeURIComponent(symbols.join(','));
    const res = await fetch(`http://localhost:3000/api/stocks/parallel?symbols=${symbolsParam}&interval=${interval}&workers=${workers}`, {
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


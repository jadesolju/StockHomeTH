import { fetchLiveStocksFromYFinance, fetchSingleStockYFinance } from './yfinanceBridge';
import type { StockFundamental } from '../schemas/marketSchema';

export async function fetchLiveStockFundamentals(): Promise<StockFundamental[]> {
  return await fetchLiveStocksFromYFinance();
}

export async function fetchStockByTicker(ticker: string): Promise<StockFundamental | null> {
  return await fetchSingleStockYFinance(ticker);
}

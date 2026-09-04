'use server';

import { fetchLiveStockFundamentals } from '../services/stockDataService';
import type { StockFundamental } from '../schemas/marketSchema';

export async function getLiveStocksAction(): Promise<StockFundamental[]> {
  return await fetchLiveStockFundamentals();
}

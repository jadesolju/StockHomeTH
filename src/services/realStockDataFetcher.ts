import type { StockFundamentalData } from '../data/fullMarketStocks';
import { fullMarketStocks } from '../data/fullMarketStocks';

// Use Vite's same-origin proxy locally, avoiding localhost/IPv6 and CORS mismatches.
const BACKEND_API_URL = '/api/stocks/live';

export const realStockDataFetcher = {
  /** Fetch live stocks from Express backend, fallback to static data gracefully */
  async fetchLiveStocks(): Promise<StockFundamentalData[]> {
    try {
      const response = await fetch(BACKEND_API_URL, {
        signal: AbortSignal.timeout(6000), // 6 sec timeout
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        const json = await response.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          // Map backend payload to StockFundamentalData shape
          return json.data.map((s: Record<string, unknown>): StockFundamentalData => ({
            ticker:         String(s.ticker        ?? ''),
            name:           String(s.name          ?? ''),
            market:         (s.market as 'SET' | 'US') ?? 'US',
            sector:         String(s.sector        ?? 'General'),
            price:          Number(s.price         ?? 0),
            currency:       String(s.currency      ?? 'USD'),
            change:         Number(s.change        ?? 0),
            marketCap:      String(s.marketCap     ?? '—'),
            peRatio:        Number(s.peRatio       ?? 0),
            dividendYield:  Number(s.dividendYield ?? 0),
            high52w:        Number(s.high52w       ?? 0),
            low52w:         Number(s.low52w        ?? 0),
            volume:         String(s.volume        ?? '—'),
            sparkline7d:    Array.isArray(s.sparkline7d) ? (s.sparkline7d as number[]) : [0, 0],
            analystRating:  String(s.analystRating ?? 'Hold') as StockFundamentalData['analystRating'],
            targetPrice:    Number(s.targetPrice   ?? 0),
            sentimentScore: Number(s.sentimentScore ?? 50),
            aiInsight:      String(s.aiInsight     ?? ''),
            description:    String(s.description   ?? ''),
          }));
        }
      }
    } catch (err) {
      console.warn('[realStockDataFetcher] Backend offline — using static fallback dataset:', err);
    }

    // Graceful fallback to rich static dataset
    return fullMarketStocks;
  },
};

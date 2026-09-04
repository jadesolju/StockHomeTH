import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { StockFundamentalSchema, type StockFundamental } from '../schemas/marketSchema';
import { fullMarketStocks } from '../../data/fullMarketStocks';

const execAsync = promisify(exec);

// In-memory cache for fast SSR
let cachedStocks: StockFundamental[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000; // 60 seconds

export async function fetchLiveStocksFromYFinance(): Promise<StockFundamental[]> {
  const now = Date.now();
  if (cachedStocks && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedStocks;
  }

  try {
    const scriptPath = path.resolve(process.cwd(), 'server', 'yfinance_engine.py');
    // Try executing python via py or direct python executable
    const pythonCmd = `py "${scriptPath}" --action stocks`;

    const { stdout } = await execAsync(pythonCmd, { timeout: 25000 });
    const json = JSON.parse(stdout.trim());

    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
      const validated = json.data
        .map((item: unknown) => {
          try {
            return StockFundamentalSchema.parse(item);
          } catch {
            return null;
          }
        })
        .filter((i: StockFundamental | null): i is StockFundamental => i !== null);

      if (validated.length > 0) {
        cachedStocks = validated;
        cacheTimestamp = now;
        return validated;
      }
    }
  } catch (err) {
    console.warn('[yfinanceBridge] Python yfinance engine warning, attempting Google Finance fallback:', err);
    try {
      const gfScriptPath = path.resolve(process.cwd(), 'server', 'google_finance_engine.py');
      const gfCmd = `py "${gfScriptPath}" --action stocks`;
      const { stdout } = await execAsync(gfCmd, { timeout: 15000 });
      const json = JSON.parse(stdout.trim());
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        const validated = json.data
          .map((item: unknown) => {
            try {
              return StockFundamentalSchema.parse(item);
            } catch {
              return null;
            }
          })
          .filter((i: StockFundamental | null): i is StockFundamental => i !== null);
        if (validated.length > 0) {
          cachedStocks = validated;
          cacheTimestamp = now;
          return validated;
        }
      }
    } catch (gfErr) {
      console.warn('[yfinanceBridge] Google Finance fallback error:', gfErr);
    }
  }

  // If both live engines had an issue, fallback to full static verified set
  return fullMarketStocks.map((s) => StockFundamentalSchema.parse(s));
}

export async function fetchSingleStockYFinance(symbol: string): Promise<StockFundamental | null> {
  try {
    const scriptPath = path.resolve(process.cwd(), 'server', 'yfinance_engine.py');
    const pythonCmd = `py "${scriptPath}" --action single --symbol "${symbol}"`;
    const { stdout } = await execAsync(pythonCmd, { timeout: 10000 });
    const json = JSON.parse(stdout.trim());
    if (json.success && json.data) {
      return StockFundamentalSchema.parse(json.data);
    }
  } catch (err) {
    console.error(`[yfinanceBridge] Error querying symbol ${symbol}:`, err);
  }
  return null;
}

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { StockFundamentalSchema, type StockFundamental } from '../schemas/marketSchema';
import { fullMarketStocks } from '../../data/fullMarketStocks';

const execAsync = promisify(exec);

// In-memory cache for ultra-fast response
let cachedStocks: StockFundamental[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30_000; // 30 seconds
let isRefreshingBackground = false;
let activePythonCmd: string | null = null;

async function detectPythonCommand(): Promise<string> {
  if (activePythonCmd) return activePythonCmd;

  const candidates = ['py -3.11', 'py', 'python'];
  for (const cmd of candidates) {
    try {
      const { stdout } = await execAsync(`${cmd} -c "import yfinance, sys; print('OK')"`, { timeout: 3000 });
      if (stdout.includes('OK')) {
        activePythonCmd = cmd;
        return cmd;
      }
    } catch {
      // Continue to next candidate
    }
  }
  return 'py';
}

function loadMarketCacheFile(): StockFundamental[] | null {
  try {
    const cwd = process.cwd();
    const cachePath = path.resolve(cwd, 'market_cache.json');
    if (fs.existsSync(cachePath)) {
      const raw = fs.readFileSync(cachePath, 'utf-8');
      const json = JSON.parse(raw);
      const rawList = Array.isArray(json) ? json : Array.isArray(json.data) ? json.data : null;

      if (rawList && rawList.length > 0) {
        const validated = rawList
          .map((item: unknown) => {
            try {
              return StockFundamentalSchema.parse(item);
            } catch {
              return null;
            }
          })
          .filter((i: StockFundamental | null): i is StockFundamental => i !== null);

        if (validated.length > 0) {
          return validated;
        }
      }
    }
  } catch (err) {
    console.warn('[yfinanceBridge] market_cache.json read warning:', err);
  }
  return null;
}

async function triggerBackgroundRefresh() {
  if (isRefreshingBackground || process.env.VERCEL === '1') return;
  isRefreshingBackground = true;
  try {
    const pyCmd = await detectPythonCommand();
    const scriptPath = path.resolve(process.cwd(), 'server', 'yfinance_engine.py');
    const pythonCmd = `${pyCmd} "${scriptPath}" --action stocks`;

    const { stdout } = await execAsync(pythonCmd, { timeout: 20000 });
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
        cacheTimestamp = Date.now();
      }
    }
  } catch (err) {
    console.warn('[yfinanceBridge] Background refresh warning:', err);
  } finally {
    isRefreshingBackground = false;
  }
}

async function loadSupabaseStocks(): Promise<StockFundamental[] | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vxfyflltpdqkddnmpwdg.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_4uyj29eoy8YuXHj4sCejPg_gEcfN1AM';
    if (!supabaseUrl || !supabaseKey) return null;

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .eq('is_active', true)
      .limit(2000);

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((item: any) => ({
        ticker: item.ticker,
        name: item.name,
        market: item.market,
        sector: item.sector || 'General',
        price: Number(item.price) || 0,
        currency: item.currency || 'THB',
        change: Number(item.change) || 0,
        marketCap: item.market_cap || '-',
        peRatio: item.pe_ratio != null ? Number(item.pe_ratio) : 0,
        dividendYield: item.dividend_yield != null ? Number(item.dividend_yield) : 0,
        high52w: item.high_52w != null ? Number(item.high_52w) : 0,
        low52w: item.low_52w != null ? Number(item.low_52w) : 0,
        volume: item.volume || '-',
        aiInsight: item.ai_insight || '',
        description: item.description || '',
        sparkline7d: Array.isArray(item.sparkline_7d) ? item.sparkline_7d : [],
        analystRating: item.analyst_rating || 'Hold',
        targetPrice: item.target_price != null ? Number(item.target_price) : 0,
        sentimentScore: item.sentiment_score != null ? Number(item.sentiment_score) : 50
      }));
    }
  } catch (err) {
    console.warn('[yfinanceBridge] Supabase stocks read warning:', err);
  }
  return null;
}

export async function fetchLiveStocksFromYFinance(): Promise<StockFundamental[]> {
  const now = Date.now();

  // 1. In-memory hot cache
  if (cachedStocks && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedStocks;
  }

  // 2. Disk cache file (generated by yfinance engine on local runtime)
  const fileData = loadMarketCacheFile();
  if (fileData && fileData.length > 0) {
    cachedStocks = fileData;
    cacheTimestamp = now;
    if (now - cacheTimestamp >= CACHE_TTL_MS) {
      triggerBackgroundRefresh().catch(() => {});
    }
    return fileData;
  }

  // 3. Supabase Cloud Database (Primary persistent source on Vercel / Cloud)
  const supabaseData = await loadSupabaseStocks();
  if (supabaseData && supabaseData.length > 0) {
    cachedStocks = supabaseData;
    cacheTimestamp = now;
    return supabaseData;
  }

  // 4. Fallback to comprehensive static catalog
  const fallback = fullMarketStocks.map((s) => StockFundamentalSchema.parse(s));
  cachedStocks = fallback;
  cacheTimestamp = now;

  triggerBackgroundRefresh().catch(() => {});

  return fallback;
}

function parseLastJsonLine(output: string): any {
  const lines = output.trim().split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.startsWith('{') && line.endsWith('}')) {
      try {
        return JSON.parse(line);
      } catch {
        // Continue to next line
      }
    }
  }
  return JSON.parse(output.trim());
}

export async function fetchSingleStockYFinance(symbol: string, market?: string, forceLive = false): Promise<StockFundamental | null> {
  const cleanSym = symbol.replace('.BK', '').toUpperCase();

  // 1. Fast Cache Check (< 1ms): Return immediately if already in hot memory or market cache
  if (!forceLive) {
    const cacheList = cachedStocks || loadMarketCacheFile();
    if (cacheList && cacheList.length > 0) {
      const match = cacheList.find(
        (s) => s.ticker.toUpperCase() === cleanSym && (!market || market === 'ALL' || s.market.toUpperCase() === market.toUpperCase())
      );
      if (match) return match;
    }
  }

  // 2. Query Yahoo Finance & Webull via Python Engine for live market quote (Local runtime only)
  if (process.env.VERCEL !== '1') {
    try {
      const pyCmd = await detectPythonCommand();
      const scriptPath = path.resolve(process.cwd(), 'server', 'yfinance_engine.py');
      const marketFlag = market && market !== 'ALL' ? `--market "${market}"` : '--market "auto"';
      const pythonCmd = `${pyCmd} "${scriptPath}" --action single --symbol "${cleanSym}" ${marketFlag}`;
      const { stdout } = await execAsync(pythonCmd, { timeout: 8000 });
      const json = parseLastJsonLine(stdout);
      if (json && json.success && json.data) {
        const parsed = StockFundamentalSchema.parse(json.data);
        if (cachedStocks) {
          const existingIdx = cachedStocks.findIndex((s) => s.ticker.toUpperCase() === cleanSym);
          if (existingIdx >= 0) {
            cachedStocks[existingIdx] = parsed;
          } else {
            cachedStocks.unshift(parsed);
          }
        }
        return parsed;
      }
    } catch (err) {
      console.warn(`[yfinanceBridge] Live ticker query warning for ${cleanSym}:`, err);
    }
  }

  // 3. Fallback search in memory cache or disk cache if live fetch timed out
  const cacheList = cachedStocks || loadMarketCacheFile();
  if (cacheList && cacheList.length > 0) {
    const match = cacheList.find((s) => s.ticker.toUpperCase() === cleanSym);
    if (match) return match;
  }

  // Symbol does not exist or has no active trading data
  return null;
}

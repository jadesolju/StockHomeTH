import path from 'path';
import fs from 'fs';

export interface SupabaseStockRow {
  ticker: string;
  symbol: string;
  name: string;
  market: 'SET' | 'US';
  sector: string;
  price: number;
  currency: 'THB' | 'USD';
  change: number;
  change_amount: number;
  market_cap: string;
  pe_ratio: number;
  dividend_yield: number;
  high52w: number;
  low52w: number;
  volume: string;
  sparkline_7d: number[];
  analyst_rating: string;
  target_price: number;
  sentiment_score: number;
  ai_insight: string;
  description: string;
  is_active: boolean;
  updated_at: string;
}

interface RawStockRecord {
  ticker: string;
  symbol?: string;
  name?: string;
  market?: string;
  sector?: string;
  price?: number | string;
  change?: number | string;
  changeAmount?: number | string;
  marketCap?: string;
  market_cap?: string;
  peRatio?: number | string;
  pe_ratio?: number | string;
  dividendYield?: number | string;
  dividend_yield?: number | string;
  high52w?: number | string;
  low52w?: number | string;
  volume?: string;
  sparkline7d?: number[];
  sparkline_7d?: number[];
  analystRating?: string;
  analyst_rating?: string;
  targetPrice?: number | string;
  target_price?: number | string;
  sentimentScore?: number;
  sentiment_score?: number;
  aiInsight?: string;
  ai_insight?: string;
  description?: string;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://vxfyflltpdqkddnmpwdg.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_4uyj29eoy8YuXHj4sCejPg_gEcfN1AM';

async function upsertToSupabaseRest(batch: SupabaseStockRow[]): Promise<boolean> {
  const endpoint = `${SUPABASE_URL}/rest/v1/stocks?on_conflict=ticker`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify(batch),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return true;
}

export async function syncAllStocksToSupabase(limitPerMarket?: number): Promise<{ success: boolean; message: string; count: number; durationMs: number }> {
  const tStart = Date.now();
  const cwd = process.cwd();

  const thaiPath = path.resolve(cwd, 'server', 'data', 'thai_stocks.json');
  const usPath = path.resolve(cwd, 'server', 'data', 'us_stocks.json');
  const cachePath = path.resolve(cwd, 'market_cache.json');

  const stocksToUpsert: SupabaseStockRow[] = [];
  const cacheMap: Record<string, RawStockRecord> = {};

  if (fs.existsSync(cachePath)) {
    try {
      const rawCache = fs.readFileSync(cachePath, 'utf-8');
      const parsedCache = JSON.parse(rawCache) as { data?: RawStockRecord[] } | RawStockRecord[];
      const cacheList = Array.isArray(parsedCache) ? parsedCache : Array.isArray(parsedCache.data) ? parsedCache.data : [];
      for (const item of cacheList) {
        if (item.ticker && item.price !== undefined && item.price !== null && Number(item.price) > 0) {
          cacheMap[item.ticker] = item;
        }
      }
    } catch {}
  }

  // 1. Load Thai Stocks
  if (fs.existsSync(thaiPath)) {
    try {
      const raw = fs.readFileSync(thaiPath, 'utf-8');
      const parsed = JSON.parse(raw) as { stocks?: RawStockRecord[] } | RawStockRecord[];
      const thaiList = Array.isArray(parsed) ? parsed : Array.isArray(parsed.stocks) ? parsed.stocks : [];
      const selected = limitPerMarket ? thaiList.slice(0, limitPerMarket) : thaiList;
      for (const s of selected) {
        const cached = cacheMap[s.ticker];
        const price = cached && Number(cached.price) > 0 ? Number(cached.price) : Number(s.price || 0);
        const change = cached && cached.change !== undefined ? Number(cached.change) : Number(s.change || 0);

        stocksToUpsert.push({
          ticker: s.ticker,
          symbol: s.symbol || s.ticker,
          name: s.name || s.ticker,
          market: 'SET',
          sector: s.sector || 'General',
          price,
          currency: 'THB',
          change,
          change_amount: Number(s.changeAmount || 0),
          market_cap: s.marketCap || s.market_cap || '-',
          pe_ratio: Number(s.peRatio || s.pe_ratio || 0),
          dividend_yield: Number(s.dividendYield || s.dividend_yield || 0),
          high52w: Number(s.high52w || price),
          low52w: Number(s.low52w || price),
          volume: s.volume || '-',
          sparkline_7d: Array.isArray(s.sparkline7d) ? s.sparkline7d : [],
          analyst_rating: s.analystRating || s.analyst_rating || 'Hold',
          target_price: Number(s.targetPrice || s.target_price || price),
          sentiment_score: Number(s.sentimentScore || s.sentiment_score || 0.5),
          ai_insight: s.aiInsight || s.ai_insight || `สรุปข้อมูลพื้นฐานของ ${s.name || s.ticker}`,
          description: s.description || '',
          is_active: true,
          updated_at: new Date().toISOString(),
        });
      }
    } catch {}
  }

  // 2. Load US Stocks
  if (fs.existsSync(usPath)) {
    try {
      const raw = fs.readFileSync(usPath, 'utf-8');
      const parsed = JSON.parse(raw) as { stocks?: RawStockRecord[] } | RawStockRecord[];
      const usList = Array.isArray(parsed) ? parsed : Array.isArray(parsed.stocks) ? parsed.stocks : [];
      const selected = limitPerMarket ? usList.slice(0, limitPerMarket) : usList;
      for (const s of selected) {
        const cached = cacheMap[s.ticker];
        const price = cached && Number(cached.price) > 0 ? Number(cached.price) : Number(s.price || 0);
        const change = cached && cached.change !== undefined ? Number(cached.change) : Number(s.change || 0);

        stocksToUpsert.push({
          ticker: s.ticker,
          symbol: s.symbol || s.ticker,
          name: s.name || s.ticker,
          market: 'US',
          sector: s.sector || 'US Equities',
          price,
          currency: 'USD',
          change,
          change_amount: Number(s.changeAmount || 0),
          market_cap: s.marketCap || s.market_cap || '-',
          pe_ratio: Number(s.peRatio || s.pe_ratio || 0),
          dividend_yield: Number(s.dividendYield || s.dividend_yield || 0),
          high52w: Number(s.high52w || price),
          low52w: Number(s.low52w || price),
          volume: s.volume || '-',
          sparkline_7d: Array.isArray(s.sparkline7d) ? s.sparkline7d : [],
          analyst_rating: s.analystRating || s.analyst_rating || 'Hold',
          target_price: Number(s.targetPrice || s.target_price || price),
          sentiment_score: Number(s.sentimentScore || s.sentiment_score || 0.5),
          ai_insight: s.aiInsight || s.ai_insight || `Fundamental market profile for ${s.name || s.ticker}`,
          description: s.description || '',
          is_active: true,
          updated_at: new Date().toISOString(),
        });
      }
    } catch {}
  }

  // Batch upsert (chunks of 250)
  const chunkSize = 250;
  let successCount = 0;
  for (let i = 0; i < stocksToUpsert.length; i += chunkSize) {
    const chunk = stocksToUpsert.slice(i, i + chunkSize);
    await upsertToSupabaseRest(chunk);
    successCount += chunk.length;
  }

  const durationMs = Date.now() - tStart;
  return {
    success: true,
    message: `Successfully synced ${successCount} stocks to Supabase Cloud Database.`,
    count: successCount,
    durationMs,
  };
}

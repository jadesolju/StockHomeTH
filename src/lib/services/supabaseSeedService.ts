import path from 'path';
import fs from 'fs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://vxfyflltpdqkddnmpwdg.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_4uyj29eoy8YuXHj4sCejPg_gEcfN1AM';

async function upsertToSupabaseRest(batch: any[]) {
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

  const stocksToUpsert: any[] = [];
  let cacheMap: Record<string, any> = {};

  if (fs.existsSync(cachePath)) {
    try {
      const rawCache = fs.readFileSync(cachePath, 'utf-8');
      const parsedCache = JSON.parse(rawCache);
      const cacheList = Array.isArray(parsedCache.data) ? parsedCache.data : Array.isArray(parsedCache) ? parsedCache : [];
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
      const parsed = JSON.parse(raw);
      const thaiList = Array.isArray(parsed.stocks) ? parsed.stocks : Array.isArray(parsed) ? parsed : [];
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
          change_amount: s.changeAmount || 0,
          market_cap: s.marketCap || 'N/A',
          pe_ratio: s.peRatio || 0,
          dividend_yield: s.dividendYield || 0,
          high52w: s.high52w || price,
          low52w: s.low52w || price,
          volume: s.volume || 'N/A',
          sparkline_7d: s.sparkline7d || [],
          analyst_rating: s.analystRating || 'Hold',
          target_price: s.targetPrice || price,
          sentiment_score: s.sentimentScore || 0.5,
          ai_insight: s.aiInsight || `สรุปข้อมูลพื้นฐานของ ${s.name || s.ticker}`,
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
      const parsed = JSON.parse(raw);
      const usList = Array.isArray(parsed.stocks) ? parsed.stocks : Array.isArray(parsed) ? parsed : [];
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
          change_amount: s.changeAmount || 0,
          market_cap: s.marketCap || 'N/A',
          pe_ratio: s.peRatio || 0,
          dividend_yield: s.dividendYield || 0,
          high52w: s.high52w || price,
          low52w: s.low52w || price,
          volume: s.volume || 'N/A',
          sparkline_7d: s.sparkline7d || [],
          analyst_rating: s.analystRating || 'Hold',
          target_price: s.targetPrice || price,
          sentiment_score: s.sentimentScore || 0.5,
          ai_insight: s.aiInsight || `Fundamental market profile for ${s.name || s.ticker}`,
          description: s.description || '',
          is_active: true,
          updated_at: new Date().toISOString(),
        });
      }
    } catch {}
  }

  // Batch upsert (chunks of 200)
  const chunkSize = 200;
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

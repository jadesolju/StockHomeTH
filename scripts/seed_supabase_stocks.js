import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vxfyflltpdqkddnmpwdg.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_4uyj29eoy8YuXHj4sCejPg_gEcfN1AM';

async function upsertToSupabaseRest(batch) {
  const endpoint = `${SUPABASE_URL}/rest/v1/stocks?on_conflict=ticker`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(batch)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return true;
}

async function seedStocks() {
  console.log(`🚀 Connecting to Supabase REST: ${SUPABASE_URL}`);
  
  const thaiPath = path.resolve(rootDir, 'server', 'data', 'thai_stocks.json');
  const usPath = path.resolve(rootDir, 'server', 'data', 'us_stocks.json');
  
  const stocksToUpsert = [];

  // Load live cache data to merge prices
  const cachePath = path.resolve(rootDir, 'market_cache.json');
  let cacheMap = {};
  if (fs.existsSync(cachePath)) {
    try {
      const rawCache = fs.readFileSync(cachePath, 'utf-8');
      const cacheData = JSON.parse(rawCache);
      const list = Array.isArray(cacheData) ? cacheData : cacheData.data || [];
      for (const item of list) {
        if (item.ticker && item.market) {
          cacheMap[`${item.market}-${item.ticker}`] = item;
        }
      }
      console.log(`🧠 Loaded ${Object.keys(cacheMap).length} live stocks from market_cache.json`);
    } catch (e) {
      console.warn('Could not read market_cache.json:', e.message);
    }
  }

  // 1. Read Thai Stocks
  if (fs.existsSync(thaiPath)) {
    const raw = fs.readFileSync(thaiPath, 'utf-8');
    const data = JSON.parse(raw);
    const list = Array.isArray(data) ? data : data.stocks || [];
    console.log(`📦 Loaded ${list.length} Thai stocks from ${thaiPath}`);
    for (const s of list) {
      const ticker = s.ticker || s.symbol?.replace('.BK', '');
      const live = cacheMap[`SET-${ticker}`] || {};
      
      stocksToUpsert.push({
        ticker: ticker,
        name: live.name || s.name || ticker,
        market: 'SET',
        sector: live.sector || s.sector || 'General',
        price: Number(live.price || s.price) || 0,
        currency: live.currency || 'THB',
        change: Number(live.change || s.change) || 0,
        market_cap: live.marketCap || s.marketCap || s.market_cap || '-',
        pe_ratio: Number(live.peRatio || s.peRatio || s.pe_ratio) || null,
        dividend_yield: Number(live.dividendYield || s.dividendYield || s.dividend_yield) || null,
        high_52w: Number(live.high52w || s.high52w || s.high_52w) || null,
        low_52w: Number(live.low52w || s.low52w || s.low_52w) || null,
        volume: live.volume || s.volume || '-',
        ai_insight: live.aiInsight || s.aiInsight || s.ai_insight || null,
        description: live.description || s.description || null,
        sparkline_7d: live.sparkline7d || s.sparkline7d || s.sparkline_7d || [],
        analyst_rating: live.analystRating || s.analystRating || s.analyst_rating || 'Hold',
        target_price: Number(live.targetPrice || s.targetPrice || s.target_price) || null,
        sentiment_score: Number(live.sentimentScore || s.sentimentScore || s.sentiment_score) || 50,
        is_active: true,
        updated_at: new Date().toISOString()
      });
    }
  }

  // 2. Read US Stocks
  if (fs.existsSync(usPath)) {
    const raw = fs.readFileSync(usPath, 'utf-8');
    const data = JSON.parse(raw);
    const list = Array.isArray(data) ? data : data.stocks || [];
    console.log(`📦 Loaded ${list.length} US stocks from ${usPath}`);
    for (const s of list) {
      const ticker = s.ticker || s.symbol;
      const live = cacheMap[`US-${ticker}`] || {};
      
      stocksToUpsert.push({
        ticker: ticker,
        name: live.name || s.name || ticker,
        market: 'US',
        sector: live.sector || s.sector || 'General',
        price: Number(live.price || s.price) || 0,
        currency: live.currency || 'USD',
        change: Number(live.change || s.change) || 0,
        market_cap: live.marketCap || s.marketCap || s.market_cap || '-',
        pe_ratio: Number(live.peRatio || s.peRatio || s.pe_ratio) || null,
        dividend_yield: Number(live.dividendYield || s.dividendYield || s.dividend_yield) || null,
        high_52w: Number(live.high52w || s.high52w || s.high_52w) || null,
        low_52w: Number(live.low52w || s.low52w || s.low_52w) || null,
        volume: live.volume || s.volume || '-',
        ai_insight: live.aiInsight || s.aiInsight || s.ai_insight || null,
        description: live.description || s.description || null,
        sparkline_7d: live.sparkline7d || s.sparkline7d || s.sparkline_7d || [],
        analyst_rating: live.analystRating || s.analystRating || s.analyst_rating || 'Hold',
        target_price: Number(live.targetPrice || s.targetPrice || s.target_price) || null,
        sentiment_score: Number(live.sentimentScore || s.sentimentScore || s.sentiment_score) || 50,
        is_active: true,
        updated_at: new Date().toISOString()
      });
    }
  }

  console.log(`⚡ Total stocks prepared: ${stocksToUpsert.length}`);

  // Batch Upsert (250 at a time) via Supabase REST
  const batchSize = 250;
  let successCount = 0;
  for (let i = 0; i < stocksToUpsert.length; i += batchSize) {
    const batch = stocksToUpsert.slice(i, i + batchSize);
    try {
      await upsertToSupabaseRest(batch);
      successCount += batch.length;
      console.log(`✅ Synced batch ${Math.floor(i / batchSize) + 1} (${successCount}/${stocksToUpsert.length})`);
    } catch (err) {
      console.warn(`⚠️ Batch ${Math.floor(i / batchSize) + 1} warning:`, err.message);
    }
  }

  console.log(`\n🎉 Completed syncing ${successCount} stocks to Supabase Cloud!`);
}

seedStocks().catch(console.error);

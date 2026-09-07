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

  // 1. Read Thai Stocks
  if (fs.existsSync(thaiPath)) {
    const raw = fs.readFileSync(thaiPath, 'utf-8');
    const data = JSON.parse(raw);
    const list = Array.isArray(data) ? data : data.stocks || [];
    console.log(`📦 Loaded ${list.length} Thai stocks from ${thaiPath}`);
    for (const s of list) {
      stocksToUpsert.push({
        ticker: s.ticker || s.symbol?.replace('.BK', ''),
        name: s.name || s.ticker,
        market: 'SET',
        sector: s.sector || 'General',
        price: Number(s.price) || 0,
        currency: 'THB',
        change: Number(s.change) || 0,
        market_cap: s.marketCap || s.market_cap || '-',
        pe_ratio: Number(s.peRatio || s.pe_ratio) || null,
        dividend_yield: Number(s.dividendYield || s.dividend_yield) || null,
        high_52w: Number(s.high52w || s.high_52w) || null,
        low_52w: Number(s.low52w || s.low_52w) || null,
        volume: s.volume || '-',
        ai_insight: s.aiInsight || s.ai_insight || null,
        description: s.description || null,
        sparkline_7d: s.sparkline7d || s.sparkline_7d || [],
        analyst_rating: s.analystRating || s.analyst_rating || 'Hold',
        target_price: Number(s.targetPrice || s.target_price) || null,
        sentiment_score: Number(s.sentimentScore || s.sentiment_score) || 50,
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
      stocksToUpsert.push({
        ticker: s.ticker || s.symbol,
        name: s.name || s.ticker,
        market: 'US',
        sector: s.sector || 'General',
        price: Number(s.price) || 0,
        currency: 'USD',
        change: Number(s.change) || 0,
        market_cap: s.marketCap || s.market_cap || '-',
        pe_ratio: Number(s.peRatio || s.pe_ratio) || null,
        dividend_yield: Number(s.dividendYield || s.dividend_yield) || null,
        high_52w: Number(s.high52w || s.high_52w) || null,
        low_52w: Number(s.low52w || s.low_52w) || null,
        volume: s.volume || '-',
        ai_insight: s.aiInsight || s.ai_insight || null,
        description: s.description || null,
        sparkline_7d: s.sparkline7d || s.sparkline_7d || [],
        analyst_rating: s.analystRating || s.analyst_rating || 'Hold',
        target_price: Number(s.targetPrice || s.target_price) || null,
        sentiment_score: Number(s.sentimentScore || s.sentiment_score) || 50,
        is_active: true,
        updated_at: new Date().toISOString()
      });
    }
  }

  console.log(`⚡ Total stocks prepared: ${stocksToUpsert.length}`);

  // Batch Upsert (50 at a time) via Supabase REST
  const batchSize = 50;
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

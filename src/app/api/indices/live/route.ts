import { NextResponse } from 'next/server';
import { mockMarketIndices } from '../../../../data/mockMarketData';

let cachedPayload: any = null;
let cacheTime = 0;
const CACHE_TTL_MS = 60_000; // 60 seconds

const MAJOR_INDEX_DEFINITIONS = [
  { s: '^SET.BK', name: 'SET Index', c: 'THB', cat: 'index', country: 'TH' },
  { s: '^GSPC', name: 'S&P 500', c: 'USD', cat: 'index', country: 'US' },
  { s: '^IXIC', name: 'NASDAQ', c: 'USD', cat: 'index', country: 'US' },
  { s: '^DJI', name: 'Dow Jones', c: 'USD', cat: 'index', country: 'US' },
  { s: 'GC=F', name: 'Gold Spot', c: 'USD', cat: 'commodity', country: 'GLOBAL' },
  { s: 'CL=F', name: 'Crude Oil WTI', c: 'USD', cat: 'commodity', country: 'GLOBAL' },
  { s: 'BTC-USD', name: 'Bitcoin', c: 'USD', cat: 'crypto', country: 'GLOBAL' }
];

async function fetchLiveIndicesFromYahoo(): Promise<any[] | null> {
  try {
    const results = await Promise.all(
      MAJOR_INDEX_DEFINITIONS.map(async (item) => {
        try {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.s)}?interval=1d&range=5d`;
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3500);

          const res = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            signal: controller.signal,
            next: { revalidate: 60 }
          });
          clearTimeout(timeout);

          if (!res.ok) return null;
          const json = await res.json();
          const meta = json?.chart?.result?.[0]?.meta;
          if (!meta) return null;

          const price = meta.regularMarketPrice;
          const prev = meta.chartPreviousClose || meta.previousClose || price;
          const change = price - prev;
          const changePercent = prev !== 0 ? (change / prev) * 100 : 0;

          return {
            symbol: item.s,
            name: item.name,
            price: Number(price.toFixed(2)),
            change: Number(change.toFixed(2)),
            changePercent: Number(changePercent.toFixed(2)),
            currency: item.c,
            category: item.cat,
            country: item.country,
            high52w: meta.fiftyTwoWeekHigh || price,
            low52w: meta.fiftyTwoWeekLow || price,
            timestamp: new Date().toISOString()
          };
        } catch {
          return null;
        }
      })
    );

    const valid = results.filter((r): r is NonNullable<typeof r> => r !== null);
    if (valid.length > 0) return valid;
  } catch {}
  return null;
}

export async function GET() {
  const now = Date.now();
  if (cachedPayload && now - cacheTime < CACHE_TTL_MS) {
    return NextResponse.json({
      success: true,
      source: 'cache',
      data: cachedPayload.data,
      indices: cachedPayload.indices,
      commodities: cachedPayload.commodities,
      timestamp: new Date(cacheTime).toISOString()
    });
  }

  // 1. Direct Cloud-Native HTTP Fetch from Yahoo Finance (Zero Python, 100% Vercel compatible)
  const liveData = await fetchLiveIndicesFromYahoo();
  if (liveData && liveData.length > 0) {
    const indices = liveData.filter((d) => d.category === 'index');
    const commodities = liveData.filter((d) => d.category !== 'index');

    cachedPayload = {
      data: liveData,
      indices,
      commodities
    };
    cacheTime = now;

    return NextResponse.json({
      success: true,
      source: 'live',
      count: liveData.length,
      data: liveData,
      indices,
      commodities,
      timestamp: new Date().toISOString()
    });
  }

  // 2. Fallback to cached payload or static data
  if (cachedPayload) {
    return NextResponse.json({
      success: true,
      source: 'stale_cache',
      data: cachedPayload.data,
      indices: cachedPayload.indices,
      commodities: cachedPayload.commodities,
      timestamp: new Date().toISOString()
    });
  }

  return NextResponse.json({
    success: true,
    source: 'fallback',
    data: mockMarketIndices,
    timestamp: new Date().toISOString()
  });
}

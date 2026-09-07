import { NextResponse } from 'next/server';
import { mockMarketIndices } from '../../../../data/mockMarketData';

let cachedPayload: any = null;
let cacheTime = 0;
const CACHE_TTL_MS = 60_000; // 60 seconds

interface IndexItem {
  symbol: string;
  name: string;
  value: number;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  category: string;
  country: string;
  region: string;
  isPositive: boolean;
  sparklineData: number[];
  high52w?: number;
  low52w?: number;
  sellPrice?: number;
  buyPrice?: number;
  lastUpdated: string;
  timestamp: string;
}

const MAJOR_INDEX_DEFINITIONS = [
  { s: '^SET.BK', name: 'SET Index', c: 'THB', cat: 'index', country: 'TH' },
  { s: '^GSPC', name: 'S&P 500', c: 'USD', cat: 'index', country: 'US' },
  { s: '^IXIC', name: 'NASDAQ', c: 'USD', cat: 'index', country: 'US' },
  { s: '^DJI', name: 'Dow Jones', c: 'USD', cat: 'index', country: 'US' },
  { s: 'GC=F', name: 'Gold Spot', c: 'USD', cat: 'commodity', country: 'GLOBAL' },
  { s: 'CL=F', name: 'Crude Oil WTI', c: 'USD', cat: 'commodity', country: 'GLOBAL' },
  { s: 'BTC-USD', name: 'Bitcoin', c: 'USD', cat: 'crypto', country: 'GLOBAL' },
  { s: 'THB=X', name: 'USD / THB', c: 'THB', cat: 'forex', country: 'TH' }
];

async function fetchLiveIndicesFromYahoo(): Promise<IndexItem[] | null> {
  try {
    const results = await Promise.all(
      MAJOR_INDEX_DEFINITIONS.map(async (item): Promise<IndexItem | null> => {
        try {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.s)}?interval=1d&range=5d`;
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 4000);

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

          const price = Number(meta.regularMarketPrice) || 0;
          const prev = Number(meta.chartPreviousClose || meta.previousClose) || price;
          const change = price - prev;
          const changePercent = prev !== 0 ? (change / prev) * 100 : 0;
          const isPositive = change >= 0;

          // Extract sparkline points if available
          const quotes = json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || [];
          const sparklineData = Array.isArray(quotes) && quotes.filter((v: any) => typeof v === 'number').length >= 2
            ? quotes.filter((v: any) => typeof v === 'number').slice(-7)
            : [prev * 0.995, prev, price];

          return {
            symbol: item.s,
            name: item.name,
            value: Number(price.toFixed(2)),
            price: Number(price.toFixed(2)),
            change: Number(change.toFixed(2)),
            changePercent: Number(changePercent.toFixed(2)),
            currency: item.c,
            category: item.cat,
            country: item.country,
            region: item.country === 'TH' ? 'thai' : 'global',
            isPositive,
            sparklineData,
            high52w: meta.fiftyTwoWeekHigh || price,
            low52w: meta.fiftyTwoWeekLow || price,
            lastUpdated: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
            timestamp: new Date().toISOString()
          };
        } catch {
          return null;
        }
      })
    );

    const valid = results.filter((r): r is IndexItem => r !== null);
    if (valid.length > 0) {
      // Add Thai Gold estimate if Gold Spot is present
      const goldSpot = valid.find((v) => v.symbol === 'GC=F');
      const usdThb = valid.find((v) => v.symbol === 'THB=X');
      if (goldSpot && goldSpot.value > 0) {
        const fxRate = usdThb && usdThb.value > 0 ? usdThb.value : 34.2;
        const rawThaiGold = Math.round((goldSpot.value * (15.244 / 31.104) * 0.965 * fxRate) + 300);
        valid.push({
          symbol: 'GOLD_THAI',
          name: 'ทองคำแท่ง 96.5% (สมาคม)',
          value: rawThaiGold,
          price: rawThaiGold,
          sellPrice: rawThaiGold,
          buyPrice: rawThaiGold - 100,
          change: goldSpot.change,
          changePercent: goldSpot.changePercent,
          currency: 'THB',
          category: 'gold_thai',
          country: 'TH',
          region: 'thai',
          isPositive: goldSpot.isPositive,
          sparklineData: [rawThaiGold * 0.995, rawThaiGold * 0.998, rawThaiGold],
          lastUpdated: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
          timestamp: new Date().toISOString()
        });
      }
      return valid;
    }
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

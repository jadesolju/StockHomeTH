import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { StockFundamentalSchema, type StockFundamental } from '../schemas/marketSchema';
import type { MarketIndex } from '../../types/market';
import type { DigestSummary } from '../schemas/newsSchema';
import { fullMarketStocks } from '../../data/fullMarketStocks';
import { mockMarketIndices } from '../../data/mockMarketData';
import { mockDailyDigestSummary } from '../../data/mockNewsData';
import { fetchLiveAggregatedNews } from './liveNewsAggregatorService';

const execAsync = promisify(exec);

// In-memory caches
let cachedStocks: StockFundamental[] | null = null;
let stockCacheTime = 0;
const STOCK_CACHE_TTL_MS = 30_000; // 30 seconds

let cachedIndices: MarketIndex[] | null = null;
let indexCacheTime = 0;
const INDEX_CACHE_TTL_MS = 25_000; // 25 seconds

let cachedOverview: DigestSummary | null = null;
let overviewCacheTime = 0;
const OVERVIEW_CACHE_TTL_MS = 30_000; // 30 seconds

let isPythonEngineAvailable: boolean | null = null;

import { fetchLiveStocksFromYFinance } from './yfinanceBridge';

/**
 * Fetch live stocks (SET & US) - Seamless 10,689 universe integration
 */
export async function fetchLiveStocks(): Promise<StockFundamental[]> {
  return await fetchLiveStocksFromYFinance();
}

/**
 * Fetch live market indices (SET Index, S&P 500, NASDAQ, Dow Jones)
 */
export async function fetchLiveIndices(): Promise<MarketIndex[]> {
  const now = Date.now();
  if (cachedIndices && now - indexCacheTime < INDEX_CACHE_TTL_MS && cachedIndices.length > 0) {
    return cachedIndices;
  }

  if (isPythonEngineAvailable !== false) {
    try {
      const scriptPath = path.resolve(process.cwd(), 'server', 'yfinance_engine.py');
      const pythonCmd = `py "${scriptPath}" --action indices`;
      const { stdout } = await execAsync(pythonCmd, { timeout: 3000 });
      const json = JSON.parse(stdout.trim());

      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        isPythonEngineAvailable = true;
        cachedIndices = json.data;
        indexCacheTime = now;
        return json.data;
      }
    } catch {
      isPythonEngineAvailable = false;
    }
  }

  cachedIndices = mockMarketIndices;
  indexCacheTime = now;
  return mockMarketIndices;
}

/**
 * Calculate real-time market overview summary & sentiment gauge
 */
export async function fetchLiveMarketOverview(): Promise<DigestSummary> {
  const now = Date.now();
  if (cachedOverview && now - overviewCacheTime < OVERVIEW_CACHE_TTL_MS) {
    return cachedOverview;
  }

  try {
    const [stocks, newsList] = await Promise.all([
      fetchLiveStocks(),
      fetchLiveAggregatedNews()
    ]);

    if (stocks && stocks.length > 0) {
      const gainers = stocks.filter((s) => s.change > 0).length;
      const losers = stocks.filter((s) => s.change < 0).length;
      const total = stocks.length;

      const bullishPercent = Math.round((gainers / total) * 100);
      const bearishPercent = Math.round((losers / total) * 100);
      const neutralPercent = Math.max(0, 100 - bullishPercent - bearishPercent);

      const topGainer = [...stocks].sort((a, b) => b.change - a.change)[0];
      const topLoser = [...stocks].sort((a, b) => a.change - b.change)[0];

      const currentTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
      const currentDate = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

      // Dynamically extract breaking catalysts from real news & stock market leaders
      const liveCatalysts: string[] = [];

      if (newsList && newsList.length > 0) {
        // Take top 2 breaking headlines
        for (const item of newsList.slice(0, 2)) {
          const mainTicker = item.tickers.find((t) => t !== 'SET' && t !== 'MARKET' && t !== 'US') || item.tickers[0] || 'SET';
          liveCatalysts.push(`ข่าวเด่น: ${item.title} (${item.source}) [หุ้น $${mainTicker}]`);
        }
      }

      if (topGainer) {
        liveCatalysts.push(`หุ้นนำตลาดสูงสุด: ${topGainer.ticker} (${topGainer.currency === 'THB' ? '฿' : '$'}${(Number(topGainer.price) || 0).toFixed(2)}) บวก +${(Number(topGainer.change) || 0).toFixed(2)}% สัดส่วนหุ้นบวก ${gainers} บริษัท`);
      }

      if (topLoser && Number(topLoser.change) < -1.0) {
        liveCatalysts.push(`หุ้นปรับฐาน: ${topLoser.ticker} (${topLoser.currency === 'THB' ? '฿' : '$'}${(Number(topLoser.price) || 0).toFixed(2)}) ลบ ${(Number(topLoser.change) || 0).toFixed(2)}%`);
      }

      if (liveCatalysts.length === 0) {
        liveCatalysts.push(
          `ระบบ Real-time Multi-Source Engine เชื่อมต่อสมบูรณ์`,
          `อัตราส่วนหุ้นบวกต่อหุ้นลบในตลาดสด: ${gainers} ต่อ ${losers} บริษัท`
        );
      }

      const topHeadline = newsList && newsList.length > 0
        ? newsList[0].title
        : `ตลาดภาพรวมเคลื่อนไหว ${bullishPercent >= 50 ? 'เชิงบวก' : 'ผันผวน'} นำโดย ${topGainer?.ticker || 'กลุ่มพลังงาน & เทคโนโลยี'}`;

      const overview: DigestSummary = {
        id: `digest-${Date.now()}`,
        timeframe: 'daily',
        region: 'all',
        periodLabel: `สรุปภาวะตลาดและข่าวเด่น • ${currentDate}`,
        updatedAt: currentTime,
        mainHeadline: topHeadline,
        overviewSummary: `ความเคลื่อนไหวตลาดล่าสุด: หุ้นปรับตัวขึ้น ${gainers} บริษัท, ปรับตัวลง ${losers} บริษัท จากทั้งหมด ${total} บริษัทที่ติดตามในระบบ พร้อมสรุปข่าวสารการเงินสดต่อเนื่องทุกนาที`,
        marketSentimentScore: {
          bullishPercent,
          neutralPercent,
          bearishPercent
        },
        keyCatalysts: liveCatalysts.slice(0, 4),
        topWatchlistTickers: stocks.slice(0, 5).map(s => s.ticker),
      };

      cachedOverview = overview;
      overviewCacheTime = now;
      return overview;
    }
  } catch (err) {
    console.warn('[liveMarketDataService] Overview generation warning:', err);
  }

  return mockDailyDigestSummary;
}

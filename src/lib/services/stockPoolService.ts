/**
 * StockHomeTH Stock Pool & Multi-Layer Data Service
 * Provides Supabase-backed persistent market data pooling, pending/completed analysis queues,
 * and multi-layer zero-rejection fallbacks.
 */

import { supabase } from '@/lib/supabase/client';
import type { StockFundamental } from '../schemas/marketSchema';
import { loadBundledUniverseFiles, loadMarketCacheFile } from './yfinanceBridge';

export interface StockPoolItem extends StockFundamental {
  analysisStatus?: 'pending' | 'completed' | 'failed' | 'processing';
  lastFetchedAt?: string;
  lastAnalyzedAt?: string;
  analysisPayload?: {
    summary?: string;
    strengths?: string[];
    risks?: string[];
    valuationVerdict?: string;
    technicalTrend?: string;
    catalysts?: string[];
    priceTarget?: number;
  };
  priceHistorySample?: number[];
  technicalIndicators?: {
    rsi?: number;
    trend?: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
    support?: number;
    resistance?: number;
    changeFromPrevious?: number;
  };
}

let inMemoryPoolCache = new Map<string, { data: StockPoolItem; timestamp: number }>();
const POOL_CACHE_TTL_MS = 60_000; // 1 minute hot memory cache

/**
 * Normalizes ticker symbol (removes .BK, uppercase)
 */
export function normalizeTicker(symbol: string): string {
  if (!symbol) return '';
  return symbol.replace(/\.BK$/i, '').toUpperCase().trim();
}

/**
 * Layer 2 / Pool Query: Fetch stock data and analysis from Supabase pool
 */
export async function fetchStockFromPool(symbol: string): Promise<StockPoolItem | null> {
  const cleanTicker = normalizeTicker(symbol);
  if (!cleanTicker) return null;

  const now = Date.now();
  const cached = inMemoryPoolCache.get(cleanTicker);
  if (cached && now - cached.timestamp < POOL_CACHE_TTL_MS) {
    return cached.data;
  }

  // 1. Query Supabase public.stocks table
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('stocks')
        .select('*')
        .eq('ticker', cleanTicker)
        .maybeSingle();

      if (!error && data && data.price > 0) {
        const item: StockPoolItem = {
          ticker: data.ticker,
          name: data.name || cleanTicker,
          market: data.market || (cleanTicker.length <= 5 ? 'SET' : 'US'),
          sector: data.sector || 'General Market',
          price: Number(data.price),
          currency: data.currency || (data.market === 'US' ? 'USD' : 'THB'),
          change: Number(data.change || 0),
          marketCap: data.market_cap || '—',
          peRatio: data.pe_ratio ? Number(data.pe_ratio) : 0,
          dividendYield: data.dividend_yield ? Number(data.dividend_yield) : 0,
          high52w: data.high_52w ? Number(data.high_52w) : Number(data.price || 0),
          low52w: data.low_52w ? Number(data.low_52w) : Number(data.price || 0),
          volume: data.volume || '—',
          aiInsight: data.ai_insight || '',
          description: data.description || '',
          sparkline7d: Array.isArray(data.sparkline_7d) && data.sparkline_7d.length >= 2 ? data.sparkline_7d : [Number(data.price || 0), Number(data.price || 0)],
          analystRating: (data.analyst_rating as any) || 'Hold',
          targetPrice: data.target_price ? Number(data.target_price) : Number(data.price || 0),
          sentimentScore: data.sentiment_score ? Number(data.sentiment_score) : 50,
          analysisStatus: data.analysis_status || 'pending',
          lastFetchedAt: data.last_fetched_at || data.updated_at,
          lastAnalyzedAt: data.last_analyzed_at,
          analysisPayload: data.analysis_payload || {},
          priceHistorySample: Array.isArray(data.price_history_sample) ? data.price_history_sample : [],
          technicalIndicators: data.technical_indicators || {},
        };

        inMemoryPoolCache.set(cleanTicker, { data: item, timestamp: now });
        return item;
      }
    }
  } catch (err) {
    console.warn(`[stockPoolService] Supabase pool fetch error for ${cleanTicker}:`, err);
  }

  // 2. Layer 3: Fallback to bundled in-memory universe or market cache
  const localList = loadMarketCacheFile() || loadBundledUniverseFiles();
  if (localList && localList.length > 0) {
    const localMatch = localList.find((s) => s.ticker.toUpperCase() === cleanTicker);
    if (localMatch && localMatch.price > 0) {
      const fallbackItem: StockPoolItem = {
        ...localMatch,
        analysisStatus: 'pending',
        lastFetchedAt: new Date().toISOString(),
      };
      inMemoryPoolCache.set(cleanTicker, { data: fallbackItem, timestamp: now });
      return fallbackItem;
    }
  }

  return null;
}

/**
 * Upsert freshly fetched stock quotes into Supabase Pool and flag status = 'pending'
 */
export async function upsertStocksToPool(stocks: StockFundamental[]): Promise<number> {
  if (!stocks || stocks.length === 0 || !supabase) return 0;

  try {
    const nowIso = new Date().toISOString();
    const fullRecords = stocks.map((s) => {
      const cleanTicker = normalizeTicker(s.ticker);
      return {
        ticker: cleanTicker,
        name: s.name || cleanTicker,
        market: s.market || (s.currency === 'USD' ? 'US' : 'SET'),
        sector: s.sector || 'General Market',
        price: s.price,
        currency: s.currency || (s.market === 'US' ? 'USD' : 'THB'),
        change: s.change || 0,
        market_cap: s.marketCap || '—',
        pe_ratio: s.peRatio ?? null,
        dividend_yield: s.dividendYield ?? null,
        high_52w: s.high52w ?? null,
        low_52w: s.low52w ?? null,
        volume: s.volume || '—',
        sparkline_7d: s.sparkline7d || [],
        description: s.description || null,
        analysis_status: 'pending',
        last_fetched_at: nowIso,
        updated_at: nowIso,
      };
    });

    const { error } = await supabase
      .from('stocks')
      .upsert(fullRecords, { onConflict: 'ticker' });

    if (error) {
      // If remote Supabase schema has not run migration yet, fallback to base columns
      if (error.code === 'PGRST204' || error.message?.includes('analysis_status')) {
        const baseRecords = stocks.map((s) => ({
          ticker: normalizeTicker(s.ticker),
          name: s.name || normalizeTicker(s.ticker),
          market: s.market || (s.currency === 'USD' ? 'US' : 'SET'),
          sector: s.sector || 'General Market',
          price: s.price,
          currency: s.currency || (s.market === 'US' ? 'USD' : 'THB'),
          change: s.change || 0,
          market_cap: s.marketCap || '—',
          pe_ratio: s.peRatio ?? null,
          dividend_yield: s.dividendYield ?? null,
          high_52w: s.high52w ?? null,
          low_52w: s.low52w ?? null,
          volume: s.volume || '—',
          sparkline_7d: s.sparkline7d || [],
          updated_at: nowIso,
        }));

        await supabase.from('stocks').upsert(baseRecords, { onConflict: 'ticker' });
      } else {
        console.warn('[stockPoolService] Error upserting stocks to pool:', error);
      }
    }

    // Refresh in-memory pool cache
    const now = Date.now();
    for (const s of stocks) {
      const clean = normalizeTicker(s.ticker);
      inMemoryPoolCache.set(clean, {
        data: { ...s, analysisStatus: 'pending', lastFetchedAt: nowIso },
        timestamp: now,
      });
    }

    return stocks.length;
  } catch (err) {
    console.warn('[stockPoolService] Upsert exception:', err);
    return 0;
  }
}

/**
 * Fetch a batch of stocks with analysis_status = 'pending' for background AI processing
 */
export async function fetchPendingAnalysisBatch(limit = 10): Promise<StockPoolItem[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .eq('analysis_status', 'pending')
      .order('last_fetched_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data.map((d: any) => ({
      ticker: d.ticker,
      name: d.name,
      market: d.market,
      sector: d.sector,
      price: Number(d.price),
      currency: d.currency,
      change: Number(d.change || 0),
      marketCap: d.market_cap,
      peRatio: d.pe_ratio ? Number(d.pe_ratio) : 0,
      dividendYield: d.dividend_yield ? Number(d.dividend_yield) : 0,
      high52w: d.high_52w ? Number(d.high_52w) : Number(d.price || 0),
      low52w: d.low_52w ? Number(d.low_52w) : Number(d.price || 0),
      volume: d.volume || '—',
      aiInsight: d.ai_insight || '',
      description: d.description || '',
      sparkline7d: Array.isArray(d.sparkline_7d) && d.sparkline_7d.length >= 2 ? d.sparkline_7d : [Number(d.price || 0), Number(d.price || 0)],
      analystRating: d.analyst_rating || 'Hold',
      targetPrice: d.target_price ? Number(d.target_price) : Number(d.price || 0),
      sentimentScore: d.sentiment_score || 50,
      analysisStatus: d.analysis_status,
      lastFetchedAt: d.last_fetched_at,
      lastAnalyzedAt: d.last_analyzed_at,
      analysisPayload: d.analysis_payload || {},
      priceHistorySample: d.price_history_sample || [],
      technicalIndicators: d.technical_indicators || {},
    }));
  } catch (err) {
    console.warn('[stockPoolService] Error fetching pending batch:', err);
    return [];
  }
}

/**
 * Updates a stock's analysis payload, insights, and marks status = 'completed'
 */
export async function updateStockAnalysisResult(
  ticker: string,
  analysisData: {
    aiInsight: string;
    analystRating?: 'Buy' | 'Hold' | 'Sell';
    targetPrice?: number;
    sentimentScore?: number;
    analysisPayload: {
      summary?: string;
      strengths?: string[];
      risks?: string[];
      valuationVerdict?: string;
      technicalTrend?: string;
      catalysts?: string[];
      priceTarget?: number;
    };
    technicalIndicators?: {
      rsi?: number;
      trend?: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
      support?: number;
      resistance?: number;
      changeFromPrevious?: number;
    };
  }
): Promise<boolean> {
  const cleanTicker = normalizeTicker(ticker);
  if (!cleanTicker || !supabase) return false;

  try {
    const nowIso = new Date().toISOString();
    const updatePayload: any = {
      ai_insight: analysisData.aiInsight,
      analysis_payload: analysisData.analysisPayload,
      analysis_status: 'completed',
      last_analyzed_at: nowIso,
      updated_at: nowIso,
    };

    if (analysisData.analystRating) updatePayload.analyst_rating = analysisData.analystRating;
    if (analysisData.targetPrice) updatePayload.target_price = analysisData.targetPrice;
    if (analysisData.sentimentScore != null) updatePayload.sentiment_score = analysisData.sentimentScore;
    if (analysisData.technicalIndicators) updatePayload.technical_indicators = analysisData.technicalIndicators;

    const { error } = await supabase
      .from('stocks')
      .update(updatePayload)
      .eq('ticker', cleanTicker);

    if (error) {
      console.warn(`[stockPoolService] Error updating analysis for ${cleanTicker}:`, error);
      return false;
    }

    // Invalidate / update memory cache
    const existing = inMemoryPoolCache.get(cleanTicker);
    if (existing) {
      existing.data.analysisStatus = 'completed';
      existing.data.aiInsight = analysisData.aiInsight;
      existing.data.analysisPayload = analysisData.analysisPayload;
      existing.data.lastAnalyzedAt = nowIso;
      if (analysisData.analystRating) existing.data.analystRating = analysisData.analystRating;
      if (analysisData.targetPrice) existing.data.targetPrice = analysisData.targetPrice;
    }

    return true;
  } catch (err) {
    console.warn(`[stockPoolService] Exception updating analysis for ${cleanTicker}:`, err);
    return false;
  }
}

/**
 * StockHomeTH - Real-Time Market Data Synchronization Service
 * Unifies live prices, indices, and real-time news across all UI components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { StockFundamental } from '../schemas/marketSchema';
import type { MarketIndex } from '../../types/market';
import type { StockNewsItem } from '../../types/stockNews';
import type { DigestSummary } from '../schemas/newsSchema';

export interface RealtimeMarketState {
  stocks: StockFundamental[];
  indices: MarketIndex[];
  news: StockNewsItem[];
  overview: DigestSummary | null;
  lastUpdated: string;
  isLive: boolean;
  isLoading: boolean;
  refreshAll: () => Promise<void>;
}

export function useRealtimeMarketSync(initialStocks?: StockFundamental[]): RealtimeMarketState {
  const [stocks, setStocks] = useState<StockFundamental[]>(initialStocks || []);
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [news, setNews] = useState<StockNewsItem[]>([]);
  const [overview, setOverview] = useState<DigestSummary | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('กำลังเชื่อมต่อ...');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLive, setIsLive] = useState<boolean>(true);

  const fetchLiveStocks = async () => {
    try {
      const res = await fetch('/api/stocks/live');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setStocks(json.data);
        }
      }
    } catch (e) {
      console.warn('[RealtimeSync] Stock fetch warning:', e);
    }
  };

  const fetchLiveIndices = async () => {
    try {
      const res = await fetch('/api/indices/live');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setIndices(json.data);
        }
      }
    } catch (e) {
      console.warn('[RealtimeSync] Indices fetch warning:', e);
    }
  };

  const fetchLiveNews = async () => {
    try {
      const res = await fetch('/api/news/live');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setNews(json.data);
        }
      }
    } catch (e) {
      console.warn('[RealtimeSync] News fetch warning:', e);
    }
  };

  const fetchLiveOverview = async () => {
    try {
      const res = await fetch('/api/market/overview');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setOverview(json.data);
        }
      }
    } catch (e) {
      console.warn('[RealtimeSync] Overview fetch warning:', e);
    }
  };

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.allSettled([
      fetchLiveStocks(),
      fetchLiveIndices(),
      fetchLiveNews(),
      fetchLiveOverview()
    ]);
    const nowStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' น.';
    setLastUpdated(nowStr);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshAll();

    // Auto-polling interval: every 20 seconds for stocks & indices, 60s for news
    const stockInterval = setInterval(() => {
      fetchLiveStocks();
      fetchLiveIndices();
      fetchLiveOverview();
      const nowStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' น.';
      setLastUpdated(nowStr);
    }, 20000);

    const newsInterval = setInterval(() => {
      fetchLiveNews();
    }, 60000);

    return () => {
      clearInterval(stockInterval);
      clearInterval(newsInterval);
    };
  }, [refreshAll]);

  return {
    stocks,
    indices,
    news,
    overview,
    lastUpdated,
    isLive,
    isLoading,
    refreshAll
  };
}

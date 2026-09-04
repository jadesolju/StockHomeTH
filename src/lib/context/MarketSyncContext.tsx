'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { StockFundamental } from '../schemas/marketSchema';
import type { MarketIndex } from '../../types/market';
import type { StockNewsItem } from '../schemas/newsSchema';
import type { DigestSummary } from '../schemas/newsSchema';

interface MarketSyncContextType {
  stocks: StockFundamental[];
  indices: MarketIndex[];
  news: StockNewsItem[];
  overview: DigestSummary | null;
  selectedTicker: string | null;
  setSelectedTicker: (ticker: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedMarket: 'ALL' | 'SET' | 'US';
  setSelectedMarket: (market: 'ALL' | 'SET' | 'US') => void;
  activeStockModal: StockFundamental | null;
  setActiveStockModal: (stock: StockFundamental | null) => void;
  activeNewsModal: StockNewsItem | null;
  setActiveNewsModal: (news: StockNewsItem | null) => void;
  lastUpdated: string;
  isSyncing: boolean;
  refreshAll: () => Promise<void>;
  getStockByTicker: (ticker: string) => StockFundamental | undefined;
  getNewsByTicker: (ticker: string) => StockNewsItem[];
  focusStock: (ticker: string) => void;
}

const MarketSyncContext = createContext<MarketSyncContextType | undefined>(undefined);

export function MarketSyncProvider({
  children,
  initialStocks = [],
  initialIndices = [],
  initialNews = [],
  initialOverview = null
}: {
  children: React.ReactNode;
  initialStocks?: StockFundamental[];
  initialIndices?: MarketIndex[];
  initialNews?: StockNewsItem[];
  initialOverview?: DigestSummary | null;
}) {
  const [stocks, setStocks] = useState<StockFundamental[]>(initialStocks);
  const [indices, setIndices] = useState<MarketIndex[]>(initialIndices);
  const [news, setNews] = useState<StockNewsItem[]>(initialNews);
  const [overview, setOverview] = useState<DigestSummary | null>(initialOverview);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMarket, setSelectedMarket] = useState<'ALL' | 'SET' | 'US'>('ALL');
  const [activeStockModal, setActiveStockModal] = useState<StockFundamental | null>(null);
  const [activeNewsModal, setActiveNewsModal] = useState<StockNewsItem | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('กำลังเชื่อมต่อสด...');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Master Synchronized Fetch
  const refreshAll = useCallback(async () => {
    setIsSyncing(true);
    try {
      const stockPromise = fetch('/api/stocks/live')
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      const indexPromise = fetch('/api/indices/live')
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      const newsPromise = fetch('/api/news/live')
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      const overviewPromise = fetch('/api/market/overview')
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      const [stockRes, indexRes, newsRes, overviewRes] = await Promise.allSettled([
        stockPromise,
        indexPromise,
        newsPromise,
        overviewPromise
      ]);

      if (stockRes.status === 'fulfilled' && stockRes.value?.success && Array.isArray(stockRes.value.data)) {
        setStocks(stockRes.value.data);
      }

      if (indexRes.status === 'fulfilled' && indexRes.value?.success && Array.isArray(indexRes.value.data)) {
        setIndices(indexRes.value.data);
      }

      if (newsRes.status === 'fulfilled' && newsRes.value?.success && Array.isArray(newsRes.value.data)) {
        setNews(newsRes.value.data);
      }

      if (overviewRes.status === 'fulfilled' && overviewRes.value?.success && overviewRes.value.data) {
        setOverview(overviewRes.value.data);
      }

      const nowStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' น.';
      setLastUpdated(nowStr);
    } catch (err) {
      console.warn('[MarketSyncContext] Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 25000);
    return () => clearInterval(interval);
  }, [refreshAll]);

  // Helper to query stock data by ticker
  const getStockByTicker = useCallback(
    (ticker: string) => {
      const clean = ticker.replace(/[\$\^\.]/g, '').replace(/BK$/, '').trim().toUpperCase();
      return stocks.find((s) => s.ticker.toUpperCase() === clean || s.name.toUpperCase().includes(clean));
    },
    [stocks]
  );

  // Helper to get news matching a ticker
  const getNewsByTicker = useCallback(
    (ticker: string) => {
      const clean = ticker.replace(/[\$\^\.]/g, '').replace(/BK$/, '').trim().toUpperCase();
      return news.filter((n) => n.tickers.some((t) => t.toUpperCase().includes(clean)));
    },
    [news]
  );

  // Cross-Section Interactive Linking Trigger
  const focusStock = useCallback(
    (ticker: string) => {
      const clean = ticker.replace(/[\$\^\.]/g, '').replace(/BK$/, '').trim().toUpperCase();
      setSelectedTicker(clean);
      const stock = getStockByTicker(clean);
      if (stock) {
        setActiveStockModal(stock);
      }
      // Smooth scroll to stock explorer section if in page
      const el = document.getElementById('stock-explorer-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [getStockByTicker]
  );

  const contextValue = useMemo(
    () => ({
      stocks,
      indices,
      news,
      overview,
      selectedTicker,
      setSelectedTicker,
      searchQuery,
      setSearchQuery,
      selectedMarket,
      setSelectedMarket,
      activeStockModal,
      setActiveStockModal,
      activeNewsModal,
      setActiveNewsModal,
      lastUpdated,
      isSyncing,
      refreshAll,
      getStockByTicker,
      getNewsByTicker,
      focusStock
    }),
    [
      stocks,
      indices,
      news,
      overview,
      selectedTicker,
      searchQuery,
      selectedMarket,
      activeStockModal,
      activeNewsModal,
      lastUpdated,
      isSyncing,
      refreshAll,
      getStockByTicker,
      getNewsByTicker,
      focusStock
    ]
  );

  return <MarketSyncContext.Provider value={contextValue}>{children}</MarketSyncContext.Provider>;
}

export function useMarketSync() {
  const context = useContext(MarketSyncContext);
  if (!context) {
    throw new Error('useMarketSync must be used within a MarketSyncProvider');
  }
  return context;
}

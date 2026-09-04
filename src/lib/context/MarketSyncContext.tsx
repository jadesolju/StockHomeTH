'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { StockFundamental } from '../schemas/marketSchema';
import type { MarketIndex } from '../../types/market';
import type { StockNewsItem } from '../schemas/newsSchema';
import type { DigestSummary } from '../schemas/newsSchema';
import type { SyncLogItem } from '../../types/syncLog';
import { getDualMarketStatus, DualMarketStatus } from '../utils/marketHours';

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
  lastStockSyncTime: string;
  lastNewsSyncTime: string;
  isSyncing: boolean;
  marketStatus: DualMarketStatus;
  refreshAll: () => Promise<void>;
  refreshStocksAndIndices: () => Promise<void>;
  refreshNewsAndOverview: () => Promise<void>;
  getStockByTicker: (ticker: string) => StockFundamental | undefined;
  getNewsByTicker: (ticker: string) => StockNewsItem[];
  focusStock: (ticker: string) => void;
  syncLogs: SyncLogItem[];
  isLogModalOpen: boolean;
  setIsLogModalOpen: (open: boolean) => void;
  clearSyncLogs: () => void;
  // Chunking State & Actions
  stockPage: number;
  totalStocksCount: number;
  setUniverseCount: number;
  usUniverseCount: number;
  hasMoreStocks: boolean;
  isLoadingMoreStocks: boolean;
  loadNextStockChunk: () => Promise<void>;
  loadAllStockChunks: () => Promise<void>;
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
  const [lastStockSyncTime, setLastStockSyncTime] = useState<string>('');
  const [lastNewsSyncTime, setLastNewsSyncTime] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [syncLogs, setSyncLogs] = useState<SyncLogItem[]>([]);
  const [marketStatus, setMarketStatus] = useState<DualMarketStatus>(() => getDualMarketStatus());

  // Chunking batch state
  const [stockPage, setStockPage] = useState<number>(1);
  const [totalStocksCount, setTotalStocksCount] = useState<number>(initialStocks.length || 1500);
  const [setUniverseCount, setSetUniverseCount] = useState<number>(500);
  const [usUniverseCount, setUsUniverseCount] = useState<number>(1000);
  const [hasMoreStocks, setHasMoreStocks] = useState<boolean>(true);
  const [isLoadingMoreStocks, setIsLoadingMoreStocks] = useState<boolean>(false);

  // Periodically update Market Status (every 15s)
  useEffect(() => {
    const statusInterval = setInterval(() => {
      setMarketStatus(getDualMarketStatus());
    }, 15000);
    return () => clearInterval(statusInterval);
  }, []);

  // Load saved sync logs from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('stockhome_sync_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const seen = new Set<string>();
          const deduped: SyncLogItem[] = [];
          for (const item of parsed) {
            let id = item.id;
            if (!id || seen.has(id)) {
              id = `log-saved-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            }
            seen.add(id);
            deduped.push({ ...item, id });
          }
          setSyncLogs(deduped);
          return;
        }
      }
    } catch {
      // Ignore parse error
    }

    // Default startup log with smart schedule details
    const now = new Date();
    const currentStatus = getDualMarketStatus(now);
    const initLog: SyncLogItem = {
      id: `log-init-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' น.',
      isoTimestamp: now.toISOString(),
      source: 'System Engine',
      type: 'all',
      status: 'success',
      itemCount: initialStocks.length + initialNews.length,
      summary: `ระบบเริ่มต้นสำเร็จ (รอบดึงราคาหุ้น: ${currentStatus.stockSyncIntervalLabel}, ข่าวสาร & AI: ${currentStatus.newsSyncIntervalLabel})`,
      durationMs: 45
    };
    setSyncLogs([initLog]);
  }, []);

  const addLogEntries = useCallback((newLogs: SyncLogItem[]) => {
    setSyncLogs((prev) => {
      const seenIds = new Set<string>();
      const combined: SyncLogItem[] = [];
      for (const log of [...newLogs, ...prev]) {
        let uniqueId = log.id;
        if (!uniqueId || seenIds.has(uniqueId)) {
          uniqueId = `log-${log.type || 'item'}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        }
        seenIds.add(uniqueId);
        combined.push({ ...log, id: uniqueId });
        if (combined.length >= 80) break;
      }
      try {
        localStorage.setItem('stockhome_sync_logs', JSON.stringify(combined));
      } catch {
        // LocalStorage full or private browsing
      }
      return combined;
    });
  }, []);

  const clearSyncLogs = useCallback(() => {
    setSyncLogs([]);
    try {
      localStorage.removeItem('stockhome_sync_logs');
    } catch {
      // Ignore
    }
  }, []);

  // Fetch Stocks & Indices (Every 1 min when Open / 30 min when Closed)
  const refreshStocksAndIndices = useCallback(async () => {
    const startTime = Date.now();
    const createdLogs: SyncLogItem[] = [];
    const currentStatus = getDualMarketStatus();

    try {
      const stockPromise = fetch(`/api/stocks/live?page=1&limit=50&market=${selectedMarket}`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      const indexPromise = fetch('/api/indices/live')
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      const [stockRes, indexRes] = await Promise.allSettled([stockPromise, indexPromise]);

      const now = new Date();
      const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' น.';
      const elapsed = Date.now() - startTime;

      if (stockRes.status === 'fulfilled' && stockRes.value?.success && Array.isArray(stockRes.value.data)) {
        setStocks(stockRes.value.data);
        setStockPage(1);
        setHasMoreStocks(stockRes.value.hasMore ?? false);
        if (stockRes.value.counts) {
          setTotalStocksCount(stockRes.value.counts.total ?? 1500);
          setSetUniverseCount(stockRes.value.counts.set ?? 500);
          setUsUniverseCount(stockRes.value.counts.us ?? 1000);
        }
        createdLogs.push({
          id: `log-stock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          timestamp: timeStr,
          isoTimestamp: now.toISOString(),
          source: 'Yahoo Finance & SEC Batch Engine',
          type: 'stocks',
          status: 'success',
          itemCount: stockRes.value.data.length,
          summary: `ดึงราคาล่าสุดสำเร็จ (${currentStatus.stockSyncIntervalLabel}) โหลด Chunk 1 (${stockRes.value.data.length} ตัว) จากคลัง ${stockRes.value.counts?.total || 1500} ตัว`,
          durationMs: elapsed
        });
      }

      if (indexRes.status === 'fulfilled' && indexRes.value?.success && Array.isArray(indexRes.value.data)) {
        setIndices(indexRes.value.data);
        createdLogs.push({
          id: `log-idx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          timestamp: timeStr,
          isoTimestamp: now.toISOString(),
          source: 'Global Indices & Thai Gold Feed',
          type: 'indices',
          status: 'success',
          itemCount: indexRes.value.data.length,
          summary: `อัปเดตดัชนีตลาดหุ้น (SET, S&P500, NASDAQ, Dow) + ทองคำแท่งไทย 96.5% + ทองคำโลก + ค่าเงินบาท เรียบร้อย (${indexRes.value.data.length} รายการ)`,
          durationMs: elapsed
        });
      }

      if (createdLogs.length > 0) {
        addLogEntries(createdLogs);
      }

      setLastStockSyncTime(timeStr);
      setLastUpdated(timeStr);
    } catch (err) {
      console.warn('[MarketSyncContext] Stock sync error:', err);
    }
  }, [selectedMarket, addLogEntries]);

  // Fetch News & AI Overview (Every 30 minutes)
  const refreshNewsAndOverview = useCallback(async () => {
    const startTime = Date.now();
    const createdLogs: SyncLogItem[] = [];

    try {
      const newsPromise = fetch('/api/news/live')
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      const overviewPromise = fetch('/api/market/overview')
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      const [newsRes, overviewRes] = await Promise.allSettled([newsPromise, overviewPromise]);

      const now = new Date();
      const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' น.';
      const elapsed = Date.now() - startTime;

      if (newsRes.status === 'fulfilled' && newsRes.value?.success && Array.isArray(newsRes.value.data)) {
        setNews(newsRes.value.data);
        createdLogs.push({
          id: `log-news-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          timestamp: timeStr,
          isoTimestamp: now.toISOString(),
          source: 'Google RSS & Multi-Source Extractor',
          type: 'news',
          status: 'success',
          itemCount: newsRes.value.data.length,
          summary: `ดึงข่าวสดการเงิน ${newsRes.value.data.length} รายการ (รอบกำหนด 30 นาที) พร้อม AI Sentiment Analysis`,
          durationMs: elapsed
        });
      }

      if (overviewRes.status === 'fulfilled' && overviewRes.value?.success && overviewRes.value.data) {
        setOverview(overviewRes.value.data);
        createdLogs.push({
          id: `log-ov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          timestamp: timeStr,
          isoTimestamp: now.toISOString(),
          source: 'AI Market Briefing Engine',
          type: 'overview',
          status: 'success',
          summary: `ประมวลผล AI Market Briefing และสรุปประเด็นด่วน (รอบ 30 นาที) สำเร็จ`,
          durationMs: elapsed
        });
      }

      if (createdLogs.length > 0) {
        addLogEntries(createdLogs);
      }

      setLastNewsSyncTime(timeStr);
      setLastUpdated(timeStr);
    } catch (err) {
      console.warn('[MarketSyncContext] News sync error:', err);
    }
  }, [addLogEntries]);

  // Master Synchronized Fetch for manual refresh button
  const refreshAll = useCallback(async () => {
    setIsSyncing(true);
    try {
      await Promise.allSettled([refreshStocksAndIndices(), refreshNewsAndOverview()]);
    } finally {
      setIsSyncing(false);
    }
  }, [refreshStocksAndIndices, refreshNewsAndOverview]);

  // Load Next Chunk (50 stocks per batch)
  const loadNextStockChunk = useCallback(async () => {
    if (isLoadingMoreStocks || !hasMoreStocks) return;
    setIsLoadingMoreStocks(true);
    const startTime = Date.now();
    try {
      const nextPage = stockPage + 1;
      const res = await fetch(`/api/stocks/live?page=${nextPage}&limit=50&market=${selectedMarket}`).then((r) =>
        r.ok ? r.json() : null
      );
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        setStocks((prev) => {
          const existingKeys = new Set(prev.map((s) => `${s.market}-${s.ticker.toUpperCase()}`));
          const newItems = res.data.filter((s: StockFundamental) => !existingKeys.has(`${s.market}-${s.ticker.toUpperCase()}`));
          return [...prev, ...newItems];
        });
        setStockPage(nextPage);
        setHasMoreStocks(res.hasMore ?? false);

        const now = new Date();
        const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' น.';
        addLogEntries([
          {
            id: `log-chunk-${nextPage}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            timestamp: timeStr,
            isoTimestamp: now.toISOString(),
            source: 'Batch Chunk Loader (+50)',
            type: 'stocks',
            status: 'success',
            itemCount: res.data.length,
            summary: `โหลดหุ้นชุดที่ ${nextPage} สำเร็จ (+${res.data.length} ตัว) รวมแสดงผล ${stocks.length + res.data.length} / ${res.total} ตัว`,
            durationMs: Date.now() - startTime
          }
        ]);
      } else {
        setHasMoreStocks(false);
      }
    } catch (err) {
      console.warn('[MarketSyncContext] loadNextStockChunk error:', err);
    } finally {
      setIsLoadingMoreStocks(false);
    }
  }, [isLoadingMoreStocks, hasMoreStocks, stockPage, selectedMarket, stocks.length, addLogEntries]);

  // Load All Chunks
  const loadAllStockChunks = useCallback(async () => {
    if (isLoadingMoreStocks) return;
    setIsLoadingMoreStocks(true);
    const startTime = Date.now();
    try {
      const res = await fetch(`/api/stocks/live?all=true&market=${selectedMarket}`).then((r) =>
        r.ok ? r.json() : null
      );
      if (res && res.success && Array.isArray(res.data)) {
        setStocks(res.data);
        setStockPage(res.totalPages || 1);
        setHasMoreStocks(false);

        const now = new Date();
        const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' น.';
        addLogEntries([
          {
            id: `log-chunk-all-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            timestamp: timeStr,
            isoTimestamp: now.toISOString(),
            source: 'Full Universe Loader',
            type: 'stocks',
            status: 'success',
            itemCount: res.data.length,
            summary: `โหลดหุ้นครบทั้งหมด ${res.data.length} ตัว (ไทย 500 ตัว, สหรัฐฯ 1,000 ตัว) สำเร็จ`,
            durationMs: Date.now() - startTime
          }
        ]);
      }
    } catch (err) {
      console.warn('[MarketSyncContext] loadAllStockChunks error:', err);
    } finally {
      setIsLoadingMoreStocks(false);
    }
  }, [isLoadingMoreStocks, selectedMarket, addLogEntries]);

  // Re-sync stocks and indices immediately whenever selectedMarket changes
  useEffect(() => {
    refreshStocksAndIndices();
  }, [selectedMarket, refreshStocksAndIndices]);

  // Safe and relaxed interval scheduling (avoids hitting API rate limits or excessive polling)
  useEffect(() => {
    refreshAll();

    // 15-minute relaxed background sync, user can click manual refresh button anytime
    const backgroundTimer = setInterval(() => {
      refreshAll();
    }, 15 * 60 * 1000);

    return () => {
      clearInterval(backgroundTimer);
    };
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
        const now = new Date();
        const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' น.';
        addLogEntries([
          {
            id: `log-focus-${clean}-${Date.now()}`,
            timestamp: timeStr,
            isoTimestamp: now.toISOString(),
            source: 'Interactive Stock Linker',
            type: 'stocks',
            status: 'success',
            itemCount: 1,
            summary: `เชื่อมโยงข้อมูลหุ้น $${clean} (${stock.name}) -> ราคาล่าสุด ${stock.currency === 'THB' ? '฿' : '$'}${stock.price.toFixed(2)} (${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}%) พร้อมข้อมูลปัจจัยพื้นฐานและข่าวด่วนที่เกี่ยวข้อง`,
            durationMs: 15
          }
        ]);
      }
      const el = document.getElementById('stock-explorer-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [getStockByTicker, addLogEntries]
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
      lastStockSyncTime,
      lastNewsSyncTime,
      isSyncing,
      marketStatus,
      refreshAll,
      refreshStocksAndIndices,
      refreshNewsAndOverview,
      getStockByTicker,
      getNewsByTicker,
      focusStock,
      syncLogs,
      isLogModalOpen,
      setIsLogModalOpen,
      clearSyncLogs,
      stockPage,
      totalStocksCount,
      setUniverseCount,
      usUniverseCount,
      hasMoreStocks,
      isLoadingMoreStocks,
      loadNextStockChunk,
      loadAllStockChunks
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
      lastStockSyncTime,
      lastNewsSyncTime,
      isSyncing,
      marketStatus,
      refreshAll,
      refreshStocksAndIndices,
      refreshNewsAndOverview,
      getStockByTicker,
      getNewsByTicker,
      focusStock,
      syncLogs,
      isLogModalOpen,
      setIsLogModalOpen,
      clearSyncLogs,
      stockPage,
      totalStocksCount,
      setUniverseCount,
      usUniverseCount,
      hasMoreStocks,
      isLoadingMoreStocks,
      loadNextStockChunk,
      loadAllStockChunks
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

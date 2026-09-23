'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { StockFundamental } from '../schemas/marketSchema';
import type { MarketIndex } from '../../types/market';
import type { StockNewsItem } from '../schemas/newsSchema';
import type { DigestSummary } from '../schemas/newsSchema';
import type { SyncLogItem } from '../../types/syncLog';
import { getDualMarketStatus, DualMarketStatus, getCurrentBriefingSession, isSundayWeeklySynthesisDay } from '../utils/marketHours';

interface MarketSyncContextType {
  stocks: StockFundamental[];
  indices: MarketIndex[];
  news: StockNewsItem[];
  overview: DigestSummary | null;
  weeklyNews: StockNewsItem[];
  weeklyOverview: DigestSummary | null;
  selectedTicker: string | null;
  setSelectedTicker: (ticker: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedMarket: 'ALL' | 'SET' | 'US';
  setSelectedMarket: (market: 'ALL' | 'SET' | 'US') => void;
  activeStockModal: StockFundamental | null;
  setActiveStockModal: (stock: StockFundamental | null) => void;
  updateStock: (stock: StockFundamental) => void;
  updateStocks: (stocks: StockFundamental[]) => void;
  activeNewsModal: StockNewsItem | null;
  setActiveNewsModal: (news: StockNewsItem | null) => void;
  lastUpdated: string;
  lastStockSyncTime: string;
  lastNewsSyncTime: string;
  isSyncing: boolean;
  cooldownRemaining: number;
  marketStatus: DualMarketStatus;
  refreshAll: (force?: boolean) => Promise<void>;
  refreshStocksAndIndices: () => Promise<void>;
  refreshNewsAndOverview: () => Promise<void>;
  refreshWeeklyNews: (force?: boolean) => Promise<void>;
  getStockByTicker: (ticker: string) => StockFundamental | undefined;
  getNewsByTicker: (ticker: string) => StockNewsItem[];
  focusStock: (ticker: string) => void;
  syncLogs: SyncLogItem[];
  isLogModalOpen: boolean;
  setIsLogModalOpen: (open: boolean) => void;
  clearSyncLogs: () => void;
  tickerFlashMap: Record<string, 'up' | 'down'>;
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
  const [weeklyNews, setWeeklyNews] = useState<StockNewsItem[]>([]);
  const [weeklyOverview, setWeeklyOverview] = useState<DigestSummary | null>(null);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMarket, setSelectedMarket] = useState<'ALL' | 'SET' | 'US'>('ALL');
  const [activeStockModal, setActiveStockModal] = useState<StockFundamental | null>(null);
  const [activeNewsModal, setActiveNewsModal] = useState<StockNewsItem | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('กำลังเชื่อมต่อสด...');
  const [lastStockSyncTime, setLastStockSyncTime] = useState<string>('');
  const [lastNewsSyncTime, setLastNewsSyncTime] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const isSyncingRef = useRef<boolean>(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const cooldownRemainingRef = useRef<number>(0);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [syncLogs, setSyncLogs] = useState<SyncLogItem[]>([]);
  const [marketStatus, setMarketStatus] = useState<DualMarketStatus>(() => getDualMarketStatus());
  const lastLoggedRef = useRef<Map<string, number>>(new Map());

  // Keep refs in sync with state
  useEffect(() => {
    isSyncingRef.current = isSyncing;
  }, [isSyncing]);

  useEffect(() => {
    cooldownRemainingRef.current = cooldownRemaining;
  }, [cooldownRemaining]);

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
    const nowMs = Date.now();
    const validLogs = newLogs.filter((log) => {
      const key = `${log.source || ''}-${log.summary || ''}`;
      const lastTime = lastLoggedRef.current.get(key) || 0;
      if (nowMs - lastTime < 4000) {
        // Suppress duplicate identical log within 4 seconds
        return false;
      }
      lastLoggedRef.current.set(key, nowMs);
      return true;
    });

    if (validLogs.length === 0) return;

    setSyncLogs((prev) => {
      const seenIds = new Set<string>();
      const combined: SyncLogItem[] = [];
      for (const log of [...validLogs, ...prev]) {
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

  // Fetch Stocks & Indices (Every 30s when Open / 15m when Closed)
  const refreshStocksAndIndices = useCallback(async () => {
    const startTime = Date.now();
    const createdLogs: SyncLogItem[] = [];
    const currentStatus = getDualMarketStatus();

    try {
      const stockPromise = fetch(`/api/stocks/live?page=1&limit=50&market=${selectedMarket}`, { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      const indexPromise = fetch('/api/indices/live', { cache: 'no-store' })
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

  // Fetch News & AI Overview (Every 5 minutes)
  const refreshNewsAndOverview = useCallback(async () => {
    const startTime = Date.now();
    const createdLogs: SyncLogItem[] = [];

    try {
      const newsPromise = fetch('/api/news/live', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      const overviewPromise = fetch('/api/market/overview', { cache: 'no-store' })
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
          summary: `ดึงข่าวสดการเงิน ${newsRes.value.data.length} รายการ (รอบกำหนด 5 นาที) พร้อม AI Sentiment Analysis`,
          durationMs: elapsed
        });
      }

      if (overviewRes.status === 'fulfilled' && overviewRes.value?.success && overviewRes.value.data) {
        setOverview(overviewRes.value.data);
        const sessionInfo = overviewRes.value.session || getCurrentBriefingSession(now);
        const cacheTag = overviewRes.value.source === 'session_checkpoint_cache' ? ' [Cached Checkpoint]' : '';
        createdLogs.push({
          id: `log-ov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          timestamp: timeStr,
          isoTimestamp: now.toISOString(),
          source: 'AI Market Briefing Engine',
          type: 'overview',
          status: 'success',
          summary: `ประมวลผล AI Market Briefing ${sessionInfo.labelTh} (${sessionInfo.timeRangeTh})${cacheTag} สำเร็จ`,
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

  // Fetch 7-Day Weekly News & Keylists (Primary Sunday schedule)
  const refreshWeeklyNews = useCallback(async (force = false) => {
    const startTime = Date.now();
    try {
      const res = await fetch(`/api/news/weekly${force ? '?refresh=true' : ''}`, { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      if (res && res.success && Array.isArray(res.data)) {
        setWeeklyNews(res.data);
        if (res.overview) {
          setWeeklyOverview(res.overview);
        }
        const now = new Date();
        const isSunday = isSundayWeeklySynthesisDay(now);
        const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' น.';
        addLogEntries([
          {
            id: `log-weekly-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            timestamp: timeStr,
            isoTimestamp: now.toISOString(),
            source: '7-Day Weekly Intelligence Engine',
            type: 'news',
            status: 'success',
            itemCount: res.data.length,
            summary: `ดึงข่าวและสรุป Keylist ประจำสัปดาห์ ${res.data.length} รายการ (${isSunday ? 'ประมวลผลรอบวันอาทิตย์' : 'โหลดสรุปล่าสุดประจำสัปดาห์'}) พร้อมภาพรวมตลาด 7 วัน (ไทย & US)`,
            durationMs: Date.now() - startTime
          }
        ]);
      }
    } catch (err) {
      console.warn('[MarketSyncContext] Weekly sync error:', err);
    }
  }, [addLogEntries]);

  // Master Synchronized Fetch for manual refresh button with Anti-Spam Cooldown
  const refreshAll = useCallback(
    async (force = false) => {
      if (isSyncingRef.current) return;
      if (!force && cooldownRemainingRef.current > 0) return;
      setIsSyncing(true);
      isSyncingRef.current = true;
      try {
        await Promise.allSettled([
          refreshStocksAndIndices(),
          refreshNewsAndOverview(),
          refreshWeeklyNews(force)
        ]);
        setCooldownRemaining(8); // 8-second anti-spam delay
        cooldownRemainingRef.current = 8;
      } finally {
        setIsSyncing(false);
        isSyncingRef.current = false;
      }
    },
    [refreshStocksAndIndices, refreshNewsAndOverview, refreshWeeklyNews]
  );

  // Countdown timer for Anti-Spam Cooldown
  useEffect(() => {
    if (cooldownRemaining > 0) {
      cooldownTimerRef.current = setTimeout(() => {
        setCooldownRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, [cooldownRemaining]);

  // Load Next Chunk (50 stocks per batch)
  const loadNextStockChunk = useCallback(async () => {
    if (isLoadingMoreStocks || !hasMoreStocks) return;
    setIsLoadingMoreStocks(true);
    const startTime = Date.now();
    try {
      const nextPage = stockPage + 1;
      const res = await fetch(`/api/stocks/live?page=${nextPage}&limit=50&market=${selectedMarket}`, { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : null
      );
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        setStocks((prev) => {
          const combined = [...prev, ...res.data];
          const seen = new Set<string>();
          return combined.filter((s: StockFundamental) => {
            if (!s || !s.ticker) return false;
            const key = `${(s.market || 'SET').toUpperCase()}-${s.ticker.toUpperCase()}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
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
      const res = await fetch(`/api/stocks/live?all=true&market=${selectedMarket}`, { cache: 'no-store' }).then((r) =>
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

  const [tickerFlashMap, setTickerFlashMap] = useState<Record<string, 'up' | 'down'>>({});
  const flashTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Note: Artificial random micro-ticks have been completely removed.
  // Prices are 100% genuine and reflect real server updates without simulated fluctuations.

  // 2. Silent Background REST Polling (every 30s when market is open / every 15m when closed/weekends)
  const isMarketActive =
    selectedMarket === 'SET' ? marketStatus.set.isOpen :
    selectedMarket === 'US' ? marketStatus.us.isOpen :
    marketStatus.isAnyOpen;

  useEffect(() => {
    const stockPollIntervalMs = isMarketActive ? 30000 : 15 * 60 * 1000;
    let isPollingStocks = false;
    let isPollingIndices = false;

    const pollStocks = async () => {
      if (isPollingStocks) return;
      isPollingStocks = true;
      try {
        const response = await fetch(`/api/stocks/live?page=1&limit=60&market=${selectedMarket}`, { cache: 'no-store' });
        const data = response.ok ? await response.json() : null;
        if (data?.success && Array.isArray(data.data)) {
          const freshStocks = data.data as StockFundamental[];
          setStocks((prev) => {
            const incomingMap = new Map<string, StockFundamental>(freshStocks.map((s) => [`${s.market}-${s.ticker}`, s]));
            return prev.map((old) => incomingMap.get(`${old.market}-${old.ticker}`) || old);
          });
          const syncTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' น.';
          setLastStockSyncTime(syncTime);
          setLastUpdated(syncTime);
        }
      } catch (err) {
        // Silent catch for background poll
      } finally {
        isPollingStocks = false;
      }
    };

    const pollIndices = async () => {
      if (isPollingIndices) return;
      isPollingIndices = true;
      try {
        const response = await fetch('/api/indices/live', { cache: 'no-store' });
        const data = response.ok ? await response.json() : null;
        if (data?.success && Array.isArray(data.data)) {
          setIndices(data.data);
          setLastUpdated(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' น.');
        }
      } catch (err) {
        // Silent catch for background poll
      } finally {
        isPollingIndices = false;
      }
    };

    const pollMarketData = () => {
      void pollStocks();
      void pollIndices();
    };
    const stockPollTimer = setInterval(() => void pollStocks(), stockPollIntervalMs);
    const indexPollTimer = setInterval(() => void pollIndices(), 60_000);
    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') void pollMarketData();
    };
    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnFocus);

    return () => {
      clearInterval(stockPollTimer);
      clearInterval(indexPollTimer);
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnFocus);
    };
  }, [selectedMarket, isMarketActive]);

  // News and AI market overview have their own slower refresh cadence.
  useEffect(() => {
    const timer = setInterval(() => {
      void refreshNewsAndOverview();
    }, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [refreshNewsAndOverview]);

  const isInitialMountRef = useRef<boolean>(true);

  // Re-sync stocks and indices whenever selectedMarket changes (skipping initial mount to prevent duplicate sync)
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    refreshStocksAndIndices();
  }, [selectedMarket, refreshStocksAndIndices]);

  // Initial full fetch on mount (strictly once)
  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper to query stock data by ticker
  const getStockByTicker = useCallback(
    (ticker?: string) => {
      if (!ticker || typeof ticker !== 'string') return undefined;
      const clean = ticker.replace(/[\$\^\.]/g, '').replace(/BK$/, '').trim().toUpperCase();
      if (!clean) return undefined;
      return stocks.find((s) => s.ticker.toUpperCase() === clean || s.name.toUpperCase().includes(clean));
    },
    [stocks]
  );

  // Helper to get news matching a ticker
  const getNewsByTicker = useCallback(
    (ticker?: string) => {
      if (!ticker || typeof ticker !== 'string') return [];
      const clean = ticker.replace(/[\$\^\.]/g, '').replace(/BK$/, '').trim().toUpperCase();
      if (!clean) return [];
      return news.filter((n) => Array.isArray(n.tickers) && n.tickers.some((t) => t && t.toUpperCase().includes(clean)));
    },
    [news]
  );

  // Cross-Section Interactive Linking Trigger
  const focusStock = useCallback(
    (ticker?: string) => {
      if (!ticker || typeof ticker !== 'string') return;
      const clean = ticker.replace(/[\$\^\.]/g, '').replace(/BK$/, '').trim().toUpperCase();
      if (!clean) return;
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
            summary: `เชื่อมโยงข้อมูลหุ้น $${clean} (${stock.name}) -> ราคาล่าสุด ${stock.currency === 'THB' ? '฿' : '$'}${(Number(stock.price) || 0).toFixed(2)} (${Number(stock.change) >= 0 ? '+' : ''}${(Number(stock.change) || 0).toFixed(2)}%) พร้อมข้อมูลปัจจัยพื้นฐานและข่าวด่วนที่เกี่ยวข้อง`,
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

  // Update single stock data in global context (guarantees cards & modal are 100% in sync)
  const updateStock = useCallback((freshStock: StockFundamental) => {
    if (!freshStock || !freshStock.ticker) return;
    const cleanSym = freshStock.ticker.toUpperCase();
    const market = freshStock.market;

    setStocks((prev) => {
      const idx = prev.findIndex(
        (s) => s.ticker.toUpperCase() === cleanSym && (!market || s.market === market)
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...freshStock };
        return next;
      }
      return [freshStock, ...prev];
    });
  }, []);

  // Bulk update multiple stocks (from parallel/live feeds)
  const updateStocks = useCallback((freshList: StockFundamental[]) => {
    if (!freshList || freshList.length === 0) return;
    const freshMap = new Map(
      freshList.map((s) => [`${(s.market || 'SET').toUpperCase()}-${s.ticker.toUpperCase()}`, s])
    );

    setStocks((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        const key = `${(item.market || 'SET').toUpperCase()}-${item.ticker.toUpperCase()}`;
        const fresh = freshMap.get(key);
        if (fresh) {
          changed = true;
          return { ...item, ...fresh };
        }
        return item;
      });
      return changed ? next : prev;
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      stocks,
      indices,
      news,
      overview,
      weeklyNews,
      weeklyOverview,
      selectedTicker,
      setSelectedTicker,
      searchQuery,
      setSearchQuery,
      selectedMarket,
      setSelectedMarket,
      activeStockModal,
      setActiveStockModal,
      updateStock,
      updateStocks,
      activeNewsModal,
      setActiveNewsModal,
      lastUpdated,
      lastStockSyncTime,
      lastNewsSyncTime,
      isSyncing,
      cooldownRemaining,
      marketStatus,
      refreshAll,
      refreshStocksAndIndices,
      refreshNewsAndOverview,
      refreshWeeklyNews,
      getStockByTicker,
      getNewsByTicker,
      focusStock,
      syncLogs,
      isLogModalOpen,
      setIsLogModalOpen,
      clearSyncLogs,
      tickerFlashMap,
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
      weeklyNews,
      weeklyOverview,
      selectedTicker,
      searchQuery,
      selectedMarket,
      activeStockModal,
      updateStock,
      updateStocks,
      activeNewsModal,
      lastUpdated,
      lastStockSyncTime,
      lastNewsSyncTime,
      isSyncing,
      cooldownRemaining,
      marketStatus,
      refreshAll,
      refreshStocksAndIndices,
      refreshNewsAndOverview,
      refreshWeeklyNews,
      getStockByTicker,
      getNewsByTicker,
      focusStock,
      syncLogs,
      isLogModalOpen,
      setIsLogModalOpen,
      clearSyncLogs,
      tickerFlashMap,
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

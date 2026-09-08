'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback, useTransition } from 'react';
import type { StockFundamental } from '../../lib/schemas/marketSchema';
import { useMarketSync } from '../../lib/context/MarketSyncContext';
import { useLanguage } from '../../lib/context/LanguageContext';
import { Sparkline } from '../ui/Sparkline';
import { useClientAuth } from '../../lib/context/ClientAuthContext';
import { useSubscription } from '../../lib/context/SubscriptionContext';
import type { StockAnalysisResult } from '../../lib/services/aiStockAnalysisService';
import { getStockTags, getMarketScopedTagFilters, getStockPopularityRank, THAI_7_GIANTS, MAGNIFICENT_7, SET50_TICKERS, SET100_TICKERS, DOW_JONES_30, NASDAQ_100, RECENT_IPOS } from '../../lib/utils/stockTagHelper';
import {
  Search,
  Filter,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  X,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Newspaper,
  ChevronRight,
  Landmark,
  Building,
  Globe,
  Flame,
  Diamond,
  BarChart3,
  Award,
  ArrowUpDown,
  Tag,
  ExternalLink,
  Bot,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Lock,
  LogIn,
  Layers
} from 'lucide-react';

export type StockSortOption =
  | 'popular'
  | 'volume'
  | 'marketCap'
  | 'gainers'
  | 'losers'
  | 'aiScore'
  | 'dividend'
  | 'peRatio'
  | 'marketThaiFirst'
  | 'marketUsFirst'
  | 'tickerAsc';

interface StockExplorerClientProps {
  initialStocks?: StockFundamental[];
  marketOverride?: 'ALL' | 'SET' | 'US';
  hideMarketTabs?: boolean;
}

/**
 * Helper to parse string values like "12.5M", "450K", "$3.2T", "—" into raw numbers
 */
function parseNumericValue(val: string | number | undefined): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val || val === '—' || val === '-') return 0;
  const str = String(val).trim().toUpperCase();
  const num = parseFloat(str.replace(/[^0-9.-]/g, ''));
  if (isNaN(num)) return 0;
  if (str.endsWith('T')) return num * 1_000_000_000_000;
  if (str.endsWith('B')) return num * 1_000_000_000;
  if (str.endsWith('M')) return num * 1_000_000;
  if (str.endsWith('K')) return num * 1_000;
  return num;
}

export function StockExplorerClient({ initialStocks, marketOverride, hideMarketTabs = false }: StockExplorerClientProps) {
  const {
    stocks: liveStocks,
    selectedTicker,
    setSelectedTicker,
    selectedMarket: contextMarket,
    setSelectedMarket,
    activeStockModal,
    setActiveStockModal,
    activeNewsModal,
    setActiveNewsModal,
    isSyncing,
    cooldownRemaining,
    refreshAll,
    getNewsByTicker,
    stockPage,
    totalStocksCount,
    setUniverseCount,
    usUniverseCount,
    hasMoreStocks,
    isLoadingMoreStocks,
    loadNextStockChunk,
    tickerFlashMap,
    updateStock,
    updateStocks,
  } = useMarketSync();
  const { t, tDynamic, language } = useLanguage();
  const { user, openAuthModal } = useClientAuth();
  const { currentTier, currentPlan, aiUsageToday, incrementAiUsage, openPricingModal } = useSubscription();

  // AI Stock Analysis State (Localhost Prototype with Smart Cache & Rate Limits)
  const [aiAnalysisMap, setAiAnalysisMap] = useState<Record<string, StockAnalysisResult>>({});
  const [isAnalyzingStock, setIsAnalyzingStock] = useState(false);
  const [aiAnalysisError, setAiAnalysisError] = useState<string | null>(null);
  const [smartCacheHitMap, setSmartCacheHitMap] = useState<Record<string, boolean>>({});

  const handleAnalyzeStockWithAi = async (stock: StockFundamental) => {
    setIsAnalyzingStock(true);
    setAiAnalysisError(null);

    try {
      const res = await fetch('/api/ai/analyze-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: stock.ticker,
          market: stock.market,
          userTier: currentTier,
          stockData: stock,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 429 || data.code === 'RATE_LIMIT_EXCEEDED') {
          setAiAnalysisError(data.error || `โควตาเครดิต AI ประจำวันของแพ็กเกจ ${currentTier.toUpperCase()} เต็มแล้ว`);
        } else {
          setAiAnalysisError(data.error || 'เกิดข้อผิดพลาดในการวิเคราะห์หุ้น กรุณาลองใหม่อีกครั้ง');
        }
        return;
      }

      if (data.data) {
        setAiAnalysisMap((prev) => ({ ...prev, [stock.ticker]: data.data }));
        setSmartCacheHitMap((prev) => ({ ...prev, [stock.ticker]: Boolean(data.cached) }));
        if (!data.cached && typeof data.quota?.creditsUsed === 'number') {
          incrementAiUsage(data.quota.creditsUsed);
        }
      }
    } catch (err) {
      setAiAnalysisError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ AI ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsAnalyzingStock(false);
    }
  };

  // Instant reactive market state (allows live market toggle and direct sorting in ALL view)
  const [localMarket, setLocalMarket] = useState<'ALL' | 'SET' | 'US'>(
    hideMarketTabs && marketOverride ? marketOverride : contextMarket || 'ALL'
  );

  // Trigger login modal if guest scrolls down
  useEffect(() => {
    if (user) return;
    const hasSeenLoginPrompt = sessionStorage.getItem('stockhome_login_prompted');
    if (hasSeenLoginPrompt) return;

    const handleScroll = () => {
      if (window.scrollY > 800) {
        sessionStorage.setItem('stockhome_login_prompted', 'true');
        openAuthModal('login');
        window.removeEventListener('scroll', handleScroll);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [user, openAuthModal]);

  const selectedMarket = hideMarketTabs && marketOverride ? marketOverride : localMarket;

  const handleMarketChange = (m: 'ALL' | 'SET' | 'US') => {
    startTransition(() => {
      setLocalMarket(m);
      setSelectedMarket(m);
      setSelectedTag('ALL');
      setVisibleCount(50);
    });
  };

  useEffect(() => {
    if (hideMarketTabs && marketOverride && contextMarket !== marketOverride) {
      setSelectedMarket(marketOverride);
    }
  }, [hideMarketTabs, marketOverride, contextMarket, setSelectedMarket]);

  const [localExtraStocks, setLocalExtraStocks] = useState<StockFundamental[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState<boolean>(false);
  const [modalStockNews, setModalStockNews] = useState<any[]>([]);
  const [isLoadingModalNews, setIsLoadingModalNews] = useState<boolean>(false);

  // Combine live stocks with any search-fetched extra stocks and strictly guarantee 100% uniqueness
  const stocks = useMemo(() => {
    const base = liveStocks && liveStocks.length > 0 ? liveStocks : initialStocks || [];
    const combined = [...localExtraStocks, ...base];
    const seen = new Set<string>();
    const uniqueList: StockFundamental[] = [];

    for (const item of combined) {
      if (!item || !item.ticker) continue;
      const key = `${(item.market || 'SET').toUpperCase()}-${item.ticker.toUpperCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueList.push(item);
      }
    }
    return uniqueList;
  }, [liveStocks, initialStocks, localExtraStocks]);

  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<StockSortOption>('popular');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [visibleCount, setVisibleCount] = useState<number>(50);
  const [isPending, startTransition] = useTransition();

  // Dynamically resolve market-scoped tag filters
  const availableTags = useMemo(() => getMarketScopedTagFilters(selectedMarket), [selectedMarket]);

  // Reset active tag when market changes to prevent cross-market filter contamination
  useEffect(() => {
    setSelectedTag('ALL');
  }, [selectedMarket]);

  // Memoized pre-parsed metrics for ultra-smooth O(1) sort comparator and tag retrieval
  const stockMetricsMap = useMemo(() => {
    const map = new Map<string, { numVol: number; numCap: number; tags: string[] }>();
    for (const s of stocks) {
      const key = `${s.market}-${s.ticker}`;
      map.set(key, {
        numVol: parseNumericValue(s.volume),
        numCap: parseNumericValue(s.marketCap),
        tags: getStockTags(s)
      });
    }
    return map;
  }, [stocks]);

  const totalStats = useMemo(() => {
    const setCount = setUniverseCount || stocks.filter((s) => s.market === 'SET').length;
    const usCount = usUniverseCount || stocks.filter((s) => s.market === 'US').length;
    return { setCount, usCount, total: totalStocksCount || stocks.length };
  }, [stocks, setUniverseCount, usUniverseCount, totalStocksCount]);

  // Guest Protection: Clicking individual stock pop-up forces Login for guests
  const handleStockClick = useCallback(
    (stock: StockFundamental) => {
      if (!user) {
        openAuthModal('login');
        return;
      }
      setActiveStockModal(stock);
      setSelectedTicker(stock.ticker);
    },
    [user, openAuthModal, setActiveStockModal, setSelectedTicker]
  );

  const availableSectors = useMemo(() => {
    const set = new Set<string>();
    stocks.forEach((s) => set.add(s.sector));
    return ['ALL', ...Array.from(set)];
  }, [stocks]);

  // Fast On-Demand Search Engine: Query Yahoo Finance & Webull directly for real-time tickers
  const performApiSearch = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q) return;
    setIsSearchingApi(true);
    try {
      const res = await fetch(
        `/api/stocks/live?search=${encodeURIComponent(q)}&market=${selectedMarket}&limit=50`
      ).then((r) => (r.ok ? r.json() : null));

      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        setLocalExtraStocks((prev) => {
          const combined = [...res.data, ...prev];
          const seen = new Set<string>();
          return combined.filter((s: StockFundamental) => {
            if (!s || !s.ticker) return false;
            const key = `${(s.market || 'SET').toUpperCase()}-${s.ticker.toUpperCase()}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        });
        setVisibleCount((prev) => Math.max(prev, res.data.length));
      }
    } catch (err) {
      console.warn('[StockExplorer] Search API warning:', err);
    } finally {
      setIsSearchingApi(false);
    }
  }, [selectedMarket]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setLocalExtraStocks([]);
      setIsSearchingApi(false);
      return;
    }

    // Adaptive debounce: 60ms for fast ticker symbols (e.g. SNDK, SPCX, NVDA, PTT), 150ms for longer queries
    const delay = q.length <= 6 && /^[A-Za-z0-9.\-]+$/.test(q) ? 60 : 150;

    const timer = setTimeout(() => {
      performApiSearch(q);
    }, delay);

    return () => clearTimeout(timer);
  }, [searchQuery, performApiSearch]);

  // Prioritized On-Demand Tag Fetcher: If user selects a tag, fetch and display all matching stocks immediately
  useEffect(() => {
    if (selectedTag === 'ALL') return;

    // Immediately expand visible count so all constituents are visible without scrolling
    setVisibleCount(200);

    let isCancelled = false;
    fetch(`/api/stocks/live?tag=${encodeURIComponent(selectedTag)}&market=${selectedMarket}&limit=200&all=true`)
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (!isCancelled && res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setLocalExtraStocks((prev) => {
            const combined = [...res.data, ...prev];
            const seen = new Set<string>();
            return combined.filter((s: StockFundamental) => {
              if (!s || !s.ticker) return false;
              const key = `${(s.market || 'SET').toUpperCase()}-${s.ticker.toUpperCase()}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
          });
        }
      })
      .catch((err) => console.warn('[StockExplorer] Tag fetch warning:', err));

    return () => {
      isCancelled = true;
    };
  }, [selectedTag, selectedMarket]);

  const filteredStocks = useMemo(() => {
    let list = [...stocks];

    if (selectedMarket !== 'ALL') {
      list = list.filter((s) => s.market === selectedMarket);
    }

    if (selectedSector !== 'ALL') {
      list = list.filter((s) => s.sector === selectedSector);
    }

    if (selectedTag !== 'ALL') {
      const targetTag = selectedTag.toLowerCase().trim();
      list = list.filter((s) => {
        const metrics = stockMetricsMap.get(`${s.market}-${s.ticker}`);
        const tags = metrics?.tags || getStockTags(s);
        const tickerUpper = s.ticker.toUpperCase();

        if (targetTag.includes('ipo')) {
          return RECENT_IPOS.has(tickerUpper) || tags.some((t) => t.toLowerCase().includes('ipo'));
        }
        if (targetTag.includes('นางฟ้า') || targetTag.includes('thai 7')) {
          return s.market === 'SET' && (THAI_7_GIANTS.has(tickerUpper) || tags.some((t) => t.toLowerCase().includes('นางฟ้า')));
        }
        if (targetTag.includes('set50') || targetTag.includes('บลูชิพ')) {
          return s.market === 'SET' && (SET50_TICKERS.has(tickerUpper) || tags.some((t) => t.toLowerCase().includes('set50') || t.toLowerCase().includes('blue chip')));
        }
        if (targetTag.includes('set100') || targetTag.includes('หุ้นใหญ่')) {
          return s.market === 'SET' && (SET100_TICKERS.has(tickerUpper) || tags.some((t) => t.toLowerCase().includes('set100') || t.toLowerCase().includes('set50')));
        }
        if (targetTag.includes('sset') || targetTag.includes('mai')) {
          return s.market === 'SET' && (!SET50_TICKERS.has(tickerUpper) && !SET100_TICKERS.has(tickerUpper) || tags.some((t) => t.toLowerCase().includes('sset') || t.toLowerCase().includes('mai')));
        }
        if (targetTag.includes('magnificent') || targetTag.includes('mag 7')) {
          return s.market === 'US' && (MAGNIFICENT_7.has(tickerUpper) || tags.some((t) => t.toLowerCase().includes('magnificent')));
        }
        if (targetTag.includes('dow') || targetTag.includes('djia')) {
          return s.market === 'US' && (DOW_JONES_30.has(tickerUpper) || tags.some((t) => t.toLowerCase().includes('dow')));
        }
        if (targetTag.includes('nasdaq')) {
          return s.market === 'US' && (NASDAQ_100.has(tickerUpper) || tags.some((t) => t.toLowerCase().includes('nasdaq')));
        }
        if (targetTag.includes('s&p') || targetTag.includes('sp500')) {
          return s.market === 'US' && tags.some((t) => t.toLowerCase().includes('s&p') || t.toLowerCase().includes('sp500'));
        }
        return tags.some((t) => t.toLowerCase() === targetTag || t.toLowerCase().includes(targetTag));
      });
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const rawUpper = searchQuery.toUpperCase().trim();
      list = list.filter((s) => {
        if (s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)) return true;
        const tags = stockMetricsMap.get(`${s.market}-${s.ticker}`)?.tags || [];
        return tags.some((t) => t.toLowerCase().includes(q));
      });

      // Boost exact ticker matches to absolute top (rank 1), followed by prefix matches and volume
      list.sort((a, b) => {
        const aExact = a.ticker.toUpperCase() === rawUpper ? 3 : a.ticker.toLowerCase() === q ? 2 : 0;
        const bExact = b.ticker.toUpperCase() === rawUpper ? 3 : b.ticker.toLowerCase() === q ? 2 : 0;
        if (aExact !== bExact) return bExact - aExact;

        const aStarts = a.ticker.toLowerCase().startsWith(q) ? 1 : 0;
        const bStarts = b.ticker.toLowerCase().startsWith(q) ? 1 : 0;
        if (aStarts !== bStarts) return bStarts - aStarts;

        const metricA = stockMetricsMap.get(`${a.market}-${a.ticker}`);
        const metricB = stockMetricsMap.get(`${b.market}-${b.ticker}`);
        return (metricB?.numVol ?? 0) - (metricA?.numVol ?? 0);
      });

      return list;
    }

    // Comprehensive Ultra-Smooth Sorting
    list.sort((a, b) => {
      const metricA = stockMetricsMap.get(`${a.market}-${a.ticker}`);
      const metricB = stockMetricsMap.get(`${b.market}-${b.ticker}`);

      switch (sortBy) {
        case 'popular': {
          const rankA = getStockPopularityRank(a, selectedMarket);
          const rankB = getStockPopularityRank(b, selectedMarket);
          if (rankA !== rankB) return rankA - rankB;

          // Within same tier, sort by Market Cap then Volume
          const capDiff = (metricB?.numCap ?? 0) - (metricA?.numCap ?? 0);
          if (capDiff !== 0) return capDiff;
          return (metricB?.numVol ?? 0) - (metricA?.numVol ?? 0);
        }
        case 'volume': {
          const volDiff = (metricB?.numVol ?? 0) - (metricA?.numVol ?? 0);
          if (volDiff !== 0) return volDiff;
          return (metricB?.numCap ?? 0) - (metricA?.numCap ?? 0);
        }
        case 'marketCap': {
          return (metricB?.numCap ?? 0) - (metricA?.numCap ?? 0);
        }
        case 'gainers':
          return b.change - a.change;
        case 'losers':
          return a.change - b.change;
        case 'aiScore':
          return (b.sentimentScore ?? 50) - (a.sentimentScore ?? 50);
        case 'dividend':
          return (b.dividendYield ?? 0) - (a.dividendYield ?? 0);
        case 'peRatio':
          return (a.peRatio || 999) - (b.peRatio || 999);
        case 'marketThaiFirst': {
          if (a.market !== b.market) {
            return a.market === 'SET' ? -1 : 1;
          }
          return (metricB?.numVol ?? 0) - (metricA?.numVol ?? 0);
        }
        case 'marketUsFirst': {
          if (a.market !== b.market) {
            return a.market === 'US' ? -1 : 1;
          }
          return (metricB?.numVol ?? 0) - (metricA?.numVol ?? 0);
        }
        case 'tickerAsc':
          return a.ticker.localeCompare(b.ticker);
        default:
          return (metricB?.numVol ?? 0) - (metricA?.numVol ?? 0);
      }
    });

    return list;
  }, [stocks, selectedMarket, selectedSector, selectedTag, searchQuery, sortBy, stockMetricsMap]);

  const displayedStocks = useMemo(() => {
    const limit = !user ? 24 : visibleCount;
    return filteredStocks.slice(0, limit);
  }, [filteredStocks, visibleCount, user]);

  // Fetch dedicated live stock news for the active modal from SET IR & Finnhub APIs
  useEffect(() => {
    if (!activeStockModal) {
      setModalStockNews([]);
      return;
    }

    let isCancelled = false;
    setIsLoadingModalNews(true);

    fetch(`/api/news/live?ticker=${encodeURIComponent(activeStockModal.ticker)}&market=${activeStockModal.market}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (!isCancelled && res && res.success && Array.isArray(res.data)) {
          setModalStockNews(res.data);
        }
      })
      .catch((err) => {
        console.warn('[StockExplorer] Modal news fetch warning:', err);
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingModalNews(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [activeStockModal]);

  const stocksRef = useRef(stocks);
  useEffect(() => {
    stocksRef.current = stocks;
  }, [stocks]);

  // Background live quote sync for top active/featured stocks on mount (ensures cards match live modal quotes right away)
  useEffect(() => {
    let isCancelled = false;
    const topSymbols = ['DELTA', 'PTT', 'CPALL', 'AOT', 'KBANK', 'SCB', 'GULF', 'NVDA', 'AAPL', 'MSFT', 'TSLA'];
    fetch(`/api/stocks/parallel?symbols=${topSymbols.join(',')}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (isCancelled || !res?.success || !res.data) return;
        const freshList: StockFundamental[] = [];
        for (const [sym, quote] of Object.entries(res.data as Record<string, any>)) {
          if (!quote || typeof quote.current_price !== 'number') continue;
          const match = stocksRef.current.find((s) => s.ticker.toUpperCase() === sym.toUpperCase());
          if (match) {
            freshList.push({
              ...match,
              price: quote.current_price,
              change: typeof quote.change_percent === 'number' ? quote.change_percent : match.change,
              high52w: quote.high52w || match.high52w,
              low52w: quote.low52w || match.low52w,
            });
          }
        }
        if (freshList.length > 0) {
          updateStocks(freshList);
          setLocalExtraStocks((prev) => {
            const next = [...prev];
            for (const item of freshList) {
              const idx = next.findIndex(
                (s) => s.ticker.toUpperCase() === item.ticker.toUpperCase() && s.market === item.market
              );
              if (idx >= 0) next[idx] = item;
              else next.push(item);
            }
            return next;
          });
        }
      })
      .catch((err) => console.warn('[StockExplorer] Background parallel sync warning:', err));

    return () => {
      isCancelled = true;
    };
  }, [updateStocks]);

  // Fetch real-time live stock quote & fundamentals from Yahoo Finance & Webull when opening modal
  useEffect(() => {
    if (!activeStockModal) return;
    const ticker = activeStockModal.ticker;
    const market = activeStockModal.market;
    let isCancelled = false;

    fetch(`/api/stocks/live?ticker=${encodeURIComponent(ticker)}&market=${market}&forceLive=true`)
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (!isCancelled && res && res.success && res.data) {
          const freshData = res.data as StockFundamental;
          setActiveStockModal(freshData);
          updateStock(freshData);
          setLocalExtraStocks((prev) => {
            const idx = prev.findIndex(
              (s) => s.ticker.toUpperCase() === freshData.ticker.toUpperCase() && s.market === freshData.market
            );
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = freshData;
              return next;
            }
            return [freshData, ...prev];
          });
        }
      })
      .catch((err) => {
        console.warn('[StockExplorer] Live stock quote refresh warning:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [activeStockModal?.ticker, activeStockModal?.market, updateStock]);

  const relatedNews = useMemo(() => {
    if (!activeStockModal) return [];
    if (modalStockNews.length > 0) return modalStockNews;
    return getNewsByTicker(activeStockModal.ticker);
  }, [activeStockModal, modalStockNews, getNewsByTicker]);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset pagination when filter criteria changes (if not filtered by tag)
  useEffect(() => {
    if (selectedTag === 'ALL') {
      setVisibleCount(50);
    }
  }, [selectedMarket, selectedSector, searchQuery, sortBy, selectedTag]);

  // Smooth auto-load on scroll (Only for logged-in members; Guests are capped at 24)
  useEffect(() => {
    if (!sentinelRef.current || !user) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry.isIntersecting &&
          (hasMoreStocks || visibleCount < filteredStocks.length) &&
          !isLoadingMoreStocks
        ) {
          if (visibleCount < filteredStocks.length) {
            setVisibleCount((prev) => prev + 50);
          } else if (hasMoreStocks) {
            loadNextStockChunk();
          }
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinelRef.current);
    return () => {
      observer.disconnect();
    };
  }, [hasMoreStocks, visibleCount, filteredStocks.length, isLoadingMoreStocks, loadNextStockChunk, user]);

  return (
    <div id="stock-explorer-section" style={{ marginBottom: '40px', scrollMarginTop: '80px' }}>
      {/* Control Header & Filters */}
      <div className="glass-card" style={{ padding: '20px', borderRadius: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          {/* Market Region Toggle */}
          {!hideMarketTabs ? (
            <div className="ios-segmented-control" style={{ padding: '3px' }}>
              {(['ALL', 'SET', 'US'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => handleMarketChange(m)}
                  className={`ios-segment-btn ${selectedMarket === m ? 'active' : ''}`}
                  style={{ padding: '6px 18px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {m === 'ALL' ? <Globe size={14} /> : m === 'SET' ? <Landmark size={14} /> : <Building size={14} />}
                  <span>{m === 'ALL' ? t('allMarkets') : m === 'SET' ? t('thaiMarketTab') : t('usMarketTab')}</span>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--card-sub-bg)', padding: '6px 14px', borderRadius: '100px', border: '1px solid var(--card-sub-border)' }}>
              {selectedMarket === 'SET' ? <Landmark size={15} color="#007AFF" /> : selectedMarket === 'US' ? <Building size={15} color="#8B5CF6" /> : <Globe size={15} color="#10B981" />}
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {selectedMarket === 'SET' ? t('thaiStocks') : selectedMarket === 'US' ? t('foreignStocks') : t('allMarkets')}
              </span>
            </div>
          )}

          {/* Quick Sort Shortcuts & View Mode */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div className="ios-segmented-control" style={{ padding: '3px' }}>
              <button
                onClick={() => setSortBy('popular')}
                className={`ios-segment-btn ${sortBy === 'popular' ? 'active' : ''}`}
                style={{ padding: '5px 12px', fontSize: '0.75rem', color: sortBy === 'popular' ? '#FF9500' : undefined, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title="เรียงจากหุ้นยอดนิยมและสภาพคล่องสูงสุด (Default)"
              >
                <Flame size={13} /> ยอดนิยม
              </button>
              <button
                onClick={() => setSortBy('gainers')}
                className={`ios-segment-btn ${sortBy === 'gainers' ? 'active' : ''}`}
                style={{ padding: '5px 12px', fontSize: '0.75rem', color: sortBy === 'gainers' ? 'var(--accent-bullish)' : undefined, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <TrendingUp size={13} /> {t('topGainers')}
              </button>
              <button
                onClick={() => setSortBy('losers')}
                className={`ios-segment-btn ${sortBy === 'losers' ? 'active' : ''}`}
                style={{ padding: '5px 12px', fontSize: '0.75rem', color: sortBy === 'losers' ? 'var(--accent-bearish)' : undefined, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <TrendingDown size={13} /> {t('topLosers')}
              </button>
              <button
                onClick={() => setSortBy('volume')}
                className={`ios-segment-btn ${sortBy === 'volume' ? 'active' : ''}`}
                style={{ padding: '5px 12px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title="เรียงจากปริมาณการซื้อขายสูงสุด"
              >
                <BarChart3 size={13} /> ปริมาณเทรด
              </button>
            </div>

            {/* Live Status & Refresh with Anti-Spam Protection */}
            <button
              onClick={() => refreshAll()}
              disabled={isSyncing || cooldownRemaining > 0}
              title={cooldownRemaining > 0 ? `โปรดรอ ${cooldownRemaining} วินาทีก่อนรีเฟรชอีกครั้ง` : t('refreshData')}
              style={{
                background: 'var(--card-sub-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                padding: '6px 10px',
                color: (isSyncing || cooldownRemaining > 0) ? 'var(--text-tertiary)' : 'var(--accent-bullish)',
                cursor: (isSyncing || cooldownRemaining > 0) ? 'not-allowed' : 'pointer',
                opacity: (isSyncing || cooldownRemaining > 0) ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                transition: 'all 0.15s ease'
              }}
            >
              <Activity size={14} className={isSyncing ? 'animate-spin' : ''} />
              <span>
                {isSyncing
                  ? t('syncing')
                  : cooldownRemaining > 0
                  ? (language === 'en' ? `Wait ${cooldownRemaining}s` : `รออีก ${cooldownRemaining}s`)
                  : t('liveConnected')}
              </span>
            </button>

            <div className="ios-segmented-control" style={{ padding: '3px' }}>
              <button
                onClick={() => setViewMode('grid')}
                className={`ios-segment-btn ${viewMode === 'grid' ? 'active' : ''}`}
                style={{ padding: '5px 8px' }}
                title="Grid View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`ios-segment-btn ${viewMode === 'table' ? 'active' : ''}`}
                style={{ padding: '5px 8px' }}
                title="Table View"
              >
                <TableIcon size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Search, Sector Filter & Comprehensive Sort Dropdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {/* Instant Search Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              performApiSearch(searchQuery);
            }}
            style={{ position: 'relative' }}
          >
            <Search size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'en' ? 'Search stock symbol / company (e.g. SNDK, SPCX, NVDA, PTT)...' : 'ค้นหาชื่อย่อหุ้น หรือบริษัท (เช่น SNDK, SPCX, NVDA, PTT)...'}
              style={{
                width: '100%',
                padding: '10px 36px 10px 38px',
                borderRadius: '12px',
                border: '1px solid var(--input-border)',
                background: 'var(--input-bg)',
                color: 'var(--input-text)',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
            {isSearchingApi && (
              <Activity size={14} className="animate-spin" color="#007AFF" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            )}
            {!isSearchingApi && searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  padding: '2px'
                }}
              >
                <X size={14} />
              </button>
            )}
          </form>

          {/* Sector Filter */}
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid var(--input-border)',
              background: 'var(--input-bg)',
              color: 'var(--input-text)',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {availableSectors.map((s) => (
              <option key={s} value={s} style={{ background: 'var(--glass-bg)', color: 'var(--text-primary)' }}>
                {s === 'ALL' ? t('allSectors') : s}
              </option>
            ))}
          </select>

          {/* Comprehensive Sort Dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              value={sortBy}
              onChange={(e) => {
                const val = e.target.value as StockSortOption;
                startTransition(() => {
                  setSortBy(val);
                });
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid var(--input-border)',
                background: 'var(--input-bg)',
                color: 'var(--input-text)',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              <option value="popular">{language === 'en' ? 'Sort by: Most Popular & Liquidity (Default)' : 'เรียงตาม: หุ้นยอดนิยม & สภาพคล่อง (Default)'}</option>
              <option value="volume">{language === 'en' ? 'Sort by: Highest Trading Volume' : 'เรียงตาม: ปริมาณซื้อขายสูงสุด (Volume)'}</option>
              <option value="marketCap">{language === 'en' ? 'Sort by: Highest Market Cap' : 'เรียงตาม: มูลค่าตลาดสูงสุด (Market Cap)'}</option>
              <option value="gainers">{language === 'en' ? 'Sort by: Top Gainers %' : 'เรียงตาม: บวกสูงสุด (Top Gainers %)'}</option>
              <option value="losers">{language === 'en' ? 'Sort by: Top Losers %' : 'เรียงตาม: ลบมากสุด (Top Losers %)'}</option>
              <option value="aiScore">{language === 'en' ? 'Sort by: Highest AI Sentiment Score' : 'เรียงตาม: คะแนน AI Sentiment สูงสุด'}</option>
              <option value="dividend">{language === 'en' ? 'Sort by: Highest Dividend Yield' : 'เรียงตาม: เงินปันผลสูงสุด (Dividend Yield)'}</option>
              <option value="peRatio">{language === 'en' ? 'Sort by: Lowest P/E Ratio (Value)' : 'เรียงตาม: P/E ต่ำสุด (Value Stocks)'}</option>
              {selectedMarket === 'ALL' && (
                <>
                  <option value="marketThaiFirst">{language === 'en' ? 'Sort by Market: Thai Stocks (SET) First' : 'เรียงตามตลาด: หุ้นไทย (SET) ขึ้นก่อน'}</option>
                  <option value="marketUsFirst">{language === 'en' ? 'Sort by Market: US Stocks (NYSE/NASDAQ) First' : 'เรียงตามตลาด: หุ้นสหรัฐฯ (US) ขึ้นก่อน'}</option>
                </>
              )}
              <option value="tickerAsc">{language === 'en' ? 'Sort by: Symbol A - Z' : 'เรียงตาม: ตัวอักษร A - Z'}</option>
            </select>
          </div>
        </div>

        {/* Popular Curated Tag Filter Bar (Side-scrollable track on mobile PWA) */}
        <div className="mobile-side-scroll" style={{ marginTop: '14px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', overflowX: 'auto' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginRight: '4px', flexShrink: 0 }}>
            <Tag size={13} color="var(--accent-blue)" /> {language === 'en' ? 'Tags:' : 'แท็ก:'}
          </span>
          {availableTags.map((tag) => {
            const isActive = selectedTag === tag.id;
            return (
              <button
                key={tag.id}
                onClick={() => {
                  startTransition(() => {
                    setSelectedTag(tag.id);
                  });
                }}
                style={{
                  flexShrink: 0,
                  background: isActive ? 'var(--accent-blue)' : 'var(--card-sub-bg)',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--accent-blue)' : '1px solid var(--card-sub-border)',
                  borderRadius: '100px',
                  padding: '4px 12px',
                  fontSize: '0.75rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{language === 'en' ? tag.labelEn : tag.labelTh}</span>
              </button>
            );
          })}
        </div>

        {/* Active Tag Filter Notification Banner */}
        {selectedTag !== 'ALL' && (
          <div
            style={{
              marginTop: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(0, 122, 255, 0.12)',
              border: '1px solid rgba(0, 122, 255, 0.3)',
              borderRadius: '10px',
              padding: '6px 12px',
              fontSize: '0.8rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-blue)', fontWeight: 700 }}>
              <Tag size={14} />
              <span>{language === 'en' ? `Filtered by tag: #${selectedTag}` : `กำลังกรองเฉพาะแท็ก: #${selectedTag}`}</span>
            </div>
            <button
              onClick={() => setSelectedTag('ALL')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                fontWeight: 600
              }}
            >
              <X size={13} /> {language === 'en' ? 'Show All' : 'ดูทั้งหมด'}
            </button>
          </div>
        )}
      </div>

      {/* Live Exchange Real-Time Search Loading State (Active Search & No Local Match Yet) */}
      {isSearchingApi && filteredStocks.length === 0 && (
        <div
          className="glass-card"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            borderRadius: '20px',
            background: 'var(--accent-blue-bg)',
            border: '1px solid var(--accent-blue-border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            margin: '20px 0'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(0, 113, 227, 0.15)',
              border: '1px solid var(--accent-blue-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-blue)',
              position: 'relative'
            }}
          >
            <Activity size={30} className="animate-spin" />
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#30d158'
              }}
            />
          </div>

          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
              {language === 'en'
                ? `Searching "${searchQuery.toUpperCase()}" from Live Exchanges...`
                : `กำลังค้นหาหุ้น "${searchQuery.toUpperCase()}" จากตลาดหลักทรัพย์ Real-Time...`}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto', lineHeight: 1.6 }}>
              {language === 'en'
                ? 'Connecting to Yahoo Finance, Webull & SET Data Pipeline to retrieve real-time quotes and verified fundamentals...'
                : 'ระบบกำลังดึงข้อมูลสดจาก Yahoo Finance, Webull และ SET Pipeline กรุณารอสักครู่...'}
            </p>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '100px', background: 'var(--card-sub-bg)', border: '1px solid var(--card-sub-border)', color: 'var(--accent-blue)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span className="live-dot" />
            <span>{language === 'en' ? 'Live Exchange Direct Query' : 'กำลังค้นหาหุ้นจากฐานข้อมูลตลาดหลักทรัพย์'}</span>
          </div>
        </div>
      )}

      {/* Empty State when no matching stocks found (Only when search is NOT in progress) */}
      {!isSearchingApi && filteredStocks.length === 0 && (
        <div
          className="glass-card"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            borderRadius: '20px',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            margin: '20px 0'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(0, 122, 255, 0.12)',
              border: '1px solid rgba(0, 122, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-blue)'
            }}
          >
            <Search size={30} />
          </div>

          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
              {language === 'en'
                ? `No stocks found for "${searchQuery || selectedTag}"`
                : `ไม่พบข้อมูลหุ้นสำหรับ "${searchQuery || selectedTag}"`}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
              {language === 'en'
                ? 'System only retrieves real verified stocks listed on the Stock Exchange of Thailand (SET) or US Markets (NYSE/NASDAQ).'
                : 'ระบบดึงเฉพาะข้อมูลหุ้นจริงที่มีการจดทะเบียนในตลาดหลักทรัพย์แห่งประเทศไทย (SET) และตลาดหุ้นสหรัฐฯ (US) เท่านั้น'}
            </p>
          </div>

          {/* Quick Suggested Tickers */}
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '8px' }}>
              {language === 'en' ? 'Try searching for verified symbols:' : 'ตัวอย่างชื่อย่อหุ้นที่ค้นหาได้:'}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {['SNDK', 'SPCX', 'NVDA', 'AAPL', 'PTT', 'DELTA', 'CPALL', 'BDMS', 'TSLA'].map((suggested) => (
                <button
                  key={suggested}
                  onClick={() => {
                    startTransition(() => {
                      setSearchQuery(suggested);
                      setSelectedMarket('ALL');
                      setSelectedTag('ALL');
                      setSelectedSector('ALL');
                    });
                  }}
                  style={{
                    background: 'var(--card-sub-bg)',
                    border: '1px solid var(--card-sub-border)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--accent-blue)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  ${suggested}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Filters / Clear Search Button */}
          <button
            onClick={() => {
              startTransition(() => {
                setSearchQuery('');
                setSelectedTag('ALL');
                setSelectedSector('ALL');
              });
            }}
            style={{
              marginTop: '12px',
              padding: '10px 20px',
              borderRadius: '12px',
              background: 'var(--accent-blue)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <X size={15} />
            <span>{language === 'en' ? 'Reset Filters & Search' : 'ล้างการค้นหาและตัวกรอง'}</span>
          </button>
        </div>
      )}

      {/* Inline Live Search Status Indicator when results exist but background lookup is syncing */}
      {isSearchingApi && filteredStocks.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '12px',
            background: 'rgba(0, 122, 255, 0.08)',
            border: '1px solid rgba(0, 122, 255, 0.25)',
            marginBottom: '16px',
            fontSize: '0.8rem',
            color: 'var(--accent-blue)',
            fontWeight: 700
          }}
        >
          <Activity size={14} className="animate-spin" />
          <span>
            {language === 'en'
              ? `Syncing live exchange quotes for "${searchQuery.toUpperCase()}"...`
              : `กำลังอัปเดตและตรวจสอบข้อมูลเพิ่มเติมจากตลาดหลักทรัพย์สำหรับ "${searchQuery.toUpperCase()}"...`}
          </span>
        </div>
      )}

      {/* Grid View */}
      {filteredStocks.length > 0 && viewMode === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {displayedStocks.map((stock) => {
            const isUp = stock.change >= 0;
            const isSelected = selectedTicker?.toUpperCase() === stock.ticker.toUpperCase();
            const isExactSearchMatch = searchQuery.trim() !== '' && stock.ticker.toUpperCase() === searchQuery.trim().toUpperCase();
            const flashClass = tickerFlashMap[stock.ticker] === 'up' ? 'price-tick-up' : tickerFlashMap[stock.ticker] === 'down' ? 'price-tick-down' : '';
            return (
              <div
                key={`${stock.market}-${stock.ticker}`}
                className={`glass-card ${flashClass}`}
                onClick={() => handleStockClick(stock)}
                style={{
                  padding: '18px',
                  borderRadius: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                  transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                  border: isExactSearchMatch ? '2px solid var(--accent-blue)' : isSelected ? '2px solid var(--accent-blue)' : '1px solid var(--glass-border)',
                  background: isExactSearchMatch ? 'var(--accent-blue-bg)' : isSelected ? 'var(--accent-blue-bg)' : undefined
                }}
              >
                {/* Header Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {stock.ticker}
                      </span>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: stock.market === 'SET' ? 'rgba(0, 122, 255, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                          color: stock.market === 'SET' ? '#007AFF' : '#8B5CF6',
                          fontWeight: 700,
                        }}
                      >
                        {stock.market}
                      </span>
                      {isExactSearchMatch && (
                        <span
                          style={{
                            fontSize: '0.65rem',
                            padding: '2px 8px',
                            borderRadius: '100px',
                            background: 'rgba(0, 122, 255, 0.25)',
                            color: '#007AFF',
                            fontWeight: 800,
                            border: '1px solid rgba(0, 122, 255, 0.5)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          🎯 {language === 'en' ? 'Exact Match' : 'ผลการค้นหาตรงกัน'}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {stock.name}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div 
                      style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}
                    >
                      {stock.currency === 'THB' ? '฿' : '$'}
                      {(Number(stock.price) || 0).toFixed(2)}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '2px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: isUp ? 'var(--accent-bullish)' : 'var(--accent-bearish)',
                      }}
                    >
                      {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      <span>{isUp ? '+' : ''}{(Number(stock.change) || 0).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>

                {/* Sparkline & Metrics */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.15)', padding: '8px 12px', borderRadius: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>P/E Ratio</div>
                    {!user ? (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          openAuthModal('login');
                        }}
                        style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}
                        title={language === 'en' ? 'Sign in to unlock P/E Ratio' : 'เข้าสู่ระบบเพื่อปลดล็อกค่า P/E'}
                      >
                        <span style={{ filter: 'blur(4px)', userSelect: 'none' }}>{stock.peRatio}x</span>
                        <Lock size={10} color="#007AFF" />
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stock.peRatio}x</div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{t('colMarketCap')}</div>
                    {!user ? (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          openAuthModal('login');
                        }}
                        style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}
                        title={language === 'en' ? 'Sign in to unlock Market Cap' : 'เข้าสู่ระบบเพื่อปลดล็อกมูลค่าตลาด'}
                      >
                        <span style={{ filter: 'blur(4px)', userSelect: 'none' }}>{stock.marketCap}</span>
                        <Lock size={10} color="#007AFF" />
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stock.marketCap}</div>
                    )}
                  </div>
                  <div>
                    <Sparkline data={stock.sparkline7d} isPositive={isUp} width={90} height={28} />
                  </div>
                </div>

                {/* Smart Tags & AI Insight Tag */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                    {(stockMetricsMap.get(`${stock.market}-${stock.ticker}`)?.tags || getStockTags(stock)).slice(0, 2).map((tg) => (
                      <span
                        key={tg}
                        onClick={(e) => {
                          e.stopPropagation();
                          startTransition(() => {
                            setSelectedTag(tg);
                          });
                        }}
                        title={language === 'en' ? `Filter by #${tg}` : `คลิกเพื่อกรองเฉพาะหุ้นแท็ก #${tg}`}
                        style={{
                          fontSize: '0.65rem',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          background: tg.includes('SET50') || tg.includes('Magnificent') || tg.includes('นางฟ้า') ? 'rgba(0, 122, 255, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                          color: tg.includes('SET50') || tg.includes('Magnificent') || tg.includes('นางฟ้า') ? '#007AFF' : 'var(--text-secondary)',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: '1px solid rgba(255, 255, 255, 0.08)'
                        }}
                      >
                        #{tg}
                      </span>
                    ))}
                  </div>

                  {!user ? (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        openAuthModal('login');
                      }}
                      title={language === 'en' ? 'Sign in to unlock AI Score' : 'เข้าสู่ระบบเพื่อปลดล็อกคะแนน AI'}
                      style={{
                        background: 'rgba(0, 122, 255, 0.1)',
                        color: 'var(--accent-blue)',
                        padding: '2px 8px',
                        borderRadius: '100px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        border: '1px solid rgba(0, 122, 255, 0.25)',
                      }}
                    >
                      <Sparkles size={11} /> AI <span style={{ filter: 'blur(4px)', userSelect: 'none' }}>{stock.sentimentScore}</span>/100 <Lock size={10} />
                    </span>
                  ) : (
                    <span
                      style={{
                        background: 'rgba(0, 122, 255, 0.1)',
                        color: 'var(--accent-blue)',
                        padding: '2px 8px',
                        borderRadius: '100px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <Sparkles size={11} /> AI {stock.sentimentScore}/100
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {filteredStocks.length > 0 && viewMode === 'table' && (
        <div className="glass-card" style={{ overflowX: 'auto', borderRadius: '18px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-tertiary)' }}>
                <th style={{ padding: '14px 16px' }}>{t('colTickerName')}</th>
                <th style={{ padding: '14px 16px' }}>{t('colPrice')}</th>
                <th style={{ padding: '14px 16px' }}>{t('col24hChange')}</th>
                <th style={{ padding: '14px 16px' }}>{t('colMarketCap')}</th>
                <th style={{ padding: '14px 16px' }}>P/E</th>
                <th style={{ padding: '14px 16px' }}>{t('colDivYield')}</th>
                <th style={{ padding: '14px 16px' }}>{t('colAnalyst')}</th>
                <th style={{ padding: '14px 16px' }}>{t('colTrend7d')}</th>
              </tr>
            </thead>
            <tbody>
              {displayedStocks.map((stock) => {
                const isUp = stock.change >= 0;
                const isSelected = selectedTicker?.toUpperCase() === stock.ticker.toUpperCase();
                const isExactSearchMatch = searchQuery.trim() !== '' && stock.ticker.toUpperCase() === searchQuery.trim().toUpperCase();
                const flashClass = tickerFlashMap[stock.ticker] === 'up' ? 'price-tick-up' : tickerFlashMap[stock.ticker] === 'down' ? 'price-tick-down' : '';
                return (
                  <tr
                    key={`${stock.market}-${stock.ticker}`}
                    className={flashClass}
                    onClick={() => handleStockClick(stock)}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                      background: isExactSearchMatch ? 'rgba(0, 122, 255, 0.18)' : isSelected ? 'rgba(0, 122, 255, 0.12)' : undefined
                    }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{stock.ticker}</span>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background: stock.market === 'SET' ? 'rgba(0, 122, 255, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                            color: stock.market === 'SET' ? '#007AFF' : '#8B5CF6',
                            fontWeight: 700,
                          }}
                        >
                          {stock.market}
                        </span>
                        {isExactSearchMatch && (
                          <span
                            style={{
                              fontSize: '0.62rem',
                              padding: '1px 6px',
                              borderRadius: '100px',
                              background: 'rgba(0, 122, 255, 0.25)',
                              color: '#007AFF',
                              fontWeight: 800,
                              border: '1px solid rgba(0, 122, 255, 0.5)'
                            }}
                          >
                            🎯 {language === 'en' ? 'Match' : 'ตรงกัน'}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{stock.name}</div>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                        {(stockMetricsMap.get(`${stock.market}-${stock.ticker}`)?.tags || getStockTags(stock)).slice(0, 2).map((tg) => (
                          <span
                            key={tg}
                            onClick={(e) => {
                              e.stopPropagation();
                              startTransition(() => {
                                setSelectedTag(tg);
                              });
                            }}
                            title={language === 'en' ? `Filter by #${tg}` : `กรองเฉพาะหุ้นแท็ก #${tg}`}
                            style={{
                              fontSize: '0.62rem',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: 'rgba(255, 255, 255, 0.06)',
                              color: 'var(--text-secondary)',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            #{tg}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td 
                      style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}
                    >
                      {stock.currency === 'THB' ? '฿' : '$'}
                      {(Number(stock.price) || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontWeight: 700,
                          color: isUp ? 'var(--accent-bullish)' : 'var(--accent-bearish)',
                        }}
                      >
                        {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {isUp ? '+' : ''}
                        {(Number(stock.change) || 0).toFixed(2)}%
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                      {!user ? (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            openAuthModal('login');
                          }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                          title={language === 'en' ? 'Sign in to unlock Market Cap' : 'เข้าสู่ระบบเพื่อปลดล็อกมูลค่าตลาด'}
                        >
                          <span style={{ filter: 'blur(4px)', userSelect: 'none' }}>{stock.marketCap}</span>
                          <Lock size={11} color="#007AFF" />
                        </span>
                      ) : (
                        stock.marketCap
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                      {!user ? (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            openAuthModal('login');
                          }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                          title={language === 'en' ? 'Sign in to unlock P/E Ratio' : 'เข้าสู่ระบบเพื่อปลดล็อกค่า P/E'}
                        >
                          <span style={{ filter: 'blur(4px)', userSelect: 'none' }}>{stock.peRatio}x</span>
                          <Lock size={11} color="#007AFF" />
                        </span>
                      ) : (
                        `${stock.peRatio}x`
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                      {!user ? (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            openAuthModal('login');
                          }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                          title={language === 'en' ? 'Sign in to unlock Dividend Yield' : 'เข้าสู่ระบบเพื่อปลดล็อกปันผล'}
                        >
                          <span style={{ filter: 'blur(4px)', userSelect: 'none' }}>{stock.dividendYield}%</span>
                          <Lock size={11} color="#007AFF" />
                        </span>
                      ) : (
                        `${stock.dividendYield}%`
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 700,
                          color:
                            stock.analystRating === 'Strong Buy' || stock.analystRating === 'Buy'
                              ? 'var(--accent-bullish)'
                              : stock.analystRating === 'Sell'
                              ? 'var(--accent-bearish)'
                              : 'var(--accent-neutral)',
                        }}
                      >
                        <Award size={14} />
                        {stock.analystRating}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <Sparkline data={stock.sparkline7d} isPositive={isUp} width={80} height={24} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Progressive Loading Status Bar */}
      {filteredStocks.length > 0 && (
        <div
          className="glass-card"
          style={{
            marginTop: '20px',
            padding: '14px 20px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span>
              {!user && filteredStocks.length > 24 ? (
                language === 'en' ? (
                  <>Showing <strong style={{ color: 'var(--text-primary)' }}>{displayedStocks.length}</strong> of <strong style={{ color: '#007AFF' }}>{filteredStocks.length}</strong> stocks <span style={{ color: '#007AFF', fontWeight: 700 }}>(Guest Preview)</span></>
                ) : (
                  <>แสดง <strong style={{ color: 'var(--text-primary)' }}>{displayedStocks.length}</strong> จาก <strong style={{ color: '#007AFF' }}>{filteredStocks.length}</strong> หุ้น <span style={{ color: '#007AFF', fontWeight: 700 }}>(สิทธิ์ Guest ดูตัวอย่าง)</span></>
                )
              ) : (
                language === 'en' ? (
                  <>Showing <strong style={{ color: 'var(--text-primary)' }}>{displayedStocks.length}</strong> stocks</>
                ) : (
                  <>แสดง <strong style={{ color: 'var(--text-primary)' }}>{displayedStocks.length}</strong> หุ้น</>
                )
              )}
            </span>
          </div>
        </div>
      )}

      {/* Guest Paywall Barrier Card (Shown at the bottom when not logged in) */}
      {!user && filteredStocks.length > 24 && (
        <div
          className="glass-card"
          style={{
            marginTop: '20px',
            padding: '32px 24px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)',
            border: '1px solid rgba(0, 122, 255, 0.35)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 8px 32px rgba(0, 122, 255, 0.15)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(0, 122, 255, 0.2)',
              border: '1px solid rgba(0, 122, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#007AFF',
            }}
          >
            <Lock size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
              {language === 'en'
                ? `Sign in to unlock all ${filteredStocks.length}+ stocks & full financial analytics`
                : `เข้าสู่ระบบเพื่อดูหุ้นทั้งหมด ${filteredStocks.length}+ ตัว และตัวชี้วัดทางการเงินเชิงลึก`}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '540px', margin: '0 auto', lineHeight: 1.6 }}>
              {language === 'en'
                ? 'Create a free account to access real-time SET & US quotes, deep financial ratios (P/E, Dividend Yield, Market Cap), AI intelligence scores, and portfolio tracking.'
                : 'สมัครสมาชิกฟรีเพื่อปลดล็อกข้อมูลหุ้นไทยและต่างประเทศครบทุกตัว อัตราส่วนทางการเงินเชิงลึก (P/E, ปันผล, มูลค่าตลาด), คะแนนวิเคราะห์ AI และระบบบันทึกหุ้นโปรด'}
            </p>
          </div>
          <button
            onClick={() => openAuthModal('login')}
            className="ios-btn-primary"
            style={{
              padding: '12px 28px',
              borderRadius: '14px',
              fontSize: '0.95rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0, 122, 255, 0.4)',
            }}
          >
            <LogIn size={18} />
            <span>{language === 'en' ? 'Sign In / Register Free' : 'เข้าสู่ระบบ / สมัครสมาชิกฟรี'}</span>
          </button>
        </div>
      )}

      {/* Smooth Infinite Scroll Sentinel (Only for Logged-In Members) */}
      {user && (hasMoreStocks || visibleCount < filteredStocks.length) && filteredStocks.length > 0 && (
        <div
          ref={sentinelRef}
          style={{
            marginTop: '16px',
            padding: '16px 20px',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            textAlign: 'center',
          }}
        >
          {isLoadingMoreStocks ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#007AFF', fontSize: '0.85rem', fontWeight: 600 }}>
              <Activity size={16} className="animate-spin" />
              <span>{language === 'en' ? 'Loading more stocks...' : 'กำลังโหลดข้อมูลหุ้นเพิ่มเติม...'}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
              <span>{language === 'en' ? 'Scroll down to load more' : 'เลื่อนลงเพื่อดูหุ้นเพิ่มเติม'}</span>
            </div>
          )}
        </div>
      )}

      {/* Reached End State (Only for Logged-In Members) */}
      {user && !hasMoreStocks && visibleCount >= filteredStocks.length && filteredStocks.length > 0 && (
        <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
          {language === 'en' ? `✓ All matching stocks loaded (${displayedStocks.length} stocks)` : `✓ โหลดข้อมูลหุ้นครบถ้วนตามเงื่อนไขที่ค้นหาแล้ว (${displayedStocks.length} หุ้น)`}
        </div>
      )}

      {/* Stock Detail Sheet / Modal */}
      {activeStockModal && (
        <div className="ios-sheet-overlay" onClick={() => setActiveStockModal(null)}>
          <div className="ios-sheet-content" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '85vh', overflowY: 'auto', position: 'relative' }}>
            <div style={{ width: '40px', height: '4px', background: 'var(--text-tertiary)', borderRadius: '100px', margin: '0 auto 20px auto', opacity: 0.5 }} />

            {!user ? (
              <div style={{ padding: '24px 16px 36px 16px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                  <button
                    onClick={() => setActiveStockModal(null)}
                    style={{
                      background: 'var(--card-sub-bg)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                    border: '1px solid rgba(0, 122, 255, 0.35)',
                    display: 'grid',
                    placeItems: 'center',
                    margin: '0 auto 18px auto',
                    boxShadow: '0 8px 32px rgba(0, 122, 255, 0.2)',
                  }}
                >
                  <Lock size={32} color="var(--accent-blue)" />
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '100px',
                    background: 'rgba(0, 122, 255, 0.1)',
                    border: '1px solid rgba(0, 122, 255, 0.25)',
                    color: 'var(--accent-blue)',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    marginBottom: '14px',
                  }}
                >
                  <Sparkles size={13} /> {language === 'en' ? 'Stock Intelligence • Login Required' : 'สิทธิพิเศษเฉพาะสมาชิก StockHomeTH'}
                </div>

                <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
                  {language === 'en' ? `Sign In to View ${activeStockModal.ticker}` : `เข้าสู่ระบบเพื่อดูข้อมูลเจาะลึก ${activeStockModal.ticker}`}
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 26px auto', lineHeight: 1.6 }}>
                  {language === 'en'
                    ? 'Access deep financial fundamentals, real-time P/E & dividend ratios, 52-week price range, and AI stock valuations for free.'
                    : 'ปลดล็อกข้อมูลงบการเงินย้อนหลัง ค่า P/E อัตราเงินปันผล กราฟราคา Real-time และ AI วิเคราะห์กลยุทธ์การลงทุนรายตัวฟรี เพียงเข้าสู่ระบบ'}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '320px', margin: '0 auto' }}>
                  <button
                    onClick={() => {
                      setActiveStockModal(null);
                      openAuthModal('login');
                    }}
                    style={{
                      padding: '13px 24px',
                      borderRadius: '14px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #007AFF 0%, #3b82f6 100%)',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 8px 24px -4px rgba(0, 122, 255, 0.4)',
                    }}
                  >
                    <Zap size={18} /> {language === 'en' ? 'Sign In with Google / Email' : 'เข้าสู่ระบบด้วย Google / Email'}
                  </button>
                  <button
                    onClick={() => {
                      setActiveStockModal(null);
                      openAuthModal('register');
                    }}
                    style={{
                      padding: '11px 20px',
                      borderRadius: '12px',
                      border: '1px solid var(--glass-border)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {language === 'en' ? 'Create Free Account' : 'สมัครสมาชิกใหม่ (ฟรี)'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{activeStockModal.ticker}</span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: activeStockModal.market === 'SET' ? 'rgba(0, 122, 255, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                    color: activeStockModal.market === 'SET' ? '#007AFF' : '#8B5CF6',
                    fontWeight: 700,
                  }}
                >
                  {activeStockModal.market}
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{activeStockModal.name}</span>
              </div>
              <button
                onClick={() => setActiveStockModal(null)}
                style={{
                  background: 'var(--card-sub-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Price Banner */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '20px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                {activeStockModal.currency === 'THB' ? '฿' : '$'}
                {(Number(activeStockModal.price) || 0).toFixed(2)}
              </span>
              <span
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: Number(activeStockModal.change) >= 0 ? 'var(--accent-bullish)' : 'var(--accent-bearish)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {Number(activeStockModal.change) >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                {Number(activeStockModal.change) >= 0 ? '+' : ''}
                {(Number(activeStockModal.change) || 0).toFixed(2)}%
              </span>

              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: '0.68rem',
                  padding: '3px 8px',
                  borderRadius: '100px',
                  background: 'var(--accent-bullish-bg)',
                  color: 'var(--accent-bullish)',
                  border: '1px solid var(--accent-bullish-border)',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="เชื่อมต่อดึงข้อมูลสดคู่ขนานจาก Yahoo Finance & Webull OpenAPI"
              >
                <span className="live-pulse-dot" style={{ width: '5px', height: '5px' }} />
                {activeStockModal.market === 'SET' ? 'SET IR & Yahoo Live' : 'Yahoo & Webull Live'}
              </span>
            </div>

            {/* 52-Week Price Range Indicator */}
            <div style={{ background: 'var(--card-sub-bg)', padding: '14px 18px', borderRadius: '16px', border: '1px solid var(--card-sub-border)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                  {language === 'en' ? '52-Week Price Range' : 'กรอบราคารอบ 52 สัปดาห์ (52W Low - High)'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                  {activeStockModal.currency === 'THB' ? '฿' : '$'}{(Number(activeStockModal.low52w) || 0).toFixed(2)} - {activeStockModal.currency === 'THB' ? '฿' : '$'}{(Number(activeStockModal.high52w) || 0).toFixed(2)}
                </span>
              </div>
              <div style={{ position: 'relative', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '100px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, Math.max(5, (((Number(activeStockModal.price) || 0) - (Number(activeStockModal.low52w) || 0)) / Math.max(1, (Number(activeStockModal.high52w) || 0) - (Number(activeStockModal.low52w) || 0))) * 100))}%`,
                    background: 'var(--accent-blue)',
                    borderRadius: '100px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                <span>52W Low: {activeStockModal.currency === 'THB' ? '฿' : '$'}{(Number(activeStockModal.low52w) || 0).toFixed(2)}</span>
                <span>52W High: {activeStockModal.currency === 'THB' ? '฿' : '$'}{(Number(activeStockModal.high52w) || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Fundamental Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--card-sub-bg)', padding: '12px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{t('colMarketCap')}</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{activeStockModal.marketCap}</div>
              </div>
              <div style={{ background: 'var(--card-sub-bg)', padding: '12px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>P/E Ratio</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{activeStockModal.peRatio}x</div>
              </div>
              <div style={{ background: 'var(--card-sub-bg)', padding: '12px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{t('colDivYield')}</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{activeStockModal.dividendYield}%</div>
              </div>
              <div style={{ background: 'var(--card-sub-bg)', padding: '12px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>24h Volume</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{activeStockModal.volume}</div>
              </div>
              <div style={{ background: 'var(--card-sub-bg)', padding: '12px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{t('colAnalyst')}</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-bullish)', marginTop: '2px' }}>{activeStockModal.analystRating}</div>
              </div>
              <div style={{ background: 'var(--card-sub-bg)', padding: '12px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{language === 'en' ? 'Target Price' : 'ราคาเป้าหมาย'}</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-blue)', marginTop: '2px' }}>{activeStockModal.currency === 'THB' ? '฿' : '$'}{(Number(activeStockModal.targetPrice) || 0).toFixed(2)}</div>
              </div>
            </div>

            {/* Smart Tags in Modal Sheet */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Tag size={13} color="var(--accent-blue)" /> {language === 'en' ? 'Tags:' : 'หมวดแท็ก:'}
              </span>
              {(stockMetricsMap.get(`${activeStockModal.market}-${activeStockModal.ticker}`)?.tags || getStockTags(activeStockModal)).map((tg) => (
                <span
                  key={tg}
                  onClick={() => {
                    setActiveStockModal(null);
                    startTransition(() => {
                      setSelectedTag(tg);
                    });
                  }}
                  title={language === 'en' ? `Filter stocks with #${tg}` : `คลิกเพื่อกรองหุ้นแท็ก #${tg}`}
                  style={{
                    fontSize: '0.72rem',
                    padding: '3px 10px',
                    borderRadius: '100px',
                    background: tg.includes('SET50') || tg.includes('Magnificent') || tg.includes('นางฟ้า') ? 'rgba(0, 122, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                    color: tg.includes('SET50') || tg.includes('Magnificent') || tg.includes('นางฟ้า') ? '#007AFF' : 'var(--text-primary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '1px solid var(--glass-border)',
                  }}
                >
                  #{tg}
                </span>
              ))}
            </div>

            {/* Interactive Gemini 1.5 Flash AI Stock Analysis Card */}
            {(() => {
              const currentAnalysis = aiAnalysisMap[activeStockModal.ticker];
              const isCachedToday = smartCacheHitMap[activeStockModal.ticker];
              const remainingCredits = Math.max(0, currentPlan.limits.aiOnDemandDailyLimit - aiUsageToday);

              return (
                <div
                  style={{
                    background: 'linear-gradient(180deg, rgba(0, 122, 255, 0.08) 0%, rgba(18, 18, 22, 0.9) 100%)',
                    border: '1px solid rgba(0, 122, 255, 0.25)',
                    borderRadius: '18px',
                    padding: '18px 20px',
                    marginBottom: '22px',
                    position: 'relative',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  {/* Header & Quota Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)', fontWeight: 800, fontSize: '0.95rem' }}>
                      <Bot size={18} />
                      <span>{language === 'en' ? 'AI Stock Intelligence' : 'AI วิเคราะห์หุ้นเจาะลึก'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isCachedToday && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '100px',
                            background: 'rgba(34, 197, 94, 0.15)',
                            color: 'var(--accent-bullish)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Zap size={11} /> Smart Cache (0 เครดิต)
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '100px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--glass-border)',
                        }}
                      >
                        โควตา AI วันนี้: <b style={{ color: remainingCredits > 0 ? 'var(--accent-blue)' : '#ef4444' }}>{aiUsageToday}/{currentPlan.limits.aiOnDemandDailyLimit}</b> ครั้ง ({currentPlan.name})
                      </span>
                    </div>
                  </div>

                  {/* Quota Error Banner */}
                  {aiAnalysisError && (
                    <div
                      style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '12px',
                        padding: '12px 14px',
                        marginBottom: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fca5a5', fontSize: '0.82rem', fontWeight: 600 }}>
                        <AlertTriangle size={16} color="#ef4444" />
                        <span>{aiAnalysisError}</span>
                      </div>
                      <button
                        onClick={openPricingModal}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'var(--accent-blue)',
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        ⚡ อัปเกรดรับโควตาเพิ่ม
                      </button>
                    </div>
                  )}

                  {/* Analysis Result or Trigger Button */}
                  {currentAnalysis ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn 0.2s ease-out' }}>
                      {/* Valuation & Rating Row */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '10px',
                          padding: '12px 14px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: 900,
                              padding: '4px 10px',
                              borderRadius: '8px',
                              background:
                                currentAnalysis.rating === 'STRONG_BUY'
                                  ? 'rgba(34, 197, 94, 0.25)'
                                  : currentAnalysis.rating === 'BUY'
                                  ? 'rgba(16, 185, 129, 0.2)'
                                  : currentAnalysis.rating === 'HOLD'
                                  ? 'rgba(234, 179, 8, 0.2)'
                                  : 'rgba(239, 68, 68, 0.2)',
                              color:
                                currentAnalysis.rating === 'STRONG_BUY' || currentAnalysis.rating === 'BUY'
                                  ? 'var(--accent-bullish)'
                                  : currentAnalysis.rating === 'HOLD'
                                  ? '#eab308'
                                  : '#ef4444',
                              border: '1px solid currentColor',
                            }}
                          >
                            {currentAnalysis.rating.replace('_', ' ')}
                          </span>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            เป้าหมาย Fair Value: <b style={{ color: 'var(--text-primary)' }}>{currentAnalysis.currency === 'THB' ? '฿' : '$'}{currentAnalysis.fairValueEstimate.targetPrice.toFixed(2)}</b> ({currentAnalysis.fairValueEstimate.upsidePercent >= 0 ? '+' : ''}{currentAnalysis.fairValueEstimate.upsidePercent}% Upside)
                          </span>
                        </div>

                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          AI Confidence: <b style={{ color: 'var(--accent-blue)' }}>{currentAnalysis.confidenceScore}%</b>
                        </div>
                      </div>

                      {/* Summary */}
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                        {currentAnalysis.summary}
                      </p>

                      {/* 2-Col Strengths & Risks */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                        {/* Strengths */}
                        <div style={{ background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.15)', borderRadius: '12px', padding: '10px 12px' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-bullish)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={13} /> จุดเด่นเชิงพื้นฐาน
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {currentAnalysis.keyStrengths.map((s, idx) => (
                              <li key={idx} style={{ marginBottom: '4px' }}>{s}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Risks */}
                        <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '12px', padding: '10px 12px' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f87171', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={13} /> ปัจจัยเสี่ยงที่ต้องติดตาม
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {currentAnalysis.keyRisks.map((r, idx) => (
                              <li key={idx} style={{ marginBottom: '4px' }}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Technical & Verdict Box */}
                      <div
                        style={{
                          background: 'rgba(0, 122, 255, 0.06)',
                          borderRadius: '12px',
                          border: '1px solid rgba(0, 122, 255, 0.15)',
                          padding: '10px 14px',
                          fontSize: '0.8rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                      >
                        <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                          📊 กราฟ & เทคนิค: <span style={{ color: currentAnalysis.technicalInsight.trend === 'BULLISH' ? 'var(--accent-bullish)' : '#eab308' }}>{currentAnalysis.technicalInsight.trend}</span> • แนวรับ {currentAnalysis.currency === 'THB' ? '฿' : '$'}{currentAnalysis.technicalInsight.supportLevel} • แนวต้าน {currentAnalysis.currency === 'THB' ? '฿' : '$'}{currentAnalysis.technicalInsight.resistanceLevel}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                          🎯 <b>กลยุทธ์:</b> {currentAnalysis.actionableVerdict}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 14px 0' }}>
                        {tDynamic(activeStockModal.aiInsight || activeStockModal.description)}
                      </p>

                      <button
                        disabled={isAnalyzingStock}
                        onClick={() => handleAnalyzeStockWithAi(activeStockModal)}
                        style={{
                          width: '100%',
                          padding: '11px 18px',
                          borderRadius: '12px',
                          border: 'none',
                          background: 'linear-gradient(90deg, #007AFF 0%, #3B82F6 100%)',
                          color: '#ffffff',
                          fontSize: '0.88rem',
                          fontWeight: 800,
                          cursor: isAnalyzingStock ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          boxShadow: '0 4px 16px rgba(0, 122, 255, 0.3)',
                          transition: 'all 0.2s',
                        }}
                      >
                        {isAnalyzingStock ? (
                          <>
                            <Loader2 size={16} className="spin" /> {language === 'en' ? 'Processing AI analysis...' : 'กำลังประมวลผลการวิเคราะห์ด้วย AI...'}
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} /> สั่ง AI วิเคราะห์เจาะลึกงบ & เทคนิค ${activeStockModal.ticker}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Dedicated Stock-Specific News & Filings Feed */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Newspaper size={16} color="#8B5CF6" />
                  <span>{language === 'en' ? `Live News & Intelligence for $${activeStockModal.ticker}` : `ข่าวสาร & สารสนเทศสดของหุ้น $${activeStockModal.ticker}`}</span>
                </h4>
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '3px 10px',
                    borderRadius: '100px',
                    background: activeStockModal.market === 'SET' ? 'rgba(0, 122, 255, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                    color: activeStockModal.market === 'SET' ? '#007AFF' : '#8B5CF6',
                    fontWeight: 700,
                    border: '1px solid var(--glass-border)'
                  }}
                >
                  {activeStockModal.market === 'SET' ? 'SET IR & Thai Media' : 'Finnhub & SEC Filings'}
                </span>
              </div>

              {isLoadingModalNews ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                  <div className="spin" style={{ display: 'inline-block', marginBottom: '8px' }}>
                    <Activity size={18} color="var(--accent-blue)" />
                  </div>
                  <div>{language === 'en' ? 'Fetching live real-time stock news & disclosures...' : 'กำลังดึงข่าวสารและสารสนเทศสดจากระบบตลาดทุน...'}</div>
                </div>
              ) : relatedNews.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', background: 'var(--card-sub-bg)', borderRadius: '14px', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                  {language === 'en' ? `No recent breaking news for $${activeStockModal.ticker}` : `ยังไม่มีข่าวด่วนหรือรายงานใหม่ของ $${activeStockModal.ticker}`}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {relatedNews.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setActiveStockModal(null);
                        setActiveNewsModal(item);
                      }}
                      style={{
                        padding: '14px 16px',
                        background: 'var(--card-sub-bg)',
                        borderRadius: '14px',
                        border: '1px solid var(--card-sub-border)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      className="stock-news-mini-card"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '6px' }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                          {tDynamic(item.title)}
                        </div>
                        {item.sentiment && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              flexShrink: 0,
                              background: item.sentiment === 'bullish' ? 'rgba(0, 230, 118, 0.15)' : item.sentiment === 'bearish' ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                              color: item.sentiment === 'bullish' ? '#00E676' : item.sentiment === 'bearish' ? '#FF3B30' : 'var(--text-secondary)'
                            }}
                          >
                            {item.sentiment === 'bullish' ? (language === 'en' ? 'Bullish' : 'เชิงบวก') : item.sentiment === 'bearish' ? (language === 'en' ? 'Bearish' : 'เชิงลบ') : (language === 'en' ? 'Neutral' : 'ทรงตัว')}
                          </span>
                        )}
                      </div>

                      {item.summary && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                          {tDynamic(item.summary.slice(0, 140))}...
                        </p>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                          {item.source} • {tDynamic(item.date || item.periodLabel || 'วันนี้')}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {(item.link || item.sourceUrl) && (
                            <a
                              href={item.link || item.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '0.72rem',
                                color: 'var(--accent-blue)',
                                textDecoration: 'none',
                                fontWeight: 700
                              }}
                            >
                              <span>{language === 'en' ? 'Original Source' : 'เปิดอ่านต้นฉบับ'}</span>
                              <ExternalLink size={11} />
                            </a>
                          )}
                          <ChevronRight size={14} color="var(--text-tertiary)" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live Yahoo Finance Source Verification */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
              <a
                href={`https://finance.yahoo.com/quote/${activeStockModal.market === 'SET' ? `${activeStockModal.ticker}.BK` : activeStockModal.ticker}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  background: 'var(--card-sub-bg)',
                  border: '1px solid var(--card-sub-border)',
                  color: 'var(--accent-blue)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <ExternalLink size={16} />
                <span>{language === 'en' ? `Verify Real-Time Quotes on Yahoo Finance (${activeStockModal.ticker})` : `ตรวจสอบข้อมูลสดบน Yahoo Finance (${activeStockModal.ticker})`}</span>
              </a>
            </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

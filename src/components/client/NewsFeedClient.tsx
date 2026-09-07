'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { StockNewsItem } from '../../lib/schemas/newsSchema';
import { useMarketSync } from '../../lib/context/MarketSyncContext';
import { useLanguage } from '../../lib/context/LanguageContext';
import { MarketFilterBar } from './MarketFilterBar';
import { NewsCard } from './NewsCard';
import { NewsDetailSheet } from './NewsDetailSheet';
import { useStockFilters } from '../../lib/hooks/useStockFilters';
import { generateAiNewsAction } from '../../lib/actions/newsActions';
import { Sparkles, RotateCcw, X, Target, Newspaper, Calendar, Search, TrendingUp, ShieldCheck, Zap, Activity, ChevronDown, CheckCircle2, Landmark, Globe, Lock, LogIn, Crown } from 'lucide-react';
import { useClientAuth } from '../../lib/context/ClientAuthContext';

interface NewsFeedClientProps {
  initialNews?: StockNewsItem[];
}

const POPULAR_THAI_TICKERS = ['PTT', 'CPALL', 'DELTA', 'KBANK', 'AOT', 'ADVANC', 'GULF', 'BDMS', 'SCB', 'TRUE'];
const POPULAR_US_TICKERS = ['NVDA', 'AAPL', 'TSLA', 'MSFT', 'GOOGL', 'META', 'AMZN', 'AMD'];
const ITEMS_PER_BATCH = 5;

export function NewsFeedClient({ initialNews }: NewsFeedClientProps) {
  const {
    news: liveNews,
    selectedTicker,
    setSelectedTicker,
  } = useMarketSync();
  const { t, tDynamic, language } = useLanguage();
  const { user, openAuthModal } = useClientAuth();

  const [dailyNewsList, setDailyNewsList] = useState<StockNewsItem[]>(
    liveNews && liveNews.length > 0 ? liveNews : initialNews || []
  );
  const [weeklyNewsList, setWeeklyNewsList] = useState<StockNewsItem[]>([]);
  const [weeklyOverview, setWeeklyOverview] = useState<any | null>(null);
  const [isLoadingWeekly, setIsLoadingWeekly] = useState<boolean>(false);
  const [selectedNews, setSelectedNews] = useState<StockNewsItem | null>(null);
  const [tickerSpecificNews, setTickerSpecificNews] = useState<StockNewsItem[]>([]);
  const [isLoadingTickerNews, setIsLoadingTickerNews] = useState<boolean>(false);
  const [tickerInput, setTickerInput] = useState<string>('');

  // Pagination & Debounced Load More state
  const [visibleCount, setVisibleCount] = useState<number>(ITEMS_PER_BATCH);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [lastClickTime, setLastClickTime] = useState<number>(0);

  useEffect(() => {
    if (liveNews && liveNews.length > 0) {
      setDailyNewsList(liveNews);
    }
  }, [liveNews]);

  // Load Weekly News from /api/news/weekly
  const fetchWeeklyNewsData = async (force = false) => {
    setIsLoadingWeekly(true);
    try {
      const url = `/api/news/weekly${force ? '?refresh=true' : ''}`;
      const res = await fetch(url).then((r) => (r.ok ? r.json() : null));
      if (res && res.success && Array.isArray(res.data)) {
        setWeeklyNewsList(res.data);
        if (res.overview) {
          setWeeklyOverview(res.overview);
        }
      }
    } catch (err) {
      console.warn('[NewsFeedClient] Weekly news fetch error:', err);
    } finally {
      setIsLoadingWeekly(false);
    }
  };

  // Dedicated Stock-Specific Fetcher (Failover engine using SET IR & Finnhub APIs)
  useEffect(() => {
    if (!selectedTicker) {
      setTickerSpecificNews([]);
      return;
    }

    let isCancelled = false;
    setIsLoadingTickerNews(true);

    const clean = selectedTicker.replace(/[\$\^\.]/g, '').replace(/BK$/, '').trim().toUpperCase();

    fetch(`/api/news/live?ticker=${encodeURIComponent(clean)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (!isCancelled && res && res.success && Array.isArray(res.data)) {
          setTickerSpecificNews(res.data);
        }
      })
      .catch((err) => {
        console.warn('[NewsFeedClient] Ticker news fetch warning:', err);
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingTickerNews(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedTicker]);

  const isEn = language === 'en';

  // Combined news pool based on active timeframe
  const activePool = useMemo(() => {
    return [...dailyNewsList, ...weeklyNewsList];
  }, [dailyNewsList, weeklyNewsList]);

  const { filters, filteredItems, updateFilter, resetFilters } = useStockFilters(activePool);

  // Trigger weekly fetch when timeframe is switched to weekly
  useEffect(() => {
    if (filters.timeframe === 'weekly' && weeklyNewsList.length === 0) {
      fetchWeeklyNewsData();
    }
  }, [filters.timeframe, weeklyNewsList.length]);

  const displayItems = useMemo(() => {
    if (!selectedTicker) return filteredItems;
    const clean = selectedTicker.replace(/[\$\^\.]/g, '').toUpperCase();

    // If we have live-fetched stock-specific items from SET IR / Finnhub, display them with top priority
    if (tickerSpecificNews.length > 0) {
      const existingIds = new Set(tickerSpecificNews.map((i) => i.id));
      const localMatches = filteredItems.filter(
        (item) => !existingIds.has(item.id) && item.tickers.some((t) => t.toUpperCase().includes(clean))
      );
      return [...tickerSpecificNews, ...localMatches];
    }

    return filteredItems.filter((item) =>
      item.tickers.some((t) => t.toUpperCase().includes(clean))
    );
  }, [filteredItems, selectedTicker, tickerSpecificNews]);

  // Reset pagination whenever search query, region, category, sentiment, timeframe, or selected ticker changes
  useEffect(() => {
    setVisibleCount(ITEMS_PER_BATCH);
  }, [filters.region, filters.category, filters.sentiment, filters.searchQuery, filters.timeframe, selectedTicker]);

  // Debounced Load More Handler with anti-spam cooldown and simulated smooth load
  const handleLoadMore = () => {
    const now = Date.now();
    if (isLoadingMore || now - lastClickTime < 600) return; // Ignore rapid clicks
    setLastClickTime(now);
    setIsLoadingMore(true);

    setTimeout(() => {
      setVisibleCount((prev) => prev + ITEMS_PER_BATCH);
      setIsLoadingMore(false);
    }, 450);
  };

  const paginatedItems = useMemo(() => {
    return displayItems.slice(0, visibleCount);
  }, [displayItems, visibleCount]);

  // Load Bookmarks from Firebase or LocalStorage
  useEffect(() => {
    const loadBookmarks = async () => {
      let bookmarkedIds: string[] = [];
      if (user) {
        // Load from Firebase
        const { getUserBookmarks } = await import('../../lib/services/bookmarkService');
        const bookmarks = await getUserBookmarks(user.uid);
        bookmarkedIds = bookmarks.map((b: any) => b.newsId);
      } else {
        // Load from LocalStorage
        try {
          const saved = localStorage.getItem('stockhome_bookmarked_ids');
          if (saved) {
            bookmarkedIds = JSON.parse(saved);
          }
        } catch {
          // Ignore
        }
      }

      if (bookmarkedIds.length > 0) {
        const updateIsBookmarked = (prev: StockNewsItem[]) =>
          prev.map((item) => ({ ...item, isBookmarked: bookmarkedIds.includes(item.id) }));
        setDailyNewsList(updateIsBookmarked);
        setWeeklyNewsList(updateIsBookmarked);
      }
    };
    loadBookmarks();
  }, [user]);

  const handleToggleBookmark = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    if (!user) {
      openAuthModal('login');
      return;
    }

    const itemToBookmark = activePool.find(i => i.id === id) || tickerSpecificNews.find(i => i.id === id);
    if (!itemToBookmark) return;

    const isCurrentlyBookmarked = itemToBookmark.isBookmarked || false;

    // Optimistic UI Update
    const updateList = (prev: StockNewsItem[]) =>
      prev.map((item) =>
        item.id === id ? { ...item, isBookmarked: !isCurrentlyBookmarked } : item
      );

    setDailyNewsList(updateList);
    setWeeklyNewsList(updateList);
    setTickerSpecificNews(updateList);

    if (selectedNews && selectedNews.id === id) {
      setSelectedNews((prev) => (prev ? { ...prev, isBookmarked: !isCurrentlyBookmarked } : null));
    }

    // Persist to Firebase
    try {
      const { toggleBookmark } = await import('../../lib/services/bookmarkService');
      await toggleBookmark(user.uid, itemToBookmark, isCurrentlyBookmarked);
    } catch (error) {
      console.error('Failed to toggle bookmark in Firebase', error);
      // Revert Optimistic UI if failed
      setDailyNewsList((prev) => prev.map((item) => item.id === id ? { ...item, isBookmarked: isCurrentlyBookmarked } : item));
      setWeeklyNewsList((prev) => prev.map((item) => item.id === id ? { ...item, isBookmarked: isCurrentlyBookmarked } : item));
      setTickerSpecificNews((prev) => prev.map((item) => item.id === id ? { ...item, isBookmarked: isCurrentlyBookmarked } : item));
    }
  };

  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);

  const handleGenerateAiNews = async () => {
    setIsGeneratingAi(true);
    try {
      if (filters.timeframe === 'weekly') {
        await fetchWeeklyNewsData(true);
      } else {
        const newItem = await generateAiNewsAction();
        setDailyNewsList((prev) => [newItem, ...prev]);
      }
    } catch (err) {
      console.error('Failed to generate AI news:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSearchTickerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tickerInput.trim()) return;
    setSelectedTicker(tickerInput.trim().toUpperCase());
    setTickerInput('');
  };

  useEffect(() => {
    const handleFilterEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setSelectedTicker(customEvent.detail);
      }
    };
    window.addEventListener('filterNewsByTicker', handleFilterEvent);
    return () => window.removeEventListener('filterNewsByTicker', handleFilterEvent);
  }, [setSelectedTicker]);

  return (
    <div id="news-feed-section" style={{ maxWidth: '1240px', margin: '0 auto' }}>
      {/* Timeframe Pill Switcher (Daily Market Pulse vs. 7-Day Weekly Briefing) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
        <div className="ios-segmented-control" style={{ padding: '4px' }}>
          <button
            onClick={() => updateFilter('timeframe', 'daily')}
            className={`ios-segment-btn ${filters.timeframe === 'daily' ? 'active' : ''}`}
            style={{ padding: '7px 18px', fontSize: '0.85rem' }}
          >
            <Newspaper size={15} />
            <span>{t('dailyNews')}</span>
          </button>
          <button
            onClick={() => {
              updateFilter('timeframe', 'weekly');
              if (weeklyNewsList.length === 0) fetchWeeklyNewsData();
            }}
            className={`ios-segment-btn ${filters.timeframe === 'weekly' ? 'active' : ''}`}
            style={{ padding: '7px 18px', fontSize: '0.85rem' }}
          >
            <Calendar size={15} />
            <span>{isEn ? '7-Day Weekly Digest' : 'สรุปข่าวรอบ 7 วัน (Weekly)'}</span>
            {weeklyNewsList.length > 0 && (
              <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '100px', background: 'var(--accent-neutral)', color: '#000000', fontWeight: 800 }}>
                {weeklyNewsList.length}
              </span>
            )}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => updateFilter('showBookmarkedOnly', !filters.showBookmarkedOnly)}
            className="ios-glass-btn"
            style={{
              background: filters.showBookmarkedOnly ? 'var(--accent-neutral-bg)' : 'var(--card-sub-bg)',
              color: filters.showBookmarkedOnly ? 'var(--accent-neutral)' : 'var(--text-secondary)',
              border: filters.showBookmarkedOnly ? '1px solid var(--accent-neutral-border)' : '1px solid var(--card-sub-border)',
              padding: '6px 14px',
              borderRadius: '10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={14} />
            <span>{filters.showBookmarkedOnly ? (isEn ? 'Showing Saved' : 'กำลังแสดงที่บันทึก') : (isEn ? 'Saved News' : 'ข่าวที่บันทึกไว้')}</span>
          </button>
        </div>
      </div>

      {/* ─── 7-Day Weekly Executive Hub (แสดงเฉพาะเมื่อเลือกแท็บสรุปข่าวรอบสัปดาห์) ─── */}
      {filters.timeframe === 'weekly' && (
        !user ? (
          /* Guest Gate Overlay Card */
          <div
            className="glass-card"
            style={{
              padding: '36px 24px',
              borderRadius: '24px',
              marginBottom: '24px',
              border: '1px solid rgba(0, 122, 255, 0.35)',
              background: 'linear-gradient(180deg, rgba(0, 122, 255, 0.09) 0%, rgba(10, 13, 20, 0.85) 100%)',
              textAlign: 'center',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                background: 'rgba(0, 122, 255, 0.15)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
              }}
            >
              <Lock size={26} color="#007AFF" />
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 122, 255, 0.15)', color: '#007AFF', padding: '3px 12px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 800, marginBottom: '10px' }}>
              <Crown size={12} /> {isEn ? 'MEMBER EXCLUSIVE INTELLIGENCE' : 'บทวิเคราะห์เฉพาะสมาชิก'}
            </div>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {isEn ? 'Weekly Market Intelligence & Deep Catalysts' : 'สาระสำคัญและสรุปแนวโน้มตลาดรอบ 7 วัน'}
            </h3>
            <p style={{ margin: '10px auto 22px auto', fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '520px', lineHeight: 1.55 }}>
              {isEn
                ? 'Sign in or create a free account to unlock full 7-day AI synthesized market intelligence, Thai SET catalysts, Wall Street trends, and dedicated stock summaries.'
                : 'เข้าสู่ระบบหรือสมัครสมาชิกฟรี เพื่อปลดล็อกบทวิเคราะห์สรุปแนวโน้มตลาดหุ้นไทย SET และตลาดสหรัฐฯ Wall Street พร้อม Keylist ปัจจัยบวก/ลบเชิงลึก'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => openAuthModal('login')}
                className="ios-btn-primary"
                style={{
                  padding: '11px 22px',
                  borderRadius: '14px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(0, 122, 255, 0.4)'
                }}
              >
                <LogIn size={16} /> {isEn ? 'Sign In / Register Free' : 'เข้าสู่ระบบ / สมัครสมาชิกฟรี'}
              </button>
            </div>
          </div>
        ) : (
          /* Logged-In Member Hub */
          <div
            className="glass-card"
            style={{
              padding: '24px',
              borderRadius: '20px',
              marginBottom: '24px',
              border: '1px solid var(--accent-neutral-border)',
              background: 'var(--glass-bg)',
            }}
          >
            {/* Hub Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'var(--accent-neutral-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-neutral)'
                  }}
                >
                  <Calendar size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      <span>{isEn ? '7-Day Market Intelligence & Keylists' : 'สาระสำคัญและภาพรวมตลาดรอบ 7 วัน'}</span>
                    </h3>
                    <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '100px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Crown size={11} /> {isEn ? 'Member Access' : 'สิทธิ์สมาชิก'}
                    </span>
                  </div>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {isEn
                      ? 'Synthesized from verified Thai & Foreign financial channels over the past 7 days'
                      : 'รวบรวมและวิเคราะห์จากสำนักข่าวการเงินชั้นนำของไทยและต่างประเทศรอบ 7 วันที่ผ่านมา'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => fetchWeeklyNewsData(true)}
                disabled={isLoadingWeekly}
                className="ios-glass-btn"
                style={{
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  background: 'var(--accent-neutral-bg)',
                  border: '1px solid var(--accent-neutral-border)',
                  color: 'var(--accent-neutral)',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={13} className={isLoadingWeekly ? 'spin' : ''} />
                <span>{isLoadingWeekly ? (isEn ? 'Re-syncing...' : 'กำลังดึงข้อมูลสด...') : (isEn ? 'Live Re-sync 7D' : 'อัปเดตสดรอบ 7 วัน')}</span>
              </button>
            </div>

            {/* Dual Column: Thai Keylist vs US/Global Keylist */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
              {/* Thai Keylist Box */}
              <div style={{ background: 'var(--card-sub-bg)', padding: '16px 18px', borderRadius: '16px', border: '1px solid var(--card-sub-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Landmark size={16} color="var(--accent-blue)" />
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {isEn ? 'Thai SET Weekly Catalysts' : 'Keylist หุ้นไทยและเศรษฐกิจรอบสัปดาห์'}
                    </h4>
                  </div>
                  <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '100px', background: 'var(--accent-blue-bg)', color: 'var(--accent-blue)', fontWeight: 700 }}>
                    SET & mai
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {(weeklyOverview?.thaiCatalysts_th || [
                    'สัญญาณ Fund Flow ไหลเข้าสะสมในหุ้นขนาดใหญ่ SET50 และหุ้นปันผลสูง (PTT, KBANK, ADVANC)',
                    'การลงทุนโครงสร้างพื้นฐาน Data Center และศูนย์กลาง AI ในประเทศไทยขยายตัวต่อเนื่อง (DELTA, GULF)',
                    'ตัวเลขเศรษฐกิจภาคบริการและการท่องเที่ยวไทยขยายตัวดีกว่าคาดการณ์ (AOT, CPALL, BDMS)'
                  ]).map((item: string, idx: number) => {
                    const text = isEn ? (weeklyOverview?.thaiCatalysts_en?.[idx] || tDynamic(item)) : (weeklyOverview?.thaiCatalysts_th?.[idx] || item);
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                        <span style={{ color: 'var(--accent-blue)', fontWeight: 800 }}>•</span>
                        <span>{text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Global / US Keylist Box */}
              <div style={{ background: 'var(--card-sub-bg)', padding: '16px 18px', borderRadius: '16px', border: '1px solid var(--card-sub-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe size={16} color="#5e5ce6" />
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {isEn ? 'Wall Street & Global Catalysts' : 'Keylist หุ้นต่างประเทศ & วอลล์สตรีท'}
                    </h4>
                  </div>
                  <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '100px', background: 'rgba(94, 92, 230, 0.15)', color: '#5e5ce6', fontWeight: 700 }}>
                    S&P 500 & Tech
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {(weeklyOverview?.usCatalysts_th || [
                    'NVIDIA (NVDA) & ชิป AI: ดีมานด์เซิร์ฟเวอร์ Blackwell AI และ Data Center ระดับโลกเติบโตทำสถิติใหม่',
                    'Apple (AAPL) & Microsoft (MSFT): ยอดสมัครใช้บริการ Enterprise AI และรายได้ Cloud ขยายตัวแกร่ง',
                    'Wall Street (S&P 500 & NASDAQ): ทิศทางนโยบายดอกเบี้ย Fed และผลประกอบการกลุ่ม Big Tech ดีกว่าคาด'
                  ]).map((item: string, idx: number) => {
                    const text = isEn ? (weeklyOverview?.usCatalysts_en?.[idx] || tDynamic(item)) : (weeklyOverview?.usCatalysts_th?.[idx] || item);
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                        <span style={{ color: '#5e5ce6', fontWeight: 800 }}>•</span>
                        <span>{text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* Stock-Specific Focus Bar (ศูนย์รวมและค้นหาข่าวสารหุ้นรายตัว) */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          borderRadius: '16px',
          marginBottom: '20px',
          background: 'var(--card-sub-bg)',
          border: '1px solid var(--card-sub-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={16} color="var(--accent-blue)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {language === 'en' ? 'Stock-Specific News Focus' : 'เจาะลึกข่าวสารและสารสนเทศรายตัวหุ้น (Stock News Hub)'}
            </span>
            <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '100px', background: 'rgba(0, 122, 255, 0.15)', color: '#007AFF', fontWeight: 700 }}>
              SET IR & Finnhub Live
            </span>
          </div>

          {/* Quick Ticker Search Form */}
          <form onSubmit={handleSearchTickerSubmit} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder={language === 'en' ? 'Search stock (e.g. PTT, NVDA)...' : 'ค้นหาชื่อหุ้น เช่น PTT, NVDA...'}
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value)}
                style={{
                  padding: '7px 28px 7px 30px',
                  borderRadius: '100px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  outline: 'none',
                  width: '220px'
                }}
              />
              {tickerInput && (
                <button
                  type="button"
                  onClick={() => setTickerInput('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <button
              type="submit"
              style={{
                padding: '7px 16px',
                borderRadius: '100px',
                background: 'var(--accent-blue)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
            >
              {language === 'en' ? 'Search' : 'ค้นหา'}
            </button>
          </form>
        </div>

        {/* Quick Ticker Pills (Side-scrollable track on mobile PWA) */}
        <div className="mobile-side-scroll" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', overflowX: 'auto' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, marginRight: '4px', flexShrink: 0 }}>
            {language === 'en' ? 'Quick Tickers:' : 'หุ้นยอดนิยม:'}
          </span>

          <button
            onClick={() => setSelectedTicker(null)}
            style={{
              flexShrink: 0,
              padding: '3px 10px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: !selectedTicker ? 'var(--accent-blue)' : 'rgba(255, 255, 255, 0.06)',
              color: !selectedTicker ? '#ffffff' : 'var(--text-secondary)',
              border: '1px solid var(--glass-border)'
            }}
          >
            {language === 'en' ? 'All Feed' : 'ข่าวทั้งหมด'}
          </button>

          {/* Thai Stocks */}
          {POPULAR_THAI_TICKERS.map((t) => {
            const isSelected = selectedTicker === t;
            return (
              <button
                key={t}
                onClick={() => setSelectedTicker(isSelected ? null : t)}
                style={{
                  flexShrink: 0,
                  padding: '3px 9px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: isSelected ? 'var(--accent-blue)' : 'rgba(0, 113, 227, 0.08)',
                  color: isSelected ? '#ffffff' : 'var(--accent-blue)',
                  border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'rgba(0, 113, 227, 0.25)'}`
                }}
              >
                ${t}
              </button>
            );
          })}

          <div style={{ width: '1px', height: '14px', background: 'rgba(255, 255, 255, 0.1)', margin: '0 4px', flexShrink: 0 }} />

          {/* US Stocks */}
          {POPULAR_US_TICKERS.map((t) => {
            const isSelected = selectedTicker === t;
            return (
              <button
                key={t}
                onClick={() => setSelectedTicker(isSelected ? null : t)}
                style={{
                  flexShrink: 0,
                  padding: '3px 9px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: isSelected ? '#5856d6' : 'rgba(88, 86, 214, 0.08)',
                  color: isSelected ? '#ffffff' : '#5856d6',
                  border: `1px solid ${isSelected ? '#5856d6' : 'rgba(88, 86, 214, 0.25)'}`
                }}
              >
                ${t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Bar */}
      <MarketFilterBar
        selectedRegion={filters.region}
        onSelectRegion={(r) => updateFilter('region', r)}
        selectedCategory={filters.category}
        onSelectCategory={(c) => updateFilter('category', c)}
        selectedSentiment={filters.sentiment}
        onSelectSentiment={(s) => updateFilter('sentiment', s)}
      />

      {/* Selected Ticker Filter Banner */}
      {selectedTicker && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 113, 227, 0.08)',
            border: '1px solid rgba(0, 113, 227, 0.3)',
            borderRadius: '12px',
            padding: '12px 18px',
            marginBottom: '18px',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Target size={18} color="var(--accent-blue)" />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {t('showingExclusiveNews')}:{' '}
                <span style={{ color: 'var(--accent-blue)', fontSize: '1.05rem' }}>${selectedTicker}</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {POPULAR_THAI_TICKERS.includes(selectedTicker)
                  ? t('setIrDesc')
                  : t('finnhubDesc')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isLoadingTickerNews && (
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Activity size={13} className="spin" /> {language === 'en' ? 'Updating...' : 'กำลังดึงสด...'}
              </span>
            )}
            <button
              onClick={() => setSelectedTicker(null)}
              style={{
                background: 'var(--card-sub-bg)',
                border: '1px solid var(--card-sub-border)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                padding: '6px 14px',
                borderRadius: '100px',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <X size={13} />
              <span>{t('showAllStocks')}</span>
            </button>
          </div>
        </div>
      )}

      {/* News Feed Grid Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          {selectedTicker
            ? `${language === 'en' ? 'Latest Intelligence for' : 'ข่าวสารล่าสุดของ'} $${selectedTicker}`
            : filters.timeframe === 'daily'
            ? t('dailyNews')
            : t('weeklyNews')}
        </h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
          {t('foundItems')} {displayItems.length} {t('itemsCount')}
        </span>
      </div>

      {/* News Cards List */}
      {displayItems.length > 0 ? (
        <div>
          {paginatedItems.map((news, idx) => (
            <NewsCard
              key={`${news.id || 'news'}-${idx}`}
              item={news}
              onSelectNews={setSelectedNews}
              onToggleBookmark={handleToggleBookmark}
            />
          ))}

          {/* Apple iOS Minimalist Load More Bar (5 items per batch with anti-spam debounce) */}
          <div
            style={{
              marginTop: '24px',
              marginBottom: '32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            {/* Counter & Progress Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '100%', maxWidth: '380px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                {language === 'en'
                  ? `Showing ${paginatedItems.length} of ${displayItems.length} stories`
                  : `กำลังแสดง ${paginatedItems.length} จากทั้งหมด ${displayItems.length} ข่าว`}
              </span>
              <div
                style={{
                  width: '100%',
                  height: '4px',
                  borderRadius: '100px',
                  background: 'var(--card-sub-bg)',
                  border: '1px solid var(--glass-border-subtle)',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${Math.min(100, Math.max(5, (paginatedItems.length / Math.max(1, displayItems.length)) * 100))}%`,
                    background: 'var(--accent-blue)',
                    borderRadius: '100px',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>

            {/* Load More Button or Finished Indicator */}
            {paginatedItems.length < displayItems.length ? (
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="ios-glass-btn"
                style={{
                  marginTop: '8px',
                  padding: '10px 24px',
                  borderRadius: '12px',
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: isLoadingMore ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: 'var(--glass-shadow)',
                  transition: 'all 0.18s ease',
                  opacity: isLoadingMore ? 0.7 : 1
                }}
              >
                {isLoadingMore ? (
                  <>
                    <RotateCcw size={15} className="spin" />
                    <span>{language === 'en' ? 'Loading Stories...' : 'กำลังโหลดข่าวสาร...'}</span>
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} />
                    <span>
                      {language === 'en'
                        ? `Load More News (+${Math.min(ITEMS_PER_BATCH, displayItems.length - paginatedItems.length)})`
                        : `โหลดข่าวเพิ่มเติม (+${Math.min(ITEMS_PER_BATCH, displayItems.length - paginatedItems.length)} ข่าว)`}
                    </span>
                  </>
                )}
              </button>
            ) : (
              <div
                style={{
                  marginTop: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 16px',
                  borderRadius: '100px',
                  background: 'var(--accent-bullish-bg)',
                  border: '1px solid var(--accent-bullish-border)',
                  color: 'var(--accent-bullish)',
                  fontSize: '0.78rem',
                  fontWeight: 600
                }}
              >
                <CheckCircle2 size={14} />
                <span>{language === 'en' ? 'All available news loaded' : 'แสดงข่าวสารครบทั้งหมดแล้ว'}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', margin: '20px 0' }}>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
            {selectedTicker
              ? (language === 'en' ? `No news found for $${selectedTicker}` : `ยังไม่พบข่าวสารของหุ้น $${selectedTicker}`)
              : t('noNewsFound')}
          </p>
          <button
            onClick={() => {
              resetFilters();
              setSelectedTicker(null);
            }}
            style={{
              marginTop: '12px',
              background: 'var(--accent-blue)',
              color: '#ffffff',
              border: 'none',
              padding: '9px 20px',
              borderRadius: '100px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RotateCcw size={14} /> {t('clearFilters')}
          </button>
        </div>
      )}

      {/* Detail Sheet Modal */}
      <NewsDetailSheet
        item={selectedNews}
        onClose={() => setSelectedNews(null)}
        onToggleBookmark={handleToggleBookmark}
      />
    </div>
  );
}

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
import { Sparkles, RotateCcw, X, Target, Newspaper, Calendar, Search, TrendingUp, ShieldCheck, Zap, Activity } from 'lucide-react';

interface NewsFeedClientProps {
  initialNews?: StockNewsItem[];
}

const POPULAR_THAI_TICKERS = ['PTT', 'CPALL', 'DELTA', 'KBANK', 'AOT', 'ADVANC', 'GULF', 'BDMS', 'SCB', 'TRUE'];
const POPULAR_US_TICKERS = ['NVDA', 'AAPL', 'TSLA', 'MSFT', 'GOOGL', 'META', 'AMZN', 'AMD'];

export function NewsFeedClient({ initialNews }: NewsFeedClientProps) {
  const {
    news: liveNews,
    selectedTicker,
    setSelectedTicker,
  } = useMarketSync();
  const { t, language } = useLanguage();

  const [newsList, setNewsList] = useState<StockNewsItem[]>(
    liveNews && liveNews.length > 0 ? liveNews : initialNews || []
  );
  const [selectedNews, setSelectedNews] = useState<StockNewsItem | null>(null);
  const [tickerSpecificNews, setTickerSpecificNews] = useState<StockNewsItem[]>([]);
  const [isLoadingTickerNews, setIsLoadingTickerNews] = useState<boolean>(false);
  const [tickerInput, setTickerInput] = useState<string>('');

  useEffect(() => {
    if (liveNews && liveNews.length > 0) {
      setNewsList(liveNews);
    }
  }, [liveNews]);

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

  const { filters, filteredItems, updateFilter, resetFilters } = useStockFilters(newsList);

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

  // Load Bookmarks from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('stockhome_bookmarked_ids');
      if (saved) {
        const bookmarkedIds: string[] = JSON.parse(saved);
        setNewsList((prev) =>
          prev.map((item) => ({
            ...item,
            isBookmarked: bookmarkedIds.includes(item.id),
          }))
        );
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleToggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNewsList((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, isBookmarked: !item.isBookmarked } : item
      );
      const bookmarkedIds = updated.filter((i) => i.isBookmarked).map((i) => i.id);
      localStorage.setItem('stockhome_bookmarked_ids', JSON.stringify(bookmarkedIds));
      return updated;
    });

    if (selectedNews && selectedNews.id === id) {
      setSelectedNews((prev) => (prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null));
    }
  };

  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);

  const handleGenerateAiNews = async () => {
    setIsGeneratingAi(true);
    try {
      const newItem = await generateAiNewsAction();
      setNewsList((prev) => [newItem, ...prev]);
    } catch (err) {
      console.error('Failed to generate AI news:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSearchTickerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tickerInput.trim().toUpperCase();
    if (clean) {
      setSelectedTicker(clean);
      setTickerInput('');
    }
  };

  return (
    <div>
      {/* Timeframe Switcher & AI Generator Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
        <div className="ios-segmented-control" style={{ padding: '3px' }}>
          <button
            onClick={() => updateFilter('timeframe', 'daily')}
            className={`ios-segment-btn ${filters.timeframe === 'daily' ? 'active' : ''}`}
            style={{ padding: '7px 20px', fontSize: '0.85rem' }}
          >
            <Newspaper size={15} /> {t('timeframeDaily')}
          </button>
          <button
            onClick={() => updateFilter('timeframe', 'weekly')}
            className={`ios-segment-btn ${filters.timeframe === 'weekly' ? 'active' : ''}`}
            style={{ padding: '7px 20px', fontSize: '0.85rem' }}
          >
            <Calendar size={15} /> {t('timeframeWeekly')}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Region Tabs */}
          <div className="ios-segmented-control" style={{ padding: '3px' }}>
            {(['all', 'thai', 'global'] as const).map((r) => (
              <button
                key={r}
                onClick={() => updateFilter('region', r)}
                className={`ios-segment-btn ${filters.region === r ? 'active' : ''}`}
                style={{ padding: '5px 14px', fontSize: '0.78rem' }}
              >
                {r === 'all' ? t('regionAll') : r === 'thai' ? t('thaiStocks') : t('foreignStocks')}
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerateAiNews}
            disabled={isGeneratingAi}
            className="ios-glass-btn"
            style={{
              background: 'var(--accent-blue-gradient)',
              color: '#ffffff',
              fontWeight: 700,
              padding: '7px 16px',
            }}
          >
            <Sparkles size={15} className={isGeneratingAi ? 'spin' : ''} />
            <span>{isGeneratingAi ? t('generatingAi') : t('liveAiDigest')}</span>
          </button>
        </div>
      </div>

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
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                placeholder={language === 'en' ? 'Search stock (e.g. PTT, NVDA)...' : 'พิมพ์ชื่อหุ้น เช่น PTT, NVDA...'}
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value)}
                style={{
                  padding: '6px 12px 6px 30px',
                  borderRadius: '100px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  outline: 'none',
                  width: '210px'
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: '6px 14px',
                borderRadius: '100px',
                background: 'var(--accent-blue-gradient)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              {language === 'en' ? 'View Stock' : 'ดูข่าวหุ้นนี้'}
            </button>
          </form>
        </div>

        {/* Quick Ticker Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, marginRight: '4px' }}>
            {language === 'en' ? 'Quick Tickers:' : 'หุ้นยอดนิยม:'}
          </span>

          <button
            onClick={() => setSelectedTicker(null)}
            style={{
              padding: '3px 10px',
              borderRadius: '100px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: !selectedTicker ? 'var(--accent-blue)' : 'rgba(255, 255, 255, 0.08)',
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
                  padding: '3px 9px',
                  borderRadius: '100px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: isSelected ? '#007AFF' : 'rgba(0, 122, 255, 0.1)',
                  color: isSelected ? '#ffffff' : '#007AFF',
                  border: `1px solid ${isSelected ? '#007AFF' : 'rgba(0, 122, 255, 0.3)'}`
                }}
              >
                ${t}
              </button>
            );
          })}

          <div style={{ width: '1px', height: '14px', background: 'rgba(255, 255, 255, 0.15)', margin: '0 4px' }} />

          {/* US Stocks */}
          {POPULAR_US_TICKERS.map((t) => {
            const isSelected = selectedTicker === t;
            return (
              <button
                key={t}
                onClick={() => setSelectedTicker(isSelected ? null : t)}
                style={{
                  padding: '3px 9px',
                  borderRadius: '100px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: isSelected ? '#8B5CF6' : 'rgba(139, 92, 246, 0.1)',
                  color: isSelected ? '#ffffff' : '#8B5CF6',
                  border: `1px solid ${isSelected ? '#8B5CF6' : 'rgba(139, 92, 246, 0.3)'}`
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
        selectedCategory={filters.category}
        onSelectCategory={(c) => updateFilter('category', c)}
        selectedSentiment={filters.sentiment}
        onSelectSentiment={(s) => updateFilter('sentiment', s)}
        searchQuery={filters.searchQuery}
        onSearchChange={(q) => updateFilter('searchQuery', q)}
      />

      {/* Selected Ticker Filter Banner */}
      {selectedTicker && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.18), rgba(139, 92, 246, 0.18))',
            border: '1px solid rgba(0, 122, 255, 0.5)',
            borderRadius: '14px',
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
                {language === 'en' ? 'Showing Exclusive News for' : 'กำลังแสดงข่าวสารและสารสนเทศเฉพาะหุ้น'}:{' '}
                <span style={{ color: 'var(--accent-blue)', fontSize: '1.05rem' }}>${selectedTicker}</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {POPULAR_THAI_TICKERS.includes(selectedTicker)
                  ? 'ดึงสดตรงจากระบบตลาดหลักทรัพย์แห่งประเทศไทย (SET IR API) & ข่าวหุ้นไทย'
                  : 'ดึงสดตรงจาก Finnhub Global Intelligence & SEC Filings Database'}
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
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
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
              <span>{language === 'en' ? 'Show All Stocks' : 'ดูข่าวหุ้นทั้งหมด'}</span>
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
          {displayItems.map((news, idx) => (
            <NewsCard
              key={`${news.id || 'news'}-${idx}`}
              item={news}
              onSelectNews={setSelectedNews}
              onToggleBookmark={handleToggleBookmark}
            />
          ))}
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
              background: 'var(--accent-blue-gradient)',
              color: '#ffffff',
              border: 'none',
              padding: '9px 20px',
              borderRadius: '100px',
              fontSize: '0.85rem',
              fontWeight: 700,
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

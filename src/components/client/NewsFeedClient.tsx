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
import { Sparkles, RotateCcw, X, Target, Newspaper, Calendar } from 'lucide-react';

interface NewsFeedClientProps {
  initialNews?: StockNewsItem[];
}

export function NewsFeedClient({ initialNews }: NewsFeedClientProps) {
  const {
    news: liveNews,
    selectedTicker,
    setSelectedTicker,
  } = useMarketSync();
  const { t } = useLanguage();

  const [newsList, setNewsList] = useState<StockNewsItem[]>(
    liveNews && liveNews.length > 0 ? liveNews : initialNews || []
  );
  const [selectedNews, setSelectedNews] = useState<StockNewsItem | null>(null);

  useEffect(() => {
    if (liveNews && liveNews.length > 0) {
      setNewsList(liveNews);
    }
  }, [liveNews]);

  const { filters, filteredItems, updateFilter, resetFilters } = useStockFilters(newsList);

  const displayItems = useMemo(() => {
    if (!selectedTicker) return filteredItems;
    const clean = selectedTicker.replace(/[\$\^\.]/g, '').toUpperCase();
    return filteredItems.filter((item) =>
      item.tickers.some((t) => t.toUpperCase().includes(clean))
    );
  }, [filteredItems, selectedTicker]);

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
            background: 'rgba(0, 122, 255, 0.15)',
            border: '1px solid rgba(0, 122, 255, 0.4)',
            borderRadius: '12px',
            padding: '10px 16px',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={16} color="var(--accent-blue)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Filtering for ticker: <span style={{ color: 'var(--accent-blue)' }}>${selectedTicker}</span>
            </span>
          </div>
          <button
            onClick={() => setSelectedTicker(null)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <X size={12} />
            <span>Show all</span>
          </button>
        </div>
      )}

      {/* News Feed Grid Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          {filters.timeframe === 'daily' ? t('dailyNews') : t('weeklyNews')}
        </h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
          {t('foundItems')} {displayItems.length} {t('itemsCount')}
        </span>
      </div>

      {/* News Cards List */}
      {displayItems.length > 0 ? (
        <div>
          {displayItems.map((news) => (
            <NewsCard
              key={news.id}
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
              ? `No news found for $${selectedTicker}`
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

'use client';

import { useState, useMemo } from 'react';
import type { StockNewsItem, MarketRegion, TimeframeType, NewsCategory, SentimentType } from '../schemas/newsSchema';

export interface NewsFilterState {
  timeframe: TimeframeType;
  region: 'all' | MarketRegion;
  category: NewsCategory;
  sentiment: 'all' | SentimentType;
  searchQuery: string;
  showBookmarkedOnly: boolean;
}

export function useStockFilters(initialItems: StockNewsItem[]) {
  const [filters, setFilters] = useState<NewsFilterState>({
    timeframe: 'daily',
    region: 'all',
    category: 'all',
    sentiment: 'all',
    searchQuery: '',
    showBookmarkedOnly: false,
  });

  const filteredItems = useMemo(() => {
    return initialItems.filter((item) => {
      if (item.timeframe !== filters.timeframe) return false;
      if (filters.region !== 'all' && item.region !== filters.region) return false;
      if (filters.category !== 'all' && item.category !== filters.category) return false;
      if (filters.sentiment !== 'all' && item.sentiment !== filters.sentiment) return false;
      if (filters.showBookmarkedOnly && !item.isBookmarked) return false;

      if (filters.searchQuery.trim() !== '') {
        const query = filters.searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesSummary = item.summary.toLowerCase().includes(query);
        const matchesTickers = item.tickers.some((t) => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesSummary && !matchesTickers) return false;
      }

      return true;
    }).sort((a, b) => (b.relevanceScore ?? 60) - (a.relevanceScore ?? 60));
  }, [initialItems, filters]);

  const updateFilter = <K extends keyof NewsFilterState>(key: K, value: NewsFilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      timeframe: 'daily',
      region: 'all',
      category: 'all',
      sentiment: 'all',
      searchQuery: '',
      showBookmarkedOnly: false,
    });
  };

  return {
    filters,
    filteredItems,
    updateFilter,
    resetFilters,
  };
}

'use client';

import React from 'react';
import type { NewsCategory, SentimentType } from '../../lib/schemas/newsSchema';
import { useLanguage } from '../../lib/context/LanguageContext';
import {
  Search,
  X,
  Globe,
  Cpu,
  Zap,
  Building2,
  ShoppingBag,
  Radio,
  Landmark,
  HeartPulse,
  TrendingUp,
  TrendingDown,
  Layers
} from 'lucide-react';

interface MarketFilterBarProps {
  selectedCategory: NewsCategory;
  onSelectCategory: (category: NewsCategory) => void;
  selectedSentiment: 'all' | SentimentType;
  onSelectSentiment: (sentiment: 'all' | SentimentType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function MarketFilterBar({
  selectedCategory,
  onSelectCategory,
  selectedSentiment,
  onSelectSentiment,
  searchQuery,
  onSearchChange,
}: MarketFilterBarProps) {
  const { t, language } = useLanguage();

  const CATEGORIES = [
    { id: 'all' as NewsCategory, label: t('catAll'), icon: <Layers size={14} /> },
    { id: 'macro' as NewsCategory, label: t('catMacro'), icon: <Globe size={14} /> },
    { id: 'tech' as NewsCategory, label: t('catTech'), icon: <Cpu size={14} /> },
    { id: 'energy' as NewsCategory, label: t('catEnergy'), icon: <Zap size={14} /> },
    { id: 'finance' as NewsCategory, label: t('catFinance'), icon: <Landmark size={14} /> },
    { id: 'retail' as NewsCategory, label: t('catRetail'), icon: <ShoppingBag size={14} /> },
    { id: 'telecom' as NewsCategory, label: language === 'th' ? 'สื่อสาร' : 'Telecom', icon: <Radio size={14} /> },
    { id: 'realestate' as NewsCategory, label: language === 'th' ? 'อสังหาฯ' : 'Real Estate', icon: <Building2 size={14} /> },
    { id: 'health' as NewsCategory, label: t('catHealth'), icon: <HeartPulse size={14} /> },
  ];

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Search Input Bar */}
      <div style={{ position: 'relative', marginBottom: '14px' }}>
        <Search
          size={18}
          color="var(--text-tertiary)"
          style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('searchStockPlaceholder')}
          style={{
            width: '100%',
            padding: '12px 42px 12px 46px',
            borderRadius: '16px',
            border: '1px solid var(--glass-border)',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(16px)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            outline: 'none',
          }}
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            style={{
              position: 'absolute',
              right: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Category Pills & Sentiment Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        {/* Category Pills List */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', flex: 1 }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="ios-chip"
              style={{
                background: selectedCategory === cat.id ? 'var(--accent-blue-gradient)' : 'var(--glass-bg)',
                color: selectedCategory === cat.id ? '#ffffff' : 'var(--text-secondary)',
                border: selectedCategory === cat.id ? '1px solid rgba(0, 122, 255, 0.4)' : '1px solid var(--glass-border)',
                fontWeight: selectedCategory === cat.id ? 700 : 500,
                padding: '6px 14px',
                borderRadius: '100px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Sentiment Filter Controls */}
        <div className="ios-segmented-control" style={{ padding: '3px', flexShrink: 0 }}>
          <button
            onClick={() => onSelectSentiment('all')}
            className={`ios-segment-btn ${selectedSentiment === 'all' ? 'active' : ''}`}
            style={{ padding: '5px 12px', fontSize: '0.75rem' }}
          >
            {language === 'th' ? 'ทิศทางทั้งหมด' : 'All Sentiments'}
          </button>
          <button
            onClick={() => onSelectSentiment('bullish')}
            className={`ios-segment-btn ${selectedSentiment === 'bullish' ? 'active' : ''}`}
            style={{ padding: '5px 12px', fontSize: '0.75rem', color: selectedSentiment === 'bullish' ? 'var(--accent-bullish)' : undefined, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <TrendingUp size={13} />
            <span>{t('sentimentBullish')}</span>
          </button>
          <button
            onClick={() => onSelectSentiment('bearish')}
            className={`ios-segment-btn ${selectedSentiment === 'bearish' ? 'active' : ''}`}
            style={{ padding: '5px 12px', fontSize: '0.75rem', color: selectedSentiment === 'bearish' ? 'var(--accent-bearish)' : undefined, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <TrendingDown size={13} />
            <span>{t('sentimentBearish')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

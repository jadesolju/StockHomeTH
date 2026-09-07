'use client';

import React from 'react';
import type { NewsCategory, SentimentType, MarketRegion } from '../../lib/schemas/newsSchema';
import { useLanguage } from '../../lib/context/LanguageContext';
import {
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
  Layers,
  Flag
} from 'lucide-react';

interface MarketFilterBarProps {
  selectedRegion?: 'all' | MarketRegion;
  onSelectRegion?: (region: 'all' | MarketRegion) => void;
  selectedCategory: NewsCategory;
  onSelectCategory: (category: NewsCategory) => void;
  selectedSentiment: 'all' | SentimentType;
  onSelectSentiment: (sentiment: 'all' | SentimentType) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function MarketFilterBar({
  selectedRegion = 'all',
  onSelectRegion,
  selectedCategory,
  onSelectCategory,
  selectedSentiment,
  onSelectSentiment,
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
      {/* Market Region & Sentiment Controls Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
        {/* Market Region Selector */}
        {onSelectRegion && (
          <div className="ios-segmented-control" style={{ padding: '3px' }}>
            <button
              onClick={() => onSelectRegion('all')}
              className={`ios-segment-btn ${selectedRegion === 'all' ? 'active' : ''}`}
              style={{ padding: '5px 14px', fontSize: '0.78rem', fontWeight: selectedRegion === 'all' ? 700 : 500 }}
            >
              <Globe size={13} />
              <span>{language === 'th' ? 'ทุกตลาด' : 'All Markets'}</span>
            </button>
            <button
              onClick={() => onSelectRegion('thai')}
              className={`ios-segment-btn ${selectedRegion === 'thai' ? 'active' : ''}`}
              style={{
                padding: '5px 14px',
                fontSize: '0.78rem',
                color: selectedRegion === 'thai' ? 'var(--accent-blue)' : undefined,
                fontWeight: selectedRegion === 'thai' ? 700 : 500
              }}
            >
              <Landmark size={13} />
              <span>{language === 'th' ? 'หุ้นไทย (SET)' : 'Thai SET'}</span>
            </button>
            <button
              onClick={() => onSelectRegion('global')}
              className={`ios-segment-btn ${selectedRegion === 'global' ? 'active' : ''}`}
              style={{
                padding: '5px 14px',
                fontSize: '0.78rem',
                color: selectedRegion === 'global' ? '#5e5ce6' : undefined,
                fontWeight: selectedRegion === 'global' ? 700 : 500
              }}
            >
              <Flag size={13} />
              <span>{language === 'th' ? 'สากล / สหรัฐฯ (US)' : 'Global / US'}</span>
            </button>
          </div>
        )}

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

      {/* Category Pills List */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className="ios-chip"
            style={{
              background: selectedCategory === cat.id ? 'var(--accent-blue)' : 'var(--glass-bg)',
              color: selectedCategory === cat.id ? '#ffffff' : 'var(--text-secondary)',
              border: selectedCategory === cat.id ? '1px solid var(--accent-blue)' : '1px solid var(--glass-border)',
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
    </div>
  );
}

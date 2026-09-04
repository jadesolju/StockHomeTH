'use client';

import React from 'react';
import type { StockNewsItem } from '../../lib/schemas/newsSchema';
import { useMarketSync } from '../../lib/context/MarketSyncContext';
import { useLanguage } from '../../lib/context/LanguageContext';
import { Bookmark, ChevronRight, Star, TrendingUp, TrendingDown, Minus, Lightbulb, Clock, ExternalLink } from 'lucide-react';

interface NewsCardProps {
  item: StockNewsItem;
  onSelectNews: (item: StockNewsItem) => void;
  onToggleBookmark: (id: string, e: React.MouseEvent) => void;
}

export function NewsCard({
  item,
  onSelectNews,
  onToggleBookmark,
}: NewsCardProps) {
  const { getStockByTicker, focusStock } = useMarketSync();
  const { t, tDynamic } = useLanguage();

  const getSentimentBadge = () => {
    switch (item.sentiment) {
      case 'bullish':
        return (
          <span className="badge-sentiment badge-bullish">
            <TrendingUp size={13} /> {t('sentimentBullish')}
          </span>
        );
      case 'bearish':
        return (
          <span className="badge-sentiment badge-bearish">
            <TrendingDown size={13} /> {t('sentimentBearish')}
          </span>
        );
      default:
        return (
          <span className="badge-sentiment badge-neutral">
            <Minus size={13} /> {t('sentimentNeutral')}
          </span>
        );
    }
  };

  return (
    <div
      className="glass-card"
      onClick={() => onSelectNews(item)}
      style={{
        padding: '20px',
        borderRadius: '20px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.2s ease, border-color 0.2s ease',
      }}
    >
      {/* Card Header: Tags, Time, and Sentiment Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {item.isFeatured && (
            <span
              style={{
                background: 'rgba(255, 204, 0, 0.2)',
                color: '#FFCC00',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Star size={11} fill="#FFCC00" /> Featured
            </span>
          )}

          <span
            style={{
              fontSize: '0.7rem',
              padding: '2px 8px',
              borderRadius: '100px',
              background: item.region === 'thai' ? 'rgba(0, 122, 255, 0.15)' : 'rgba(139, 92, 246, 0.15)',
              color: item.region === 'thai' ? '#007AFF' : '#8B5CF6',
              fontWeight: 600,
            }}
          >
            {item.marketName}
          </span>

          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> {tDynamic(item.periodLabel)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getSentimentBadge()}

          <button
            onClick={(e) => onToggleBookmark(item.id, e)}
            title={item.isBookmarked ? 'Unsave' : 'Save'}
            style={{
              background: 'transparent',
              border: 'none',
              color: item.isBookmarked ? '#FFCC00' : 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Bookmark size={17} fill={item.isBookmarked ? '#FFCC00' : 'none'} />
          </button>
        </div>
      </div>

      {/* Main Title */}
      <h3 style={{ fontSize: '1.08rem', fontWeight: 700, lineHeight: 1.4, marginBottom: '8px', color: 'var(--text-primary)' }}>
        {tDynamic(item.title)}
      </h3>

      {/* Short Summary */}
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
        {tDynamic(item.summary)}
      </p>

      {/* Key Takeaways Box */}
      <div
        style={{
          background: 'var(--card-sub-bg)',
          padding: '12px 14px',
          borderRadius: '12px',
          marginBottom: '14px',
          border: '1px solid var(--card-sub-border)',
        }}
      >
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)', letterSpacing: '0.03em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Lightbulb size={13} /> {t('keyTakeaways')}:
        </div>
        <div className="takeaway-list">
          {item.keyTakeaways.slice(0, 3).map((takeaway, idx) => (
            <div key={idx} className="takeaway-item">
              <div className="takeaway-bullet" />
              <span style={{ color: 'var(--text-primary)' }}>{tDynamic(takeaway)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Line: Stock Tickers & Read More */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          paddingTop: '8px',
          borderTop: '1px solid var(--card-sub-border)',
        }}
      >
        {/* Tickers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{t('relatedTickers')}:</span>
          {item.tickers.map((symbol) => {
            const stock = getStockByTicker(symbol);
            if (stock) {
              const isUp = stock.change >= 0;
              return (
                <button
                  key={symbol}
                  onClick={(e) => {
                    e.stopPropagation();
                    focusStock(symbol);
                  }}
                  title={`View details for ${stock.name} (${stock.ticker})`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '8px',
                    background: isUp ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 59, 48, 0.12)',
                    border: `1px solid ${isUp ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 59, 48, 0.3)'}`,
                    color: isUp ? '#00E676' : '#FF3B30',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{stock.market === 'SET' ? 'TH' : 'US'} ${stock.ticker}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>
                    {stock.currency === 'THB' ? '฿' : '$'}{stock.price.toFixed(2)}
                  </span>
                  <span style={{ fontSize: '0.68rem' }}>
                    ({isUp ? '+' : ''}{stock.change.toFixed(1)}%)
                  </span>
                </button>
              );
            }
            return (
              <span
                key={symbol}
                className="ticker-pill"
                onClick={(e) => {
                  e.stopPropagation();
                  focusStock(symbol);
                }}
                style={{ cursor: 'pointer' }}
              >
                ${symbol}
              </span>
            );
          })}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {(item.link || item.sourceUrl) && (
            <a
              href={item.link || item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title={`เปิดอ่านข่าวต้นฉบับจาก ${item.source}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '8px',
                background: 'rgba(0, 122, 255, 0.1)',
                border: '1px solid rgba(0, 122, 255, 0.3)',
                color: 'var(--accent-blue)',
                fontSize: '0.75rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span>อ่านต้นฉบับ</span>
              <ExternalLink size={12} />
            </a>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.8rem', color: 'var(--accent-blue)', fontWeight: 600 }}>
            <span>{t('readMore')}</span>
            <ChevronRight size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}

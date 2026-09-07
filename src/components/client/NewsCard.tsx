'use client';

import React from 'react';
import type { StockNewsItem } from '../../lib/schemas/newsSchema';
import { useMarketSync } from '../../lib/context/MarketSyncContext';
import { useLanguage } from '../../lib/context/LanguageContext';
import { useClientAuth } from '../../lib/context/ClientAuthContext';
import { Bookmark, ChevronRight, Star, TrendingUp, TrendingDown, Minus, Lightbulb, Clock, Calendar, ExternalLink, Lock, ShieldCheck, Crown } from 'lucide-react';

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
  const { t, tDynamic, language } = useLanguage();
  const { user } = useClientAuth();

  const isEn = language === 'en';
  const resolvedTitle = isEn
    ? (item.title_en || tDynamic(item.title_th, item.title_en))
    : (item.title_th || tDynamic(item.title_th, item.title_en));

  const resolvedSummary = isEn
    ? (item.summary_en || tDynamic(item.summary_th, item.summary_en))
    : (item.summary_th || tDynamic(item.summary_th, item.summary_en));

  const resolvedTakeaways = isEn && item.keyTakeaways_en && item.keyTakeaways_en.length > 0
    ? item.keyTakeaways_en
    : (!isEn && item.keyTakeaways_th && item.keyTakeaways_th.length > 0)
    ? item.keyTakeaways_th
    : item.keyTakeaways.map((takeaway) => tDynamic(takeaway));

  const resolvedPeriodLabel = isEn
    ? (item.periodLabel_en || tDynamic(item.periodLabel_th, item.periodLabel_en))
    : (item.periodLabel_th || tDynamic(item.periodLabel_th, item.periodLabel_en));

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
          {item.timeframe === 'weekly' && (
            <span
              style={{
                background: 'var(--accent-neutral-bg)',
                color: 'var(--accent-neutral)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                border: '1px solid var(--accent-neutral-border)'
              }}
            >
              <Calendar size={11} /> {isEn ? '7-Day Weekly' : 'สรุปสัปดาห์ (7 Days)'}
            </span>
          )}

          {item.isFeatured && (
            <span
              style={{
                background: 'var(--accent-neutral-bg)',
                color: 'var(--accent-neutral)',
                border: '1px solid var(--accent-neutral-border)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Star size={11} fill="var(--accent-neutral)" color="var(--accent-neutral)" /> Featured
            </span>
          )}

          <span
            style={{
              fontSize: '0.7rem',
              padding: '2px 8px',
              borderRadius: '100px',
              background: item.region === 'thai' ? 'var(--accent-blue-bg)' : 'rgba(94, 92, 230, 0.15)',
              color: item.region === 'thai' ? 'var(--accent-blue)' : '#5e5ce6',
              fontWeight: 600,
            }}
          >
            {item.marketName}
          </span>

          {item.impactAnalysis && (
            <span
              style={{
                fontSize: '0.68rem',
                padding: '2px 7px',
                borderRadius: '6px',
                background: user ? 'rgba(16, 185, 129, 0.12)' : 'rgba(0, 122, 255, 0.12)',
                color: user ? '#10b981' : '#007AFF',
                border: user ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(0, 122, 255, 0.25)',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              {user ? <ShieldCheck size={11} /> : <Lock size={10} />}
              <span>{isEn ? 'Impact Analysis' : 'วิเคราะห์ผลกระทบ'}</span>
            </span>
          )}

          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> {resolvedPeriodLabel}
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
              color: item.isBookmarked ? 'var(--accent-neutral)' : 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Bookmark size={17} fill={item.isBookmarked ? 'var(--accent-neutral)' : 'none'} color={item.isBookmarked ? 'var(--accent-neutral)' : 'var(--text-tertiary)'} />
          </button>
        </div>
      </div>

      {/* Main Title */}
      <h3 style={{ fontSize: '1.08rem', fontWeight: 700, lineHeight: 1.4, marginBottom: '8px', color: 'var(--text-primary)' }}>
        {resolvedTitle}
      </h3>

      {/* Short Summary */}
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
        {resolvedSummary}
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
          {resolvedTakeaways.slice(0, 3).map((takeaway, idx) => (
            <div key={idx} className="takeaway-item">
              <div className="takeaway-bullet" />
              <span style={{ color: 'var(--text-primary)' }}>{takeaway}</span>
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
                    background: isUp ? 'var(--accent-bullish-bg)' : 'var(--accent-bearish-bg)',
                    border: `1px solid ${isUp ? 'var(--accent-bullish-border)' : 'var(--accent-bearish-border)'}`,
                    color: isUp ? 'var(--accent-bullish)' : 'var(--accent-bearish)',
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
              title={isEn ? `Open original source from ${item.source}` : `เปิดอ่านข่าวต้นฉบับจาก ${item.source}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '8px',
                background: 'var(--accent-blue-bg)',
                border: '1px solid var(--accent-blue-border)',
                color: 'var(--accent-blue)',
                fontSize: '0.75rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{t('originalSource')}</span>
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

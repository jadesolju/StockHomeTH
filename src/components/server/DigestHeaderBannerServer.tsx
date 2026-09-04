'use client';

import React from 'react';
import type { DigestSummary } from '../../lib/schemas/newsSchema';
import { useMarketSync } from '../../lib/context/MarketSyncContext';
import { useLanguage } from '../../lib/context/LanguageContext';
import { Zap, CheckCircle2, RefreshCw, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DigestHeaderBannerProps {
  summary?: DigestSummary;
}

export function DigestHeaderBannerServer({ summary: propSummary }: DigestHeaderBannerProps) {
  const { overview, isSyncing, refreshAll, focusStock, getStockByTicker, lastUpdated } = useMarketSync();
  const { t } = useLanguage();
  const summary = overview || propSummary;

  if (!summary) {
    return null;
  }

  const { bullishPercent, neutralPercent, bearishPercent } = summary.marketSentimentScore;

  const renderCatalystItem = (cat: string, idx: number) => {
    const words = cat.split(/[\s:,\(\)\+]+/);
    const candidateTickers = ['PTT', 'CPALL', 'DELTA', 'AOT', 'KBANK', 'GULF', 'BDMS', 'SCB', 'ADVANC', 'TRUE', 'NVDA', 'AAPL', 'TSLA', 'MSFT', 'GOOGL', 'META', 'AMZN', 'AMD'];
    const matched = candidateTickers.find(t => words.includes(t));
    const stock = matched ? getStockByTicker(matched) : undefined;

    return (
      <div
        key={idx}
        onClick={() => matched && focusStock(matched)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
          background: 'rgba(255,255,255,0.03)',
          padding: '6px 10px',
          borderRadius: '8px',
          cursor: matched ? 'pointer' : 'default',
          border: matched ? '1px solid rgba(0, 122, 255, 0.2)' : '1px solid transparent',
          transition: 'all 0.15s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
          <CheckCircle2 size={13} color="var(--accent-blue)" style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat}</span>
        </div>
        {stock && (
          <span
            style={{
              flexShrink: 0,
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '100px',
              background: stock.change >= 0 ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 59, 48, 0.15)',
              color: stock.change >= 0 ? '#00E676' : '#FF3B30',
              display: 'flex',
              alignItems: 'center',
              gap: '2px'
            }}
          >
            {stock.change >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {stock.currency === 'THB' ? '฿' : '$'}{stock.price.toFixed(2)} ({stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%)
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '28px', borderLeft: '4px solid var(--accent-blue)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={18} color="var(--accent-blue)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-blue)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {summary.periodLabel}
          </span>
          <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '100px', background: 'rgba(0, 230, 118, 0.15)', color: '#00E676', fontWeight: 700 }}>
            REAL-TIME AI BRIEFING
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            {lastUpdated || summary.updatedAt}
          </span>
          <button
            onClick={() => refreshAll()}
            disabled={isSyncing}
            title={t('refreshData')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, lineHeight: 1.4, marginBottom: '12px', color: 'var(--text-primary)' }}>
        {summary.mainHeadline}
      </h2>

      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
        {summary.overviewSummary}
      </p>

      {/* Grid of Sentiment & Key Catalysts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
        {/* Sentiment Gauge Bar */}
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '8px' }}>
            Market Sentiment AI Live
          </div>
          <div style={{ display: 'flex', height: '10px', borderRadius: '100px', overflow: 'hidden', gap: '2px', marginBottom: '8px' }}>
            <div style={{ width: `${bullishPercent}%`, background: 'var(--accent-bullish)' }} title={`Bullish ${bullishPercent}%`} />
            <div style={{ width: `${neutralPercent}%`, background: 'var(--accent-neutral)' }} title={`Neutral ${neutralPercent}%`} />
            <div style={{ width: `${bearishPercent}%`, background: 'var(--accent-bearish)' }} title={`Bearish ${bearishPercent}%`} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700 }}>
            <span style={{ color: 'var(--accent-bullish)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <TrendingUp size={12} /> {t('sentimentBullish')} {bullishPercent}%
            </span>
            <span style={{ color: 'var(--accent-neutral)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <Minus size={12} /> {t('sentimentNeutral')} {neutralPercent}%
            </span>
            <span style={{ color: 'var(--accent-bearish)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <TrendingDown size={12} /> {t('sentimentBearish')} {bearishPercent}%
            </span>
          </div>
        </div>

        {/* Key Catalysts List */}
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '8px' }}>
            Key Live Catalysts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {summary.keyCatalysts.map((cat, idx) => renderCatalystItem(cat, idx))}
          </div>
        </div>
      </div>
    </div>
  );
}

export { DigestHeaderBannerServer as DigestHeaderBanner };

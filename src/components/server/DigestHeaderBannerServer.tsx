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
  const { overview, stocks, isSyncing, refreshAll, focusStock, getStockByTicker, lastUpdated, setIsLogModalOpen } = useMarketSync();
  const { t, tDynamic } = useLanguage();
  const summary = overview || propSummary;

  if (!summary) {
    return null;
  }

  const { bullishPercent, neutralPercent, bearishPercent } = summary.marketSentimentScore;

  const renderCatalystItem = (cat: string, idx: number) => {
    const translatedCat = tDynamic(cat);
    const words = cat.split(/[\s:,\(\)\+]+/);
    const matched = words.find(w => {
      const clean = w.replace(/[\$\^\.]/g, '').trim().toUpperCase();
      return clean.length >= 2 && stocks.some(s => s.ticker.toUpperCase() === clean);
    });
    const cleanTicker = matched ? matched.replace(/[\$\^\.]/g, '').trim().toUpperCase() : undefined;
    const stock = cleanTicker ? getStockByTicker(cleanTicker) : undefined;

    return (
      <div
        key={`cat-${idx}-${cat.substring(0, 15)}`}
        onClick={() => matched && focusStock(matched)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          fontSize: '0.82rem',
          color: 'var(--text-primary)',
          background: 'var(--card-sub-bg)',
          padding: '8px 12px',
          borderRadius: '10px',
          cursor: matched ? 'pointer' : 'default',
          border: matched ? '1px solid var(--accent-blue)' : '1px solid var(--card-sub-border)',
          transition: 'all 0.15s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
          <CheckCircle2 size={13} color="var(--accent-blue)" style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{translatedCat}</span>
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
            {tDynamic(summary.periodLabel)}
          </span>
          <span
            onClick={() => setIsLogModalOpen(true)}
            title="คลิกเพื่อดูบันทึกการอัปเดตข้อมูล Real-Time (Sync Logs)"
            style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: '100px', background: 'rgba(0, 230, 118, 0.15)', color: 'var(--accent-bullish)', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <span className="live-pulse-dot" style={{ width: '6px', height: '6px' }} /> REAL-TIME AI BRIEFING • LOGS
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
        {tDynamic(summary.mainHeadline)}
      </h2>

      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
        {tDynamic(summary.overviewSummary)}
      </p>

      {/* Grid of Sentiment & Key Catalysts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', background: 'var(--card-sub-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--card-sub-border)' }}>
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

'use client';

import React from 'react';
import type { MarketIndex } from '../../lib/schemas/marketSchema';
import { useMarketSync } from '../../lib/context/MarketSyncContext';
import { TrendingUp, TrendingDown, RefreshCw, Activity } from 'lucide-react';

interface MarketTickerBarProps {
  indices?: MarketIndex[];
  activeRegion?: 'all' | 'thai' | 'global';
}

export function MarketTickerBarServer({ activeRegion = 'all' }: MarketTickerBarProps) {
  const { indices, isSyncing, lastUpdated, refreshAll, setSelectedMarket } = useMarketSync();

  const filteredIndices = indices.filter((idx) =>
    activeRegion === 'all' ? true : idx.region === activeRegion
  );

  const handleIndexClick = (region: string) => {
    if (region === 'thai') {
      setSelectedMarket('SET');
    } else {
      setSelectedMarket('US');
    }
    const el = document.getElementById('stock-explorer-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#00E676', boxShadow: '0 0 8px #00E676' }} />
          <span style={{ fontWeight: 700, color: '#00E676' }}>REAL-TIME INDICES FEED</span>
          {lastUpdated && <span style={{ opacity: 0.7 }}>• อัปเดต {lastUpdated}</span>}
        </div>
        <button
          onClick={() => refreshAll()}
          disabled={isSyncing}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.72rem'
          }}
        >
          <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
          <span>{isSyncing ? 'กำลังซิงค์สด...' : 'รีเฟรชทั้งหมด'}</span>
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '8px',
          scrollbarWidth: 'none',
        }}
      >
        {filteredIndices.map((idx) => {
          const isUp = (idx.change || 0) >= 0;
          return (
            <div
              key={idx.symbol}
              className="glass-card"
              onClick={() => handleIndexClick(idx.region)}
              title={`คลิกเพื่อดูกลุ่มหุ้น ${idx.region === 'thai' ? 'ตลาดหุ้นไทย (SET)' : 'ตลาดหุ้นสหรัฐฯ (US)'}`}
              style={{
                padding: '12px 16px',
                minWidth: '180px',
                flexShrink: 0,
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, border-color 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {idx.name}
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: idx.region === 'thai' ? 'rgba(0, 122, 255, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                    color: idx.region === 'thai' ? '#007AFF' : '#8B5CF6',
                    fontWeight: 700,
                  }}
                >
                  {idx.region === 'thai' ? '🇹🇭 SET' : '🌍 GLOBAL'}
                </span>
              </div>

              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'monospace' }}>
                  {typeof idx.value === 'number'
                    ? idx.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : idx.value}
                </span>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color: isUp ? '#00E676' : '#FF3B30',
                  }}
                >
                  {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span>
                    {isUp ? '+' : ''}
                    {typeof idx.changePercent === 'number' ? idx.changePercent.toFixed(2) : idx.changePercent}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { MarketTickerBarServer as MarketTickerBar };

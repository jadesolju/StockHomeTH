import React from 'react';
import type { MarketIndex } from '../types/market';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MarketTickerBarProps {
  indices: MarketIndex[];
  activeRegion: 'all' | 'thai' | 'global';
}

export const MarketTickerBar: React.FC<MarketTickerBarProps> = ({ indices, activeRegion }) => {
  const filteredIndices = indices.filter(idx => 
    activeRegion === 'all' ? true : idx.region === activeRegion
  );

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        display: 'flex',
        gap: '12px',
        overflowX: 'auto',
        paddingBottom: '8px',
        scrollbarWidth: 'none',
      }}>
        {filteredIndices.map((idx) => {
          const isUp = idx.isPositive;
          return (
            <div
              key={idx.symbol}
              className="glass-card"
              style={{
                padding: '12px 16px',
                minWidth: '175px',
                flexShrink: 0,
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>
                  {idx.name}
                </span>
                <span style={{
                  fontSize: '0.65rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: idx.region === 'thai' ? 'rgba(0, 122, 255, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                  color: idx.region === 'thai' ? '#007AFF' : '#8B5CF6',
                  fontWeight: 600
                }}>
                  {idx.region.toUpperCase()}
                </span>
              </div>

              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {idx.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: isUp ? 'var(--accent-bullish)' : 'var(--accent-bearish)',
                }}>
                  {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  <span>{isUp ? '+' : ''}{idx.changePercent}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

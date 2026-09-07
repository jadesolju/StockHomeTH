import React from 'react';
import type { StockFundamental } from '../../lib/schemas/marketSchema';
import { ArrowUpRight, ArrowDownRight, Award } from 'lucide-react';

interface StockFundamentalTableServerProps {
  stocks: StockFundamental[];
}

export function StockFundamentalTableServer({ stocks }: StockFundamentalTableServerProps) {
  return (
    <div className="glass-card" style={{ overflowX: 'auto', borderRadius: '18px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-tertiary)' }}>
            <th style={{ padding: '14px 16px' }}>TICKER / NAME</th>
            <th style={{ padding: '14px 16px' }}>PRICE</th>
            <th style={{ padding: '14px 16px' }}>24H CHANGE</th>
            <th style={{ padding: '14px 16px' }}>MARKET CAP</th>
            <th style={{ padding: '14px 16px' }}>P/E RATIO</th>
            <th style={{ padding: '14px 16px' }}>DIV YIELD</th>
            <th style={{ padding: '14px 16px' }}>ANALYST RATING</th>
            <th style={{ padding: '14px 16px' }}>AI SENTIMENT</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) => {
            const numChange = Number(stock.change) || 0;
            const numPrice = Number(stock.price) || 0;
            const isUp = numChange >= 0;
            return (
              <tr
                key={`${stock.market}-${stock.ticker}`}
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  transition: 'background 0.2s ease',
                }}
              >
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{stock.ticker}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{stock.name}</div>
                </td>
                <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {stock.currency === 'THB' ? '฿' : '$'}
                  {numPrice.toFixed(2)}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontWeight: 700,
                      color: isUp ? 'var(--accent-bullish)' : 'var(--accent-bearish)',
                    }}
                  >
                    {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {isUp ? '+' : ''}
                    {numChange.toFixed(2)}%
                  </span>
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{stock.marketCap}</td>
                <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{stock.peRatio}x</td>
                <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{stock.dividendYield}%</td>
                <td style={{ padding: '14px 16px' }}>
                  <span
                    style={{
                      background: stock.analystRating === 'Strong Buy' || stock.analystRating === 'Buy'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)',
                      color: stock.analystRating === 'Strong Buy' || stock.analystRating === 'Buy'
                        ? '#10b981'
                        : '#ef4444',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {stock.analystRating}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 700,
                      color: 'var(--accent-blue)',
                    }}
                  >
                    <Award size={13} /> {stock.sentimentScore}/100
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

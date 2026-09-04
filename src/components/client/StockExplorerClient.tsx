'use client';

import React, { useState, useMemo } from 'react';
import type { StockFundamental } from '../../lib/schemas/marketSchema';
import { useMarketSync } from '../../lib/context/MarketSyncContext';
import { useLanguage } from '../../lib/context/LanguageContext';
import { Sparkline } from '../ui/Sparkline';
import {
  Search,
  Filter,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  X,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Newspaper,
  ChevronRight,
  Landmark,
  Building,
  Globe,
  Flame,
  Diamond
} from 'lucide-react';

interface StockExplorerClientProps {
  initialStocks?: StockFundamental[];
}

export function StockExplorerClient({ initialStocks }: StockExplorerClientProps) {
  const {
    stocks: liveStocks,
    selectedTicker,
    setSelectedTicker,
    selectedMarket,
    setSelectedMarket,
    activeStockModal,
    setActiveStockModal,
    isSyncing,
    refreshAll,
    getNewsByTicker,
  } = useMarketSync();
  const { t, language } = useLanguage();

  const stocks = liveStocks && liveStocks.length > 0 ? liveStocks : initialStocks || [];

  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'gainers' | 'losers' | 'marketCap' | 'peRatio'>('gainers');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const availableSectors = useMemo(() => {
    const set = new Set<string>();
    stocks.forEach((s) => set.add(s.sector));
    return ['ALL', ...Array.from(set)];
  }, [stocks]);

  const filteredStocks = useMemo(() => {
    let list = [...stocks];

    if (selectedMarket !== 'ALL') {
      list = list.filter((s) => s.market === selectedMarket);
    }

    if (selectedSector !== 'ALL') {
      list = list.filter((s) => s.sector === selectedSector);
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter((s) => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (sortBy === 'gainers') return b.change - a.change;
      if (sortBy === 'losers') return a.change - b.change;
      if (sortBy === 'peRatio') return a.peRatio - b.peRatio;
      return b.price - a.price;
    });

    return list;
  }, [stocks, selectedMarket, selectedSector, searchQuery, sortBy]);

  const relatedNews = useMemo(() => {
    if (!activeStockModal) return [];
    return getNewsByTicker(activeStockModal.ticker);
  }, [activeStockModal, getNewsByTicker]);

  return (
    <div id="stock-explorer-section" style={{ marginBottom: '40px', scrollMarginTop: '80px' }}>
      {/* Control Header & Filters */}
      <div className="glass-card" style={{ padding: '20px', borderRadius: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          {/* Market Region Toggle */}
          <div className="ios-segmented-control" style={{ padding: '3px' }}>
            {(['ALL', 'SET', 'US'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMarket(m)}
                className={`ios-segment-btn ${selectedMarket === m ? 'active' : ''}`}
                style={{ padding: '6px 18px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {m === 'ALL' ? <Globe size={14} /> : m === 'SET' ? <Landmark size={14} /> : <Building size={14} />}
                <span>{m === 'ALL' ? t('allMarkets') : m === 'SET' ? t('thaiMarketTab') : t('usMarketTab')}</span>
              </button>
            ))}
          </div>

          {/* View Mode & Sorters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="ios-segmented-control" style={{ padding: '3px' }}>
              <button
                onClick={() => setSortBy('gainers')}
                className={`ios-segment-btn ${sortBy === 'gainers' ? 'active' : ''}`}
                style={{ padding: '5px 12px', fontSize: '0.75rem', color: sortBy === 'gainers' ? 'var(--accent-bullish)' : undefined, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Flame size={13} /> {t('topGainers')}
              </button>
              <button
                onClick={() => setSortBy('losers')}
                className={`ios-segment-btn ${sortBy === 'losers' ? 'active' : ''}`}
                style={{ padding: '5px 12px', fontSize: '0.75rem', color: sortBy === 'losers' ? 'var(--accent-bearish)' : undefined, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <TrendingDown size={13} /> {t('topLosers')}
              </button>
              <button
                onClick={() => setSortBy('peRatio')}
                className={`ios-segment-btn ${sortBy === 'peRatio' ? 'active' : ''}`}
                style={{ padding: '5px 12px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Diamond size={13} /> {t('lowPE')}
              </button>
            </div>

            {/* Live Status & Refresh */}
            <button
              onClick={() => refreshAll()}
              disabled={isSyncing}
              title={t('refreshData')}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                padding: '6px 10px',
                color: '#00E676',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              <Activity size={14} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? t('syncing') : t('liveConnected')}</span>
            </button>

            <div className="ios-segmented-control" style={{ padding: '3px' }}>
              <button
                onClick={() => setViewMode('grid')}
                className={`ios-segment-btn ${viewMode === 'grid' ? 'active' : ''}`}
                style={{ padding: '5px 8px' }}
                title="Grid View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`ios-segment-btn ${viewMode === 'table' ? 'active' : ''}`}
                style={{ padding: '5px 8px' }}
                title="Table View"
              >
                <TableIcon size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Search & Sector Filter */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchStockPlaceholder')}
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)',
                background: 'rgba(0,0,0,0.2)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>

          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {availableSectors.map((s) => (
              <option key={s} value={s} style={{ background: '#0f172a', color: '#ffffff' }}>
                {s === 'ALL' ? t('allSectors') : s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredStocks.map((stock) => {
            const isUp = stock.change >= 0;
            const isSelected = selectedTicker?.toUpperCase() === stock.ticker.toUpperCase();
            return (
              <div
                key={stock.ticker}
                className="glass-card"
                onClick={() => {
                  setActiveStockModal(stock);
                  setSelectedTicker(stock.ticker);
                }}
                style={{
                  padding: '18px',
                  borderRadius: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                  transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                  border: isSelected ? '2px solid var(--accent-blue)' : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: isSelected ? '0 0 20px rgba(0, 122, 255, 0.3)' : undefined,
                  background: isSelected ? 'linear-gradient(135deg, rgba(0, 122, 255, 0.12) 0%, rgba(0,0,0,0.3) 100%)' : undefined
                }}
              >
                {/* Header Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {stock.ticker}
                      </span>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: stock.market === 'SET' ? 'rgba(0, 122, 255, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                          color: stock.market === 'SET' ? '#007AFF' : '#8B5CF6',
                          fontWeight: 700,
                        }}
                      >
                        {stock.market}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {stock.name}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                      {stock.currency === 'THB' ? '฿' : '$'}
                      {stock.price.toFixed(2)}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '2px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: isUp ? 'var(--accent-bullish)' : 'var(--accent-bearish)',
                      }}
                    >
                      {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      <span>{isUp ? '+' : ''}{stock.change.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>

                {/* Sparkline & Metrics */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.15)', padding: '8px 12px', borderRadius: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>P/E Ratio</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stock.peRatio}x</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{t('colMarketCap')}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stock.marketCap}</div>
                  </div>
                  <div>
                    <Sparkline data={stock.sparkline7d} isPositive={isUp} width={90} height={28} />
                  </div>
                </div>

                {/* AI Insight Tag */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                    {stock.sector}
                  </span>
                  <span
                    style={{
                      background: 'rgba(0, 122, 255, 0.1)',
                      color: 'var(--accent-blue)',
                      padding: '2px 8px',
                      borderRadius: '100px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                  >
                    <Sparkles size={11} /> AI {stock.sentimentScore}/100
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="glass-card" style={{ overflowX: 'auto', borderRadius: '18px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-tertiary)' }}>
                <th style={{ padding: '14px 16px' }}>{t('colTickerName')}</th>
                <th style={{ padding: '14px 16px' }}>{t('colPrice')}</th>
                <th style={{ padding: '14px 16px' }}>{t('col24hChange')}</th>
                <th style={{ padding: '14px 16px' }}>{t('colMarketCap')}</th>
                <th style={{ padding: '14px 16px' }}>P/E</th>
                <th style={{ padding: '14px 16px' }}>{t('colDivYield')}</th>
                <th style={{ padding: '14px 16px' }}>{t('colAnalyst')}</th>
                <th style={{ padding: '14px 16px' }}>{t('colTrend7d')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map((stock) => {
                const isUp = stock.change >= 0;
                const isSelected = selectedTicker?.toUpperCase() === stock.ticker.toUpperCase();
                return (
                  <tr
                    key={stock.ticker}
                    onClick={() => {
                      setActiveStockModal(stock);
                      setSelectedTicker(stock.ticker);
                    }}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                      background: isSelected ? 'rgba(0, 122, 255, 0.12)' : undefined
                    }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{stock.ticker}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{stock.name}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                      {stock.currency === 'THB' ? '฿' : '$'}
                      {stock.price.toFixed(2)}
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
                        {stock.change.toFixed(2)}%
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
                      <Sparkline data={stock.sparkline7d} isPositive={isUp} width={80} height={24} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Stock Detail Sheet / Modal */}
      {activeStockModal && (
        <div className="ios-sheet-overlay" onClick={() => setActiveStockModal(null)}>
          <div className="ios-sheet-content" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ width: '40px', height: '4px', background: 'rgba(255, 255, 255, 0.3)', borderRadius: '100px', margin: '0 auto 20px auto' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{activeStockModal.ticker}</span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: activeStockModal.market === 'SET' ? 'rgba(0, 122, 255, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                    color: activeStockModal.market === 'SET' ? '#007AFF' : '#8B5CF6',
                    fontWeight: 700,
                  }}
                >
                  {activeStockModal.market}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>• {activeStockModal.sector}</span>
              </div>
              <button
                onClick={() => setActiveStockModal(null)}
                style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '50%', width: '36px', height: '36px', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>{activeStockModal.name}</h3>

            {/* Price & Target */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              <div className="glass-card" style={{ padding: '16px', borderRadius: '14px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{t('realtimePrice')}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace', marginTop: '4px' }}>
                  {activeStockModal.currency === 'THB' ? '฿' : '$'}{activeStockModal.price.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: activeStockModal.change >= 0 ? '#00E676' : '#FF3B30', marginTop: '2px' }}>
                  {activeStockModal.change >= 0 ? '+' : ''}{activeStockModal.change.toFixed(2)}% (24h)
                </div>
              </div>
              <div className="glass-card" style={{ padding: '16px', borderRadius: '14px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{t('analystTarget')}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-bullish)', fontFamily: 'monospace', marginTop: '4px' }}>
                  {activeStockModal.currency === 'THB' ? '฿' : '$'}{activeStockModal.targetPrice.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {t('recommendation')}: <strong>{activeStockModal.analystRating}</strong>
                </div>
              </div>
            </div>

            {/* AI Insight */}
            <div style={{ background: 'rgba(0, 122, 255, 0.08)', border: '1px solid rgba(0, 122, 255, 0.2)', padding: '16px', borderRadius: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '6px' }}>
                <Sparkles size={15} /> {t('aiInsightTitle')}:
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
                {activeStockModal.aiInsight}
              </p>
            </div>

            {/* Fundamentals Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '24px' }}>
              <div className="glass-card" style={{ padding: '10px 14px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{t('colMarketCap')}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{activeStockModal.marketCap}</div>
              </div>
              <div className="glass-card" style={{ padding: '10px 14px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>P/E Ratio</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{activeStockModal.peRatio}x</div>
              </div>
              <div className="glass-card" style={{ padding: '10px 14px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{t('colDivYield')}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{activeStockModal.dividendYield}%</div>
              </div>
              <div className="glass-card" style={{ padding: '10px 14px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{t('volume')}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{activeStockModal.volume}</div>
              </div>
            </div>

            {/* Interlinked Related News Section */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  <Newspaper size={16} color="var(--accent-blue)" />
                  <span>{t('relatedNewsTitle')} ${activeStockModal.ticker} ({relatedNews.length})</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedTicker(activeStockModal.ticker);
                    setActiveStockModal(null);
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-blue)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}
                >
                  <span>{t('viewAllNews')}</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {relatedNews.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {relatedNews.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '10px 14px',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', gap: '8px' }}>
                        <span>{item.source}</span>
                        <span>• {item.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', padding: '10px 0' }}>
                  {t('noDirectNews')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

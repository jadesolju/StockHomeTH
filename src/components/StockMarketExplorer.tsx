import React, { useState, useMemo, useEffect } from 'react';
import { fullMarketStocks, type StockFundamentalData } from '../data/fullMarketStocks';
import { Search, Filter, Sparkles, LayoutGrid, Table as TableIcon, X, Activity, ArrowUpRight, ArrowDownRight, Award, Flame, RefreshCw } from 'lucide-react';
import { realStockDataFetcher } from '../services/realStockDataFetcher';

interface StockMarketExplorerProps {
  onRequestPreview: () => void;
}

// Mini SVG Sparkline Component
const Sparkline: React.FC<{ data: number[]; isPositive: boolean; width?: number; height?: number }> = ({
  data,
  isPositive,
  width = 120,
  height = 36
}) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const strokeColor = isPositive ? '#10b981' : '#ef4444';

  const firstX = 0;
  const lastX = width;
  const bottomY = height;
  const areaPoints = `${firstX},${bottomY} ${points} ${lastX},${bottomY}`;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`grad-${isPositive ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#grad-${isPositive ? 'up' : 'down'})`} />
      <polyline fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
};

export const StockMarketExplorer: React.FC<StockMarketExplorerProps> = ({ onRequestPreview }) => {
  const [selectedMarket, setSelectedMarket] = useState<'ALL' | 'SET' | 'US'>('ALL');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'gainers' | 'losers' | 'marketCap' | 'peRatio'>('gainers');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [activeStock, setActiveStock] = useState<StockFundamentalData | null>(null);
  const [stockData, setStockData] = useState<StockFundamentalData[]>(fullMarketStocks);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<'live' | 'fallback'>('fallback');

  const loadLiveData = async () => {
    setIsLoading(true);
    const result = await realStockDataFetcher.fetchLiveStocks();
    setStockData(result);
    setDataSource(result === fullMarketStocks ? 'fallback' : 'live');
    setIsLoading(false);
  };

  useEffect(() => {
    loadLiveData();
    // Auto-refresh every 90 seconds
    const interval = setInterval(loadLiveData, 90_000);
    return () => clearInterval(interval);
  }, []);

  // Extract unique sectors
  const availableSectors = useMemo(() => {
    const sectors = new Set<string>();
    stockData.forEach((s) => sectors.add(s.sector));
    return ['ALL', ...Array.from(sectors)];
  }, [stockData]);

  // Filter and sort stocks
  const filteredStocks = useMemo(() => {
    return stockData
      .filter((stock) => {
        const matchesMarket = selectedMarket === 'ALL' || stock.market === selectedMarket;
        const matchesSector = selectedSector === 'ALL' || stock.sector === selectedSector;
        const matchesSearch =
          stock.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stock.sector.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesMarket && matchesSector && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'gainers') return b.change - a.change;
        if (sortBy === 'losers') return a.change - b.change;
        if (sortBy === 'peRatio') return a.peRatio - b.peRatio;
        return b.price - a.price;
      });
  }, [selectedMarket, selectedSector, sortBy, searchQuery]);

  // Market Leaders Highlight
  const topGainer = useMemo(() => [...stockData].sort((a, b) => b.change - a.change)[0], [stockData]);
  const topLoser = useMemo(() => [...stockData].sort((a, b) => a.change - b.change)[0], [stockData]);
  const topAiRating = useMemo(() => [...stockData].sort((a, b) => b.sentimentScore - a.sentimentScore)[0], [stockData]);

  return (
    <div style={{ padding: '20px 0', width: '100%' }}>
      {/* Live/Fallback data status bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '10px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
          {isLoading ? (
            <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> <span style={{ color: 'var(--text-tertiary)' }}>กำลังดึงข้อมูลตลาดสด...</span></>
          ) : dataSource === 'live' ? (
            <><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} /><span style={{ color: '#10b981' }}>LIVE — Yahoo Finance Real Data</span></>
          ) : (
            <><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} /><span style={{ color: '#f59e0b' }}>STATIC — Server Offline (ข้อมูลอ้างอิง)</span></>
          )}
        </div>
        <button onClick={loadLiveData} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '100px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
          <RefreshCw size={13} /> รีเฟรชข้อมูล
        </button>
      </div>
      {/* Executive Market Summary Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Card 1: Top Gainer */}
        <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
              <Flame size={14} color="#10b981" /> TOP GAINER LEADER
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {topGainer.ticker} <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{topGainer.market}</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--accent-bullish)', fontWeight: 700, marginTop: '2px' }}>
              +{topGainer.change}% ({topGainer.currency === 'USD' ? '$' : '฿'}{topGainer.price})
            </div>
          </div>
          <Sparkline data={topGainer.sparkline7d} isPositive={true} width={90} height={36} />
        </div>

        {/* Card 2: Top Loser */}
        <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
              <Activity size={14} color="#ef4444" /> LARGEST RETRACE
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {topLoser.ticker} <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{topLoser.market}</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--accent-bearish)', fontWeight: 700, marginTop: '2px' }}>
              {topLoser.change}% ({topLoser.currency === 'USD' ? '$' : '฿'}{topLoser.price})
            </div>
          </div>
          <Sparkline data={topLoser.sparkline7d} isPositive={false} width={90} height={36} />
        </div>

        {/* Card 3: Top AI Sentiment */}
        <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
              <Award size={14} color="#f59e0b" /> HIGHEST AI RATING
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {topAiRating.ticker} <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{topAiRating.market}</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--accent-neutral)', fontWeight: 700, marginTop: '2px' }}>
              AI Score: {topAiRating.sentimentScore}/100 ({topAiRating.analystRating})
            </div>
          </div>
          <Sparkline data={topAiRating.sparkline7d} isPositive={true} width={90} height={36} />
        </div>
      </div>

      {/* Main Directory Filter Bar & Controls */}
      <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="live-pulse-dot" />
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-bullish)', fontWeight: 700, letterSpacing: '0.04em' }}>LIVE MARKET INTELLIGENCE FEED</span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '4px 0', color: 'var(--text-primary)' }}>
              ดัชนีและหุ้นทั้งตลาด (Stock Directory)
            </h2>
          </div>
          <button
            onClick={onRequestPreview}
            style={{
              padding: '8px 18px',
              borderRadius: '100px',
              background: 'var(--accent-blue-gradient)',
              border: 'none',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px var(--accent-blue-glow)'
            }}
          >
            <Sparkles size={15} /> Request Pro Access
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid var(--glass-border)' }}>
          {/* Market Tab Switcher */}
          <div className="ios-segmented-control" style={{ padding: '3px' }}>
            {(['ALL', 'SET', 'US'] as const).map((m) => (
              <button
                key={m}
                className={`ios-segment-btn ${selectedMarket === m ? 'active' : ''}`}
                onClick={() => setSelectedMarket(m)}
                style={{ padding: '6px 16px', fontSize: '0.82rem' }}
              >
                {m === 'ALL' ? '🌐 ทั้งหมด' : m === 'SET' ? '🇹🇭 ตลาด SET' : '🇺🇸 ตลาด US'}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="ค้นหาชื่อหุ้นหรือ Ticker (เช่น PTT, NVDA, AAPL)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 14px 9px 38px',
                borderRadius: '100px',
                border: '1px solid var(--glass-border)',
                background: 'rgba(0, 0, 0, 0.25)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Sector Select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} color="var(--text-secondary)" />
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              style={{
                padding: '9px 14px',
                borderRadius: '100px',
                border: '1px solid var(--glass-border)',
                background: 'rgba(0, 0, 0, 0.3)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {availableSectors.map((sec) => (
                <option key={sec} value={sec} style={{ background: '#0d121f', color: '#fff' }}>
                  {sec === 'ALL' ? 'ทุกกลุ่มอุตสาหกรรม (Sectors)' : sec}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Select */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: '9px 14px',
              borderRadius: '100px',
              border: '1px solid var(--glass-border)',
              background: 'rgba(0, 0, 0, 0.3)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="gainers" style={{ background: '#0d121f' }}>📈 หุ้นบวกสูงสุด (Top Gainers)</option>
            <option value="losers" style={{ background: '#0d121f' }}>📉 หุ้นลบสูงสุด (Top Losers)</option>
            <option value="peRatio" style={{ background: '#0d121f' }}>📊 ค่า P/E ต่ำสุด</option>
          </select>

          {/* Grid / Table View Switcher */}
          <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '7px 11px',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'grid' ? 'var(--accent-blue-gradient)' : 'transparent',
                color: viewMode === 'grid' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '7px 11px',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'table' ? 'var(--accent-blue-gradient)' : 'transparent',
                color: viewMode === 'table' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <TableIcon size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Stock Cards Grid or Table View */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '16px' }}>
          {filteredStocks.map((stock) => {
            const isPositive = stock.change >= 0;
            return (
              <div
                key={stock.ticker}
                className="glass-card"
                onClick={() => setActiveStock(stock)}
                style={{
                  padding: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                {/* Header info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                        {stock.ticker}
                      </span>
                      <span className="ticker-pill">{stock.market}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                      {stock.name}
                    </div>
                  </div>
                  <span
                    className={`badge-sentiment ${isPositive ? 'badge-bullish' : 'badge-bearish'}`}
                    style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                  >
                    {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {isPositive ? `+${stock.change.toFixed(2)}%` : `${stock.change.toFixed(2)}%`}
                  </span>
                </div>

                {/* Price & Sparkline Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', margin: '4px 0' }}>
                  <div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                      {stock.currency === 'USD' ? '$' : '฿'}{stock.price.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      Analyst: <strong style={{ color: 'var(--accent-blue)' }}>{stock.analystRating}</strong>
                    </div>
                  </div>
                  <Sparkline data={stock.sparkline7d} isPositive={isPositive} width={110} height={40} />
                </div>

                {/* AI Snippet Preview */}
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--glass-border)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#c084fc', fontWeight: 700, marginBottom: '3px' }}>
                    <Sparkles size={13} /> AI Intelligence:
                  </div>
                  <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
                    {stock.aiInsight}
                  </div>
                </div>

                {/* Footer Metrics */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-tertiary)', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span>Cap: {stock.marketCap}</span>
                  <span>P/E: {stock.peRatio}</span>
                  <span>Div: {stock.dividendYield}%</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(0, 0, 0, 0.3)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '14px 18px' }}>Symbol / Company</th>
                <th style={{ padding: '14px 18px' }}>Market</th>
                <th style={{ padding: '14px 18px' }}>7D Trend</th>
                <th style={{ padding: '14px 18px' }}>Price</th>
                <th style={{ padding: '14px 18px' }}>24h Change</th>
                <th style={{ padding: '14px 18px' }}>Target Price</th>
                <th style={{ padding: '14px 18px' }}>P/E Ratio</th>
                <th style={{ padding: '14px 18px' }}>Market Cap</th>
                <th style={{ padding: '14px 18px' }}>Consensus</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map((stock) => {
                const isPositive = stock.change >= 0;
                return (
                  <tr
                    key={stock.ticker}
                    style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', cursor: 'pointer', transition: 'background 0.2s' }}
                    onClick={() => setActiveStock(stock)}
                  >
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem' }}>{stock.ticker}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{stock.name}</div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span className="ticker-pill">{stock.market}</span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <Sparkline data={stock.sparkline7d} isPositive={isPositive} width={90} height={30} />
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 700, fontSize: '0.95rem' }}>
                      {stock.currency === 'USD' ? '$' : '฿'}{stock.price.toFixed(2)}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span className={`badge-sentiment ${isPositive ? 'badge-bullish' : 'badge-bearish'}`}>
                        {isPositive ? `+${stock.change.toFixed(2)}%` : `${stock.change.toFixed(2)}%`}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--accent-blue)', fontWeight: 600 }}>
                      {stock.currency === 'USD' ? '$' : '฿'}{stock.targetPrice.toFixed(2)}
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>{stock.peRatio}</td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>{stock.marketCap}</td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '100px', background: 'rgba(0, 122, 255, 0.15)', color: 'var(--accent-blue)', fontWeight: 700 }}>
                        {stock.analystRating}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Stock Detail Modal with Interactive 7D Chart */}
      {activeStock && (
        <div className="ios-sheet-overlay" onClick={() => setActiveStock(null)}>
          <div className="ios-sheet-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{activeStock.ticker}</h3>
                <span className="ticker-pill">{activeStock.market}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '100px' }}>
                  {activeStock.sector}
                </span>
              </div>
              <button
                onClick={() => setActiveStock(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '22px', lineHeight: '1.6' }}>
              {activeStock.description}
            </p>

            {/* Price & Chart Canvas Header */}
            <div className="glass-card" style={{ padding: '20px', marginBottom: '22px', background: 'radial-gradient(circle at 10% 10%, rgba(0, 122, 255, 0.1), rgba(18, 24, 38, 0.6))' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Realtime Price</div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {activeStock.currency === 'USD' ? '$' : '฿'}{activeStock.price.toFixed(2)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge-sentiment ${activeStock.change >= 0 ? 'badge-bullish' : 'badge-bearish'}`} style={{ fontSize: '1rem', padding: '6px 14px' }}>
                    {activeStock.change >= 0 ? `+${activeStock.change.toFixed(2)}%` : `${activeStock.change.toFixed(2)}%`}
                  </span>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>7 Days Historical Trend</div>
                </div>
              </div>

              {/* Large Interactive SVG Chart */}
              <div style={{ width: '100%', height: '120px', marginTop: '10px' }}>
                <Sparkline data={activeStock.sparkline7d} isPositive={activeStock.change >= 0} width={600} height={120} />
              </div>
            </div>

            {/* Financial Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '22px' }}>
              <div className="glass-card" style={{ padding: '14px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Market Cap</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{activeStock.marketCap}</div>
              </div>
              <div className="glass-card" style={{ padding: '14px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Target Price</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-blue)', marginTop: '2px' }}>
                  {activeStock.currency === 'USD' ? '$' : '฿'}{activeStock.targetPrice.toFixed(2)}
                </div>
              </div>
              <div className="glass-card" style={{ padding: '14px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Consensus</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-bullish)', marginTop: '2px' }}>{activeStock.analystRating}</div>
              </div>
              <div className="glass-card" style={{ padding: '14px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>AI Score</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-neutral)', marginTop: '2px' }}>{activeStock.sentimentScore}/100</div>
              </div>
            </div>

            {/* AI Analysis Box */}
            <div style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(0, 122, 255, 0.12))', border: '1px solid rgba(139, 92, 246, 0.25)', padding: '18px', borderRadius: '18px', marginBottom: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc', fontWeight: 800, marginBottom: '6px' }}>
                <Sparkles size={18} /> StockHome Executive AI Digest
              </div>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                "{activeStock.aiInsight}"
              </p>
            </div>

            <button
              onClick={() => setActiveStock(null)}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '100px',
                background: 'var(--accent-blue-gradient)',
                border: 'none',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px var(--accent-blue-glow)'
              }}
            >
              ปิดหน้าต่างวิเคราะห์หุ้น
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

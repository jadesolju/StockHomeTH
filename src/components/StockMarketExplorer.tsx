import React, { useState, useMemo } from 'react';
import { fullMarketStocks, type StockFundamentalData } from '../data/fullMarketStocks';
import { Search, TrendingUp, TrendingDown, Filter, Sparkles, Code2, LayoutGrid, Table as TableIcon, X, Globe } from 'lucide-react';

interface StockMarketExplorerProps {
  onOpenDevApi: () => void;
  onRequestPreview: () => void;
}

export const StockMarketExplorer: React.FC<StockMarketExplorerProps> = ({ onOpenDevApi, onRequestPreview }) => {
  const [selectedMarket, setSelectedMarket] = useState<'ALL' | 'SET' | 'US'>('ALL');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'gainers' | 'losers' | 'marketCap' | 'peRatio'>('gainers');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [activeStock, setActiveStock] = useState<StockFundamentalData | null>(null);

  // Extract unique sectors
  const availableSectors = useMemo(() => {
    const sectors = new Set<string>();
    fullMarketStocks.forEach((s) => sectors.add(s.sector));
    return ['ALL', ...Array.from(sectors)];
  }, []);

  // Filter and sort stocks
  const filteredStocks = useMemo(() => {
    return fullMarketStocks
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
        // Default marketCap or fallback
        return b.price - a.price;
      });
  }, [selectedMarket, selectedSector, sortBy, searchQuery]);

  return (
    <div style={{ padding: '24px 0', width: '100%' }}>
      {/* Banner / Header */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span className="badge-sentiment badge-bullish" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Globe size={14} /> Full Market Coverage
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>SET & US Exchanges</span>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '4px 0' }}>
              ตลาดหุ้นไทยและต่างประเทศ (Stock Directory)
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              ค้นหาหุ้น ปัจจัยพื้นฐาน บทวิเคราะห์ AI และเชื่อมต่อ Developer API สำหรับนักพัฒนา
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onOpenDevApi}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '100px',
                background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.2), rgba(139, 92, 246, 0.2))',
                border: '1px solid var(--accent-blue-glow)',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Code2 size={16} /> Developer REST API
            </button>
            <button
              onClick={onRequestPreview}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '100px',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              <Sparkles size={16} color="var(--accent-neutral)" /> Request Preview Tier
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--glass-border)' }}>
          {/* Market Tab Switcher */}
          <div className="ios-segmented-control" style={{ padding: '3px' }}>
            {(['ALL', 'SET', 'US'] as const).map((m) => (
              <button
                key={m}
                className={`ios-segment-btn ${selectedMarket === m ? 'active' : ''}`}
                onClick={() => setSelectedMarket(m)}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                {m === 'ALL' ? '🌐 ทั้งหมด' : m === 'SET' ? '🇹🇭 ตลาด SET' : '🇺🇸 ตลาด US'}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="ค้นหาชื่อหุ้น (เช่น PTT, NVDA, AAPL)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '100px',
                border: '1px solid var(--glass-border)',
                background: 'rgba(0, 0, 0, 0.15)',
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
                padding: '8px 14px',
                borderRadius: '100px',
                border: '1px solid var(--glass-border)',
                background: 'rgba(0, 0, 0, 0.2)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {availableSectors.map((sec) => (
                <option key={sec} value={sec} style={{ background: '#1a1e29', color: '#fff' }}>
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
              padding: '8px 14px',
              borderRadius: '100px',
              border: '1px solid var(--glass-border)',
              background: 'rgba(0, 0, 0, 0.2)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="gainers" style={{ background: '#1a1e29' }}>📈 หุ้นบวกสูงสุด (Top Gainers)</option>
            <option value="losers" style={{ background: '#1a1e29' }}>📉 หุ้นลบสูงสุด (Top Losers)</option>
            <option value="peRatio" style={{ background: '#1a1e29' }}>📊 ค่า P/E ต่ำสุด</option>
          </select>

          {/* Grid / Table View Switcher */}
          <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'grid' ? 'var(--accent-blue)' : 'transparent',
                color: viewMode === 'grid' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'table' ? 'var(--accent-blue)' : 'transparent',
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
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
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
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
                    style={{ fontSize: '0.8rem', padding: '3px 8px' }}
                  >
                    {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {isPositive ? `+${stock.change.toFixed(2)}%` : `${stock.change.toFixed(2)}%`}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
                  <div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {stock.currency === 'USD' ? '$' : '฿'}{stock.price.toFixed(2)}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: '4px' }}>
                      {stock.currency}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    P/E: <strong>{stock.peRatio}</strong>
                  </span>
                </div>

                {/* AI Snippet Preview */}
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '10px', border: '1px solid var(--glass-border)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-neutral)', fontWeight: 600, marginBottom: '2px' }}>
                    <Sparkles size={12} /> AI Insight:
                  </div>
                  <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {stock.aiInsight}
                  </div>
                </div>

                {/* Footer Metrics */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-tertiary)', paddingTop: '4px' }}>
                  <span>Vol: {stock.volume}</span>
                  <span>Cap: {stock.marketCap}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(0, 0, 0, 0.2)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '14px 16px' }}>Ticker / Name</th>
                <th style={{ padding: '14px 16px' }}>Market</th>
                <th style={{ padding: '14px 16px' }}>Sector</th>
                <th style={{ padding: '14px 16px' }}>Price</th>
                <th style={{ padding: '14px 16px' }}>24h Change</th>
                <th style={{ padding: '14px 16px' }}>P/E Ratio</th>
                <th style={{ padding: '14px 16px' }}>Dividend</th>
                <th style={{ padding: '14px 16px' }}>Market Cap</th>
                <th style={{ padding: '14px 16px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map((stock) => {
                const isPositive = stock.change >= 0;
                return (
                  <tr
                    key={stock.ticker}
                    style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', cursor: 'pointer' }}
                    onClick={() => setActiveStock(stock)}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{stock.ticker}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{stock.name}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="ticker-pill">{stock.market}</span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{stock.sector}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                      {stock.currency === 'USD' ? '$' : '฿'}{stock.price.toFixed(2)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`badge-sentiment ${isPositive ? 'badge-bullish' : 'badge-bearish'}`}>
                        {isPositive ? `+${stock.change.toFixed(2)}%` : `${stock.change.toFixed(2)}%`}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{stock.peRatio}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{stock.dividendYield}%</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{stock.marketCap}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveStock(stock);
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '100px',
                          background: 'rgba(0, 122, 255, 0.15)',
                          border: '1px solid var(--accent-blue-glow)',
                          color: 'var(--accent-blue)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        View AI
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Stock Detail Modal */}
      {activeStock && (
        <div className="ios-sheet-overlay" onClick={() => setActiveStock(null)}>
          <div className="ios-sheet-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{activeStock.ticker}</h3>
                <span className="ticker-pill">{activeStock.market}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{activeStock.sector}</span>
              </div>
              <button
                onClick={() => setActiveStock(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5' }}>
              {activeStock.description}
            </p>

            {/* Price Banner */}
            <div className="glass-card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Current Market Price</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {activeStock.currency === 'USD' ? '$' : '฿'}{activeStock.price.toFixed(2)}
                </div>
              </div>
              <div className={`badge-sentiment ${activeStock.change >= 0 ? 'badge-bullish' : 'badge-bearish'}`} style={{ fontSize: '1rem', padding: '6px 14px' }}>
                {activeStock.change >= 0 ? `+${activeStock.change.toFixed(2)}%` : `${activeStock.change.toFixed(2)}%`}
              </div>
            </div>

            {/* Fundamentals Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div className="glass-card" style={{ padding: '12px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Market Capitalization</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{activeStock.marketCap}</div>
              </div>
              <div className="glass-card" style={{ padding: '12px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>P/E Ratio</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{activeStock.peRatio}</div>
              </div>
              <div className="glass-card" style={{ padding: '12px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Dividend Yield</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-bullish)' }}>{activeStock.dividendYield}%</div>
              </div>
              <div className="glass-card" style={{ padding: '12px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>52-Week Range</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {activeStock.low52w} - {activeStock.high52w} {activeStock.currency}
                </div>
              </div>
            </div>

            {/* AI Insight Box */}
            <div style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.15))', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '16px', borderRadius: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c084fc', fontWeight: 700, marginBottom: '6px' }}>
                <Sparkles size={16} /> StockHome AI Analyst Insight
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                "{activeStock.aiInsight}"
              </p>
            </div>

            {/* Developer API Trigger for this stock */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  setActiveStock(null);
                  onOpenDevApi();
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '100px',
                  background: 'var(--accent-blue)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Code2 size={16} /> Call `GET /api/v1/stocks/{activeStock.ticker}`
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  CandlestickChart as CandleIcon,
  LineChart as LineIcon,
  Search,
  RefreshCw,
  Maximize2,
  Minimize2,
  Sliders,
  TrendingUp,
  TrendingDown,
  Globe,
  Layers,
  Activity,
  Zap,
  Info
} from 'lucide-react';
import {
  fetchStockChartData,
  type StockChartResponse,
  type CandleData
} from '../../lib/services/stockChartService';

interface CustomStockChartProps {
  initialSymbol?: string;
  initialCountry?: 'th' | 'us' | 'jp' | 'hk' | 'uk' | 'sg';
}

const COUNTRIES = [
  { code: 'th', label: 'ไทย (SET)', flag: '🇹🇭', suffix: '.BK', currency: 'THB' },
  { code: 'us', label: 'สหรัฐฯ (US)', flag: '🇺🇸', suffix: '', currency: 'USD' },
  { code: 'jp', label: 'ญี่ปุ่น (TSE)', flag: '🇯🇵', suffix: '.T', currency: 'JPY' },
  { code: 'hk', label: 'ฮ่องกง (HKEX)', flag: '🇭🇰', suffix: '.HK', currency: 'HKD' },
  { code: 'uk', label: 'อังกฤษ (LSE)', flag: '🇬🇧', suffix: '.L', currency: 'GBp' },
  { code: 'sg', label: 'สิงคโปร์ (SGX)', flag: '🇸🇬', suffix: '.SI', currency: 'SGD' }
] as const;

type CountryCode = typeof COUNTRIES[number]['code'];

const POPULAR_TICKERS: Record<CountryCode, Array<{ ticker: string; name: string; symbol: string }>> = {
  th: [
    { ticker: 'PTT', name: 'ปตท.', symbol: 'PTT.BK' },
    { ticker: 'CPALL', name: 'ซีพี ออลล์', symbol: 'CPALL.BK' },
    { ticker: 'DELTA', name: 'เดลต้า', symbol: 'DELTA.BK' },
    { ticker: 'AOT', name: 'ท่าอากาศยานไทย', symbol: 'AOT.BK' },
    { ticker: 'KBANK', name: 'กสิกรไทย', symbol: 'KBANK.BK' },
    { ticker: 'GULF', name: 'กัลฟ์ เอ็นเนอร์จี', symbol: 'GULF.BK' },
    { ticker: 'BDMS', name: 'กรุงเทพดุสิตเวชการ', symbol: 'BDMS.BK' },
    { ticker: 'SCB', name: 'เอสซีบี เอกซ์', symbol: 'SCB.BK' },
    { ticker: 'ADVANC', name: 'แอดวานซ์ อินโฟร์', symbol: 'ADVANC.BK' },
    { ticker: 'TRUE', name: 'ทรู คอร์ปอเรชั่น', symbol: 'TRUE.BK' }
  ],
  us: [
    { ticker: 'NVDA', name: 'NVIDIA', symbol: 'NVDA' },
    { ticker: 'AAPL', name: 'Apple', symbol: 'AAPL' },
    { ticker: 'TSLA', name: 'Tesla', symbol: 'TSLA' },
    { ticker: 'MSFT', name: 'Microsoft', symbol: 'MSFT' },
    { ticker: 'GOOGL', name: 'Alphabet Google', symbol: 'GOOGL' },
    { ticker: 'META', name: 'Meta Platforms', symbol: 'META' },
    { ticker: 'AMZN', name: 'Amazon', symbol: 'AMZN' },
    { ticker: 'AMD', name: 'AMD Semi', symbol: 'AMD' }
  ],
  jp: [
    { ticker: '7203', name: 'Toyota Motor', symbol: '7203.T' },
    { ticker: '9984', name: 'SoftBank Group', symbol: '9984.T' },
    { ticker: '6758', name: 'Sony Group', symbol: '6758.T' },
    { ticker: '8035', name: 'Tokyo Electron', symbol: '8035.T' }
  ],
  hk: [
    { ticker: '0700', name: 'Tencent', symbol: '0700.HK' },
    { ticker: '9988', name: 'Alibaba Group', symbol: '9988.HK' },
    { ticker: '3690', name: 'Meituan', symbol: '3690.HK' }
  ],
  uk: [
    { ticker: 'SHEL', name: 'Shell Energy', symbol: 'SHEL.L' },
    { ticker: 'AZN', name: 'AstraZeneca', symbol: 'AZN.L' },
    { ticker: 'HSBA', name: 'HSBC Holdings', symbol: 'HSBA.L' }
  ],
  sg: [
    { ticker: 'D05', name: 'DBS Group', symbol: 'D05.SI' },
    { ticker: 'Z74', name: 'Singtel', symbol: 'Z74.SI' },
    { ticker: 'U11', name: 'UOB Bank', symbol: 'U11.SI' }
  ]
};

const TIMEFRAMES = [
  { label: '1D', value: '1d' },
  { label: '5D', value: '5d' },
  { label: '1M', value: '1mo' },
  { label: '3M', value: '3mo' },
  { label: '6M', value: '6mo' },
  { label: '1Y', value: '1y' },
  { label: 'ALL', value: 'max' }
];

export function CustomStockChart({
  initialSymbol = 'PTT.BK',
  initialCountry = 'th'
}: CustomStockChartProps) {
  // Normalize symbol
  const cleanInitial = initialSymbol.replace(/^SET:/i, '').replace(/^NASDAQ:/i, '').replace(/^NYSE:/i, '');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(initialCountry);
  const [symbol, setSymbol] = useState<string>(cleanInitial);
  const [period, setPeriod] = useState<string>('1mo');
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [showMA20, setShowMA20] = useState<boolean>(true);
  const [showMA50, setShowMA50] = useState<boolean>(true);
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [customInput, setCustomInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Chart data state
  const [chartData, setChartData] = useState<StockChartResponse | null>(null);
  const [hoveredCandle, setHoveredCandle] = useState<CandleData | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Fetch Chart Data
  const loadChart = async (sym: string, p: string, country: CountryCode) => {
    setIsLoading(true);
    try {
      const data = await fetchStockChartData(sym, p, country);
      setChartData(data);
    } catch (e) {
      console.error('Failed to load chart data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChart(symbol, period, selectedCountry);
  }, [symbol, period, selectedCountry]);

  // Handle country switch
  const handleCountryChange = (c: CountryCode) => {
    setSelectedCountry(c);
    const presets = POPULAR_TICKERS[c];
    if (presets && presets.length > 0) {
      setSymbol(presets[0].symbol);
    }
  };

  // Handle custom symbol search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = customInput.trim().toUpperCase();
    if (!query) return;

    const countryObj = COUNTRIES.find((c) => c.code === selectedCountry);
    const suffix = countryObj ? countryObj.suffix : '';
    const formatted = query.includes('.') || query.includes('^') ? query : `${query}${suffix}`;

    setSymbol(formatted);
    setCustomInput('');
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // SVG Chart Geometry Calculations
  const chartHeight = 360;
  const volumeHeight = showVolume ? 90 : 0;
  const totalSvgHeight = chartHeight + volumeHeight + 40; // with X-axis
  const padding = { top: 20, right: 65, bottom: 25, left: 15 };

  const candles = chartData?.candles || [];

  const { minPrice, maxPrice, maxVol, priceRange } = useMemo(() => {
    if (candles.length === 0) {
      return { minPrice: 0, maxPrice: 100, maxVol: 1000, priceRange: 100 };
    }
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const vols = candles.map((c) => c.volume);
    
    // Include MA in min/max if active
    if (showMA20) candles.forEach((c) => c.ma20 && (highs.push(c.ma20), lows.push(c.ma20)));
    if (showMA50) candles.forEach((c) => c.ma50 && (highs.push(c.ma50), lows.push(c.ma50)));

    const rawMin = Math.min(...lows);
    const rawMax = Math.max(...highs);
    const margin = (rawMax - rawMin) * 0.08 || 1;
    const minP = Math.max(0.1, rawMin - margin);
    const maxP = rawMax + margin;

    return {
      minPrice: minP,
      maxPrice: maxP,
      maxVol: Math.max(...vols, 100),
      priceRange: maxP - minP || 1
    };
  }, [candles, showMA20, showMA50]);

  // Coordinate mapping helper
  const getY = (price: number) => {
    return padding.top + (1 - (price - minPrice) / priceRange) * (chartHeight - padding.top - 10);
  };

  const getVolY = (vol: number) => {
    const volBase = chartHeight + 15;
    const volH = (vol / maxVol) * (volumeHeight - 15);
    return volBase + (volumeHeight - 15 - volH);
  };

  const getVolHeight = (vol: number) => {
    return Math.max(2, (vol / maxVol) * (volumeHeight - 15));
  };

  // SVG dimensions based on candle count
  const renderWidth = Math.max(600, candles.length * 16);
  const candleStep = candles.length > 0 ? (renderWidth - padding.left - padding.right) / candles.length : 14;
  const candleWidth = Math.max(3, Math.min(18, candleStep * 0.65));

  // Generate paths for Line Mode & Area Fill
  const { linePath, areaPath, ma20Path, ma50Path } = useMemo(() => {
    if (candles.length === 0) return { linePath: '', areaPath: '', ma20Path: '', ma50Path: '' };

    const points = candles.map((c, i) => {
      const x = padding.left + i * candleStep + candleStep / 2;
      const y = getY(c.close);
      return { x, y };
    });

    const line = points.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`), '');
    const bottomY = chartHeight;
    const area = `${line} L ${points[points.length - 1].x},${bottomY} L ${points[0].x},${bottomY} Z`;

    // MA20
    const ma20Pts = candles
      .map((c, i) => {
        if (!c.ma20) return null;
        const x = padding.left + i * candleStep + candleStep / 2;
        const y = getY(c.ma20);
        return { x, y };
      })
      .filter((p): p is { x: number; y: number } => p !== null);

    const ma20 = ma20Pts.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`), '');

    // MA50
    const ma50Pts = candles
      .map((c, i) => {
        if (!c.ma50) return null;
        const x = padding.left + i * candleStep + candleStep / 2;
        const y = getY(c.ma50);
        return { x, y };
      })
      .filter((p): p is { x: number; y: number } => p !== null);

    const ma50 = ma50Pts.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`), '');

    return { linePath: line, areaPath: area, ma20Path: ma20, ma50Path: ma50 };
  }, [candles, candleStep, minPrice, maxPrice, priceRange]);

  // Handle Mouse Move for Interactive Crosshair HUD
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || candles.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const xPos = e.clientX - rect.left;
    const chartX = xPos - padding.left;
    const index = Math.floor(chartX / candleStep);

    if (index >= 0 && index < candles.length) {
      setHoveredCandle(candles[index]);
      setHoverX(padding.left + index * candleStep + candleStep / 2);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCandle(null);
    setHoverX(null);
  };

  // Price Grid Lines (4 evenly spaced horizontal levels)
  const gridLevels = useMemo(() => {
    return [0.15, 0.4, 0.65, 0.9].map((ratio) => {
      const price = minPrice + ratio * priceRange;
      const y = getY(price);
      return { price: price.toFixed(2), y };
    });
  }, [minPrice, priceRange]);

  const activeCandle = hoveredCandle || (candles.length > 0 ? candles[candles.length - 1] : null);
  const isPositive = (chartData?.change || 0) >= 0;

  return (
    <div
      ref={containerRef}
      className="glass-card custom-stock-chart-container"
      style={{
        borderRadius: '24px',
        padding: '24px',
        marginBottom: '32px',
        background: 'linear-gradient(180deg, rgba(16, 22, 34, 0.85) 0%, rgba(10, 14, 22, 0.95) 100%)',
        border: '1px solid rgba(0, 240, 255, 0.18)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background ambient lighting */}
      <div
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-80px',
          width: '350px',
          height: '350px',
          background: isPositive
            ? 'radial-gradient(circle, rgba(0, 230, 118, 0.08) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(255, 59, 48, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Header Bar: Symbol Details, Live Price, 24h Change, Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '18px',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Left: Ticker Title, Country Flag, Price Display */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '8px',
                background: 'rgba(0, 240, 255, 0.12)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                color: '#00F0FF',
                fontSize: '0.85rem',
                fontWeight: 800
              }}
            >
              <Activity size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>{chartData?.symbol || symbol}</span>
            </div>

            <span
              style={{
                fontSize: '0.75rem',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'var(--text-secondary)',
                fontWeight: 600
              }}
            >
              {COUNTRIES.find((c) => c.code === selectedCountry)?.flag}{' '}
              {COUNTRIES.find((c) => c.code === selectedCountry)?.label}
            </span>

            <span
              style={{
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: '100px',
                background: isPositive ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 59, 48, 0.15)',
                color: isPositive ? '#00E676' : '#FF3B30',
                fontWeight: 700
              }}
            >
              ● LIVE ENGINE
            </span>
          </div>

          {/* Big Price & Change */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '6px' }}>
            <span
              style={{
                fontSize: '2rem',
                fontWeight: 900,
                color: 'var(--text-primary)',
                letterSpacing: '-0.5px',
                fontFamily: 'monospace, sans-serif'
              }}
            >
              {chartData ? `${chartData.currency || ''} ${(chartData.current_price ?? 0).toLocaleString()}` : '—'}
            </span>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '1rem',
                fontWeight: 800,
                color: isPositive ? '#00E676' : '#FF3B30'
              }}
            >
              {isPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              <span>
                {isPositive ? '+' : ''}
                {(chartData?.change ?? 0).toFixed(2)} ({isPositive ? '+' : ''}
                {(chartData?.change_percent ?? 0).toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Right: Custom Ticker Search Box & Fullscreen Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '6px' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={14}
                color="var(--text-tertiary)"
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder={`ค้นหาหุ้น ${COUNTRIES.find((c) => c.code === selectedCountry)?.label}...`}
                style={{
                  padding: '7px 10px 7px 30px',
                  borderRadius: '10px',
                  border: '1px solid var(--input-border)',
                  background: 'var(--input-bg)',
                  color: 'var(--input-text)',
                  fontSize: '0.8rem',
                  outline: 'none',
                  minWidth: '200px'
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #007AFF 0%, #00C6FF 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '7px 12px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              เปิดกราฟ
            </button>
          </form>

          <button
            onClick={() => loadChart(symbol, period, selectedCountry)}
            title="รีเฟรชข้อมูลล่าสุด"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-secondary)',
              borderRadius: '10px',
              padding: '7px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'ออกจากเต็มจอ' : 'ขยายเต็มจอ'}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-secondary)',
              borderRadius: '10px',
              padding: '7px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* Country Selection Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          position: 'relative',
          zIndex: 1
        }}
      >
        {COUNTRIES.map((c) => (
          <button
            key={c.code}
            onClick={() => handleCountryChange(c.code)}
            style={{
              background: selectedCountry === c.code ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              color: selectedCountry === c.code ? '#00F0FF' : 'var(--text-secondary)',
              border: selectedCountry === c.code ? '1px solid #00F0FF' : '1px solid rgba(255, 255, 255, 0.06)',
              padding: '4px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: selectedCountry === c.code ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <span>{c.flag}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Quick Ticker Chips for Selected Country */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '10px',
          marginBottom: '16px',
          position: 'relative',
          zIndex: 1
        }}
      >
        {POPULAR_TICKERS[selectedCountry]?.map((item) => {
          const isActive = symbol === item.symbol || symbol === item.ticker;
          return (
            <button
              key={item.symbol}
              onClick={() => setSymbol(item.symbol)}
              style={{
                background: isActive ? 'linear-gradient(135deg, #007AFF 0%, #00F0FF 100%)' : 'rgba(255, 255, 255, 0.04)',
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                border: isActive ? '1px solid rgba(0, 240, 255, 0.6)' : '1px solid rgba(255, 255, 255, 0.06)',
                padding: '4px 10px',
                borderRadius: '100px',
                fontSize: '0.75rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              {item.ticker} <span style={{ opacity: 0.6, fontSize: '0.7rem' }}>({item.name})</span>
            </button>
          );
        })}
      </div>

      {/* Chart Toolbar: Chart Type, Timeframe Pills, Indicators Overlay */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '8px 12px',
          borderRadius: '12px',
          background: 'rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          marginBottom: '14px',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Left: Chart Type & Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Chart Type Toggle */}
          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '2px' }}>
            <button
              onClick={() => setChartType('candle')}
              style={{
                background: chartType === 'candle' ? 'rgba(0, 240, 255, 0.25)' : 'transparent',
                color: chartType === 'candle' ? '#00F0FF' : 'var(--text-tertiary)',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              <CandleIcon size={14} /> แท่งเทียน
            </button>
            <button
              onClick={() => setChartType('line')}
              style={{
                background: chartType === 'line' ? 'rgba(0, 240, 255, 0.25)' : 'transparent',
                color: chartType === 'line' ? '#00F0FF' : 'var(--text-tertiary)',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              <LineIcon size={14} /> เส้นกราฟ
            </button>
          </div>

          <div style={{ height: '16px', width: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />

          {/* Indicator Toggles */}
          <button
            onClick={() => setShowMA20(!showMA20)}
            style={{
              background: showMA20 ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              color: showMA20 ? '#00F0FF' : 'var(--text-tertiary)',
              border: showMA20 ? '1px solid rgba(0, 240, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ● MA20
          </button>

          <button
            onClick={() => setShowMA50(!showMA50)}
            style={{
              background: showMA50 ? 'rgba(255, 179, 0, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              color: showMA50 ? '#FFB300' : 'var(--text-tertiary)',
              border: showMA50 ? '1px solid rgba(255, 179, 0, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ● MA50
          </button>

          <button
            onClick={() => setShowVolume(!showVolume)}
            style={{
              background: showVolume ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              color: showVolume ? '#34C759' : 'var(--text-tertiary)',
              border: showVolume ? '1px solid rgba(52, 199, 89, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ปริมาณ (Vol)
          </button>
        </div>

        {/* Right: Timeframe Switcher */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setPeriod(tf.value)}
              style={{
                background: period === tf.value ? 'rgba(0, 122, 255, 0.3)' : 'transparent',
                color: period === tf.value ? '#FFFFFF' : 'var(--text-tertiary)',
                border: period === tf.value ? '1px solid rgba(0, 122, 255, 0.6)' : 'none',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: period === tf.value ? 800 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive HUD Readout (Active / Hovered Candle Stats) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          padding: '6px 12px',
          borderRadius: '8px',
          background: 'var(--card-sub-bg)',
          border: '1px solid var(--card-sub-border)',
          fontSize: '0.75rem',
          fontFamily: 'monospace, sans-serif',
          color: 'var(--text-secondary)',
          marginBottom: '10px',
          position: 'relative',
          zIndex: 1
        }}
      >
        <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
          📅 {activeCandle?.date || '—'}
        </span>
        <span>
          O: <strong style={{ color: 'var(--text-primary)' }}>{activeCandle?.open?.toFixed(2) || '—'}</strong>
        </span>
        <span>
          H: <strong style={{ color: '#00E676' }}>{activeCandle?.high?.toFixed(2) || '—'}</strong>
        </span>
        <span>
          L: <strong style={{ color: '#FF3B30' }}>{activeCandle?.low?.toFixed(2) || '—'}</strong>
        </span>
        <span>
          C:{' '}
          <strong style={{ color: activeCandle?.isUp ? '#00E676' : '#FF3B30' }}>
            {activeCandle?.close?.toFixed(2) || '—'}
          </strong>
        </span>
        {showVolume && (
          <span>
            Vol: <strong style={{ color: '#00F0FF' }}>{activeCandle?.volume?.toLocaleString() || '—'}</strong>
          </span>
        )}
        {showMA20 && activeCandle?.ma20 && (
          <span style={{ color: '#00F0FF' }}>
            MA20: <strong>{activeCandle.ma20.toFixed(2)}</strong>
          </span>
        )}
        {showMA50 && activeCandle?.ma50 && (
          <span style={{ color: '#FFB300' }}>
            MA50: <strong>{activeCandle.ma50.toFixed(2)}</strong>
          </span>
        )}
      </div>

      {/* Main SVG Native Chart Container */}
      <div
        style={{
          width: '100%',
          overflowX: 'auto',
          background: '#090D16',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          position: 'relative',
          userSelect: 'none'
        }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height={totalSvgHeight}
          viewBox={`0 0 ${renderWidth} ${totalSvgHeight}`}
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ display: 'block', cursor: 'crosshair' }}
        >
          <defs>
            {/* Area Line Gradient */}
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#007AFF" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#007AFF" stopOpacity="0.0" />
            </linearGradient>

            {/* Bullish Candle Glow */}
            <filter id="bullGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#00E676" floodOpacity="0.3" />
            </filter>

            {/* Bearish Candle Glow */}
            <filter id="bearGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#FF3B30" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Grid Background Horizontal Lines */}
          {gridLevels.map((lvl, idx) => (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={lvl.y}
                x2={renderWidth - padding.right}
                y2={lvl.y}
                stroke="rgba(255, 255, 255, 0.06)"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={renderWidth - padding.right + 8}
                y={lvl.y + 4}
                fill="rgba(255, 255, 255, 0.4)"
                fontSize="10"
                fontFamily="monospace"
              >
                {lvl.price}
              </text>
            </g>
          ))}

          {/* Area Mode: Fill & Line */}
          {chartType === 'line' && (
            <>
              <path d={areaPath} fill="url(#areaGradient)" />
              <path
                d={linePath}
                fill="none"
                stroke="#00F0FF"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* Candlestick Mode */}
          {chartType === 'candle' &&
            candles.map((c, i) => {
              const x = padding.left + i * candleStep + candleStep / 2;
              const openY = getY(c.open);
              const closeY = getY(c.close);
              const highY = getY(c.high);
              const lowY = getY(c.low);
              const isUp = c.close >= c.open;

              const candleTop = Math.min(openY, closeY);
              const candleBodyHeight = Math.max(2, Math.abs(closeY - openY));

              const color = isUp ? '#00E676' : '#FF3B30';

              return (
                <g key={c.time} filter={isUp ? 'url(#bullGlow)' : 'url(#bearGlow)'}>
                  {/* Wick (High-Low Line) */}
                  <line
                    x1={x}
                    y1={highY}
                    x2={x}
                    y2={lowY}
                    stroke={color}
                    strokeWidth="1.2"
                  />
                  {/* Body (Open-Close Rect) */}
                  <rect
                    x={x - candleWidth / 2}
                    y={candleTop}
                    width={candleWidth}
                    height={candleBodyHeight}
                    fill={color}
                    rx="1"
                  />
                </g>
              );
            })}

          {/* Technical Indicator: MA20 (Cyan Line) */}
          {showMA20 && ma20Path && (
            <path
              d={ma20Path}
              fill="none"
              stroke="#00F0FF"
              strokeWidth="1.5"
              strokeDasharray="4 2"
              opacity="0.85"
            />
          )}

          {/* Technical Indicator: MA50 (Golden Amber Line) */}
          {showMA50 && ma50Path && (
            <path
              d={ma50Path}
              fill="none"
              stroke="#FFB300"
              strokeWidth="1.5"
              strokeDasharray="4 2"
              opacity="0.85"
            />
          )}

          {/* Volume Sub-chart */}
          {showVolume && (
            <>
              {/* Volume Separator */}
              <line
                x1={padding.left}
                y1={chartHeight + 10}
                x2={renderWidth - padding.right}
                y2={chartHeight + 10}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="1"
              />
              <text
                x={padding.left + 5}
                y={chartHeight + 24}
                fill="rgba(255, 255, 255, 0.3)"
                fontSize="9"
                fontWeight="700"
              >
                VOLUME
              </text>

              {candles.map((c, i) => {
                const x = padding.left + i * candleStep + candleStep / 2;
                const vH = getVolHeight(c.volume);
                const vY = getVolY(c.volume);
                const color = c.isUp ? 'rgba(0, 230, 118, 0.5)' : 'rgba(255, 59, 48, 0.5)';

                return (
                  <rect
                    key={`vol-${c.time}`}
                    x={x - candleWidth / 2}
                    y={vY}
                    width={candleWidth}
                    height={vH}
                    fill={color}
                    rx="1"
                  />
                );
              })}
            </>
          )}

          {/* Interactive Crosshair Tracking */}
          {hoverX !== null && hoveredCandle && (
            <g>
              {/* Vertical Crosshair Line */}
              <line
                x1={hoverX}
                y1={padding.top}
                x2={hoverX}
                y2={chartHeight + (showVolume ? volumeHeight : 0)}
                stroke="rgba(0, 240, 255, 0.6)"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              {/* Horizontal Crosshair Line */}
              <line
                x1={padding.left}
                y1={getY(hoveredCandle.close)}
                x2={renderWidth - padding.right}
                y2={getY(hoveredCandle.close)}
                stroke="rgba(0, 240, 255, 0.6)"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              {/* Right Axis Price Tag */}
              <rect
                x={renderWidth - padding.right + 2}
                y={getY(hoveredCandle.close) - 10}
                width={56}
                height={20}
                fill="#00F0FF"
                rx="4"
              />
              <text
                x={renderWidth - padding.right + 6}
                y={getY(hoveredCandle.close) + 4}
                fill="#000000"
                fontSize="10"
                fontWeight="800"
                fontFamily="monospace"
              >
                {hoveredCandle.close.toFixed(2)}
              </text>
            </g>
          )}

          {/* Time Axis Date Labels at bottom */}
          {candles
            .filter((_, i) => i % Math.ceil(candles.length / 6) === 0)
            .map((c, i) => {
              const x = padding.left + candles.indexOf(c) * candleStep + candleStep / 2;
              return (
                <text
                  key={`time-${i}`}
                  x={x}
                  y={totalSvgHeight - 6}
                  fill="rgba(255, 255, 255, 0.4)"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {c.date}
                </text>
              );
            })}
        </svg>
      </div>

      {/* Footer Metrics Card: 52-Week Range Slider, Market Cap, P/E */}
      {chartData && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginTop: '16px',
            padding: '14px',
            borderRadius: '14px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            position: 'relative',
            zIndex: 1
          }}
        >
          {/* 52-Week Range Progress Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
              <span>52W Low: {chartData.currency || ''} {(chartData.low52w ?? 0).toFixed(2)}</span>
              <span>52W High: {chartData.currency || ''} {(chartData.high52w ?? 0).toFixed(2)}</span>
            </div>
            <div style={{ position: 'relative', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '100px', overflow: 'hidden' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${Math.min(100, Math.max(0, (((chartData.current_price ?? 0) - (chartData.low52w ?? 0)) / ((chartData.high52w ?? 0) - (chartData.low52w ?? 0) || 1)) * 100))}%`,
                  background: 'linear-gradient(90deg, #007AFF 0%, #00F0FF 100%)',
                  borderRadius: '100px'
                }}
              />
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: 0 }}>มูลค่าตลาด (Market Cap)</p>
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {typeof chartData.market_cap === 'number'
                  ? (chartData.market_cap / 1e9).toFixed(1) + 'B'
                  : chartData.market_cap || '—'}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: 0 }}>จำนวนแท่งเทียน</p>
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#00F0FF', margin: 0 }}>
                {chartData.candles.length} Candles
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: 0 }}>สถาปัตยกรรม API</p>
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34C759', margin: 0 }}>
                Anti-Block Bulk Engine
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

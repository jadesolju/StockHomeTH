'use client';

import React, { useState, useMemo } from 'react';
import type { MarketIndex } from '../../lib/schemas/marketSchema';
import { useMarketSync } from '../../lib/context/MarketSyncContext';
import { useLanguage } from '../../lib/context/LanguageContext';
import { TrendingUp, TrendingDown, RefreshCw, BarChart3, Coins, Globe, Sparkles } from 'lucide-react';

interface MarketTickerBarProps {
  indices?: MarketIndex[];
  activeRegion?: 'all' | 'thai' | 'global';
}

export function MarketTickerBarServer({ activeRegion = 'all' }: MarketTickerBarProps) {
  const { indices, isSyncing, cooldownRemaining, lastUpdated, refreshAll, setSelectedMarket, tickerFlashMap } = useMarketSync();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'indices' | 'commodities'>('indices');

  // Segregate Stock Indices from Commodities / Gold / FX
  const stockIndices = useMemo(() => {
    return indices.filter((item) => {
      const sym = item.symbol.toUpperCase();
      return (
        sym.startsWith('^') ||
        sym === 'SET' ||
        sym === 'SET50' ||
        sym === 'GSPC' ||
        sym === 'IXIC' ||
        sym === 'DJI' ||
        item.category === 'index' ||
        (!item.category && !sym.includes('GOLD') && !sym.includes('GC=') && !sym.includes('USDTHB') && !sym.includes('CL='))
      );
    });
  }, [indices]);

  const commodityItems = useMemo(() => {
    return indices.filter((item) => {
      const sym = item.symbol.toUpperCase();
      return (
        item.category === 'commodity' ||
        item.category === 'gold_thai' ||
        item.category === 'forex' ||
        sym.includes('GOLD') ||
        sym.includes('GC=') ||
        sym.includes('USDTHB') ||
        sym.includes('CL=')
      );
    });
  }, [indices]);

  const activeItems = activeTab === 'indices' ? stockIndices : commodityItems;

  const handleIndexClick = (idx: MarketIndex) => {
    if (idx.category === 'gold_thai' || idx.category === 'commodity' || idx.category === 'forex') {
      return;
    }
    if (idx.region === 'thai' || idx.symbol.includes('.BK') || idx.symbol === '^SET.BK') {
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
      {/* Top Controls Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '10px'
        }}
      >
        {/* Live Status Indicator & Tab Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-bullish)', boxShadow: '0 0 6px var(--accent-bullish)' }} />
            <span style={{ fontWeight: 800, color: 'var(--accent-bullish)', letterSpacing: '0.5px' }}>
              REAL-TIME MARKET FEED
            </span>
            {lastUpdated && <span style={{ opacity: 0.7, fontSize: '0.72rem' }}>• {lastUpdated}</span>}
          </div>

          {/* Option B: Tab Switcher (Stock Indices vs. Gold & Commodities) */}
          <div
            style={{
              display: 'inline-flex',
              background: 'var(--card-sub-bg)',
              padding: '3px',
              borderRadius: '10px',
              border: '1px solid var(--card-sub-border)',
              gap: '2px'
            }}
          >
            <button
              onClick={() => setActiveTab('indices')}
              style={{
                background: activeTab === 'indices' ? '#2c2c2e' : 'transparent',
                color: activeTab === 'indices' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <BarChart3 size={13} />
              <span>{language === 'en' ? 'Stock Indices' : 'ดัชนีตลาดหุ้น'}</span>
              <span style={{ fontSize: '0.65rem', opacity: 0.8, background: 'rgba(255,255,255,0.12)', padding: '1px 5px', borderRadius: '4px' }}>
                {stockIndices.length || 4}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('commodities')}
              style={{
                background: activeTab === 'commodities' ? '#2c2c2e' : 'transparent',
                color: activeTab === 'commodities' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <Coins size={13} />
              <span>{language === 'en' ? 'Gold & Commodities' : 'ทองคำ & สินค้าโภคภัณฑ์'}</span>
              <span style={{ fontSize: '0.65rem', opacity: 0.8, background: 'rgba(255,255,255,0.12)', padding: '1px 5px', borderRadius: '4px' }}>
                {commodityItems.length || 4}
              </span>
            </button>
          </div>
        </div>

        {/* Single Manual Refresh Button with Anti-Spam Protection */}
        <button
          onClick={() => refreshAll()}
          disabled={isSyncing || cooldownRemaining > 0}
          title={cooldownRemaining > 0 ? `โปรดรอ ${cooldownRemaining} วินาทีก่อนรีเฟรชอีกครั้ง` : "กดเพื่อดึงข้อมูลราคาสดจากตลาดหุ้นและสมาคมค้าทองคำทันที"}
          style={{
            background: 'var(--card-sub-bg)',
            border: '1px solid var(--card-sub-border)',
            color: (isSyncing || cooldownRemaining > 0) ? 'var(--text-tertiary)' : 'var(--text-secondary)',
            borderRadius: '8px',
            padding: '5px 10px',
            cursor: (isSyncing || cooldownRemaining > 0) ? 'not-allowed' : 'pointer',
            opacity: (isSyncing || cooldownRemaining > 0) ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.74rem',
            fontWeight: 600,
            transition: 'all 0.15s ease'
          }}
        >
          <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} color="var(--accent-blue)" />
          <span>
            {isSyncing
              ? (language === 'en' ? 'Syncing...' : 'กำลังดึงสด...')
              : cooldownRemaining > 0
              ? (language === 'en' ? `Wait ${cooldownRemaining}s` : `รออีก ${cooldownRemaining}s`)
              : (language === 'en' ? 'Refresh All' : 'รีเฟรชทั้งหมด')}
          </span>
        </button>
      </div>

      {/* Cards Grid / Scrollable Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '4px'
        }}
      >
        {activeItems.map((item) => {
          const isUp = (item.change || 0) >= 0;
          const isThaiGold = item.category === 'gold_thai' || item.symbol === 'THAI_GOLD';
          const isForex = item.category === 'forex' || item.symbol.includes('USDTHB');
          const isCommodity = item.category === 'commodity' || item.symbol.includes('GC=') || item.symbol.includes('CL=');
          const flashClass = tickerFlashMap[item.symbol] === 'up' ? 'price-tick-up' : tickerFlashMap[item.symbol] === 'down' ? 'price-tick-down' : '';

          return (
            <div
              key={item.symbol}
              className={`glass-card ${flashClass}`}
              onClick={() => handleIndexClick(item)}
              title={
                isThaiGold
                  ? `ราคาทองคำแท่งตามประกาศสมาคมค้าทองคำแห่งประเทศไทย ${item.updateRound || ''}`
                  : !isCommodity && !isForex
                  ? `คลิกเพื่อดูกลุ่มหุ้น ${item.region === 'thai' ? 'ตลาดหุ้นไทย (SET)' : 'ตลาดสหรัฐฯ (US)'}`
                  : item.name
              }
              style={{
                padding: '14px 16px',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: isThaiGold ? '1px solid rgba(255, 159, 10, 0.3)' : '1px solid var(--glass-border)',
                background: isThaiGold ? 'rgba(255, 159, 10, 0.06)' : 'var(--card-sub-bg)',
                cursor: !isCommodity && !isForex && !isThaiGold ? 'pointer' : 'default',
                transition: 'transform 0.15s ease, border-color 0.15s ease'
              }}
            >
              {/* Header Badge & Title */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {item.name}
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: isThaiGold
                      ? 'rgba(255, 184, 0, 0.2)'
                      : item.region === 'thai'
                      ? 'rgba(0, 122, 255, 0.15)'
                      : 'rgba(139, 92, 246, 0.15)',
                    color: isThaiGold ? '#FFB800' : item.region === 'thai' ? '#007AFF' : '#8B5CF6',
                    fontWeight: 800,
                  }}
                >
                  {isThaiGold
                    ? 'สมาคมค้าทองคำ'
                    : isForex
                    ? 'FOREX'
                    : isCommodity
                    ? 'GLOBAL'
                    : item.region === 'thai'
                    ? 'SET'
                    : 'GLOBAL'}
                </span>
              </div>

              {/* Price & Change Row */}
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                  {isThaiGold
                    ? `฿${item.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                    : item.currency === 'THB'
                    ? `${item.value.toFixed(2)} ฿`
                    : typeof item.value === 'number'
                    ? item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : item.value}
                </span>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color: isUp ? 'var(--accent-bullish)' : 'var(--accent-bearish)',
                  }}
                >
                  {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span>
                    {isUp ? '+' : ''}
                    {typeof item.changePercent === 'number' ? item.changePercent.toFixed(2) : item.changePercent}%
                  </span>
                </div>
              </div>

              {/* Thai Gold Specific Details: Buy / Sell Spread & Update Round */}
              {isThaiGold && (item.buyPrice || item.sellPrice) && (
                <div
                  style={{
                    marginTop: '8px',
                    paddingTop: '6px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.68rem',
                    color: 'var(--text-tertiary)'
                  }}
                >
                  <span>ขายออก: ฿{item.sellPrice?.toLocaleString()}</span>
                  <span>รับซื้อ: ฿{item.buyPrice?.toLocaleString()}</span>
                </div>
              )}

              {/* Commodity Unit / Subtext */}
              {!isThaiGold && item.unit && (
                <div
                  style={{
                    marginTop: '6px',
                    fontSize: '0.68rem',
                    color: 'var(--text-tertiary)'
                  }}
                >
                  หน่วย: {item.unit} {item.change !== undefined && item.change !== 0 ? `(${item.change > 0 ? '+' : ''}${item.change.toFixed(2)})` : ''}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { MarketTickerBarServer as MarketTickerBar };


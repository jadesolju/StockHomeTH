'use client';

import React, { useState } from 'react';
import { useMarketSync } from '../../lib/context/MarketSyncContext';
import { useLanguage } from '../../lib/context/LanguageContext';
import {
  Activity,
  X,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Newspaper,
  Landmark,
  TrendingUp,
  Radio,
  Building,
  ShieldCheck,
  Zap,
  Timer
} from 'lucide-react';

export function SyncLogModal() {
  const {
    syncLogs,
    isLogModalOpen,
    setIsLogModalOpen,
    clearSyncLogs,
    refreshAll,
    refreshStocksAndIndices,
    refreshNewsAndOverview,
    isSyncing,
    lastUpdated,
    lastStockSyncTime,
    lastNewsSyncTime,
    marketStatus,
  } = useMarketSync();
  const { language } = useLanguage();

  const [activeFilter, setActiveFilter] = useState<'all' | 'stocks' | 'news' | 'indices' | 'overview'>('all');
  const [syncingCategory, setSyncingCategory] = useState<'all' | 'stocks' | 'news' | null>(null);

  if (!isLogModalOpen) return null;

  const filteredLogs = syncLogs.filter((log) => {
    if (activeFilter === 'all') return true;
    return log.type === activeFilter;
  });

  const successCount = syncLogs.filter((l) => l.status === 'success').length;

  const handleManualSyncStocks = async () => {
    setSyncingCategory('stocks');
    try {
      await refreshStocksAndIndices();
    } finally {
      setSyncingCategory(null);
    }
  };

  const handleManualSyncNews = async () => {
    setSyncingCategory('news');
    try {
      await refreshNewsAndOverview();
    } finally {
      setSyncingCategory(null);
    }
  };

  const handleManualSyncAll = async () => {
    setSyncingCategory('all');
    try {
      await refreshAll();
    } finally {
      setSyncingCategory(null);
    }
  };

  return (
    <div className="ios-sheet-overlay" onClick={() => setIsLogModalOpen(false)}>
      <div
        className="ios-sheet-content glass-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '880px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          borderRadius: '24px'
        }}
      >
        {/* Handle Pill */}
        <div
          style={{
            width: '44px',
            height: '4px',
            background: 'var(--text-tertiary)',
            borderRadius: '100px',
            margin: '0 auto 16px auto',
            opacity: 0.5
          }}
        />

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'var(--accent-blue)',
                display: 'grid',
                placeItems: 'center',
                color: '#ffffff'
              }}
            >
              <Activity size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {language === 'th' ? 'ประวัติการอัปเดตข้อมูล Real-Time (Sync Logs)' : 'Real-Time Data Sync & Audit Logs'}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', margin: '2px 0 0 0' }}>
                {language === 'th'
                  ? 'บันทึกการดึงข้อมูลสดจากตลาด SET, Yahoo Finance, Google RSS และระบบวิเคราะห์ AI'
                  : 'Live audit trail of data fetches across SET, Yahoo Finance, Google RSS, and AI engines'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsLogModalOpen(false)}
            style={{
              background: 'var(--card-sub-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Real-time Market Status & Polling Schedule Badges */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px',
            marginBottom: '16px'
          }}
        >
          {/* Thai SET Market Card */}
          <div
            style={{
              background: 'var(--card-sub-bg)',
              border: '1px solid var(--card-sub-border)',
              padding: '12px 14px',
              borderRadius: '14px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Landmark size={14} color="#007AFF" /> ตลาดหุ้นไทย (SET)
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '2px 7px',
                  borderRadius: '100px',
                  fontWeight: 800,
                  background: marketStatus.set.isOpen ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 69, 58, 0.12)',
                  color: marketStatus.set.isOpen ? 'var(--accent-bullish)' : 'var(--accent-bearish)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span className={marketStatus.set.isOpen ? 'live-pulse-dot' : ''} style={{ width: '6px', height: '6px', background: marketStatus.set.isOpen ? '#00E676' : '#FF453A' }} />
                {marketStatus.set.isOpen ? 'เปิดทำการ' : 'ปิดทำการ'}
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
              {marketStatus.set.statusTextTh}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              {marketStatus.set.nextChange}
            </div>
          </div>

          {/* US Market Card */}
          <div
            style={{
              background: 'var(--card-sub-bg)',
              border: '1px solid var(--card-sub-border)',
              padding: '12px 14px',
              borderRadius: '14px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Building size={14} color="#8B5CF6" /> หุ้นสหรัฐฯ (US)
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '2px 7px',
                  borderRadius: '100px',
                  fontWeight: 800,
                  background: marketStatus.us.isOpen ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 69, 58, 0.12)',
                  color: marketStatus.us.isOpen ? 'var(--accent-bullish)' : 'var(--accent-bearish)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span className={marketStatus.us.isOpen ? 'live-pulse-dot' : ''} style={{ width: '6px', height: '6px', background: marketStatus.us.isOpen ? '#00E676' : '#FF453A' }} />
                {marketStatus.us.isOpen ? 'เปิดทำการ' : 'ปิดทำการ'}
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
              {marketStatus.us.statusTextTh}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              {marketStatus.us.nextChange}
            </div>
          </div>

          {/* Stock Quote Polling Rule Card */}
          <div
            style={{
              background: 'rgba(0, 122, 255, 0.05)',
              border: '1px solid rgba(0, 122, 255, 0.2)',
              padding: '12px 14px',
              borderRadius: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '4px' }}>
              <Timer size={14} /> {language === 'th' ? 'รอบดึงราคาหุ้น & ดัชนี' : 'Stock Sync Interval'}
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {marketStatus.stockSyncIntervalLabel}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              {marketStatus.isAnyOpen
                ? 'ตลาดกำลังเปิดทำการ ดึงข้อมูลสดทุก 1 นาที'
                : 'ตลาดปิดทำการ ลดความถี่เป็นทุก 30 นาที เพื่อประหยัดทรัพยากร'}
            </div>
          </div>

          {/* News & AI Polling Rule Card */}
          <div
            style={{
              background: 'rgba(139, 92, 246, 0.05)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              padding: '12px 14px',
              borderRadius: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#8B5CF6', marginBottom: '4px' }}>
              <Newspaper size={14} /> {language === 'th' ? 'รอบดึงข่าวสาร & AI' : 'News & AI Interval'}
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {marketStatus.newsSyncIntervalLabel}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              {language === 'th' ? 'ดึงข่าวใหม่และประมวลผล AI ทุก 30 นาที' : 'Aggregating news and running AI briefing every 30 mins'}
            </div>
          </div>
        </div>

        {/* Action Controls & Manual Triggers */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '14px',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--glass-border)'
          }}
        >
          {/* Filter Segmented Control */}
          <div className="ios-segmented-control" style={{ padding: '3px' }}>
            {(['all', 'stocks', 'news', 'indices', 'overview'] as const).map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => setActiveFilter(filterKey)}
                className={`ios-segment-btn ${activeFilter === filterKey ? 'active' : ''}`}
                style={{ padding: '4px 12px', fontSize: '0.75rem' }}
              >
                {filterKey === 'all' && (language === 'th' ? 'ทั้งหมด' : 'All')}
                {filterKey === 'stocks' && (language === 'th' ? 'ราคาหุ้น' : 'Stocks')}
                {filterKey === 'news' && (language === 'th' ? 'ข่าวสาร' : 'News')}
                {filterKey === 'indices' && (language === 'th' ? 'ดัชนี' : 'Indices')}
                {filterKey === 'overview' && (language === 'th' ? 'AI สรุป' : 'AI Briefing')}
              </button>
            ))}
          </div>

          {/* Quick Manual Sync Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleManualSyncStocks}
              disabled={syncingCategory !== null || isSyncing}
              style={{
                background: 'var(--card-sub-bg)',
                border: '1px solid var(--card-sub-border)',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <RefreshCw size={12} className={syncingCategory === 'stocks' ? 'spin' : ''} />
              <span>{language === 'th' ? 'ดึงหุ้นสด' : 'Sync Stocks'}</span>
            </button>

            <button
              onClick={handleManualSyncNews}
              disabled={syncingCategory !== null || isSyncing}
              style={{
                background: 'var(--card-sub-bg)',
                border: '1px solid var(--card-sub-border)',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Newspaper size={12} className={syncingCategory === 'news' ? 'spin' : ''} />
              <span>{language === 'th' ? 'ดึงข่าวสด' : 'Sync News'}</span>
            </button>

            <button
              onClick={handleManualSyncAll}
              disabled={syncingCategory !== null || isSyncing}
              style={{
                background: 'var(--accent-blue)',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#ffffff',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <RefreshCw size={12} className={syncingCategory === 'all' || isSyncing ? 'spin' : ''} />
              <span>{language === 'th' ? 'ดึงข้อมูลทั้งหมด' : 'Sync All'}</span>
            </button>

            <button
              onClick={clearSyncLogs}
              title={language === 'th' ? 'ล้างประวัติการบันทึก' : 'Clear log history'}
              style={{
                background: 'transparent',
                border: '1px solid var(--card-sub-border)',
                borderRadius: '8px',
                padding: '6px 8px',
                fontSize: '0.72rem',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Logs List Section */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            paddingRight: '4px'
          }}
        >
          {filteredLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
              {language === 'th' ? 'ยังไม่มีรายการบันทึกในหมวดนี้' : 'No log entries in this category'}
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  background: 'var(--card-sub-bg)',
                  border: '1px solid var(--card-sub-border)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
                  <div style={{ marginTop: '2px' }}>
                    {log.status === 'success' ? (
                      <CheckCircle2 size={16} color="var(--accent-bullish)" />
                    ) : (
                      <AlertTriangle size={16} color="var(--accent-bearish)" />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          background:
                            log.type === 'stocks'
                              ? 'rgba(0, 122, 255, 0.15)'
                              : log.type === 'news'
                              ? 'rgba(139, 92, 246, 0.15)'
                              : log.type === 'indices'
                              ? 'rgba(0, 230, 118, 0.15)'
                              : 'rgba(255, 204, 0, 0.15)',
                          color:
                            log.type === 'stocks'
                              ? '#007AFF'
                              : log.type === 'news'
                              ? '#8B5CF6'
                              : log.type === 'indices'
                              ? '#00E676'
                              : '#FFCC00'
                        }}
                      >
                        {log.source}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                        {log.timestamp}
                      </span>
                      {log.durationMs !== undefined && (
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                          ({log.durationMs}ms)
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      {log.summary}
                    </div>
                  </div>
                </div>

                {log.itemCount !== undefined && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      padding: '2px 8px',
                      borderRadius: '100px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-secondary)',
                      fontFamily: 'monospace',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    +{log.itemCount} items
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '14px',
            marginTop: '12px',
            borderTop: '1px solid var(--glass-border)',
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)'
          }}
        >
          <div>
            {language === 'th'
              ? `อัปเดตล่าสุด: ${lastUpdated} (หุ้น: ${lastStockSyncTime || '—'}, ข่าว: ${lastNewsSyncTime || '—'})`
              : `Last Updated: ${lastUpdated} (Stocks: ${lastStockSyncTime || '—'}, News: ${lastNewsSyncTime || '—'})`}
          </div>
          <div>
            {language === 'th' ? `บันทึกทั้งหมด ${syncLogs.length} รายการ (สำเร็จ ${successCount})` : `Total ${syncLogs.length} logs (${successCount} success)`}
          </div>
        </div>
      </div>
    </div>
  );
}

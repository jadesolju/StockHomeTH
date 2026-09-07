'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  TrendingUp,
  Moon,
  Sun,
  Monitor,
  Bookmark,
  Sparkles,
  Newspaper,
  BarChart3,
  RefreshCw,
  Globe,
  Building,
  Landmark,
  Activity
} from 'lucide-react';
import { useLanguage } from '../../lib/context/LanguageContext';
import { useTheme } from '../../lib/context/ThemeContext';
import { useMarketSync } from '../../lib/context/MarketSyncContext';

interface HeaderClientNavProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onGenerateAiSummary?: () => void;
  isGeneratingAi?: boolean;
  showBookmarkedOnly?: boolean;
  onToggleBookmarkedOnly?: () => void;
}

export function HeaderClientNav({
  onRefresh,
  isRefreshing = false,
  onGenerateAiSummary,
  isGeneratingAi = false,
  showBookmarkedOnly = false,
  onToggleBookmarkedOnly,
}: HeaderClientNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, resolvedTheme, cycleTheme } = useTheme();
  const { setSelectedMarket, refreshAll, isSyncing, cooldownRemaining } = useMarketSync();

  const [currentDate, setCurrentDate] = React.useState<string>(() => {
    return new Date().toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  React.useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      setCurrentDate(
        now.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
    };
    updateDate();
    const timer = setInterval(updateDate, 30000);
    return () => clearInterval(timer);
  }, [language]);

  return (
    <header className="glass-card" style={{ borderRadius: '0 0 24px 24px', padding: '16px 28px', marginBottom: '24px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Main Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          {/* Brand Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: '#0071e3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-primary)' }}>
                  StockHome<span style={{ color: '#007AFF' }}>TH</span>
                </h1>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '2px 9px',
                    borderRadius: '100px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Sparkles size={11} /> {t('brandSubtitle')}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>{currentDate}</p>
            </div>
          </Link>

          {/* Navigation View & Dedicated Page Switcher */}
          <nav className="ios-segmented-control" style={{ padding: '4px' }}>
            <Link
              href="/"
              className={`ios-segment-btn ${pathname === '/' || pathname === '/news' ? 'active' : ''}`}
              style={{ textDecoration: 'none', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Newspaper size={16} /> {t('newsDigest')}
            </Link>
            <Link
              href="/stocks"
              className={`ios-segment-btn ${pathname === '/stocks' ? 'active' : ''}`}
              style={{ textDecoration: 'none', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Globe size={16} /> {t('marketAndCharts')}
            </Link>
            <Link
              href="/stocks/thai"
              className={`ios-segment-btn ${pathname === '/stocks/thai' ? 'active' : ''}`}
              style={{ textDecoration: 'none', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Landmark size={16} /> {t('thaiStocks')}
            </Link>
            <Link
              href="/stocks/us"
              className={`ios-segment-btn ${pathname === '/stocks/us' ? 'active' : ''}`}
              style={{ textDecoration: 'none', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Building size={16} /> {t('foreignStocks')}
            </Link>
          </nav>

          {/* Header Action Controls: Language Switcher, Theme & Refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* TH / ENG Instant Language Toggle */}
            <div className="ios-segmented-control" style={{ padding: '3px' }}>
              <button
                onClick={() => setLanguage('th')}
                className={`ios-segment-btn ${language === 'th' ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '0.78rem', fontWeight: 700 }}
                title="สลับเป็นภาษาไทย"
              >
                TH
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`ios-segment-btn ${language === 'en' ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '0.78rem', fontWeight: 700 }}
                title="Switch to English"
              >
                ENG
              </button>
            </div>

            {/* AI Live Generate (when on news page) */}
            {pathname === '/news' && onGenerateAiSummary && (
              <button
                onClick={onGenerateAiSummary}
                disabled={isGeneratingAi}
                className="ios-glass-btn"
                style={{
                  background: 'var(--accent-blue)',
                  color: '#ffffff',
                  fontWeight: 600,
                  padding: '8px 16px',
                  borderRadius: '100px',
                  border: 'none',
                  cursor: isGeneratingAi ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: 'none'
                }}
              >
                <Sparkles size={15} className={isGeneratingAi ? 'spin' : ''} />
                <span>{isGeneratingAi ? t('generatingAi') : t('liveAiDigest')}</span>
              </button>
            )}

            {/* Bookmark Toggle (when on news page) */}
            {pathname === '/news' && onToggleBookmarkedOnly && (
              <button
                onClick={onToggleBookmarkedOnly}
                className={`ios-glass-btn ${showBookmarkedOnly ? 'active' : ''}`}
                style={{
                  background: showBookmarkedOnly ? 'rgba(245, 158, 11, 0.2)' : 'var(--glass-bg)',
                  borderColor: showBookmarkedOnly ? '#f59e0b' : 'var(--glass-border)',
                  color: showBookmarkedOnly ? '#f59e0b' : 'var(--text-secondary)',
                  borderRadius: '100px',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title={t('bookmarked')}
              >
                <Bookmark size={16} fill={showBookmarkedOnly ? '#f59e0b' : 'none'} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t('bookmarked')}</span>
              </button>
            )}

            {/* Refresh Button with Anti-Spam Protection */}
            <button
              onClick={() => (onRefresh ? onRefresh() : refreshAll())}
              disabled={isRefreshing || isSyncing || cooldownRemaining > 0}
              title={cooldownRemaining > 0 ? `โปรดรอ ${cooldownRemaining} วินาทีก่อนรีเฟรชอีกครั้ง` : t('refreshData')}
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '100px',
                padding: '8px 12px',
                color: (isRefreshing || isSyncing || cooldownRemaining > 0) ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                cursor: (isRefreshing || isSyncing || cooldownRemaining > 0) ? 'not-allowed' : 'pointer',
                opacity: (isRefreshing || isSyncing || cooldownRemaining > 0) ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                transition: 'all 0.15s ease'
              }}
            >
              <RefreshCw size={15} className={isRefreshing || isSyncing ? 'spin-anim' : ''} />
              {cooldownRemaining > 0 && <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{cooldownRemaining}s</span>}
            </button>

            {/* Theme Switcher (Light / Dark / System) */}
            <button
              onClick={cycleTheme}
              className="ios-glass-btn"
              title={`${t('themeDark')} / ${t('themeLight')} / ${t('themeSystem')}`}
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '100px',
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {theme === 'system' ? (
                <Monitor size={16} color="var(--text-secondary)" />
              ) : resolvedTheme === 'dark' ? (
                <Sun size={16} color="#fbbf24" />
              ) : (
                <Moon size={16} color="#007AFF" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

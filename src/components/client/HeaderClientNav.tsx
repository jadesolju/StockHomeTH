'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  User,
  LogIn,
  LogOut,
  Key,
  Shield,
  Check
} from 'lucide-react';
import { useLanguage } from '../../lib/context/LanguageContext';
import { useTheme } from '../../lib/context/ThemeContext';
import { useMarketSync } from '../../lib/context/MarketSyncContext';
import { useClientAuth } from '../../lib/context/ClientAuthContext';

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
  const { language, setLanguage, toggleLanguage, t } = useLanguage();
  const { theme, resolvedTheme, cycleTheme } = useTheme();
  const { setSelectedMarket, refreshAll, isSyncing, cooldownRemaining } = useMarketSync();
  const { user, openAuthModal, signOut } = useClientAuth();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [currentDate, setCurrentDate] = useState<string>(() => {
    return new Date().toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  useEffect(() => {
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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0',
                overflow: 'hidden',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/favicon.svg"
                alt="StockHomeTH Logo"
                width={42}
                height={42}
                style={{ objectFit: 'contain', width: '100%', height: '100%' }}
              />
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

          {/* Header Action Controls: Language Switcher, Theme, Refresh & Member Auth */}
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

            {/* Member Auth Button / Profile Dropdown */}
            {user ? (
              <div style={{ position: 'relative' }} ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  style={{
                    background: 'var(--card-sub-bg)',
                    border: '1px solid var(--card-sub-border)',
                    borderRadius: '100px',
                    padding: '6px 12px 6px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#007AFF',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                    }}
                  >
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'M'}
                  </div>
                  <span>{user.displayName || user.email?.split('@')[0]}</span>
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div
                    className="glass-card"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 8px)',
                      width: '220px',
                      borderRadius: '18px',
                      padding: '12px',
                      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
                      zIndex: 1000,
                      border: '1px solid var(--card-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--card-sub-border)', marginBottom: '4px' }}>
                      <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {user.displayName || 'StockHome Member'}
                      </p>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.email}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        openAuthModal('changePassword');
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        padding: '8px 10px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                      className="glass-card-hover"
                    >
                      <Key size={14} color="#007AFF" /> เปลี่ยนรหัสผ่าน
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        signOut();
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#f87171',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        padding: '8px 10px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                      className="glass-card-hover"
                    >
                      <LogOut size={14} /> ออกจากระบบ
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="ios-btn-primary"
                style={{
                  padding: '7px 14px',
                  borderRadius: '100px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <LogIn size={14} /> เข้าสู่ระบบ
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
export default HeaderClientNav;

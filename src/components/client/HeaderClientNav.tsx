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
  const { user, openAuthModal, openProfileModal, signOut } = useClientAuth();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [currentDate, setCurrentDate] = useState<string>(() => {
    return new Date().toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  });

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      setCurrentDate(
        now.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
          weekday: 'short',
          month: 'short',
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
    <header className="mobile-pwa-header glass-card" style={{ borderRadius: '0 0 20px 20px', padding: '12px 24px', marginBottom: '20px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'nowrap', gap: '12px' }}>
        {/* Brand Logo & Title */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/favicon.svg"
              alt="StockHomeTH Logo"
              width={36}
              height={36}
              style={{ objectFit: 'contain', width: '100%', height: '100%' }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-primary)' }}>
                StockHome<span style={{ color: '#007AFF' }}>TH</span>
              </span>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '1px 6px',
                  borderRadius: '100px',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <Sparkles size={9} /> AI
              </span>
            </div>
            <p className="desktop-nav-bar" style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: '0', marginTop: '1px' }}>
              {currentDate}
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Segmented Control (Hidden on Mobile PWA) */}
        <nav className="desktop-nav-bar ios-segmented-control" style={{ padding: '3px' }}>
          <Link
            href="/"
            className={`ios-segment-btn ${pathname === '/' || pathname === '/news' ? 'active' : ''}`}
            style={{ textDecoration: 'none', padding: '6px 14px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Newspaper size={15} /> {t('newsDigest')}
          </Link>
          <Link
            href="/stocks"
            className={`ios-segment-btn ${pathname === '/stocks' ? 'active' : ''}`}
            style={{ textDecoration: 'none', padding: '6px 14px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Globe size={15} /> {t('marketAndCharts')}
          </Link>
          <Link
            href="/stocks/thai"
            className={`ios-segment-btn ${pathname === '/stocks/thai' ? 'active' : ''}`}
            style={{ textDecoration: 'none', padding: '6px 14px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Landmark size={15} /> {t('thaiStocks')}
          </Link>
          <Link
            href="/stocks/us"
            className={`ios-segment-btn ${pathname === '/stocks/us' ? 'active' : ''}`}
            style={{ textDecoration: 'none', padding: '6px 14px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Building size={15} /> {t('foreignStocks')}
          </Link>
        </nav>

        {/* Header Action Controls: Language Switcher, Theme, Refresh & Member Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* TH / ENG Instant Language Toggle */}
          <div className="ios-segmented-control" style={{ padding: '2px' }}>
            <button
              onClick={() => setLanguage('th')}
              className={`ios-segment-btn ${language === 'th' ? 'active' : ''}`}
              style={{ padding: '3px 8px', fontSize: '0.72rem', fontWeight: 700 }}
              title="สลับเป็นภาษาไทย"
            >
              TH
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`ios-segment-btn ${language === 'en' ? 'active' : ''}`}
              style={{ padding: '3px 8px', fontSize: '0.72rem', fontWeight: 700 }}
              title="Switch to English"
            >
              EN
            </button>
          </div>

          {/* Refresh Button with Anti-Spam Protection */}
          <button
            onClick={() => (onRefresh ? onRefresh() : refreshAll())}
            disabled={isRefreshing || isSyncing || cooldownRemaining > 0}
            title={cooldownRemaining > 0 ? `โปรดรอ ${cooldownRemaining} วินาทีก่อนรีเฟรชอีกครั้ง` : t('refreshData')}
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '100px',
              padding: '6px 10px',
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
            <RefreshCw size={14} className={isRefreshing || isSyncing ? 'spin-anim' : ''} />
            {cooldownRemaining > 0 && <span style={{ fontSize: '0.68rem', fontWeight: 700 }}>{cooldownRemaining}s</span>}
          </button>

          {/* Theme Switcher */}
          <button
            onClick={cycleTheme}
            className="ios-glass-btn"
            title={`${t('themeDark')} / ${t('themeLight')} / ${t('themeSystem')}`}
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '100px',
              padding: '6px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {theme === 'system' ? (
              <Monitor size={15} color="var(--text-secondary)" />
            ) : resolvedTheme === 'dark' ? (
              <Sun size={15} color="#fbbf24" />
            ) : (
              <Moon size={15} color="#007AFF" />
            )}
          </button>

          {/* Member Auth Button / Profile Dropdown (Desktop view) */}
          <div className="desktop-nav-bar" style={{ position: 'relative' }} ref={userMenuRef}>
            {user ? (
              <>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  style={{
                    background: 'var(--card-sub-bg)',
                    border: '1px solid var(--card-sub-border)',
                    borderRadius: '100px',
                    padding: '4px 10px 4px 5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    transition: 'all 0.15s ease'
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
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      overflow: 'hidden',
                      position: 'relative',
                      flexShrink: 0,
                      border: '1.5px solid rgba(0, 122, 255, 0.4)',
                    }}
                  >
                    {user.photoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'Profile Avatar'}
                        referrerPolicy="no-referrer"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }}
                      />
                    ) : (
                      <span>
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'M'}
                      </span>
                    )}
                  </div>
                  <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div
                    className="glass-card"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 8px)',
                      width: '230px',
                      borderRadius: '18px',
                      padding: '12px',
                      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.55)',
                      zIndex: 10000,
                      border: '1px solid var(--card-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      backdropFilter: 'blur(24px)',
                    }}
                  >
                    <div
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        openProfileModal();
                      }}
                      style={{
                        padding: '6px 8px 8px 8px',
                        borderBottom: '1px solid var(--card-sub-border)',
                        marginBottom: '6px',
                        cursor: 'pointer',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                      className="glass-card-hover"
                    >
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          background: '#007AFF',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.85rem',
                          fontWeight: 800,
                          overflow: 'hidden',
                          flexShrink: 0,
                          border: '1.5px solid rgba(0, 122, 255, 0.4)',
                        }}
                      >
                        {user.photoURL ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.photoURL}
                            alt="Avatar"
                            referrerPolicy="no-referrer"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <span>
                            {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'M'}
                          </span>
                        )}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.displayName || 'StockHome Member'}
                        </p>
                        <p style={{ margin: '1px 0 0 0', fontSize: '0.68rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        openProfileModal();
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        padding: '7px 8px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                      className="glass-card-hover"
                    >
                      <User size={14} color="#007AFF" /> ตั้งค่าโปรไฟล์ & รูปถ่าย
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        openAuthModal('changePassword');
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        padding: '7px 8px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                      className="glass-card-hover"
                    >
                      <Key size={14} color="#f59e0b" /> เปลี่ยนรหัสผ่าน
                    </button>

                    <div style={{ height: '1px', background: 'var(--card-sub-border)', margin: '4px 0' }} />

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        signOut();
                      }}
                      style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#f87171',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        padding: '7px 8px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                      className="glass-card-hover"
                    >
                      <LogOut size={14} /> ออกจากระบบ (Log Out)
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="ios-btn-primary"
                style={{
                  padding: '6px 12px',
                  borderRadius: '100px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                }}
              >
                <LogIn size={13} /> เข้าสู่ระบบ
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
export default HeaderClientNav;

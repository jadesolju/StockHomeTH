'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Newspaper, Globe, Landmark, Building, User, Sparkles } from 'lucide-react';
import { useLanguage } from '../../lib/context/LanguageContext';
import { useClientAuth } from '../../lib/context/ClientAuthContext';

export function PwaBottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { user, openAuthModal, openProfileModal } = useClientAuth();

  const isNewsActive = pathname === '/' || pathname === '/news';
  const isStocksActive = pathname === '/stocks';
  const isThaiActive = pathname === '/stocks/thai';
  const isUsActive = pathname === '/stocks/us';

  return (
    <nav
      className="mobile-pwa-bottom-nav glass-card"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9980,
        display: 'none', // Controlled via CSS media query
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '6px 10px calc(8px + env(safe-area-inset-bottom, 0px)) 10px',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(28px) saturate(190%)',
        WebkitBackdropFilter: 'blur(28px) saturate(190%)',
        borderTop: '1px solid var(--glass-border)',
        borderRadius: '20px 20px 0 0',
        boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.4)',
      }}
      aria-label="Mobile Navigation"
    >
      {/* 1. News Tab */}
      <Link
        href="/"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          textDecoration: 'none',
          color: isNewsActive ? '#007AFF' : 'var(--text-tertiary)',
          padding: '4px 2px',
          borderRadius: '12px',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Newspaper size={20} strokeWidth={isNewsActive ? 2.5 : 1.8} />
          {isNewsActive && (
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-4px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#007AFF',
                boxShadow: '0 0 6px #007AFF',
              }}
            />
          )}
        </div>
        <span style={{ fontSize: '0.68rem', fontWeight: isNewsActive ? 800 : 500 }}>
          {t('newsDigest')}
        </span>
      </Link>

      {/* 2. All Markets Tab */}
      <Link
        href="/stocks"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          textDecoration: 'none',
          color: isStocksActive ? '#007AFF' : 'var(--text-tertiary)',
          padding: '4px 2px',
          borderRadius: '12px',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Globe size={20} strokeWidth={isStocksActive ? 2.5 : 1.8} />
          {isStocksActive && (
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-4px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#007AFF',
                boxShadow: '0 0 6px #007AFF',
              }}
            />
          )}
        </div>
        <span style={{ fontSize: '0.68rem', fontWeight: isStocksActive ? 800 : 500 }}>
          {t('marketAndCharts')}
        </span>
      </Link>

      {/* 3. Thai SET Stocks Tab */}
      <Link
        href="/stocks/thai"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          textDecoration: 'none',
          color: isThaiActive ? '#10b981' : 'var(--text-tertiary)',
          padding: '4px 2px',
          borderRadius: '12px',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Landmark size={20} strokeWidth={isThaiActive ? 2.5 : 1.8} color={isThaiActive ? '#10b981' : 'currentColor'} />
          {isThaiActive && (
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-4px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 6px #10b981',
              }}
            />
          )}
        </div>
        <span style={{ fontSize: '0.68rem', fontWeight: isThaiActive ? 800 : 500 }}>
          {t('thaiStocks')}
        </span>
      </Link>

      {/* 4. US Stocks Tab */}
      <Link
        href="/stocks/us"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          textDecoration: 'none',
          color: isUsActive ? '#a855f7' : 'var(--text-tertiary)',
          padding: '4px 2px',
          borderRadius: '12px',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Building size={20} strokeWidth={isUsActive ? 2.5 : 1.8} color={isUsActive ? '#a855f7' : 'currentColor'} />
          {isUsActive && (
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-4px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#a855f7',
                boxShadow: '0 0 6px #a855f7',
              }}
            />
          )}
        </div>
        <span style={{ fontSize: '0.68rem', fontWeight: isUsActive ? 800 : 500 }}>
          {t('foreignStocks')}
        </span>
      </Link>

      {/* 5. User / Auth Tab */}
      <button
        onClick={() => {
          if (user) {
            openProfileModal();
          } else {
            openAuthModal('login');
          }
        }}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          background: 'none',
          border: 'none',
          color: user ? '#007AFF' : 'var(--text-tertiary)',
          padding: '4px 2px',
          borderRadius: '12px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: user ? '#007AFF' : 'var(--card-sub-bg)',
            color: user ? '#ffffff' : 'var(--text-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.7rem',
            fontWeight: 800,
            overflow: 'hidden',
            position: 'relative',
            border: user ? '1.5px solid rgba(0, 122, 255, 0.4)' : '1px solid var(--glass-border)',
          }}
        >
          {user ? (
            user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoURL}
                alt="Avatar"
                referrerPolicy="no-referrer"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span>{user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'M'}</span>
            )
          ) : (
            <User size={14} />
          )}
        </div>
        <span style={{ fontSize: '0.68rem', fontWeight: user ? 800 : 500 }}>
          {user ? 'โปรไฟล์' : 'เข้าสู่ระบบ'}
        </span>
      </button>
    </nav>
  );
}
export default PwaBottomNav;

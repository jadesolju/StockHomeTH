'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Newspaper, Globe, Landmark, Building, User } from 'lucide-react';
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
        padding: '8px 12px calc(10px + env(safe-area-inset-bottom, 0px)) 12px',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(30px) saturate(200%)',
        WebkitBackdropFilter: 'blur(30px) saturate(200%)',
        borderTop: '1px solid var(--glass-border)',
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -6px 28px rgba(0, 0, 0, 0.5)',
      }}
      aria-label="Mobile Navigation"
    >
      {/* 1. News Digest Tab */}
      <Link
        href="/"
        title={t('newsDigest')}
        aria-label={t('newsDigest')}
        style={{
          flex: 1,
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textDecoration: 'none',
          color: isNewsActive ? '#007AFF' : 'var(--text-tertiary)',
          borderRadius: '14px',
          background: isNewsActive ? 'rgba(0, 122, 255, 0.14)' : 'transparent',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
        }}
      >
        <Newspaper size={22} strokeWidth={isNewsActive ? 2.4 : 1.8} />
        {isNewsActive && (
          <span
            style={{
              position: 'absolute',
              bottom: '5px',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: '#007AFF',
              boxShadow: '0 0 6px #007AFF',
            }}
          />
        )}
      </Link>

      {/* 2. All Markets Tab */}
      <Link
        href="/stocks"
        title={t('marketAndCharts')}
        aria-label={t('marketAndCharts')}
        style={{
          flex: 1,
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textDecoration: 'none',
          color: isStocksActive ? '#007AFF' : 'var(--text-tertiary)',
          borderRadius: '14px',
          background: isStocksActive ? 'rgba(0, 122, 255, 0.14)' : 'transparent',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
        }}
      >
        <Globe size={22} strokeWidth={isStocksActive ? 2.4 : 1.8} />
        {isStocksActive && (
          <span
            style={{
              position: 'absolute',
              bottom: '5px',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: '#007AFF',
              boxShadow: '0 0 6px #007AFF',
            }}
          />
        )}
      </Link>

      {/* 3. Thai SET Stocks Tab */}
      <Link
        href="/stocks/thai"
        title={t('thaiStocks')}
        aria-label={t('thaiStocks')}
        style={{
          flex: 1,
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textDecoration: 'none',
          color: isThaiActive ? '#10b981' : 'var(--text-tertiary)',
          borderRadius: '14px',
          background: isThaiActive ? 'rgba(16, 185, 129, 0.14)' : 'transparent',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
        }}
      >
        <Landmark size={22} strokeWidth={isThaiActive ? 2.4 : 1.8} color={isThaiActive ? '#10b981' : 'currentColor'} />
        {isThaiActive && (
          <span
            style={{
              position: 'absolute',
              bottom: '5px',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 6px #10b981',
            }}
          />
        )}
      </Link>

      {/* 4. US Stocks Tab */}
      <Link
        href="/stocks/us"
        title={t('foreignStocks')}
        aria-label={t('foreignStocks')}
        style={{
          flex: 1,
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textDecoration: 'none',
          color: isUsActive ? '#a855f7' : 'var(--text-tertiary)',
          borderRadius: '14px',
          background: isUsActive ? 'rgba(168, 85, 247, 0.14)' : 'transparent',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
        }}
      >
        <Building size={22} strokeWidth={isUsActive ? 2.4 : 1.8} color={isUsActive ? '#a855f7' : 'currentColor'} />
        {isUsActive && (
          <span
            style={{
              position: 'absolute',
              bottom: '5px',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: '#a855f7',
              boxShadow: '0 0 6px #a855f7',
            }}
          />
        )}
      </Link>

      {/* 5. User Profile / Auth Tab */}
      <button
        onClick={() => {
          if (user) {
            openProfileModal();
          } else {
            openAuthModal('login');
          }
        }}
        title={user ? (user.displayName || user.email || 'โปรไฟล์') : 'เข้าสู่ระบบ'}
        aria-label={user ? 'โปรไฟล์' : 'เข้าสู่ระบบ'}
        style={{
          flex: 1,
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'none',
          border: 'none',
          borderRadius: '14px',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: user ? '#007AFF' : 'var(--card-sub-bg)',
            color: user ? '#ffffff' : 'var(--text-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.78rem',
            fontWeight: 800,
            overflow: 'hidden',
            position: 'relative',
            border: user ? '2px solid rgba(0, 122, 255, 0.45)' : '1.5px solid var(--glass-border)',
            boxShadow: user ? '0 2px 8px rgba(0, 122, 255, 0.3)' : 'none',
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
            <User size={16} />
          )}
        </div>
      </button>
    </nav>
  );
}
export default PwaBottomNav;

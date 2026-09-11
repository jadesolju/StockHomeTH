'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Newspaper, TrendingUp, Sparkles, CreditCard, User } from 'lucide-react';
import { useLanguage } from '../../lib/context/LanguageContext';
import { useClientAuth } from '../../lib/context/ClientAuthContext';
import { UserAvatar } from '../ui/UserAvatar';

export function PwaBottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { user, openAuthModal, openProfileModal } = useClientAuth();

  // On AI Helper page, hide bottom nav to provide 100% full-screen immersive chat
  if (pathname === '/ai-helper') {
    return null;
  }

  const isNewsActive = pathname === '/' || pathname === '/news';
  const isStocksActive = pathname.startsWith('/stocks');
  const isPaymentsActive = pathname.startsWith('/payments');

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
        padding: '6px 8px calc(8px + env(safe-area-inset-bottom, 0px)) 8px',
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
        className="ios-tappable"
        style={{
          flex: 1,
          height: '50px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          textDecoration: 'none',
          color: isNewsActive ? '#007AFF' : 'var(--text-tertiary)',
          borderRadius: '12px',
          background: isNewsActive ? 'rgba(0, 122, 255, 0.12)' : 'transparent',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
        }}
      >
        <Newspaper size={20} strokeWidth={isNewsActive ? 2.4 : 1.8} />
        <span style={{ fontSize: '10.5px', fontWeight: isNewsActive ? 700 : 500, letterSpacing: '-0.2px' }}>
          {t('newsDigest')}
        </span>
        {isNewsActive && (
          <span
            style={{
              position: 'absolute',
              bottom: '2px',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: '#007AFF',
              boxShadow: '0 0 6px #007AFF',
            }}
          />
        )}
      </Link>

      {/* 2. All Markets Tab (Consolidated SET & US) */}
      <Link
        href="/stocks"
        title={t('marketAndCharts')}
        aria-label={t('marketAndCharts')}
        className="ios-tappable"
        style={{
          flex: 1,
          height: '50px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          textDecoration: 'none',
          color: isStocksActive ? '#007AFF' : 'var(--text-tertiary)',
          borderRadius: '12px',
          background: isStocksActive ? 'rgba(0, 122, 255, 0.12)' : 'transparent',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
        }}
      >
        <TrendingUp size={20} strokeWidth={isStocksActive ? 2.4 : 1.8} />
        <span style={{ fontSize: '10.5px', fontWeight: isStocksActive ? 700 : 500, letterSpacing: '-0.2px' }}>
          ตลาดหุ้น
        </span>
        {isStocksActive && (
          <span
            style={{
              position: 'absolute',
              bottom: '2px',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: '#007AFF',
              boxShadow: '0 0 6px #007AFF',
            }}
          />
        )}
      </Link>

      {/* 3. AI Agent Hero Tab (เด่น ๆ - Elevated Glowing Center Highlight) */}
      <Link
        href="/ai-helper"
        title="AI Financial Agent"
        aria-label="AI Financial Agent"
        className="ios-tappable"
        style={{
          flex: 1.1,
          height: '54px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textDecoration: 'none',
          position: 'relative',
          marginTop: '-12px', // Elevated above nav bar
        }}
      >
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 6px 20px rgba(6, 182, 212, 0.45), 0 0 12px rgba(59, 130, 246, 0.3)',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            transition: 'all 0.2s ease',
          }}
        >
          <Sparkles size={22} strokeWidth={2.4} />
        </div>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 800,
            marginTop: '2px',
            letterSpacing: '0.2px',
            background: 'linear-gradient(90deg, #06b6d4, #3b82f6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          AI Agent
        </span>
      </Link>

      {/* 4. Store / GemCoins Tab */}
      <Link
        href="/payments"
        title="ร้านค้า & GemCoins"
        aria-label="ร้านค้า & GemCoins"
        className="ios-tappable"
        style={{
          flex: 1,
          height: '50px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          textDecoration: 'none',
          color: isPaymentsActive ? '#f59e0b' : 'var(--text-tertiary)',
          borderRadius: '12px',
          background: isPaymentsActive ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
        }}
      >
        <CreditCard size={20} strokeWidth={isPaymentsActive ? 2.4 : 1.8} />
        <span style={{ fontSize: '10.5px', fontWeight: isPaymentsActive ? 700 : 500, letterSpacing: '-0.2px' }}>
          ร้านค้า
        </span>
        {isPaymentsActive && (
          <span
            style={{
              position: 'absolute',
              bottom: '2px',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: '#f59e0b',
              boxShadow: '0 0 6px #f59e0b',
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
        className="ios-tappable"
        style={{
          flex: 1,
          height: '50px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          background: 'none',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          color: 'var(--text-tertiary)',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {user ? (
          <UserAvatar
            photoURL={user.photoURL}
            displayName={user.displayName}
            email={user.email}
            size={22}
            border="1.5px solid rgba(0, 122, 255, 0.45)"
          />
        ) : (
          <User size={20} strokeWidth={1.8} />
        )}
        <span style={{ fontSize: '10.5px', fontWeight: 500, letterSpacing: '-0.2px' }}>
          {user ? 'โปรไฟล์' : 'เข้าสู่ระบบ'}
        </span>
      </button>
    </nav>
  );
}

export default PwaBottomNav;

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

  // On AI Helper page, hide bottom nav to give 100% full screen to chat
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
        padding: '0 12px calc(4px + env(safe-area-inset-bottom, 0px)) 12px',
        height: 'calc(54px + env(safe-area-inset-bottom, 0px))',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(30px) saturate(200%)',
        WebkitBackdropFilter: 'blur(30px) saturate(200%)',
        borderTop: '1px solid var(--glass-border)',
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -6px 28px rgba(0, 0, 0, 0.45)',
        overflow: 'visible',
      }}
      aria-label="Mobile Navigation"
    >
      {/* 1. News Digest Tab - Pure Minimal Icon */}
      <Link
        href="/"
        title={t('newsDigest')}
        aria-label={t('newsDigest')}
        className="ios-tappable"
        style={{
          flex: 1,
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textDecoration: 'none',
          color: isNewsActive ? '#007AFF' : 'var(--text-tertiary)',
          borderRadius: '16px',
          background: isNewsActive ? 'rgba(0, 122, 255, 0.12)' : 'transparent',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
        }}
      >
        <Newspaper size={22} strokeWidth={isNewsActive ? 2.3 : 1.7} />
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

      {/* 2. All Markets Tab - Pure Minimal Icon */}
      <Link
        href="/stocks"
        title={t('marketAndCharts')}
        aria-label={t('marketAndCharts')}
        className="ios-tappable"
        style={{
          flex: 1,
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textDecoration: 'none',
          color: isStocksActive ? '#007AFF' : 'var(--text-tertiary)',
          borderRadius: '16px',
          background: isStocksActive ? 'rgba(0, 122, 255, 0.12)' : 'transparent',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
        }}
      >
        <TrendingUp size={22} strokeWidth={isStocksActive ? 2.3 : 1.7} />
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

      {/* 3. AI Agent Hero Tab - Floating Elevated Glowing Circle (Zero Clutter Text) */}
      <Link
        href="/ai-helper"
        title="AI Financial Agent"
        aria-label="AI Financial Agent"
        className="ios-tappable"
        style={{
          flex: 1,
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textDecoration: 'none',
          position: 'relative',
          marginTop: '-16px', // Elevated above the bar
          overflow: 'visible',
          zIndex: 20,
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 6px 20px rgba(6, 182, 212, 0.5), 0 0 10px rgba(59, 130, 246, 0.35)',
            border: '2px solid rgba(255, 255, 255, 0.35)',
            transition: 'all 0.2s ease',
            flexShrink: 0,
          }}
        >
          <Sparkles size={23} strokeWidth={2.4} />
        </div>
      </Link>

      {/* 4. Store / GemCoins Tab - Pure Minimal Icon */}
      <Link
        href="/payments"
        title="ร้านค้า & GemCoins"
        aria-label="ร้านค้า & GemCoins"
        className="ios-tappable"
        style={{
          flex: 1,
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textDecoration: 'none',
          color: isPaymentsActive ? '#f59e0b' : 'var(--text-tertiary)',
          borderRadius: '16px',
          background: isPaymentsActive ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
        }}
      >
        <CreditCard size={22} strokeWidth={isPaymentsActive ? 2.3 : 1.7} />
        {isPaymentsActive && (
          <span
            style={{
              position: 'absolute',
              bottom: '5px',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: '#f59e0b',
              boxShadow: '0 0 6px #f59e0b',
            }}
          />
        )}
      </Link>

      {/* 5. User Profile / Auth Tab - Pure Minimal Icon */}
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
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'none',
          border: 'none',
          borderRadius: '16px',
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
            size={24}
            border="1.5px solid rgba(0, 122, 255, 0.45)"
          />
        ) : (
          <User size={22} strokeWidth={1.8} />
        )}
      </button>
    </nav>
  );
}

export default PwaBottomNav;

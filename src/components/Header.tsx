import React from 'react';
import { TrendingUp, Moon, Sun, RefreshCw, Bookmark, Sparkles, Key, Globe, User, LogOut, ShieldCheck, Newspaper, CreditCard } from 'lucide-react';
import type { UserAuthData } from './AuthModal';

interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  showBookmarkedOnly: boolean;
  onToggleBookmarkedOnly: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenApiKeyModal: () => void;
  onGenerateAiSummary: () => void;
  isGeneratingAi: boolean;
  hasApiKey: boolean;
  activeView: 'news' | 'explorer';
  onSelectView: (view: 'news' | 'explorer') => void;
  currentUser: UserAuthData | null;
  onOpenAuthModal: (tab?: 'login' | 'register') => void;
  onLogout: () => void;
  onOpenSubscription: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  showBookmarkedOnly,
  onToggleBookmarkedOnly,
  onRefresh,
  isRefreshing,
  onOpenApiKeyModal,
  onGenerateAiSummary,
  isGeneratingAi,
  hasApiKey,
  activeView,
  onSelectView,
  currentUser,
  onOpenAuthModal,
  onLogout,
  onOpenSubscription,
}) => {
  const currentDate = new Date().toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="glass-card" style={{ borderRadius: '0 0 24px 24px', padding: '16px 28px', marginBottom: '24px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Main Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          
          {/* Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }} onClick={() => onSelectView('explorer')}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: '#007AFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(0, 122, 255, 0.4)',
            }}>
              <TrendingUp size={26} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-primary)' }}>
                  StockHome<span style={{ color: '#007AFF' }}>TH</span>
                </h1>
                <span style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '2px 9px',
                  borderRadius: '100px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Sparkles size={11} /> PRO INTELLIGENCE
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                {currentDate}
              </p>
            </div>
          </div>

          {/* Navigation View Switcher (Clean Enterprise Tabs) */}
          <div className="ios-segmented-control" style={{ padding: '4px' }}>
            <button
              className={`ios-segment-btn ${activeView === 'explorer' ? 'active' : ''}`}
              onClick={() => onSelectView('explorer')}
              style={{ padding: '8px 20px' }}
            >
              <Globe size={15} /> ภาพรวมตลาดหุ้น (SET/US)
            </button>
            <button
              className={`ios-segment-btn ${activeView === 'news' ? 'active' : ''}`}
              onClick={() => onSelectView('news')}
              style={{ padding: '8px 20px' }}
            >
              <Newspaper size={15} /> ข่าวสรุปการเงิน AI
            </button>
          </div>

          {/* User Auth & Theme Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {currentUser ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '6px 14px 6px 8px',
                  borderRadius: '100px',
                  border: '1px solid var(--glass-border)'
                }}
              >
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--accent-blue)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: '0.75rem', fontWeight: 800 }}>{currentUser.name.slice(0, 1).toUpperCase()}</div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                    {currentUser.name}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--accent-bullish)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                    <ShieldCheck size={10} /> {currentUser.plan.toUpperCase()} PLAN
                  </span>
                </div>
                <button
                  onClick={onOpenSubscription}
                  title="Manage subscription"
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', marginLeft: '4px' }}
                ><CreditCard size={16} /></button>
                <button
                  onClick={onLogout}
                  title="Log out"
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', marginLeft: '6px' }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => onOpenAuthModal('login')}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '100px',
                    background: 'var(--accent-blue-gradient)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px var(--accent-blue-glow)'
                  }}
                >
                  <User size={15} /> Sign in
                </button>
              </div>
            )}

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={onToggleTheme}
              title="สลับธีม"
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '100px',
                padding: '9px 13px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {theme === 'dark' ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="#007AFF" />}
            </button>
          </div>
        </div>

        {/* Sub-Bar for News Feed actions */}
        {activeView === 'news' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <button
              onClick={onGenerateAiSummary}
              disabled={isGeneratingAi}
              style={{
                background: '#007AFF',
                color: '#ffffff',
                border: 'none',
                borderRadius: '100px',
                padding: '8px 18px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: isGeneratingAi ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(0, 122, 255, 0.35)',
                opacity: isGeneratingAi ? 0.7 : 1,
              }}
            >
              <Sparkles size={15} className={isGeneratingAi ? 'spin-anim' : ''} />
              <span>{isGeneratingAi ? 'Gemini กำลังสรุปข่าว...' : '✨ สรุปข่าวใหม่ด้วย AI'}</span>
            </button>

            <button
              onClick={onOpenApiKeyModal}
              title="ตั้งค่า Gemini API Key"
              style={{
                background: hasApiKey ? 'rgba(16, 185, 129, 0.15)' : 'var(--glass-bg)',
                border: hasApiKey ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--glass-border)',
                borderRadius: '100px',
                padding: '8px 14px',
                color: hasApiKey ? 'var(--accent-bullish)' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
            >
              <Key size={14} />
              <span>{hasApiKey ? 'Gemini Active' : 'Gemini Key'}</span>
            </button>

            <button
              onClick={onRefresh}
              title="อัปเดตข่าวสาร"
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '100px',
                padding: '8px 14px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
              }}
            >
              <RefreshCw size={15} className={isRefreshing ? 'spin-anim' : ''} />
            </button>

            <button
              onClick={onToggleBookmarkedOnly}
              style={{
                background: showBookmarkedOnly ? 'rgba(245, 158, 11, 0.18)' : 'var(--glass-bg)',
                border: showBookmarkedOnly ? '1px solid #f59e0b' : '1px solid var(--glass-border)',
                borderRadius: '100px',
                padding: '8px 16px',
                color: showBookmarkedOnly ? '#f59e0b' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                fontWeight: showBookmarkedOnly ? 700 : 500,
              }}
            >
              <Bookmark size={15} fill={showBookmarkedOnly ? '#f59e0b' : 'none'} />
              <span>ข่าวที่เซฟไว้</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

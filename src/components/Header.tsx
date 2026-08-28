import React from 'react';
import { TrendingUp, Moon, Sun, RefreshCw, Bookmark, Sparkles, Key, Globe, Code2, User, LogOut, ShieldCheck } from 'lucide-react';
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
  activeView: 'news' | 'explorer' | 'dev_api';
  onSelectView: (view: 'news' | 'explorer' | 'dev_api') => void;
  currentUser: UserAuthData | null;
  onOpenAuthModal: (tab?: 'login' | 'preview') => void;
  onLogout: () => void;
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
}) => {
  const currentDate = new Date().toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="glass-card" style={{ borderRadius: '0 0 24px 24px', padding: '16px 24px', marginBottom: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Top Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          
          {/* Brand Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => onSelectView('news')}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(0, 122, 255, 0.4)',
            }}>
              <TrendingUp size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-primary)' }}>
                  StockHome<span style={{ background: 'linear-gradient(90deg, #34C759, #007AFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TH</span>
                </h1>
                <span style={{
                  background: 'rgba(52, 199, 89, 0.15)',
                  color: '#34C759',
                  border: '1px solid rgba(52, 199, 89, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '100px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Sparkles size={11} /> PRO PLATFORM
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                {currentDate}
              </p>
            </div>
          </div>

          {/* Navigation View Switcher (Tabs) */}
          <div className="ios-segmented-control" style={{ padding: '3px' }}>
            <button
              className={`ios-segment-btn ${activeView === 'news' ? 'active' : ''}`}
              onClick={() => onSelectView('news')}
            >
              <Sparkles size={14} /> ข่าวสรุป AI
            </button>
            <button
              className={`ios-segment-btn ${activeView === 'explorer' ? 'active' : ''}`}
              onClick={() => onSelectView('explorer')}
            >
              <Globe size={14} /> หุ้นทั้งตลาด (SET/US)
            </button>
            <button
              className={`ios-segment-btn ${activeView === 'dev_api' ? 'active' : ''}`}
              onClick={() => onSelectView('dev_api')}
            >
              <Code2 size={14} /> Developer API
            </button>
          </div>

          {/* User Auth & Profile Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {currentUser ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '6px 12px 6px 8px',
                  borderRadius: '100px',
                  border: '1px solid var(--glass-border)'
                }}
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#fff' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                    {currentUser.name}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--accent-bullish)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <ShieldCheck size={10} /> {currentUser.provider} ({currentUser.tier})
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  title="Log out"
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', marginLeft: '4px' }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => onOpenAuthModal('login')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '100px',
                    background: 'var(--accent-blue)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px var(--accent-blue-glow)'
                  }}
                >
                  <User size={14} /> Sign In / OAuth
                </button>
                <button
                  onClick={() => onOpenAuthModal('preview')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '100px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  ✨ Preview Tier
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
                padding: '8px 12px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {theme === 'dark' ? <Sun size={17} color="#FFCC00" /> : <Moon size={17} color="#007AFF" />}
            </button>
          </div>
        </div>

        {/* Quick Action Sub-Bar (When viewing News Feed) */}
        {activeView === 'news' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
            {/* AI Generator Button */}
            <button
              onClick={onGenerateAiSummary}
              disabled={isGeneratingAi}
              style={{
                background: 'linear-gradient(135deg, #007AFF 0%, #34C759 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '100px',
                padding: '7px 16px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: isGeneratingAi ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(0, 122, 255, 0.35)',
                opacity: isGeneratingAi ? 0.7 : 1,
              }}
            >
              <Sparkles size={14} className={isGeneratingAi ? 'spin-anim' : ''} />
              <span>{isGeneratingAi ? 'Gemini กำลังสรุปข่าว...' : '✨ สรุปข่าวใหม่ด้วย AI'}</span>
            </button>

            {/* API Key Settings Button */}
            <button
              onClick={onOpenApiKeyModal}
              title="ตั้งค่า Gemini API Key"
              style={{
                background: hasApiKey ? 'rgba(52, 199, 89, 0.15)' : 'var(--glass-bg)',
                border: hasApiKey ? '1px solid rgba(52, 199, 89, 0.4)' : '1px solid var(--glass-border)',
                borderRadius: '100px',
                padding: '7px 12px',
                color: hasApiKey ? 'var(--accent-bullish)' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.82rem',
              }}
            >
              <Key size={14} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{hasApiKey ? 'Gemini Active' : 'Gemini Key'}</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              title="อัปเดตข่าวสาร"
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '100px',
                padding: '7px 12px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
              }}
            >
              <RefreshCw size={14} className={isRefreshing ? 'spin-anim' : ''} />
            </button>

            {/* Bookmarked Filter Button */}
            <button
              onClick={onToggleBookmarkedOnly}
              style={{
                background: showBookmarkedOnly ? 'rgba(255, 204, 0, 0.18)' : 'var(--glass-bg)',
                border: showBookmarkedOnly ? '1px solid #FFCC00' : '1px solid var(--glass-border)',
                borderRadius: '100px',
                padding: '7px 14px',
                color: showBookmarkedOnly ? '#FFCC00' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                fontWeight: showBookmarkedOnly ? 600 : 400,
              }}
            >
              <Bookmark size={14} fill={showBookmarkedOnly ? '#FFCC00' : 'none'} />
              <span>ข่าวที่เซฟไว้</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

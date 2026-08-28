import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2 } from 'lucide-react';

export interface UserAuthData {
  name: string;
  email: string;
  avatar: string;
  provider: 'Google' | 'Facebook' | 'Discord' | 'Apple' | 'X' | 'Preview Request';
  tier: 'Developer Tier' | 'Pro Preview' | 'Enterprise';
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAuthData) => void;
  initialTab?: 'login' | 'preview';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess, initialTab = 'login' }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'preview'>(initialTab);
  const [previewName, setPreviewName] = useState('');
  const [previewEmail, setPreviewEmail] = useState('');
  const [previewRole, setPreviewRole] = useState('Full Stack Developer');
  const [isSubmittedPreview, setIsSubmittedPreview] = useState(false);

  if (!isOpen) return null;

  const handleProviderLogin = (provider: 'Google' | 'Facebook' | 'Discord' | 'Apple' | 'X') => {
    // Simulate OAuth Login Success
    const mockAvatars: Record<string, string> = {
      Google: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GoogleUser',
      Facebook: 'https://api.dicebear.com/7.x/avataaars/svg?seed=FBUser',
      Discord: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DiscordUser',
      Apple: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AppleUser',
      X: 'https://api.dicebear.com/7.x/avataaars/svg?seed=XUser'
    };

    const user: UserAuthData = {
      name: `Developer (${provider})`,
      email: `dev.${provider.toLowerCase()}@stockhometh.com`,
      avatar: mockAvatars[provider],
      provider,
      tier: 'Pro Preview'
    };

    onLoginSuccess(user);
    onClose();
  };

  const handlePreviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewName || !previewEmail) return;

    setIsSubmittedPreview(true);
    setTimeout(() => {
      const user: UserAuthData = {
        name: previewName,
        email: previewEmail,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${previewName}`,
        provider: 'Preview Request',
        tier: 'Pro Preview'
      };
      onLoginSuccess(user);
      setIsSubmittedPreview(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="ios-sheet-overlay" onClick={onClose}>
      <div
        className="ios-sheet-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px', borderRadius: '28px', padding: '32px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <span className="badge-sentiment badge-bullish" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>
              StockHomeTH Auth System
            </span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              {activeTab === 'login' ? 'เข้าสู่ระบบ / Sign In' : 'ขอสิทธิ์ Preview Access'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="ios-segmented-control" style={{ width: '100%', padding: '4px', marginBottom: '24px' }}>
          <button
            className={`ios-segment-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Sign In with OAuth
          </button>
          <button
            className={`ios-segment-btn ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            ✨ Request Preview
          </button>
        </div>

        {activeTab === 'login' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'center' }}>
              เลือกบัญชีเพื่อเปิดใช้งาน Developer API & สิทธิ์ดูหุ้นทั้งตลาด
            </p>

            {/* 1. Google Login */}
            <button
              onClick={() => handleProviderLogin('Google')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '100px',
                background: '#ffffff',
                border: 'none',
                color: '#1f2937',
                fontWeight: 600,
                fontSize: '0.92rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                transition: 'transform 0.2s ease'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.39 7.35 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.99 0 12s.45 3.84 1.24 5.42l4.04-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.61 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
              Sign in with Google
            </button>

            {/* 2. Facebook Login */}
            <button
              onClick={() => handleProviderLogin('Facebook')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '100px',
                background: '#1877F2',
                border: 'none',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.92rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(24, 119, 242, 0.3)'
              }}
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Continue with Facebook
            </button>

            {/* 3. Discord Login */}
            <button
              onClick={() => handleProviderLogin('Discord')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '100px',
                background: '#5865F2',
                border: 'none',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.92rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(88, 101, 242, 0.3)'
              }}
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.009c.12.098.245.195.372.288a.077.077 0 0 1-.006.128 12.299 12.299 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              Login with Discord
            </button>

            {/* 4. Apple Login */}
            <button
              onClick={() => handleProviderLogin('Apple')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '100px',
                background: '#000000',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.92rem',
                cursor: 'pointer'
              }}
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.67-.82 1.13-1.96.99-3.1-.97.04-2.17.65-2.86 1.45-.61.71-1.14 1.87-.99 2.99 1.09.08 2.22-.52 2.86-1.34z" />
              </svg>
              Sign in with Apple
            </button>

            {/* 5. X (Twitter) Login */}
            <button
              onClick={() => handleProviderLogin('X')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '100px',
                background: '#14171A',
                border: '1px solid var(--glass-border)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.92rem',
                cursor: 'pointer'
              }}
            >
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Sign in with X
            </button>
          </div>
        ) : (
          <form onSubmit={handlePreviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              กรอกข้อมูลเพื่อขอสิทธิ์การใช้งานหน้า **Preview Tier** สำหรับข้อมูลหุ้นทั้งตลาดและ API Key ระดับ Pro
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ชื่อ - นามสกุล / Name</label>
              <input
                type="text"
                required
                placeholder="เช่น สมชาย สายเทรด..."
                value={previewName}
                onChange={(e) => setPreviewName(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--glass-border)',
                  background: 'rgba(0,0,0,0.2)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>อีเมลติดต่อ / Work Email</label>
              <input
                type="email"
                required
                placeholder="dev@example.com"
                value={previewEmail}
                onChange={(e) => setPreviewEmail(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--glass-border)',
                  background: 'rgba(0,0,0,0.2)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ตำแหน่ง / Developer Role</label>
              <select
                value={previewRole}
                onChange={(e) => setPreviewRole(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--glass-border)',
                  background: '#1a1e29',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              >
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="Algorithmic Trader">Algorithmic Trader / Quant</option>
                <option value="Fintech Startup Founder">Fintech Startup Founder</option>
                <option value="Individual Investor">Individual Investor</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmittedPreview}
              style={{
                padding: '14px',
                borderRadius: '100px',
                background: 'linear-gradient(135deg, var(--accent-bullish), #10b981)',
                border: 'none',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                marginTop: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isSubmittedPreview ? <CheckCircle2 size={18} /> : <Sparkles size={18} />}
              {isSubmittedPreview ? 'กำลังอนุมัติสิทธิ์ Preview Access...' : 'ส่งคำขอเข้าใช้งาน Preview Access'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

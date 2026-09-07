'use client';

import React, { useState } from 'react';
import { useAdminAuth } from '../../lib/context/AdminAuthContext';
import { ShieldCheck, Lock, Mail, Key, LogIn, LogOut, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export const AdminAuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, loading, signInWithGoogle, signInWithEmail, signOut, error } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(0, 122, 255, 0.2)', borderTopColor: '#007AFF', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>กำลังตรวจสอบสิทธิ์ Admin Security...</p>
      </div>
    );
  }

  // If user is authenticated and authorized as Admin
  if (user && isAdmin) {
    return (
      <div>
        {/* Top Admin Bar */}
        <div className="glass-card" style={{ padding: '12px 20px', borderRadius: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00E676', boxShadow: '0 0 8px #00E676' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Admin Session: <span style={{ color: '#007AFF' }}>{user.email}</span>
            </span>
            <span style={{ fontSize: '0.72rem', background: 'rgba(0, 230, 118, 0.15)', color: '#00E676', border: '1px solid rgba(0, 230, 118, 0.3)', padding: '2px 8px', borderRadius: '100px', fontWeight: 700 }}>
              Authorized
            </span>
          </div>
          <button
            onClick={() => signOut()}
            className="ios-btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <LogOut size={14} /> ออกจากระบบ
          </button>
        </div>

        {children}
      </div>
    );
  }

  // Not logged in or unauthorized: Show Login Form
  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    await signInWithEmail(email, password);
    setIsSubmitting(false);
  };

  return (
    <div style={{ maxWidth: '440px', margin: '40px auto', padding: '0 16px' }}>
      <div className="glass-card" style={{ padding: '36px 32px', borderRadius: '28px', border: '1px solid var(--card-border)' }}>
        {/* Header Icon */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'rgba(0, 122, 255, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
            <ShieldCheck size={32} color="#007AFF" />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Admin Backoffice
          </h2>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            ระบบควบคุมเฉพาะผู้ดูแลระบบ StockHomeTH
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '14px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.82rem', color: '#f87171', fontWeight: 600 }}>{error}</span>
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          onClick={() => signInWithGoogle()}
          className="glass-card-hover"
          style={{
            width: '100%',
            padding: '12px 18px',
            borderRadius: '16px',
            background: 'var(--card-sub-bg)',
            border: '1px solid var(--card-sub-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontSize: '0.9rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            cursor: 'pointer',
            marginBottom: '20px',
            transition: 'all 0.2s ease',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          เข้าสู่ระบบด้วย Google Account
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--card-sub-border)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>หรือกรอกรหัสผ่าน</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--card-sub-border)' }} />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmitEmail} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              อีเมลแอดมิน
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '14px', top: '13px' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: '14px',
                  background: 'var(--card-sub-bg)',
                  border: '1px solid var(--card-sub-border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              รหัสผ่าน
            </label>
            <div style={{ position: 'relative' }}>
              <Key size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '14px', top: '13px' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: '14px',
                  background: 'var(--card-sub-bg)',
                  border: '1px solid var(--card-sub-border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="ios-btn-primary"
            style={{
              marginTop: '8px',
              padding: '12px',
              borderRadius: '14px',
              fontSize: '0.88rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            <LogIn size={16} /> {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ Admin'}
          </button>
        </form>

        {/* Security Badge */}
        <div style={{ marginTop: '24px', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Lock size={12} /> ปลอดภัยด้วย Firebase Authentication & Admin Whitelist
          </p>
        </div>
      </div>
    </div>
  );
};

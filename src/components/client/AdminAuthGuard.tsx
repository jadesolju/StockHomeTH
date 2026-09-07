'use client';

import React, { useState } from 'react';
import { useAdminAuth } from '../../lib/context/AdminAuthContext';
import { ShieldCheck, Lock, Mail, Key, LogIn, LogOut, AlertCircle, Database } from 'lucide-react';

export const AdminAuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, loading, signInWithSupabase, signOut, error } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(16, 185, 129, 0.2)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>กำลังตรวจสอบสิทธิ์ Supabase Admin Security...</p>
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
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Supabase Admin Session: <span style={{ color: '#10b981' }}>{user.email}</span>
            </span>
            <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '100px', fontWeight: 700 }}>
              Authorized
            </span>
          </div>
          <button
            onClick={() => signOut()}
            className="ios-btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <LogOut size={14} /> ออกจากระบบ Admin
          </button>
        </div>

        {children}
      </div>
    );
  }

  // Not logged in or unauthorized: Show Supabase Admin Login Form (NO SIGN UP)
  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      await signInWithSupabase(email, password);
    } catch (err: any) {
      setFormError(err.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลและรหัสผ่าน');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = formError || error;

  return (
    <div style={{ maxWidth: '440px', margin: '40px auto', padding: '0 16px' }}>
      <div className="glass-card" style={{ padding: '36px 32px', borderRadius: '28px', border: '1px solid var(--card-border)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
        {/* Header Icon */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'rgba(16, 185, 129, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
            <Database size={30} color="#10b981" />
          </div>
          <p style={{ margin: '0 0 4px 0', fontSize: '0.72rem', letterSpacing: '0.08em', color: '#10b981', fontWeight: 800 }}>
            SUPABASE CONTROL PORTAL
          </p>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Admin Backoffice Login
          </h2>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            ระบบควบคุมสำหรับผู้ดูแลระบบ (ไม่มีเปิดรับสมัครสมาชิกใหม่)
          </p>
        </div>

        {/* Error Alert */}
        {displayError && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '14px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.82rem', color: '#f87171', fontWeight: 600 }}>{displayError}</span>
          </div>
        )}

        {/* Email & Password Form (Strictly Supabase Login, No Sign Up) */}
        <form onSubmit={handleSubmitEmail} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              อีเมลแอดมิน (Supabase Auth)
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '14px', top: '13px' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: '14px',
                  background: 'var(--card-sub-bg)',
                  border: '1px solid var(--card-sub-border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              รหัสผ่านแอดมิน
            </label>
            <div style={{ position: 'relative' }}>
              <Key size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '14px', top: '13px' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: '14px',
                  background: 'var(--card-sub-bg)',
                  border: '1px solid var(--card-sub-border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="ios-btn-primary"
            style={{
              marginTop: '10px',
              padding: '12px',
              borderRadius: '14px',
              fontSize: '0.88rem',
              fontWeight: 700,
              background: '#10b981',
              borderColor: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            <LogIn size={16} /> {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ Supabase Admin'}
          </button>
        </form>

        {/* Security Badge */}
        <div style={{ marginTop: '24px', padding: '12px 14px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.15)', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Lock size={13} color="#10b981" /> สิทธิ์การเข้าถึงถูกจำกัดผ่าน Supabase Authentication & Role Whitelist
          </p>
        </div>
      </div>
    </div>
  );
};
export default AdminAuthGuard;

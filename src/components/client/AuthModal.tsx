'use client';

import React, { useState, useEffect } from 'react';
import { X, LockKeyhole, Mail, Key, User as UserIcon, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useClientAuth, AuthModalTab } from '../../lib/context/ClientAuthContext';

interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialTab?: AuthModalTab;
}

export function AuthModal({
  isOpen: propIsOpen,
  onClose: propOnClose,
  initialTab = 'login',
}: AuthModalProps) {
  const {
    user,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    forgotPassword,
    changePassword,
    isAuthModalOpen,
    authModalTab,
    closeAuthModal,
    openAuthModal,
  } = useClientAuth();

  const isModalVisible = propIsOpen !== undefined ? propIsOpen : isAuthModalOpen;
  const handleClose = propOnClose || closeAuthModal;

  const [mode, setMode] = useState<AuthModalTab>(initialTab);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isModalVisible) {
      setMode(authModalTab || initialTab);
      setErrorMessage('');
      setSuccessMessage('');
      setPassword('');
      setConfirmPassword('');
    }
  }, [isModalVisible, authModalTab, initialTab]);

  if (!isModalVisible) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
        setSuccessMessage('เข้าสู่ระบบสำเร็จ');
        setTimeout(() => handleClose(), 600);
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          throw new Error('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
        }
        if (password.length < 6) {
          throw new Error('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
        }
        await registerWithEmail(name, email, password);
        setSuccessMessage('สมัครสมาชิกสำเร็จ ยินดีต้อนรับสู่ StockHomeTH');
        setTimeout(() => handleClose(), 800);
      } else if (mode === 'forgot') {
        await forgotPassword(email);
        setSuccessMessage(`ระบบได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปยัง ${email} แล้ว โปรดตรวจสอบในกล่องจดหมายของคุณ`);
      } else if (mode === 'changePassword') {
        if (password !== confirmPassword) {
          throw new Error('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
        }
        if (password.length < 6) {
          throw new Error('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
        }
        await changePassword(password);
        setSuccessMessage('เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว');
        setTimeout(() => handleClose(), 1200);
      }
    } catch (err: any) {
      console.error('[AuthModal Error]:', err);
      let msg = err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
      if (msg.includes('auth/email-already-in-use')) {
        msg = 'อีเมลนี้ถูกใช้งานในระบบแล้ว กรุณาเข้าสู่ระบบ';
      } else if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found')) {
        msg = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      } else if (msg.includes('auth/weak-password')) {
        msg = 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
      } else if (msg.includes('auth/invalid-email')) {
        msg = 'รูปแบบอีเมลไม่ถูกต้อง';
      } else if (msg.includes('auth/popup-closed-by-user')) {
        msg = 'ยกเลิกการเข้าสู่ระบบผ่าน Google';
      }
      setErrorMessage(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setBusy(true);
    setErrorMessage('');
    try {
      await signInWithGoogle();
      setSuccessMessage('เข้าสู่ระบบด้วย Google สำเร็จ');
      setTimeout(() => handleClose(), 600);
    } catch (err: any) {
      if (!err.message?.includes('popup-closed-by-user')) {
        setErrorMessage(err.message || 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ');
      }
    } finally {
      setBusy(false);
    }
  };

  const title =
    mode === 'login'
      ? 'เข้าสู่ระบบ StockHomeTH'
      : mode === 'register'
      ? 'สมัครสมาชิกใหม่'
      : mode === 'forgot'
      ? 'รีเซ็ตรหัสผ่าน'
      : 'เปลี่ยนรหัสผ่านใหม่';

  return (
    <div className="ios-sheet-overlay" onClick={handleClose} style={{ zIndex: 9999 }}>
      <section
        className="auth-dialog glass-card"
        onClick={(event) => event.stopPropagation()}
        style={{
          borderRadius: '28px',
          padding: '32px 28px',
          maxWidth: '420px',
          width: '90%',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          border: '1px solid var(--card-border)',
        }}
      >
        <button className="icon-button auth-close" onClick={handleClose} aria-label="ปิด">
          <X size={19} />
        </button>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'rgba(0, 122, 255, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}
          >
            {mode === 'changePassword' ? (
              <ShieldCheck size={26} color="#007AFF" />
            ) : (
              <LockKeyhole size={26} color="#007AFF" />
            )}
          </div>
          <p className="eyebrow" style={{ margin: '0 0 4px 0', fontSize: '0.72rem', letterSpacing: '0.08em', color: '#007AFF', fontWeight: 800 }}>
            STOCKHOMETH MEMBER
          </p>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {title}
          </h2>
          <p className="auth-copy" style={{ margin: '6px 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            {mode === 'forgot'
              ? 'กรอกอีเมลของคุณ ระบบจะส่งลิงก์สำหรับรีเซ็ตรหัสผ่านทันที'
              : mode === 'login'
              ? 'เข้าถึงบทวิเคราะห์หุ้น สรุปข่าว AI และฟีเจอร์พรีเมียม'
              : mode === 'register'
              ? 'เริ่มต้นใช้งานฟรี บันทึกหุ้นโปรดและรับข่าวสาร Real-time'
              : 'กำหนดรหัสผ่านใหม่สำหรับบัญชีผู้ใช้งานของคุณ'}
          </p>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '14px',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: 600 }}>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '14px',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>{successMessage}</span>
          </div>
        )}

        {/* Google Sign In (for login & register) */}
        {(mode === 'login' || mode === 'register') && (
          <>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={busy}
              className="glass-card-hover"
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: '14px',
                background: 'var(--card-sub-bg)',
                border: '1px solid var(--card-sub-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                fontSize: '0.88rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                cursor: busy ? 'not-allowed' : 'pointer',
                marginBottom: '16px',
                transition: 'all 0.2s ease',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              {mode === 'login' ? 'เข้าสู่ระบบด้วย Google' : 'สมัครสมาชิกด้วย Google'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '14px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--card-sub-border)' }} />
              <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>หรือใช้อีเมล</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--card-sub-border)' }} />
            </div>
          </>
        )}

        {/* Main Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                ชื่อผู้ใช้งาน
              </label>
              <div style={{ position: 'relative' }}>
                <UserIcon size={15} color="var(--text-tertiary)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น สมชาย นักลงทุน"
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    borderRadius: '12px',
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
          )}

          {mode !== 'changePassword' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                อีเมล
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="var(--text-tertiary)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    borderRadius: '12px',
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
          )}

          {mode !== 'forgot' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                {mode === 'changePassword' ? 'รหัสผ่านใหม่' : 'รหัสผ่าน'}
              </label>
              <div style={{ position: 'relative' }}>
                <Key size={15} color="var(--text-tertiary)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••• (อย่างน้อย 6 ตัวอักษร)"
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    borderRadius: '12px',
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
          )}

          {(mode === 'register' || mode === 'changePassword') && (
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                ยืนยันรหัสผ่านอีกครั้ง
              </label>
              <div style={{ position: 'relative' }}>
                <Key size={15} color="var(--text-tertiary)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    borderRadius: '12px',
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
          )}

          <button
            type="submit"
            disabled={busy}
            className="ios-btn-primary"
            style={{
              marginTop: '6px',
              padding: '11px',
              borderRadius: '12px',
              fontSize: '0.88rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy
              ? 'กำลังดำเนินการ…'
              : mode === 'login'
              ? 'เข้าสู่ระบบ'
              : mode === 'register'
              ? 'สร้างบัญชีสมาชิก'
              : mode === 'forgot'
              ? 'ส่งลิงก์รีเซ็ตรหัสผ่าน'
              : 'บันทึกรหัสผ่านใหม่'}
          </button>
        </form>

        {/* Bottom Mode Switcher */}
        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
          {mode === 'login' ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => { setErrorMessage(''); setSuccessMessage(''); setMode('forgot'); }}
                style={{ background: 'none', border: 'none', color: '#007AFF', cursor: 'pointer', fontWeight: 600, padding: 0 }}
              >
                ลืมรหัสผ่าน?
              </button>
              <span>•</span>
              <span>ยังไม่มีบัญชี?</span>
              <button
                type="button"
                onClick={() => { setErrorMessage(''); setSuccessMessage(''); setMode('register'); }}
                style={{ background: 'none', border: 'none', color: '#007AFF', cursor: 'pointer', fontWeight: 700, padding: 0 }}
              >
                สมัครสมาชิก
              </button>
            </div>
          ) : mode === 'register' ? (
            <div>
              <span>มีบัญชีผู้ใช้งานอยู่แล้ว? </span>
              <button
                type="button"
                onClick={() => { setErrorMessage(''); setSuccessMessage(''); setMode('login'); }}
                style={{ background: 'none', border: 'none', color: '#007AFF', cursor: 'pointer', fontWeight: 700, padding: 0 }}
              >
                เข้าสู่ระบบ
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => { setErrorMessage(''); setSuccessMessage(''); setMode('login'); }}
              style={{ background: 'none', border: 'none', color: '#007AFF', cursor: 'pointer', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <ArrowLeft size={14} /> กลับไปหน้าเข้าสู่ระบบ
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
export default AuthModal;

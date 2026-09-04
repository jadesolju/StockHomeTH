'use client';

import { useEffect, useState } from 'react';
import { X, LockKeyhole } from 'lucide-react';
import { authService } from '../../services/authService';
import type { UserAuthData } from '../../lib/schemas/authSchema';

type Mode = 'login' | 'register' | 'forgot' | 'reset';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAuthData) => void;
  initialTab?: 'login' | 'register';
}

export function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  initialTab = 'login',
}: AuthModalProps) {
  const [mode, setMode] = useState<Mode>(initialTab);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialTab);
      setMessage('');
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      if (mode === 'forgot') {
        const result = await authService.forgotPassword(email);
        if (result.resetUrl) window.location.assign(result.resetUrl);
        else setMessage(result.message);
        return;
      }
      const result =
        mode === 'login'
          ? await authService.login(email, password)
          : await authService.register(name, email, password);

      onLoginSuccess(result.user as UserAuthData);
      onClose();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'ดำเนินการไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  const title =
    mode === 'login'
      ? 'เข้าสู่ระบบ'
      : mode === 'register'
      ? 'สร้างบัญชี'
      : 'ตั้งรหัสผ่านใหม่';

  return (
    <div className="ios-sheet-overlay" onClick={onClose}>
      <section className="auth-dialog" onClick={(event) => event.stopPropagation()}>
        <button className="icon-button auth-close" onClick={onClose} aria-label="ปิด">
          <X size={19} />
        </button>
        <div className="auth-mark">
          <LockKeyhole size={20} />
        </div>
        <p className="eyebrow">STOCKHOME TH</p>
        <h2>{title}</h2>
        <p className="auth-copy">
          {mode === 'forgot'
            ? 'กรอกอีเมลที่ใช้สมัคร ระบบจะสร้างลิงก์เปลี่ยนรหัสผ่านให้'
            : mode === 'login'
            ? 'เข้าสู่พื้นที่วิเคราะห์และข้อมูล subscription ของคุณ'
            : 'เริ่มต้นด้วยบัญชี Free และอัปเกรดได้ภายหลัง'}
        </p>
        {(mode === 'login' || mode === 'register') && (
          <>
            <button
              type="button"
              className="google-button"
              onClick={() => window.location.assign('/api/auth/google')}
            >
              ดำเนินการต่อด้วย Google
            </button>
            <div className="auth-divider">
              <span>หรือใช้อีเมล</span>
            </div>
          </>
        )}
        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && (
            <label>
              ชื่อ
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </label>
          )}
          <label>
            อีเมล
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          {mode !== 'forgot' && (
            <label>
              รหัสผ่าน
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </label>
          )}
          {message && <p className="auth-error">{message}</p>}
          <button className="solid-button" disabled={busy}>
            {busy
              ? 'กำลังดำเนินการ…'
              : mode === 'login'
              ? 'เข้าสู่ระบบ'
              : mode === 'register'
              ? 'สร้างบัญชี'
              : 'สร้างลิงก์ตั้งรหัสผ่าน'}
          </button>
        </form>
        <p className="auth-switch">
          {mode === 'login' ? (
            <>
              <button type="button" onClick={() => setMode('forgot')}>ลืมรหัสผ่าน?</button> · ยังไม่มีบัญชี?{' '}
              <button type="button" onClick={() => setMode('register')}>สร้างบัญชี</button>
            </>
          ) : (
            <button type="button" onClick={() => setMode('login')}>กลับไปเข้าสู่ระบบ</button>
          )}
        </p>
      </section>
    </div>
  );
}

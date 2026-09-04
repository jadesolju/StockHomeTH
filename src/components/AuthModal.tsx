import { useEffect, useState } from 'react';
import { X, LockKeyhole } from 'lucide-react';
import { authService, type AuthUser } from '../services/authService';
export type UserAuthData = AuthUser;
type Mode = 'login' | 'register' | 'forgot' | 'reset';
interface Props { isOpen: boolean; onClose: () => void; onLoginSuccess: (user: AuthUser) => void; initialTab?: 'login' | 'register'; }

export function AuthModal({ isOpen, onClose, onLoginSuccess, initialTab = 'login' }: Props) {
  const resetToken = new URLSearchParams(window.location.search).get('reset_token');
  const [mode, setMode] = useState<Mode>(initialTab); const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { if (isOpen) { setMode(resetToken ? 'reset' : initialTab); setMessage(''); } }, [isOpen, initialTab, resetToken]);
  if (!isOpen) return null;
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setBusy(true); setMessage(''); try {
    if (mode === 'forgot') { const result = await authService.forgotPassword(email); if (result.resetUrl) window.location.assign(result.resetUrl); else setMessage(result.message); return; }
    const result = mode === 'login' ? await authService.login(email, password) : mode === 'reset' ? await authService.resetPassword(resetToken || '', password) : await authService.register(name, email, password);
    onLoginSuccess(result.user); window.history.replaceState({}, '', window.location.pathname); onClose();
  } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'ดำเนินการไม่สำเร็จ'); } finally { setBusy(false); } };
  const title = mode === 'login' ? 'เข้าสู่ระบบ' : mode === 'register' ? 'สร้างบัญชี' : mode === 'forgot' ? 'ตั้งรหัสผ่านใหม่' : 'กำหนดรหัสผ่านใหม่';
  return <div className="ios-sheet-overlay" onClick={onClose}><section className="auth-dialog" onClick={event => event.stopPropagation()}>
    <button className="icon-button auth-close" onClick={onClose} aria-label="ปิด"><X size={19}/></button><div className="auth-mark"><LockKeyhole size={20}/></div><p className="eyebrow">STOCKHOME TH</p><h2>{title}</h2>
    <p className="auth-copy">{mode === 'forgot' ? 'กรอกอีเมลที่ใช้สมัคร ระบบจะสร้างลิงก์เปลี่ยนรหัสผ่านให้' : mode === 'reset' ? 'ตั้งรหัสผ่านใหม่อย่างน้อย 8 ตัวอักษร' : mode === 'login' ? 'เข้าสู่พื้นที่วิเคราะห์และข้อมูล subscription ของคุณ' : 'เริ่มต้นด้วยบัญชี Free และอัปเกรดได้ภายหลัง'}</p>
    {(mode === 'login' || mode === 'register') && <><button className="google-button" onClick={() => window.location.assign('/api/auth/google')}>ดำเนินการต่อด้วย Google</button><div className="auth-divider"><span>หรือใช้อีเมล</span></div></>}
    <form onSubmit={submit} className="auth-form">{mode === 'register' && <label>ชื่อ<input value={name} onChange={e => setName(e.target.value)} required autoComplete="name" /></label>}{mode !== 'reset' && <label>อีเมล<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" /></label>}{mode !== 'forgot' && <label>รหัสผ่าน<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>}{message && <p className="auth-error">{message}</p>}<button className="solid-button" disabled={busy}>{busy ? 'กำลังดำเนินการ…' : mode === 'login' ? 'เข้าสู่ระบบ' : mode === 'register' ? 'สร้างบัญชี' : mode === 'forgot' ? 'สร้างลิงก์ตั้งรหัสผ่าน' : 'บันทึกรหัสผ่านใหม่'}</button></form>
    <p className="auth-switch">{mode === 'login' ? <><button onClick={() => setMode('forgot')}>ลืมรหัสผ่าน?</button> · ยังไม่มีบัญชี? <button onClick={() => setMode('register')}>สร้างบัญชี</button></> : <button onClick={() => setMode('login')}>กลับไปเข้าสู่ระบบ</button>}</p>
  </section></div>;
}

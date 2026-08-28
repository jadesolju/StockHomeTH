import { useEffect, useState } from 'react';
import { X, LockKeyhole } from 'lucide-react';
import { authService, type AuthUser } from '../services/authService';

export type UserAuthData = AuthUser;
interface Props { isOpen: boolean; onClose: () => void; onLoginSuccess: (user: AuthUser) => void; initialTab?: 'login' | 'register'; }

export function AuthModal({ isOpen, onClose, onLoginSuccess, initialTab = 'login' }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>(initialTab);
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { if (isOpen) { setMode(initialTab); setError(''); } }, [isOpen, initialTab]);
  if (!isOpen) return null;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try { const result = mode === 'login' ? await authService.login(email, password) : await authService.register(name, email, password); onLoginSuccess(result.user); onClose(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to continue.'); } finally { setBusy(false); }
  };
  return <div className="ios-sheet-overlay" onClick={onClose}><section className="auth-dialog" onClick={event => event.stopPropagation()}>
    <button className="icon-button auth-close" onClick={onClose} aria-label="Close"><X size={19}/></button>
    <div className="auth-mark"><LockKeyhole size={20}/></div>
    <p className="eyebrow">STOCKHOME TH</p><h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
    <p className="auth-copy">{mode === 'login' ? 'Sign in to access your workspace and subscription.' : 'Start with a free account. Upgrade whenever you need more.'}</p>
    <form onSubmit={submit} className="auth-form">
      {mode === 'register' && <label>Full name<input value={name} onChange={e => setName(e.target.value)} required autoComplete="name" /></label>}
      <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" /></label>
      <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
      {error && <p className="auth-error">{error}</p>}
      <button className="solid-button" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
    </form>
    <p className="auth-switch">{mode === 'login' ? 'New here?' : 'Already have an account?'} <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Create account' : 'Sign in'}</button></p>
  </section></div>;
}

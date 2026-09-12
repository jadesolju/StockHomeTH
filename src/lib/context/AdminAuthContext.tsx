'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';

// Pre-authorized admin emails & UIDs (configurable)
const AUTHORIZED_ADMIN_EMAILS = [
  'afillly002@gmail.com',
];

const AUTHORIZED_ADMIN_UIDS = [
  'EJCisrn5JzWcsgYUgG6k6DtYWhw2', // Firebase UID
  'addf5ae4-db55-4a32-8f67-b622ee02cc98', // Supabase UID
];


interface AdminAuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithSupabase: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Initial Session Check
    const checkSession = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.warn('[AdminAuth] Session fetch warning:', sessionError.message);
        }
        if (data?.session) {
          setSession(data.session);
          setUser(data.session.user);
        }
      } catch (err) {
        console.error('[AdminAuth] Initial check error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // 2. Auth State Listener
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const isAdmin = Boolean(
    user && (
      (user.email && AUTHORIZED_ADMIN_EMAILS.includes(user.email.toLowerCase().trim())) ||
      (user.id && AUTHORIZED_ADMIN_UIDS.includes(user.id))
    )
  );

  const signInWithSupabase = async (email: string, pass: string) => {
    try {
      setError(null);
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });

      if (authError) {
        throw new Error(authError.message || 'อีเมลหรือรหัสผ่าน Admin ไม่ถูกต้อง');
      }

      const userEmail = data.user?.email?.toLowerCase().trim();
      const userId = data.user?.id;
      const isAuthorized =
        (userEmail && AUTHORIZED_ADMIN_EMAILS.includes(userEmail)) ||
        (userId && AUTHORIZED_ADMIN_UIDS.includes(userId));

      if (!isAuthorized) {
        await supabase.auth.signOut();
        throw new Error(`บัญชีนี้ไม่มีสิทธิ์เข้าถึงระบบ Admin Backoffice`);
      }


      setUser(data.user);
      setSession(data.session);
    } catch (err: any) {
      console.error('[AdminAuth] Supabase sign in error:', err);
      let msg = err.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      if (msg.includes('Invalid login credentials')) {
        msg = 'อีเมลหรือรหัสผ่าน Supabase Admin ไม่ถูกต้อง';
      } else if (msg.includes('Email not confirmed')) {
        msg = 'กรุณายืนยันอีเมลใน Supabase ก่อนเข้าสู่ระบบ';
      }
      setError(msg);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      if (localStorage.getItem('stockhome_local_subscription_tier') === 'dev') {
        localStorage.setItem('stockhome_local_subscription_tier', 'free');
        localStorage.setItem('stockhome_gemcoin_daily_remaining', '500');
        localStorage.setItem('stockhome_gemcoin_topup_balance', '0');
      }
    } catch {}
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setError(null);
    } catch (err: any) {
      console.error('[AdminAuth] Supabase sign out error:', err);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        session,
        isAdmin,
        loading,
        signInWithSupabase,
        signOut,
        error,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
export default AdminAuthProvider;

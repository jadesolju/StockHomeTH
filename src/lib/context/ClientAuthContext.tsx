'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';
import { purgeDevStorage } from '../utils/authStorage';

export type AuthModalTab = 'login' | 'register' | 'forgot' | 'changePassword';

export interface ClientAuthUser {
  id: string;
  uid: string; // Alias for id for seamless backward compatibility
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providerData: Array<{ providerId: string }>;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
}

interface ClientAuthContextType {
  user: ClientAuthUser | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  updateUserProfile: (name?: string, photoURL?: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthModalOpen: boolean;
  authModalTab: AuthModalTab;
  openAuthModal: (tab?: AuthModalTab) => void;
  closeAuthModal: () => void;
  isProfileModalOpen: boolean;
  openProfileModal: () => void;
  closeProfileModal: () => void;
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined);

export function mapSupabaseUserToAuthUser(sbUser: SupabaseUser | null): ClientAuthUser | null {
  if (!sbUser) return null;
  const meta = sbUser.user_metadata || {};
  const displayName =
    meta.full_name ||
    meta.name ||
    meta.display_name ||
    (sbUser.email ? sbUser.email.split('@')[0] : 'Member');
  const photoURL = meta.avatar_url || meta.picture || meta.photoURL || null;
  const provider = sbUser.app_metadata?.provider || (meta.provider as string) || 'email';

  return {
    id: sbUser.id,
    uid: sbUser.id,
    email: sbUser.email ?? null,
    displayName,
    photoURL,
    providerData: [
      { providerId: provider === 'google' ? 'google.com' : 'password' },
    ],
    user_metadata: sbUser.user_metadata,
    app_metadata: sbUser.app_metadata,
  };
}

export const ClientAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ClientAuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<AuthModalTab>('login');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    // 1. Initial Session Check from Supabase Auth
    const initSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('[ClientAuthContext] Session fetch warning:', error.message);
        }
        if (isMounted) {
          if (data?.session) {
            setSession(data.session);
            setUser(mapSupabaseUserToAuthUser(data.session.user));
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('[ClientAuthContext] Init session error:', err);
        if (isMounted) setLoading(false);
      }
    };

    initSession();

    // 2. Real-Time Auth State Listener (Google OAuth redirect, token refresh, sign-in/out)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (isMounted) {
        setSession(currentSession);
        setUser(mapSupabaseUserToAuthUser(currentSession?.user ?? null));
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const openAuthModal = (tab: AuthModalTab = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const openProfileModal = () => {
    setIsProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
  };

  const signInWithGoogle = async () => {
    const isLocal =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const redirectUrl = isLocal
      ? `${window.location.origin}/auth/callback`
      : 'https://stockhometh.online/auth/callback';

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      throw new Error(error.message || 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้');
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else if (error.message.includes('Email not confirmed')) {
        throw new Error('กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ');
      }
      throw new Error(error.message || 'เข้าสู่ระบบไม่สำเร็จ');
    }

    if (data.session) {
      setSession(data.session);
      setUser(mapSupabaseUserToAuthUser(data.session.user));
    }
    closeAuthModal();
  };

  const registerWithEmail = async (name: string, email: string, pass: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: pass,
      options: {
        data: {
          full_name: name.trim(),
          display_name: name.trim(),
        },
      },
    });

    if (error) {
      if (error.message.includes('User already registered')) {
        throw new Error('อีเมลนี้ถูกใช้งานในระบบแล้ว กรุณาเข้าสู่ระบบ');
      }
      throw new Error(error.message || 'สมัครสมาชิกไม่สำเร็จ');
    }

    if (data.session) {
      setSession(data.session);
      setUser(mapSupabaseUserToAuthUser(data.session.user));
    }
    closeAuthModal();
  };

  const forgotPassword = async (email: string) => {
    const redirectUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/reset-password`
        : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUrl,
    });

    if (error) {
      throw new Error(error.message || 'ไม่สามารถส่งลิงก์รีเซ็ตรหัสผ่านได้');
    }
  };

  const changePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
    }
  };

  const updateUserProfile = async (name?: string, photoURL?: string) => {
    const updates: Record<string, any> = {};
    if (name !== undefined) {
      updates.full_name = name.trim();
      updates.display_name = name.trim();
    }
    if (photoURL !== undefined) {
      updates.avatar_url = photoURL;
      updates.picture = photoURL;
    }

    const { data, error } = await supabase.auth.updateUser({
      data: updates,
    });

    if (error) {
      throw new Error(error.message || 'อัปเดตโปรไฟล์ไม่สำเร็จ');
    }

    if (data.user) {
      const updated = mapSupabaseUserToAuthUser(data.user);
      setUser(updated);

      // Also upsert to public.user_profiles if available
      try {
        await supabase
          .from('user_profiles')
          .upsert({
            id: data.user.id,
            email: data.user.email,
            display_name: updated?.displayName || name,
            avatar_url: updated?.photoURL || photoURL,
            updated_at: new Date().toISOString(),
          });
      } catch (err) {
        console.warn('[ClientAuthContext] user_profiles sync warning:', err);
      }
    }
  };

  const signOut = async () => {
    try {
      purgeDevStorage();
    } catch (error) {
      console.error('[ClientAuthContext] Failed to purge dev storage during sign out:', error);
    }
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[ClientAuthContext] Supabase signOut error:', err);
    }
    setUser(null);
    setSession(null);
    closeProfileModal();
  };

  return (
    <ClientAuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithGoogle,
        signInWithEmail,
        registerWithEmail,
        forgotPassword,
        changePassword,
        updateUserProfile,
        signOut,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        isProfileModalOpen,
        openProfileModal,
        closeProfileModal,
      }}
    >
      {children}
    </ClientAuthContext.Provider>
  );
};

export const useClientAuth = () => {
  const context = useContext(ClientAuthContext);
  if (!context) {
    throw new Error('useClientAuth must be used within a ClientAuthProvider');
  }
  return context;
};

export default ClientAuthProvider;

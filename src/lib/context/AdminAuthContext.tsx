'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase/firebaseClient';

// List of pre-authorized admin emails (configurable via environment or defaults)
const AUTHORIZED_ADMIN_EMAILS = [
  'afillly002@gmail.com',
];

interface AdminAuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const isAdmin = Boolean(
    user && user.email && AUTHORIZED_ADMIN_EMAILS.includes(user.email.toLowerCase().trim())
  );

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email?.toLowerCase().trim();
      if (email && !AUTHORIZED_ADMIN_EMAILS.includes(email)) {
        await firebaseSignOut(auth);
        setError(`อีเมล ${email} ไม่มีสิทธิ์เข้าถึงระบบ Admin Backoffice`);
      }
    } catch (err: any) {
      console.error('[AdminAuth] Google sign in error:', err);
      setError(err.message || 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ');
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, pass);
      const userEmail = result.user.email?.toLowerCase().trim();
      if (userEmail && !AUTHORIZED_ADMIN_EMAILS.includes(userEmail)) {
        await firebaseSignOut(auth);
        setError(`อีเมล ${userEmail} ไม่มีสิทธิ์เข้าถึงระบบ Admin Backoffice`);
      }
    } catch (err: any) {
      console.error('[AdminAuth] Email sign in error:', err);
      setError(err.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setError(null);
    } catch (err: any) {
      console.error('[AdminAuth] Sign out error:', err);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        signInWithGoogle,
        signInWithEmail,
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

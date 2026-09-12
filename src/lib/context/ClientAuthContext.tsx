'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase/firebaseClient';
import { purgeDevStorage } from '../utils/authStorage';

export type AuthModalTab = 'login' | 'register' | 'forgot' | 'changePassword';

interface ClientAuthContextType {
  user: User | null;
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

export const ClientAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<AuthModalTab>('login');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
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
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    closeAuthModal();
  };

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
    closeAuthModal();
  };

  const registerWithEmail = async (name: string, email: string, pass: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, pass);
    if (name.trim() && credential.user) {
      await updateProfile(credential.user, { displayName: name.trim() });
      setUser({ ...credential.user, displayName: name.trim() } as User);
    }
    closeAuthModal();
  };

  const forgotPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const changePassword = async (newPassword: string) => {
    if (!auth.currentUser) {
      throw new Error('กรุณาเข้าสู่ระบบก่อนเปลี่ยนรหัสผ่าน');
    }
    await updatePassword(auth.currentUser, newPassword);
  };

  const updateUserProfile = async (name?: string, photoURL?: string) => {
    if (!auth.currentUser) return;
    const updates: { displayName?: string; photoURL?: string } = {};
    if (name !== undefined) updates.displayName = name.trim();
    if (photoURL !== undefined) updates.photoURL = photoURL;

    await updateProfile(auth.currentUser, updates);
    setUser({
      ...auth.currentUser,
      ...updates,
    } as User);
  };

  const signOut = async () => {
    try {
      purgeDevStorage();
    } catch {}
    await firebaseSignOut(auth);
    setUser(null);
    closeProfileModal();
  };

  return (
    <ClientAuthContext.Provider
      value={{
        user,
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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { ClientAuthProvider } from './ClientAuthContext';

// Mocks
const mockSignOut = vi.fn().mockResolvedValue(undefined);
const mockOnAuthStateChanged = vi.fn((_auth, callback) => {
  callback(null);
  return () => {};
});
const mockPurgeDevStorage = vi.fn();

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useState: (init: any) => [init, vi.fn()],
    useEffect: (effect: any) => {
      effect();
    },
  };
});

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (auth: any, callback: any) => mockOnAuthStateChanged(auth, callback),
  signOut: () => mockSignOut(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  updatePassword: vi.fn(),
}));

vi.mock('../firebase/firebaseClient', () => ({
  auth: { currentUser: null },
}));

vi.mock('../utils/authStorage', () => ({
  purgeDevStorage: () => mockPurgeDevStorage(),
}));

describe('ClientAuthContext - signOut error handling', () => {
  let consoleErrorSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('purges storage and signs out successfully when purgeDevStorage succeeds', async () => {
    mockPurgeDevStorage.mockImplementation(() => {});

    const providerElement = (ClientAuthProvider as any)({ children: null });
    const contextValue = providerElement.props.value;

    await contextValue.signOut();

    expect(mockPurgeDevStorage).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('logs error and completes sign out when purgeDevStorage throws an error', async () => {
    const purgeError = new Error('LocalStorage access denied');
    mockPurgeDevStorage.mockImplementation(() => {
      throw purgeError;
    });

    const providerElement = (ClientAuthProvider as any)({ children: null });
    const contextValue = providerElement.props.value;

    await contextValue.signOut();

    expect(mockPurgeDevStorage).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[ClientAuthContext] Failed to purge dev storage during sign out:',
      purgeError
    );
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});

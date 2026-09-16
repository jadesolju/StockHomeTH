import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { ClientAuthProvider, mapSupabaseUserToAuthUser } from './ClientAuthContext';

// Mocks
const mockSignOut = vi.fn().mockResolvedValue({ error: null });
const mockGetSession = vi.fn().mockResolvedValue({ data: { session: null }, error: null });
const mockOnAuthStateChange = vi.fn(() => ({
  data: {
    subscription: {
      unsubscribe: vi.fn(),
    },
  },
}));
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

vi.mock('../supabase/client', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: () => mockOnAuthStateChange(),
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: () => mockSignOut(),
    },
    from: vi.fn().mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

vi.mock('../utils/authStorage', () => ({
  purgeDevStorage: () => mockPurgeDevStorage(),
}));

describe('ClientAuthContext', () => {
  let consoleErrorSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('correctly maps Supabase User to ClientAuthUser', () => {
    const sbUser = {
      id: 'usr_123',
      email: 'test@stockhometh.online',
      user_metadata: {
        full_name: 'Investor Thai',
        avatar_url: 'https://example.com/avatar.png',
      },
      app_metadata: {
        provider: 'google',
      },
    } as any;

    const mapped = mapSupabaseUserToAuthUser(sbUser);
    expect(mapped).not.toBeNull();
    expect(mapped?.id).toBe('usr_123');
    expect(mapped?.uid).toBe('usr_123');
    expect(mapped?.email).toBe('test@stockhometh.online');
    expect(mapped?.displayName).toBe('Investor Thai');
    expect(mapped?.photoURL).toBe('https://example.com/avatar.png');
    expect(mapped?.providerData[0].providerId).toBe('google.com');
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

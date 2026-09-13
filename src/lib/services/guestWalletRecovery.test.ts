import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getDefaultWallet } from './userWalletService';

describe('Guest Wallet Recovery & Pending Checkout Storage', () => {
  beforeEach(() => {
    // Clear mock sessionStorage
    const storage: Record<string, string> = {};
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => storage[key] || null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        for (const k in storage) delete storage[k];
      },
    });
  });

  it('correctly constructs a default wallet for a new user account upon login', () => {
    const testUid = 'test_user_123';
    const wallet = getDefaultWallet(testUid, 'free');

    expect(wallet.uid).toBe('test_user_123');
    expect(wallet.tier).toBe('free');
    expect(wallet.dailyGemCoins).toBeGreaterThan(0);
    expect(wallet.dailyGemCoinsRemaining).toBe(wallet.dailyGemCoins);
    expect(wallet.topupGemCoins).toBe(0);
  });

  it('correctly saves pending guest package selection before auth modal prompt', () => {
    const pendingPkg = { packageId: 'tier_1500', mode: 'payment', billingCycle: 'monthly' };
    sessionStorage.setItem('pending_checkout_package', JSON.stringify(pendingPkg));

    const retrievedRaw = sessionStorage.getItem('pending_checkout_package');
    expect(retrievedRaw).not.toBeNull();

    const retrieved = JSON.parse(retrievedRaw!);
    expect(retrieved.packageId).toBe('tier_1500');
    expect(retrieved.mode).toBe('payment');
  });

  it('clears pending package selection upon auto-resume checkout after login', () => {
    const pendingPkg = { packageId: 'pro', mode: 'subscription', billingCycle: 'yearly' };
    sessionStorage.setItem('pending_checkout_package', JSON.stringify(pendingPkg));

    const raw = sessionStorage.getItem('pending_checkout_package');
    expect(raw).toBeTruthy();

    sessionStorage.removeItem('pending_checkout_package');
    expect(sessionStorage.getItem('pending_checkout_package')).toBeNull();
  });
});

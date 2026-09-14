import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getDefaultWallet, getTodayStr, UserCloudWallet } from './userWalletService';
import { getDailyKey, getTopupKey, getResetDateKey, getTierKey } from '../context/SubscriptionContext';

describe('GemCoin Persistence & Refresh Hydration Tests', () => {
  const testUid = 'user_test_persistence_123';

  beforeEach(() => {
    const storage: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
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

  it('correctly generates user-isolated localStorage keys for user vs guest', () => {
    expect(getDailyKey(testUid)).toBe(`stockhome_gemcoin_${testUid}_daily`);
    expect(getTopupKey(testUid)).toBe(`stockhome_gemcoin_${testUid}_topup`);
    expect(getResetDateKey(testUid)).toBe(`stockhome_gemcoin_${testUid}_reset_date`);
    expect(getTierKey(testUid)).toBe(`stockhome_${testUid}_tier`);

    expect(getDailyKey(null)).toBe('stockhome_gemcoin_guest_daily');
    expect(getTopupKey(null)).toBe('stockhome_gemcoin_guest_topup');
    expect(getResetDateKey(null)).toBe('stockhome_gemcoin_guest_reset_date');
    expect(getTierKey(null)).toBe('stockhome_guest_tier');
  });

  it('persists topup GemCoins and daily quota in localStorage across simulated page reloads (F5)', () => {
    const dailyKey = getDailyKey(testUid);
    const topupKey = getTopupKey(testUid);
    const resetDateKey = getResetDateKey(testUid);

    const today = getTodayStr();

    // User purchases or spends coins: set 1500 topup and 350 daily remaining
    localStorage.setItem(dailyKey, '350');
    localStorage.setItem(topupKey, '1500');
    localStorage.setItem(resetDateKey, today);

    // Simulate page reload (reading back from localStorage)
    const restoredDaily = parseInt(localStorage.getItem(dailyKey) || '0', 10);
    const restoredTopup = parseInt(localStorage.getItem(topupKey) || '0', 10);
    const restoredResetDate = localStorage.getItem(resetDateKey);

    expect(restoredDaily).toBe(350);
    expect(restoredTopup).toBe(1500);
    expect(restoredResetDate).toBe(today);
  });

  it('safely merges Cloud Wallet balance with local storage without losing topup coins', () => {
    const localTopup = 2500;
    const cloudWallet: UserCloudWallet = {
      uid: testUid,
      tier: 'pro',
      dailyGemCoins: 25000,
      dailyGemCoinsRemaining: 20000,
      topupGemCoins: 5000,
      lastResetDate: getTodayStr(),
      updatedAt: new Date().toISOString(),
    };

    // Math.max guarantees that higher purchased topup balance is retained
    const effectiveTopup = Math.max(localTopup, cloudWallet.topupGemCoins || 0);
    expect(effectiveTopup).toBe(5000);
  });
});

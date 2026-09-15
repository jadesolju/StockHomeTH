import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseClient';
import { SubscriptionTier, GemCoinLogEntry } from '../context/SubscriptionContext';
import { GEMCOIN_SUBSCRIPTION_TIERS } from '../../config/gemCoinPackages';

export interface UserCloudWallet {
  uid: string;
  tier: SubscriptionTier;
  dailyGemCoins: number;
  dailyGemCoinsRemaining: number;
  topupGemCoins: number;
  lastResetDate: string;
  updatedAt: string;
}

export function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function fetchServerWallet(uid: string): Promise<UserCloudWallet | null> {
  if (!uid) return null;
  try {
    const res = await fetch(`/api/user/wallet?uid=${encodeURIComponent(uid.trim())}`, {
      cache: 'no-store',
    });
    const data = await res.json();
    if (data.success && data.wallet) {
      return data.wallet as UserCloudWallet;
    }
  } catch (err) {
    console.warn('[UserWalletService] fetchServerWallet error:', err);
  }
  return null;
}

export async function syncServerWallet(
  uid: string,
  updates: { action: 'deduct' | 'credit' | 'setTier' | 'sync'; amount?: number; newDaily?: number; newTopup?: number; tier?: SubscriptionTier }
): Promise<UserCloudWallet | null> {
  if (!uid) return null;
  try {
    const res = await fetch('/api/user/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: uid.trim(), ...updates }),
    });
    const data = await res.json();
    if (data.success && data.wallet) {
      return data.wallet as UserCloudWallet;
    }
  } catch (err) {
    console.warn('[UserWalletService] syncServerWallet error:', err);
  }
  return null;
}

export async function fetchServerTransactions(uid: string): Promise<GemCoinLogEntry[]> {
  if (!uid || typeof window === 'undefined' || !window.location?.origin) return [];
  try {
    const res = await fetch(`/api/user/wallet/transactions?uid=${encodeURIComponent(uid.trim())}`, {
      cache: 'no-store',
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.transactions)) {
      return data.transactions as GemCoinLogEntry[];
    }
  } catch (err) {
    console.warn('[UserWalletService] fetchServerTransactions error:', err);
  }
  return [];
}

export async function recordCloudTransaction(
  uid: string,
  entry: GemCoinLogEntry
): Promise<void> {
  if (!uid) return;
  const cleanUid = uid.trim();

  // 1. Post to Server API
  if (typeof window !== 'undefined' && window.location?.origin) {
    fetch('/api/user/wallet/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: cleanUid, transaction: entry }),
    }).catch((err) => {
      console.warn('[UserWalletService] Failed to post server transaction:', err);
    });
  }

  // 2. Persist to Firestore
  if (db) {
    try {
      const txRef = doc(db, 'users', cleanUid, 'wallet_transactions', entry.id);
      await setDoc(txRef, entry, { merge: true });
    } catch (err) {
      console.warn('[UserWalletService] Firestore transaction save error:', err);
    }
  }
}

export async function syncBulkTransactions(
  uid: string,
  entries: GemCoinLogEntry[]
): Promise<void> {
  if (!uid || entries.length === 0) return;
  const cleanUid = uid.trim();

  if (typeof window !== 'undefined' && window.location?.origin) {
    fetch('/api/user/wallet/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: cleanUid, transactions: entries }),
    }).catch(() => {});
  }
}

export function getDefaultWallet(uid: string, tier: SubscriptionTier = 'free'): UserCloudWallet {
  const tierInfo =
    GEMCOIN_SUBSCRIPTION_TIERS.find((t) => t.tier === tier) ||
    GEMCOIN_SUBSCRIPTION_TIERS[0];

  return {
    uid,
    tier,
    dailyGemCoins: tierInfo.dailyGemCoins,
    dailyGemCoinsRemaining: tierInfo.dailyGemCoins,
    topupGemCoins: 0,
    lastResetDate: getTodayStr(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Real-time Firestore Cloud Wallet listener.
 * Automatically synchronizes GemCoins across all devices (PC, Mobile, Tablet) when user is logged in.
 */
export function subscribeToCloudWallet(
  uid: string,
  onUpdate: (wallet: UserCloudWallet) => void
): () => void {
  if (!uid || !db) return () => {};

  try {
    const walletRef = doc(db, 'users', uid.trim(), 'wallet', 'balance');
    const unsubscribe = onSnapshot(
      walletRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserCloudWallet;
          // Check for midnight daily reset
          const today = getTodayStr();
          if (data.lastResetDate !== today) {
            const tierInfo =
              GEMCOIN_SUBSCRIPTION_TIERS.find((t) => t.tier === data.tier) ||
              GEMCOIN_SUBSCRIPTION_TIERS[0];

            const resetWallet: UserCloudWallet = {
              ...data,
              dailyGemCoins: tierInfo.dailyGemCoins,
              dailyGemCoinsRemaining: tierInfo.dailyGemCoins,
              topupGemCoins: data.topupGemCoins || 0,
              lastResetDate: today,
              updatedAt: new Date().toISOString(),
            };
            setDoc(walletRef, resetWallet, { merge: true }).catch(() => {});
            onUpdate(resetWallet);
          } else {
            onUpdate(data);
          }
        } else {
          // Initialize new cloud wallet record
          const initial = getDefaultWallet(uid);
          setDoc(walletRef, initial, { merge: true }).catch(() => {});
          onUpdate(initial);
        }
      },
      (err) => {
        console.warn('[CloudWallet] onSnapshot listener warning:', err);
      }
    );

    return () => unsubscribe();
  } catch (err) {
    console.warn('[CloudWallet] Subscription error:', err);
    return () => {};
  }
}

/**
 * Deducts coins directly on Firestore Cloud.
 */
export async function deductCloudCoins(
  uid: string,
  amount: number,
  modelName: string,
  summary?: string
): Promise<{ success: boolean; newDaily: number; newTopup: number }> {
  if (!uid || !db || amount <= 0) return { success: false, newDaily: 0, newTopup: 0 };

  try {
    const walletRef = doc(db, 'users', uid.trim(), 'wallet', 'balance');
    const snap = await getDoc(walletRef);
    const data: UserCloudWallet = snap.exists()
      ? (snap.data() as UserCloudWallet)
      : getDefaultWallet(uid);

    let { dailyGemCoinsRemaining, topupGemCoins } = data;
    let deductFromDaily = Math.min(dailyGemCoinsRemaining, amount);
    let remainingToDeduct = amount - deductFromDaily;
    let deductFromTopup = Math.min(topupGemCoins, remainingToDeduct);

    dailyGemCoinsRemaining = Math.max(0, dailyGemCoinsRemaining - deductFromDaily);
    topupGemCoins = Math.max(0, topupGemCoins - deductFromTopup);

    const updated: Partial<UserCloudWallet> = {
      dailyGemCoinsRemaining,
      topupGemCoins,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(walletRef, updated, { merge: true });

    return {
      success: true,
      newDaily: dailyGemCoinsRemaining,
      newTopup: topupGemCoins,
    };
  } catch (err) {
    console.error('[CloudWallet] Deduct error:', err);
    return { success: false, newDaily: 0, newTopup: 0 };
  }
}

/**
 * Credits topup coins on Firestore Cloud.
 */
export async function creditCloudTopupCoins(
  uid: string,
  amount: number
): Promise<{ success: boolean; newTopup: number }> {
  if (!uid || !db || amount <= 0) return { success: false, newTopup: 0 };

  try {
    const walletRef = doc(db, 'users', uid.trim(), 'wallet', 'balance');
    const snap = await getDoc(walletRef);
    const data: UserCloudWallet = snap.exists()
      ? (snap.data() as UserCloudWallet)
      : getDefaultWallet(uid);

    const updatedTopup = (data.topupGemCoins || 0) + amount;

    await setDoc(
      walletRef,
      {
        topupGemCoins: updatedTopup,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return { success: true, newTopup: updatedTopup };
  } catch (err) {
    console.error('[CloudWallet] Credit error:', err);
    return { success: false, newTopup: 0 };
  }
}

/**
 * Updates user subscription tier on Firestore Cloud.
 */
export async function updateCloudTier(
  uid: string,
  tier: SubscriptionTier
): Promise<void> {
  if (!uid || !db) return;

  try {
    const tierInfo =
      GEMCOIN_SUBSCRIPTION_TIERS.find((t) => t.tier === tier) ||
      GEMCOIN_SUBSCRIPTION_TIERS[0];

    const walletRef = doc(db, 'users', uid.trim(), 'wallet', 'balance');
    await setDoc(
      walletRef,
      {
        tier,
        dailyGemCoins: tierInfo.dailyGemCoins,
        dailyGemCoinsRemaining: tierInfo.dailyGemCoins,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('[CloudWallet] Tier update error:', err);
  }
}

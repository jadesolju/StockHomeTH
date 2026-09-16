/**
 * User Wallet Service (Supabase PostgreSQL + Realtime Sync)
 * Manages GemCoins, Subscription Quotas, and Transaction Records backed by Supabase PostgreSQL.
 */

import { supabase } from '../supabase/client';
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
  updates: {
    action: 'deduct' | 'credit' | 'setTier' | 'sync';
    amount?: number;
    newDaily?: number;
    newTopup?: number;
    tier?: SubscriptionTier;
    model?: string;
    summary?: string;
  }
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

  // 2. Persist to Supabase if authenticated client is available
  try {
    Promise.resolve(
      supabase
        .from('user_wallet_transactions')
        .upsert({
          id: entry.id,
          user_id: cleanUid,
          type: 'deduct',
          amount: entry.gemCoinsUsed,
          model_name: entry.model || 'StockHome AI',
          summary: entry.summary || '',
          created_at: new Date(entry.timestamp).toISOString(),
        })
    ).catch(() => {});
  } catch (err) {
    console.warn('[UserWalletService] Supabase transaction save error:', err);
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

/**
 * Real-time Supabase Cloud Wallet listener.
 * Automatically synchronizes GemCoins across all devices (PC, Mobile, Tablet) when user is logged in.
 */
export function subscribeToCloudWallet(
  uid: string,
  onUpdate: (wallet: UserCloudWallet) => void
): () => void {
  if (!uid) return () => {};
  const cleanUid = uid.trim();

  try {
    // 1. Initial fetch from Server API
    fetchServerWallet(cleanUid).then((w) => {
      if (w) onUpdate(w);
    }).catch(() => {});

    // 2. Supabase Realtime Channel
    const channelName = `wallet-sync-${cleanUid}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_wallets',
          filter: `user_id=eq.${cleanUid}`,
        },
        (payload) => {
          if (payload.new) {
            const row = payload.new as any;
            const updatedWallet: UserCloudWallet = {
              uid: row.user_id,
              tier: (row.tier as SubscriptionTier) || 'free',
              dailyGemCoins: Number(row.daily_gem_coins) || 500,
              dailyGemCoinsRemaining: Number(row.daily_gem_coins_remaining) || 0,
              topupGemCoins: Number(row.topup_gem_coins) || 0,
              lastResetDate: row.last_reset_date || getTodayStr(),
              updatedAt: row.updated_at || new Date().toISOString(),
            };
            onUpdate(updatedWallet);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel).catch(() => {});
    };
  } catch (err) {
    console.warn('[UserWalletService] Subscription error:', err);
    return () => {};
  }
}

/**
 * Deducts coins directly on Supabase Cloud.
 */
export async function deductCloudCoins(
  uid: string,
  amount: number,
  modelName: string,
  summary?: string
): Promise<{ success: boolean; newDaily: number; newTopup: number }> {
  if (!uid || amount <= 0) return { success: false, newDaily: 0, newTopup: 0 };

  try {
    const updated = await syncServerWallet(uid, {
      action: 'deduct',
      amount,
      model: modelName,
      summary,
    });

    if (updated) {
      return {
        success: true,
        newDaily: updated.dailyGemCoinsRemaining,
        newTopup: updated.topupGemCoins,
      };
    }
  } catch (err) {
    console.error('[UserWalletService] Deduct error:', err);
  }
  return { success: false, newDaily: 0, newTopup: 0 };
}

/**
 * Credits topup coins on Supabase Cloud.
 */
export async function creditCloudTopupCoins(
  uid: string,
  amount: number
): Promise<{ success: boolean; newTopup: number }> {
  if (!uid || amount <= 0) return { success: false, newTopup: 0 };

  try {
    const updated = await syncServerWallet(uid, {
      action: 'credit',
      amount,
    });

    if (updated) {
      return { success: true, newTopup: updated.topupGemCoins };
    }
  } catch (err) {
    console.error('[UserWalletService] Credit error:', err);
  }
  return { success: false, newTopup: 0 };
}

/**
 * Updates user subscription tier on Supabase Cloud.
 */
export async function updateCloudTier(
  uid: string,
  tier: SubscriptionTier
): Promise<void> {
  if (!uid) return;

  try {
    await syncServerWallet(uid, {
      action: 'setTier',
      tier,
    });
  } catch (err) {
    console.error('[UserWalletService] Tier update error:', err);
  }
}

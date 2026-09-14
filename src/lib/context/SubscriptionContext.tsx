'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PRICING_PLANS, PricingPlan } from '../../config/pricingPlans';
import {
  GEMCOIN_SUBSCRIPTION_TIERS,
  GemCoinSubscriptionTierInfo,
} from '../../config/gemCoinPackages';
import { useClientAuth } from './ClientAuthContext';
import { supabase } from '../supabase/client';
import {
  subscribeToCloudWallet,
  deductCloudCoins,
  creditCloudTopupCoins,
  updateCloudTier,
  getTodayStr,
  fetchServerWallet,
  syncServerWallet,
} from '../services/userWalletService';

export type SubscriptionTier = 'free' | 'lite' | 'pro' | 'vip' | 'whale' | 'dev';
export type BillingCycle = 'monthly' | 'yearly';

export const OWNER_DEV_IDENTIFIERS = {
  emails: ['afillly002@gmail.com'],
  firebaseUids: ['EJCisrn5JzWcsgYUgG6k6DtYWhw2'],
  supabaseUids: ['addf5ae4-db55-4a32-8f67-b622ee02cc98'],
};

export interface GemCoinLogEntry {
  id: string;
  timestamp: string;
  model: string;
  gemCoinsUsed: number;
  source: 'daily' | 'topup';
  summary?: string;
}

interface SubscriptionContextType {
  currentPlan: SubscriptionPlan;
  currentTier: SubscriptionTier;
  billingCycle: BillingCycle;
  isPricingModalOpen: boolean;
  openPricingModal: () => void;
  closePricingModal: () => void;
  setTier: (tier: SubscriptionTier) => void;
  setBillingCycle: (cycle: BillingCycle) => void;
  canUseAiOnDemand: () => boolean;
  canSetLineAlerts: () => boolean;
  canExportData: () => boolean;
  getWatchlistLimit: () => number;
  aiUsageToday: number;
  incrementAiUsage: (newCount?: number) => void;
  resetAiUsage: () => void;
  isProOrAbove: boolean;
  isVip: boolean;
  isOwnerOrDev: boolean;
  isOwnerAccount: boolean;
  isGuest: boolean;
  restoreOwnerGodMode: () => void;

  // GemCoin Economy
  dailyGemCoins: number;
  dailyGemCoinsRemaining: number;
  topupGemCoins: number;
  totalGemCoinsAvailable: number;
  gemCoinLogs: GemCoinLogEntry[];
  isGemCoinModalOpen: boolean;
  gemCoinModalInitialTab: 'topup' | 'plans' | 'redeem' | 'logs';
  openGemCoinModal: (initialTab?: 'topup' | 'plans' | 'redeem' | 'logs') => void;
  closeGemCoinModal: () => void;
  deductGemCoins: (amount: number, model: string, summary?: string) => boolean;
  refundGemCoins: (amount: number, reason?: string) => void;
  topupGemCoinsDirect: (amount: number, packageName: string) => void;
  redeemPromoCode: (
    code: string
  ) => Promise<{ success: boolean; message: string; gemCoinsAdded?: number }>;
  currentTierInfo: GemCoinSubscriptionTierInfo;
}

export interface SubscriptionPlan extends PricingPlan {
  status: 'active' | 'trial' | 'expired';
  expiresAt?: string;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const STORAGE_KEY = 'stockhome_local_subscription_tier';
const AI_USAGE_KEY = 'stockhome_local_ai_usage_count';
const AI_RESET_DATE_KEY = 'stockhome_local_ai_reset_date';

// Scoped GemCoin Storage Key Helpers (Strictly isolated by user UID)
export const getDailyKey = (uid?: string | null) =>
  uid && uid.trim() ? `stockhome_gemcoin_${uid.trim()}_daily` : 'stockhome_gemcoin_guest_daily';
export const getTopupKey = (uid?: string | null) =>
  uid && uid.trim() ? `stockhome_gemcoin_${uid.trim()}_topup` : 'stockhome_gemcoin_guest_topup';
export const getLogsKey = (uid?: string | null) =>
  uid && uid.trim() ? `stockhome_gemcoin_${uid.trim()}_logs` : 'stockhome_gemcoin_guest_logs';
export const getTierKey = (uid?: string | null) =>
  uid && uid.trim() ? `stockhome_${uid.trim()}_tier` : 'stockhome_guest_tier';
export const getResetDateKey = (uid?: string | null) =>
  uid && uid.trim() ? `stockhome_gemcoin_${uid.trim()}_reset_date` : 'stockhome_gemcoin_guest_reset_date';

export { purgeDevStorage } from '../utils/authStorage';
import { purgeDevStorage } from '../utils/authStorage';

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useClientAuth();
  const [currentTier, setCurrentTierState] = useState<SubscriptionTier>('free');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [isPricingModalOpen, setIsPricingModalOpen] = useState<boolean>(false);
  const [aiUsageToday, setAiUsageToday] = useState<number>(0);

  // GemCoin States
  const [dailyGemCoinsRemaining, setDailyGemCoinsRemaining] = useState<number>(500);
  const [topupGemCoins, setTopupGemCoins] = useState<number>(0);
  const [gemCoinLogs, setGemCoinLogs] = useState<GemCoinLogEntry[]>([]);
  const [isGemCoinModalOpen, setIsGemCoinModalOpen] = useState<boolean>(false);
  const [gemCoinModalInitialTab, setGemCoinModalInitialTab] = useState<
    'topup' | 'plans' | 'redeem' | 'logs'
  >('topup');
  const [userId, setUserId] = useState<string>('guest');

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const currentTierInfo =
    GEMCOIN_SUBSCRIPTION_TIERS.find((t) => t.tier === currentTier) ||
    GEMCOIN_SUBSCRIPTION_TIERS[0];
  const dailyGemCoins = currentTierInfo.dailyGemCoins;

  const [isSupabaseOwner, setIsSupabaseOwner] = useState<boolean>(false);

  // Check Supabase Auth session for owner credentials
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const sbUser = data?.session?.user;
      if (
        sbUser &&
        (OWNER_DEV_IDENTIFIERS.emails.includes(sbUser.email?.toLowerCase().trim() ?? '') ||
          OWNER_DEV_IDENTIFIERS.supabaseUids.includes(sbUser.id))
      ) {
        setIsSupabaseOwner(true);
      } else {
        setIsSupabaseOwner(false);
      }
    }).catch(() => {
      setIsSupabaseOwner(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sbUser = session?.user;
      if (
        sbUser &&
        (OWNER_DEV_IDENTIFIERS.emails.includes(sbUser.email?.toLowerCase().trim() ?? '') ||
          OWNER_DEV_IDENTIFIERS.supabaseUids.includes(sbUser.id))
      ) {
        setIsSupabaseOwner(true);
      } else {
        setIsSupabaseOwner(false);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const isFirebaseOwner = Boolean(
    user &&
      (OWNER_DEV_IDENTIFIERS.emails.includes(user.email?.toLowerCase().trim() ?? '') ||
        OWNER_DEV_IDENTIFIERS.firebaseUids.includes(user.uid))
  );

  const isOwnerAccount = isFirebaseOwner || isSupabaseOwner;

  const restoreOwnerGodMode = useCallback(() => {
    setCurrentTierState('dev');
    setTopupGemCoins(99999999);
    setDailyGemCoinsRemaining(10000000);
    // Keep God Mode strictly in React memory while authenticated as owner.
    // Intentionally DO NOT write 'dev' or 99999999 to permanent localStorage
    // so that when logged out, localStorage remains 100% clean and free of rogue dev tokens.
  }, []);

  // Synchronize tier with ownership status & immediately purge dev privileges upon logout
  useEffect(() => {
    // Always purge legacy global keys so rogue balances never leak across accounts
    try {
      localStorage.removeItem('stockhome_gemcoin_topup_balance');
      localStorage.removeItem('stockhome_gemcoin_daily_remaining');
      localStorage.removeItem('stockhome_gemcoin_logs');
      localStorage.removeItem('stockhome_local_subscription_tier');
      localStorage.removeItem('stockhome_local_ai_reset_date');
      localStorage.removeItem('stockhome_local_ai_usage_count');
    } catch {}

    if (isOwnerAccount) {
      restoreOwnerGodMode();
    } else {
      setCurrentTierState((prev) => (prev === 'dev' ? 'free' : prev));
      purgeDevStorage();
    }
  }, [isOwnerAccount, restoreOwnerGodMode]);

  // Real-time Cloud Wallet synchronization across devices (PC ↔ Mobile) via Firestore
  useEffect(() => {
    if (!user?.uid || isOwnerAccount) return;
    const currentUid = user.uid.trim();
    const unsubscribe = subscribeToCloudWallet(currentUid, (cloudWallet) => {
      if (cloudWallet.tier && !isOwnerAccount && cloudWallet.tier !== 'dev') {
        setCurrentTierState(cloudWallet.tier);
      }
      setDailyGemCoinsRemaining(cloudWallet.dailyGemCoinsRemaining);
      setTopupGemCoins(cloudWallet.topupGemCoins);
      try {
        localStorage.setItem(getDailyKey(currentUid), cloudWallet.dailyGemCoinsRemaining.toString());
        localStorage.setItem(getTopupKey(currentUid), cloudWallet.topupGemCoins.toString());
        localStorage.setItem(getResetDateKey(currentUid), cloudWallet.lastResetDate || getTodayStr());
      } catch {}
    });
    return () => unsubscribe();
  }, [user?.uid, isOwnerAccount]);

  // Account-Scoped Hydration: runs whenever active user changes or page mounts
  useEffect(() => {
    try {
      // Clean up legacy random device ID key if present
      localStorage.removeItem('stockhome_device_user_id');

      // If Owner: handled in restoreOwnerGodMode
      if (isOwnerAccount) {
        setUserId(user?.uid?.trim() || 'owner');
        restoreOwnerGodMode();
        return;
      }

      // If Guest (not logged in): use unified guest wallet key
      if (!user) {
        setUserId('guest');
        const guestUid = 'guest';
        const guestDailyKey = getDailyKey(guestUid);
        const guestTopupKey = getTopupKey(guestUid);
        const guestResetDateKey = getResetDateKey(guestUid);
        const guestLogsKey = getLogsKey(guestUid);

        setCurrentTierState('free');
        const today = getTodayStr();
        const savedResetDate = localStorage.getItem(guestResetDateKey);
        const savedDaily = localStorage.getItem(guestDailyKey);
        const savedTopup = localStorage.getItem(guestTopupKey);

        let activeDaily = 500;
        let activeTopup = 0;

        if (savedResetDate !== today) {
          activeDaily = 500;
          activeTopup = savedTopup !== null ? parseInt(savedTopup, 10) || 0 : 0;
          localStorage.setItem(guestDailyKey, activeDaily.toString());
          localStorage.setItem(guestTopupKey, activeTopup.toString());
          localStorage.setItem(guestResetDateKey, today);
        } else {
          activeDaily = savedDaily !== null ? parseInt(savedDaily, 10) || 0 : 500;
          activeTopup = savedTopup !== null ? parseInt(savedTopup, 10) || 0 : 0;
        }

        setDailyGemCoinsRemaining(activeDaily);
        setTopupGemCoins(activeTopup);

        const savedLogs = localStorage.getItem(guestLogsKey);
        if (savedLogs) {
          try {
            setGemCoinLogs(JSON.parse(savedLogs));
          } catch {
            setGemCoinLogs([]);
          }
        } else {
          setGemCoinLogs([]);
        }
        return;
      }

      // Logged in User: load scoped data for this UID
      const currentUid = user.uid.trim();
      setUserId(currentUid);
      const dailyKey = getDailyKey(currentUid);
      const topupKey = getTopupKey(currentUid);
      const resetDateKey = getResetDateKey(currentUid);
      const tierKey = getTierKey(currentUid);
      const logsKey = getLogsKey(currentUid);

      const savedTier = (localStorage.getItem(tierKey) as SubscriptionTier) || 'free';
      const effectiveTier = ['free', 'lite', 'pro', 'vip', 'whale'].includes(savedTier) ? savedTier : 'free';
      setCurrentTierState(effectiveTier);

      const tierInfo =
        GEMCOIN_SUBSCRIPTION_TIERS.find((t) => t.tier === effectiveTier) ||
        GEMCOIN_SUBSCRIPTION_TIERS[0];

      const today = getTodayStr();
      const savedResetDate = localStorage.getItem(resetDateKey);
      const savedDaily = localStorage.getItem(dailyKey);
      const savedTopup = localStorage.getItem(topupKey);

      let activeDaily = tierInfo.dailyGemCoins;
      let activeTopup = 0;

      if (savedResetDate !== today) {
        // Midnight daily reset! Reset daily free quota to tier amount, keep top-up intact
        activeDaily = tierInfo.dailyGemCoins;
        activeTopup = savedTopup !== null ? parseInt(savedTopup, 10) || 0 : 0;
        localStorage.setItem(dailyKey, activeDaily.toString());
        localStorage.setItem(topupKey, activeTopup.toString());
        localStorage.setItem(resetDateKey, today);
      } else {
        activeDaily = savedDaily !== null ? parseInt(savedDaily, 10) || 0 : tierInfo.dailyGemCoins;
        activeTopup = savedTopup !== null ? parseInt(savedTopup, 10) || 0 : 0;
      }

      // Migrate any guest topup balance or promo redemptions to user account
      const guestTopupRaw = localStorage.getItem(getTopupKey('guest'));
      if (guestTopupRaw) {
        const guestTopupVal = parseInt(guestTopupRaw, 10) || 0;
        if (guestTopupVal > 0) {
          activeTopup += guestTopupVal;
          localStorage.setItem(topupKey, activeTopup.toString());
          localStorage.removeItem(getTopupKey('guest'));
          syncServerWallet(currentUid, { action: 'sync', newDaily: activeDaily, newTopup: activeTopup }).catch(() => {});
        }
      }

      setDailyGemCoinsRemaining(activeDaily);
      setTopupGemCoins(activeTopup);

      // Load scoped logs and merge guest logs if present
      let mergedLogs: GemCoinLogEntry[] = [];
      const savedLogs = localStorage.getItem(logsKey);
      if (savedLogs) {
        try {
          mergedLogs = JSON.parse(savedLogs);
        } catch {
          mergedLogs = [];
        }
      }

      const guestLogsRaw = localStorage.getItem(getLogsKey('guest'));
      if (guestLogsRaw) {
        try {
          const guestLogs = JSON.parse(guestLogsRaw);
          if (Array.isArray(guestLogs) && guestLogs.length > 0) {
            mergedLogs = [...guestLogs, ...mergedLogs].slice(0, 100);
            localStorage.setItem(logsKey, JSON.stringify(mergedLogs));
            localStorage.removeItem(getLogsKey('guest'));
          }
        } catch {}
      }

      setGemCoinLogs(mergedLogs);

      // Sync with server wallet API in background without wiping locally spent balance
      fetchServerWallet(currentUid).then((serverWallet) => {
        if (serverWallet && !isOwnerAccount) {
          if (serverWallet.lastResetDate === today) {
            // Guard: Take lower remaining daily balance so a rebooted serverless instance cannot erase today's usage back to 500
            const effectiveDaily = (activeDaily < tierInfo.dailyGemCoins && serverWallet.dailyGemCoinsRemaining === tierInfo.dailyGemCoins)
              ? activeDaily
              : Math.min(serverWallet.dailyGemCoinsRemaining, activeDaily);

            const effectiveTopup = Math.max(serverWallet.topupGemCoins, activeTopup);

            setDailyGemCoinsRemaining(effectiveDaily);
            setTopupGemCoins(effectiveTopup);

            if (serverWallet.tier && serverWallet.tier !== 'dev') {
              setCurrentTierState(serverWallet.tier as SubscriptionTier);
            }
            try {
              localStorage.setItem(dailyKey, effectiveDaily.toString());
              localStorage.setItem(topupKey, effectiveTopup.toString());
              localStorage.setItem(resetDateKey, today);
              if (serverWallet.tier) localStorage.setItem(tierKey, serverWallet.tier);
            } catch {}

            if (effectiveDaily !== serverWallet.dailyGemCoinsRemaining) {
              syncServerWallet(currentUid, {
                action: 'sync',
                newDaily: effectiveDaily,
                newTopup: effectiveTopup,
              }).catch(() => {});
            }
          }
        }
      }).catch(() => {});
    } catch (err) {
      console.warn('[SubscriptionContext] User hydration error:', err);
    }
  }, [user, isOwnerAccount, restoreOwnerGodMode]);

  // Auto-claim any pending GemCoin airdrops sent to user's email by Admin
  useEffect(() => {
    if (!user?.email || !user?.uid) return;
    const currentUid = user.uid.trim();
    const checkAirdrops = async () => {
      try {
        const res = await fetch('/api/gemcoin/airdrop/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, userId: currentUid }),
        });
        const data = await res.json();
        if (data.success && data.totalGemCoins > 0) {
          const added = Number(data.totalGemCoins);
          setTopupGemCoins((prev) => {
            const updated = prev + added;
            try {
              localStorage.setItem(getTopupKey(currentUid), updated.toString());
            } catch {}
            return updated;
          });

          const logEntry: GemCoinLogEntry = {
            id: 'airdrop_' + Date.now(),
            timestamp: new Date().toISOString(),
            model: 'Admin Gift',
            gemCoinsUsed: 0,
            source: 'topup',
            summary: `🎁 ได้รับของขวัญ GemCoins จาก Admin (+${added.toLocaleString()} GemCoins)`,
          };

          setGemCoinLogs((prev) => {
            const updated = [logEntry, ...prev.slice(0, 49)];
            try {
              localStorage.setItem(getLogsKey(currentUid), JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
      } catch {}
    };

    checkAirdrops();
  }, [user?.email, user?.uid]);

  // Save changes to Tier
  const setTier = useCallback(
    (tier: SubscriptionTier) => {
      if (tier === 'dev' && !isOwnerAccount) {
        console.warn('Unauthorized attempt to set dev tier');
        return;
      }
      setCurrentTierState(tier);
      const currentUid = user?.uid?.trim();
      if (currentUid) {
        try {
          localStorage.setItem(getTierKey(currentUid), tier);
        } catch {}
        updateCloudTier(currentUid, tier).catch(() => {});
        syncServerWallet(currentUid, { action: 'setTier', tier }).catch(() => {});
      }
      try {
        if (tier === 'dev') {
          // Keep dev in-memory only for owner, do not write dev tokens to localStorage!
          setTopupGemCoins(99999999);
          setDailyGemCoinsRemaining(10000000);
        } else {
          const tierInfo =
            GEMCOIN_SUBSCRIPTION_TIERS.find((t) => t.tier === tier) ||
            GEMCOIN_SUBSCRIPTION_TIERS[0];

          // If user upgrades, immediately grant permanent topup bonus!
          if (tierInfo.permanentTopupBonus > 0) {
            setTopupGemCoins((prev) => {
              const updated = prev + tierInfo.permanentTopupBonus;
              if (currentUid) {
                try {
                  localStorage.setItem(getTopupKey(currentUid), updated.toString());
                } catch {}
              }
              return updated;
            });
          }

          // Adjust daily remaining if lower than new tier's quota
          setDailyGemCoinsRemaining((prev) => {
            const updated = Math.max(prev, tierInfo.dailyGemCoins);
            if (currentUid) {
              try {
                localStorage.setItem(getDailyKey(currentUid), updated.toString());
              } catch {}
            }
            return updated;
          });
        }
      } catch {}
    },
    [user?.uid, isOwnerAccount]
  );

  const openPricingModal = useCallback(() => setIsPricingModalOpen(true), []);
  const closePricingModal = useCallback(() => setIsPricingModalOpen(false), []);

  const openGemCoinModal = useCallback(
    (initialTab: 'topup' | 'plans' | 'redeem' | 'logs' = 'topup') => {
      setGemCoinModalInitialTab(initialTab);
      setIsGemCoinModalOpen(true);
    },
    []
  );
  const closeGemCoinModal = useCallback(() => setIsGemCoinModalOpen(false), []);

  // Deduct GemCoins (Deducts from Daily Free first, then from Top-up)
  const deductGemCoins = useCallback(
    (amount: number, model: string, summary?: string): boolean => {
      if (currentTier === 'dev' || isOwnerAccount) {
        const logEntry: GemCoinLogEntry = {
          id: 'log_' + Date.now(),
          timestamp: new Date().toISOString(),
          model,
          gemCoinsUsed: amount,
          source: 'topup',
          summary: summary || '👑 Dev & Owner Unlimited Prompt',
        };
        setGemCoinLogs((prev) => [logEntry, ...prev.slice(0, 49)]);
        return true;
      }

      const totalAvailable = dailyGemCoinsRemaining + topupGemCoins;
      if (totalAvailable < amount) {
        return false;
      }

      let source: 'daily' | 'topup' = 'daily';
      let newDaily = dailyGemCoinsRemaining;
      let newTopup = topupGemCoins;

      if (dailyGemCoinsRemaining >= amount) {
        newDaily = dailyGemCoinsRemaining - amount;
        source = 'daily';
      } else {
        const remainingToDeduct = amount - dailyGemCoinsRemaining;
        newDaily = 0;
        newTopup = topupGemCoins - remainingToDeduct;
        source = 'topup';
      }

      setDailyGemCoinsRemaining(newDaily);
      setTopupGemCoins(newTopup);

      const logEntry: GemCoinLogEntry = {
        id: 'log_' + Date.now(),
        timestamp: new Date().toISOString(),
        model,
        gemCoinsUsed: amount,
        source,
        summary: summary || 'แชทสอบถามการเงินและวิเคราะห์หุ้น',
      };

      const currentUid = user?.uid?.trim() || (userId !== 'guest' ? userId : 'guest');
      const today = getTodayStr();

      try {
        localStorage.setItem(getDailyKey(currentUid), newDaily.toString());
        localStorage.setItem(getTopupKey(currentUid), newTopup.toString());
        localStorage.setItem(getResetDateKey(currentUid), today);
      } catch {}

      if (user?.uid) {
        // Persist immediately to Server Wallet API
        syncServerWallet(user.uid.trim(), {
          action: 'deduct',
          amount,
          newDaily,
          newTopup,
        }).catch(() => {});

        // Sync to Firestore Cloud
        deductCloudCoins(user.uid.trim(), amount, model, summary).catch(() => {});
      }

      setGemCoinLogs((prev) => {
        const updated = [logEntry, ...prev.slice(0, 49)];
        try {
          localStorage.setItem(getLogsKey(currentUid), JSON.stringify(updated));
        } catch {}
        return updated;
      });

      return true;
    },
    [dailyGemCoinsRemaining, topupGemCoins, currentTier, isOwnerAccount, user, userId]
  );

  // Refund GemCoins (e.g. Aborted request or connection error)
  const refundGemCoins = useCallback(
    (amount: number, reason: string = 'ยกเลิกคำขอ') => {
      if (amount <= 0) return;
      const newTopup = topupGemCoins + amount;
      setTopupGemCoins(newTopup);

      const currentUid = user?.uid?.trim();
      if (currentUid) {
        try {
          localStorage.setItem(getTopupKey(currentUid), newTopup.toString());
        } catch {}

        syncServerWallet(currentUid, {
          action: 'credit',
          amount,
          newTopup,
        }).catch(() => {});

        creditCloudTopupCoins(currentUid, amount).catch(() => {});
      }

      const logEntry: GemCoinLogEntry = {
        id: 'refund_' + Date.now(),
        timestamp: new Date().toISOString(),
        model: 'Refund',
        gemCoinsUsed: 0,
        source: 'topup',
        summary: `🔄 คืนเหรียญ (${reason}) +${amount.toLocaleString()} GemCoins`,
      };

      setGemCoinLogs((prev) => {
        const updated = [logEntry, ...prev.slice(0, 49)];
        if (currentUid) {
          try {
            localStorage.setItem(getLogsKey(currentUid), JSON.stringify(updated));
          } catch {}
        }
        return updated;
      });
    },
    [topupGemCoins, user?.uid]
  );

  // Top up GemCoins directly (from store package)
  const topupGemCoinsDirect = useCallback(
    (amount: number, packageName: string) => {
      const newTopup = topupGemCoins + amount;
      setTopupGemCoins(newTopup);

      const currentUid = user?.uid?.trim();
      if (currentUid) {
        try {
          localStorage.setItem(getTopupKey(currentUid), newTopup.toString());
        } catch {}

        syncServerWallet(currentUid, {
          action: 'credit',
          amount,
          newTopup,
        }).catch(() => {});

        creditCloudTopupCoins(currentUid, amount).catch(() => {});
      }

      const logEntry: GemCoinLogEntry = {
        id: 'topup_' + Date.now(),
        timestamp: new Date().toISOString(),
        model: 'Top-up Package',
        gemCoinsUsed: 0,
        source: 'topup',
        summary: `เติมเหรียญแพ็กเกจ "${packageName}" (+${amount.toLocaleString()} GemCoins)`,
      };

      setGemCoinLogs((prev) => {
        const updated = [logEntry, ...prev.slice(0, 49)];
        if (currentUid) {
          try {
            localStorage.setItem(getLogsKey(currentUid), JSON.stringify(updated));
          } catch {}
        }
        return updated;
      });
    },
    [topupGemCoins, user?.uid]
  );

  // Redeem Promo Code via Backend API
  const redeemPromoCode = useCallback(
    async (
      code: string
    ): Promise<{ success: boolean; message: string; gemCoinsAdded?: number }> => {
      try {
        const currentUid = user?.uid?.trim() || (userId !== 'guest' ? userId : 'guest');
        const res = await fetch('/api/gemcoin/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, userId: currentUid }),
        });

        const data = await res.json();
        if (data.success && data.gemCoinsAdded) {
          const added = Number(data.gemCoinsAdded);
          const newTopup = topupGemCoins + added;
          setTopupGemCoins(newTopup);

          if (currentUid) {
            try {
              localStorage.setItem(getTopupKey(currentUid), newTopup.toString());
            } catch {}

            syncServerWallet(currentUid, {
              action: 'credit',
              amount: added,
              newTopup,
            }).catch(() => {});

            creditCloudTopupCoins(currentUid, added).catch(() => {});
          }

          const logEntry: GemCoinLogEntry = {
            id: 'redeem_' + Date.now(),
            timestamp: new Date().toISOString(),
            model: 'Promo Voucher',
            gemCoinsUsed: 0,
            source: 'topup',
            summary: `แลกรับรหัสโปรโมชั่น "${code.toUpperCase()}" (+${added.toLocaleString()} GemCoins)`,
          };

          setGemCoinLogs((prev) => {
            const updated = [logEntry, ...prev.slice(0, 49)];
            if (currentUid) {
              try {
                localStorage.setItem(getLogsKey(currentUid), JSON.stringify(updated));
              } catch {}
            }
            return updated;
          });
        }
        return data;
      } catch (err: any) {
        return { success: false, message: err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้' };
      }
    },
    [topupGemCoins, user?.uid, userId]
  );

  const basePlan =
    PRICING_PLANS.find((p) => p.id === currentTier) || PRICING_PLANS[0];
  const currentPlan: SubscriptionPlan = {
    ...basePlan,
    status: 'active',
    expiresAt: currentTier !== 'free' ? '31 ธ.ค. 2026' : undefined,
  };

  const isProOrAbove =
    currentTier === 'pro' || currentTier === 'vip' || currentTier === 'whale' || currentTier === 'dev';
  const isVip = currentTier === 'vip' || currentTier === 'whale' || currentTier === 'dev';
  const isOwnerOrDev = currentTier === 'dev' || isOwnerAccount;

  const canUseAiOnDemand = useCallback(() => {
    if (currentTier === 'dev' || isOwnerAccount) return true;
    return dailyGemCoinsRemaining + topupGemCoins > 0;
  }, [dailyGemCoinsRemaining, topupGemCoins, currentTier, isOwnerAccount]);

  const canSetLineAlerts = useCallback(() => {
    return currentPlan.limits.lineAlerts;
  }, [currentPlan.limits.lineAlerts]);

  const canExportData = useCallback(() => {
    return currentPlan.limits.exportData;
  }, [currentPlan.limits.exportData]);

  const getWatchlistLimit = useCallback(() => {
    return currentPlan.limits.watchlistLimit;
  }, [currentPlan.limits.watchlistLimit]);

  const incrementAiUsage = useCallback((newCount?: number) => {
    setAiUsageToday((prev) => {
      const today = getTodayStr();
      const updated = typeof newCount === 'number' ? newCount : prev + 1;
      try {
        localStorage.setItem(AI_RESET_DATE_KEY, today);
        localStorage.setItem(AI_USAGE_KEY, updated.toString());
      } catch {}
      return updated;
    });
  }, []);

  const resetAiUsage = useCallback(() => {
    const today = getTodayStr();
    setAiUsageToday(0);
    try {
      localStorage.setItem(AI_RESET_DATE_KEY, today);
      localStorage.setItem(AI_USAGE_KEY, '0');
    } catch {}
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        currentPlan,
        currentTier,
        billingCycle,
        isPricingModalOpen,
        openPricingModal,
        closePricingModal,
        setTier,
        setBillingCycle,
        canUseAiOnDemand,
        canSetLineAlerts,
        canExportData,
        getWatchlistLimit,
        aiUsageToday,
        incrementAiUsage,
        resetAiUsage,
        isProOrAbove,
        isVip,
        isOwnerOrDev,
        isOwnerAccount,
        isGuest: !user && !isOwnerAccount,
        restoreOwnerGodMode,

        // GemCoin Economy
        dailyGemCoins: (!user && !isOwnerAccount) ? 0 : dailyGemCoins,
        dailyGemCoinsRemaining: (!user && !isOwnerAccount) ? 0 : dailyGemCoinsRemaining,
        topupGemCoins: (!user && !isOwnerAccount) ? 0 : topupGemCoins,
        totalGemCoinsAvailable:
          currentTier === 'dev' || isOwnerAccount
            ? 99999999
            : (!user && !isOwnerAccount)
            ? 0
            : dailyGemCoinsRemaining + topupGemCoins,
        gemCoinLogs,
        isGemCoinModalOpen,
        gemCoinModalInitialTab,
        openGemCoinModal,
        closeGemCoinModal,
        deductGemCoins,
        refundGemCoins,
        topupGemCoinsDirect,
        redeemPromoCode,
        currentTierInfo,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

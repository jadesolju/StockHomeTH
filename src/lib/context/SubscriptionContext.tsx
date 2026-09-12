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

// GemCoin Storage Keys
const GEMCOIN_DAILY_KEY = 'stockhome_gemcoin_daily_remaining';
const GEMCOIN_TOPUP_KEY = 'stockhome_gemcoin_topup_balance';
const GEMCOIN_LOGS_KEY = 'stockhome_gemcoin_logs';
const GEMCOIN_USER_ID_KEY = 'stockhome_device_user_id';

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
  const [userId, setUserId] = useState<string>('local_device_user');

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
    try {
      localStorage.setItem(STORAGE_KEY, 'dev');
      localStorage.setItem(GEMCOIN_TOPUP_KEY, '99999999');
      localStorage.setItem(GEMCOIN_DAILY_KEY, '10000000');
    } catch {}
  }, []);

  // Synchronize tier with ownership status & revoke dev privileges upon logout
  useEffect(() => {
    if (isOwnerAccount) {
      try {
        const savedTier = localStorage.getItem(STORAGE_KEY);
        if (!savedTier || savedTier !== 'dev') {
          restoreOwnerGodMode();
        }
      } catch {}
    } else {
      // User is NOT an owner account (either logged out as guest, or normal user)
      // If current tier is 'dev' or localStorage has 'dev' -> Revoke to free!
      try {
        const savedTier = localStorage.getItem(STORAGE_KEY);
        if (currentTier === 'dev' || savedTier === 'dev') {
          setCurrentTierState('free');
          localStorage.setItem(STORAGE_KEY, 'free');
          setDailyGemCoinsRemaining(500);
          setTopupGemCoins(0);
          localStorage.setItem(GEMCOIN_DAILY_KEY, '500');
          localStorage.setItem(GEMCOIN_TOPUP_KEY, '0');
        }
      } catch {}
    }
  }, [isOwnerAccount, currentTier, restoreOwnerGodMode]);

  // Auto-claim any pending GemCoin airdrops sent to user's email by Admin
  useEffect(() => {
    if (!user?.email) return;
    const checkAirdrops = async () => {
      try {
        const res = await fetch('/api/gemcoin/airdrop/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, userId: user.uid }),
        });
        const data = await res.json();
        if (data.success && data.totalGemCoins > 0) {
          const added = Number(data.totalGemCoins);
          setTopupGemCoins((prev) => {
            const updated = prev + added;
            try {
              localStorage.setItem(GEMCOIN_TOPUP_KEY, updated.toString());
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
              localStorage.setItem(GEMCOIN_LOGS_KEY, JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
      } catch {}
    };

    checkAirdrops();
  }, [user?.email, user?.uid]);

  // Real-time Cloud Wallet synchronization across devices (PC ↔ Mobile)
  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = subscribeToCloudWallet(user.uid, (cloudWallet) => {
      if (cloudWallet.tier && !isOwnerAccount) {
        setCurrentTierState(cloudWallet.tier);
      }
      setDailyGemCoinsRemaining(cloudWallet.dailyGemCoinsRemaining);
      setTopupGemCoins(cloudWallet.topupGemCoins);
    });
    return () => unsubscribe();
  }, [user?.uid, isOwnerAccount]);

  // Initialize state on client mount
  useEffect(() => {
    try {
      // 1. User ID (Device fingerprint)
      let savedUserId = localStorage.getItem(GEMCOIN_USER_ID_KEY);
      if (!savedUserId) {
        savedUserId = 'user_' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem(GEMCOIN_USER_ID_KEY, savedUserId);
      }
      setUserId(savedUserId);

      // 2. Subscription Tier
      const savedTier = localStorage.getItem(STORAGE_KEY) as SubscriptionTier;
      let effectiveTier: SubscriptionTier = 'free';
      if (savedTier && ['free', 'lite', 'pro', 'vip', 'whale'].includes(savedTier)) {
        setCurrentTierState(savedTier);
        effectiveTier = savedTier;
      } else if (savedTier === 'dev' && isOwnerAccount) {
        setCurrentTierState('dev');
        effectiveTier = 'dev';
      } else {
        setCurrentTierState('free');
        effectiveTier = 'free';
        try {
          localStorage.setItem(STORAGE_KEY, 'free');
        } catch {}
      }


      const effectiveTierInfo =
        GEMCOIN_SUBSCRIPTION_TIERS.find((t) => t.tier === effectiveTier) ||
        GEMCOIN_SUBSCRIPTION_TIERS[0];

      // 3. Daily Reset Logic
      const today = getTodayStr();
      const lastResetDate = localStorage.getItem(AI_RESET_DATE_KEY);

      if (lastResetDate !== today) {
        // Midnight reset!
        localStorage.setItem(AI_RESET_DATE_KEY, today);
        localStorage.setItem(AI_USAGE_KEY, '0');
        setAiUsageToday(0);

        // Reset Daily GemCoins to tier full quota
        localStorage.setItem(
          GEMCOIN_DAILY_KEY,
          effectiveTierInfo.dailyGemCoins.toString()
        );
        setDailyGemCoinsRemaining(effectiveTierInfo.dailyGemCoins);
      } else {
        const savedAi = localStorage.getItem(AI_USAGE_KEY);
        if (savedAi) setAiUsageToday(parseInt(savedAi, 10) || 0);

        const savedDaily = localStorage.getItem(GEMCOIN_DAILY_KEY);
        if (savedDaily !== null) {
          setDailyGemCoinsRemaining(parseInt(savedDaily, 10) || 0);
        } else {
          setDailyGemCoinsRemaining(effectiveTierInfo.dailyGemCoins);
        }
      }

      // 4. Permanent Top-up Balance (never expires)
      const savedTopup = localStorage.getItem(GEMCOIN_TOPUP_KEY);
      if (savedTopup) {
        setTopupGemCoins(parseInt(savedTopup, 10) || 0);
      }

      // 5. Logs & Transparent Auto-Refund for past token overcharge
      const savedLogs = localStorage.getItem(GEMCOIN_LOGS_KEY);
      if (savedLogs) {
        try {
          const parsedLogs: GemCoinLogEntry[] = JSON.parse(savedLogs);
          const reconciledKey = 'gemcoin_reconciled_token_refund_v1';
          if (!localStorage.getItem(reconciledKey)) {
            const hasOvercharge = parsedLogs.some((l) => l.gemCoinsUsed >= 30 && (l.model?.includes('flash') || l.model?.includes('gemini')));
            if (hasOvercharge) {
              const refundAmount = 100;
              setDailyGemCoinsRemaining((prev) => {
                const updated = prev + refundAmount;
                localStorage.setItem(GEMCOIN_DAILY_KEY, updated.toString());
                return updated;
              });
              const refundEntry: GemCoinLogEntry = {
                id: 'refund_' + Date.now(),
                timestamp: new Date().toISOString(),
                model: 'System Reconciliation',
                gemCoinsUsed: -refundAmount,
                source: 'daily',
                summary: '🎁 ชดเชยคืนเหรียญ GemCoins กรณีระบบก่อนหน้าคำนวณเหรียญเกิน (+100 GemCoins)',
              };
              const updatedLogs = [refundEntry, ...parsedLogs];
              setGemCoinLogs(updatedLogs);
              localStorage.setItem(GEMCOIN_LOGS_KEY, JSON.stringify(updatedLogs));
              localStorage.setItem(reconciledKey, 'true');
            } else {
              setGemCoinLogs(parsedLogs);
            }
          } else {
            setGemCoinLogs(parsedLogs);
          }
        } catch {
          setGemCoinLogs([]);
        }
      }
    } catch {}
  }, []);

  // Save changes to Tier
  const setTier = useCallback(
    (tier: SubscriptionTier) => {
      setCurrentTierState(tier);
      if (user?.uid) {
        updateCloudTier(user.uid, tier).catch(() => {});
      }
      try {
        localStorage.setItem(STORAGE_KEY, tier);
        const tierInfo =
          GEMCOIN_SUBSCRIPTION_TIERS.find((t) => t.tier === tier) ||
          GEMCOIN_SUBSCRIPTION_TIERS[0];

        if (tier === 'dev') {
          setTopupGemCoins(99999999);
          setDailyGemCoinsRemaining(10000000);
          localStorage.setItem(GEMCOIN_TOPUP_KEY, '99999999');
          localStorage.setItem(GEMCOIN_DAILY_KEY, '10000000');
        } else {
          // If user upgrades, immediately grant permanent topup bonus!
          if (tierInfo.permanentTopupBonus > 0) {
            setTopupGemCoins((prev) => {
              const updated = prev + tierInfo.permanentTopupBonus;
              localStorage.setItem(GEMCOIN_TOPUP_KEY, updated.toString());
              return updated;
            });
          }

          // Adjust daily remaining if lower than new tier's quota
          setDailyGemCoinsRemaining((prev) => {
            const updated = Math.max(prev, tierInfo.dailyGemCoins);
            localStorage.setItem(GEMCOIN_DAILY_KEY, updated.toString());
            return updated;
          });
        }
      } catch {}
    },
    [user?.uid]
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
      if (currentTier === 'dev') {
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

      if (user?.uid) {
        deductCloudCoins(user.uid, amount, model, summary).catch(() => {});
      }

      const logEntry: GemCoinLogEntry = {
        id: 'log_' + Date.now(),
        timestamp: new Date().toISOString(),
        model,
        gemCoinsUsed: amount,
        source,
        summary: summary || 'แชทสอบถามการเงินและวิเคราะห์หุ้น',
      };

      setGemCoinLogs((prev) => {
        const updated = [logEntry, ...prev.slice(0, 49)];
        try {
          localStorage.setItem(GEMCOIN_DAILY_KEY, newDaily.toString());
          localStorage.setItem(GEMCOIN_TOPUP_KEY, newTopup.toString());
          localStorage.setItem(GEMCOIN_LOGS_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      return true;
    },
    [dailyGemCoinsRemaining, topupGemCoins, currentTier, user?.uid]
  );

  // Refund GemCoins (e.g. Aborted request or connection error)
  const refundGemCoins = useCallback(
    (amount: number, reason: string = 'ยกเลิกคำขอ') => {
      if (amount <= 0) return;
      setTopupGemCoins((prev) => {
        const updated = prev + amount;
        try {
          localStorage.setItem(GEMCOIN_TOPUP_KEY, updated.toString());
        } catch {}
        return updated;
      });

      if (user?.uid) {
        creditCloudTopupCoins(user.uid, amount).catch(() => {});
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
        try {
          localStorage.setItem(GEMCOIN_LOGS_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });
    },
    [user?.uid]
  );

  // Top up GemCoins directly (from store package)
  const topupGemCoinsDirect = useCallback(
    (amount: number, packageName: string) => {
      setTopupGemCoins((prev) => {
        const updated = prev + amount;
        try {
          localStorage.setItem(GEMCOIN_TOPUP_KEY, updated.toString());
        } catch {}
        return updated;
      });

      if (user?.uid) {
        creditCloudTopupCoins(user.uid, amount).catch(() => {});
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
        try {
          localStorage.setItem(GEMCOIN_LOGS_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });
    },
    [user?.uid]
  );

  // Redeem Promo Code via Backend API
  const redeemPromoCode = useCallback(
    async (
      code: string
    ): Promise<{ success: boolean; message: string; gemCoinsAdded?: number }> => {
      try {
        const res = await fetch('/api/gemcoin/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, userId }),
        });

        const data = await res.json();
        if (data.success && data.gemCoinsAdded) {
          const added = Number(data.gemCoinsAdded);
          setTopupGemCoins((prev) => {
            const updated = prev + added;
            try {
              localStorage.setItem(GEMCOIN_TOPUP_KEY, updated.toString());
            } catch {}
            return updated;
          });

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
            try {
              localStorage.setItem(GEMCOIN_LOGS_KEY, JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
        return data;
      } catch (err: any) {
        return { success: false, message: err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้' };
      }
    },
    [userId]
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
        restoreOwnerGodMode,


        // GemCoin Economy
        dailyGemCoins,
        dailyGemCoinsRemaining,
        topupGemCoins,
        totalGemCoinsAvailable:
          currentTier === 'dev' || isOwnerAccount
            ? 99999999
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

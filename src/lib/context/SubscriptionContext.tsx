'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PRICING_PLANS, PricingPlan } from '../../config/pricingPlans';

export type SubscriptionTier = 'free' | 'lite' | 'pro' | 'vip';
export type BillingCycle = 'monthly' | 'yearly';

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
}

export interface SubscriptionPlan extends PricingPlan {
  status: 'active' | 'trial' | 'expired';
  expiresAt?: string;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const STORAGE_KEY = 'stockhome_local_subscription_tier';
const AI_USAGE_KEY = 'stockhome_local_ai_usage_count';
const AI_RESET_DATE_KEY = 'stockhome_local_ai_reset_date';

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [currentTier, setCurrentTierState] = useState<SubscriptionTier>('free');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [isPricingModalOpen, setIsPricingModalOpen] = useState<boolean>(false);
  const [aiUsageToday, setAiUsageToday] = useState<number>(0);

  // Helper to get today's date string YYYY-MM-DD
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  // Load saved subscription state from localStorage on mount (Local-first persistence)
  useEffect(() => {
    try {
      const savedTier = localStorage.getItem(STORAGE_KEY) as SubscriptionTier;
      if (savedTier && ['free', 'lite', 'pro', 'vip'].includes(savedTier)) {
        setCurrentTierState(savedTier);
      }

      const today = getTodayStr();
      const lastResetDate = localStorage.getItem(AI_RESET_DATE_KEY);

      // Check daily reset rule: if new day, reset credits_used = 0
      if (lastResetDate !== today) {
        localStorage.setItem(AI_RESET_DATE_KEY, today);
        localStorage.setItem(AI_USAGE_KEY, '0');
        setAiUsageToday(0);
      } else {
        const savedAi = localStorage.getItem(AI_USAGE_KEY);
        if (savedAi) {
          setAiUsageToday(parseInt(savedAi, 10) || 0);
        }
      }
    } catch {}
  }, []);

  const setTier = useCallback((tier: SubscriptionTier) => {
    setCurrentTierState(tier);
    try {
      localStorage.setItem(STORAGE_KEY, tier);
    } catch {}
  }, []);

  const openPricingModal = useCallback(() => setIsPricingModalOpen(true), []);
  const closePricingModal = useCallback(() => setIsPricingModalOpen(false), []);

  const basePlan = PRICING_PLANS.find((p) => p.id === currentTier) || PRICING_PLANS[0];
  const currentPlan: SubscriptionPlan = {
    ...basePlan,
    status: 'active',
    expiresAt: currentTier !== 'free' ? '31 ธ.ค. 2026' : undefined,
  };

  const isProOrAbove = currentTier === 'pro' || currentTier === 'vip';
  const isVip = currentTier === 'vip';

  const canUseAiOnDemand = useCallback(() => {
    return aiUsageToday < currentPlan.limits.aiOnDemandDailyLimit;
  }, [aiUsageToday, currentPlan.limits.aiOnDemandDailyLimit]);

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

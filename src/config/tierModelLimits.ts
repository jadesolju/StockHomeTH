/**
 * tierModelLimits.ts
 * Single Source of Truth for Tier-based AI Capabilities & Token Quotas.
 * Controls Context Window, Output Tokens, Document Limits, Priority Queue, and Fallback Cascades.
 */

export type SubscriptionTier = 'free' | 'lite' | 'pro' | 'vip' | 'whale' | 'dev';

export interface TierModelLimit {
  tier: SubscriptionTier;
  label: string;
  maxOutputTokens: number;
  maxDocTokens: number;
  recentVerbatimCount: number;
  maxHistoryMessages: number;
  memorySurcharge: number; // GemCoins per rolling summary update (0 for Pro/VIP/Whale/Dev)
  queuePriority: 1 | 2 | 3 | 4; // 1 = Instant/Bypass, 2 = Fast, 3 = Normal, 4 = Queued
  deepReasoningAllowed: boolean;
  unlimitedContext: boolean;
  description: string;
}

export const TIER_MODEL_LIMITS: Record<SubscriptionTier, TierModelLimit> = {
  free: {
    tier: 'free',
    label: 'Free Member',
    maxOutputTokens: 2560,
    maxDocTokens: 4000,
    recentVerbatimCount: 4,
    maxHistoryMessages: 10,
    memorySurcharge: 5,
    queuePriority: 4,
    deepReasoningAllowed: false,
    unlimitedContext: false,
    description: 'กระชับ รวดเร็ว สรุป 1-2 หน้าจอ โควตาเอกสาร 4,000 Tokens',
  },
  lite: {
    tier: 'lite',
    label: 'Lite Plan',
    maxOutputTokens: 4096,
    maxDocTokens: 10000,
    recentVerbatimCount: 6,
    maxHistoryMessages: 25,
    memorySurcharge: 2,
    queuePriority: 3,
    deepReasoningAllowed: false,
    unlimitedContext: false,
    description: 'วิเคราะห์ครบ มีตารางสรุป โควตาเอกสาร 10,000 Tokens สรุปประวัติ 25 ข้อความ',
  },
  pro: {
    tier: 'pro',
    label: 'Pro Plan',
    maxOutputTokens: 6144,
    maxDocTokens: 30000,
    recentVerbatimCount: 8,
    maxHistoryMessages: 60,
    memorySurcharge: 0, // 100% Free Memory
    queuePriority: 2,
    deepReasoningAllowed: true,
    unlimitedContext: false,
    description: 'วิเคราะห์งบการเงินและ Valuation เชิงลึก แนบงบทั้งไตรมาส 30,000 Tokens สรุปความจำฟรี 0 บาท',
  },
  vip: {
    tier: 'vip',
    label: 'VIP Investor',
    maxOutputTokens: 8192,
    maxDocTokens: 100000,
    recentVerbatimCount: 10,
    maxHistoryMessages: 150,
    memorySurcharge: 0,
    queuePriority: 1, // Instant VIP
    deepReasoningAllowed: true,
    unlimitedContext: false,
    description: 'เพดานสูงสุด 8,192 Tokens แนบเอกสาร 100,000 Tokens คิวความเร็วสูงพิเศษ Priority 1',
  },
  whale: {
    tier: 'whale',
    label: 'Whale Fund',
    maxOutputTokens: 8192,
    maxDocTokens: Infinity, // Unlimited
    recentVerbatimCount: 12,
    maxHistoryMessages: 9999, // Infinite
    memorySurcharge: 0,
    queuePriority: 1, // Instant Bypass
    deepReasoningAllowed: true,
    unlimitedContext: true,
    description: 'Institutional Full Access แนบงบการเงินไม่จำกัดขนาด ทะลุคิว 0ms ความจำไร้ที่สิ้นสุด',
  },
  dev: {
    tier: 'dev',
    label: '👑 Dev + Owner',
    maxOutputTokens: 8192,
    maxDocTokens: Infinity,
    recentVerbatimCount: 16,
    maxHistoryMessages: 9999,
    memorySurcharge: 0,
    queuePriority: 1,
    deepReasoningAllowed: true,
    unlimitedContext: true,
    description: 'God Mode ปลดล็อกทุกโมเดลและขีดจำกัดสูงสุด 100%',
  },
};

/**
 * Fallback Array Cascade per primary model.
 * If the primary model returns 429, 500, 503 or times out,
 * OpenRouter automatically fails over to the next resilient backup in the cascade.
 */
export const MODEL_FALLBACK_CASCADES: Record<string, string[]> = {
  // Google Gemini 3.1 Pro Preview -> Sonnet -> Flash
  'google/gemini-3.1-pro-preview': [
    'google/gemini-3.1-pro-preview',
    'anthropic/claude-sonnet-5',
    'google/gemini-3.8-flash',
  ],
  // Anthropic Claude Sonnet 5 -> GPT-5 -> Gemini Pro
  'anthropic/claude-sonnet-5': [
    'anthropic/claude-sonnet-5',
    'openai/gpt-5.6-luna-pro',
    'google/gemini-3.1-pro-preview',
  ],
  // DeepSeek R1 -> DeepSeek Chat -> Gemini Pro
  'deepseek/deepseek-r1': [
    'deepseek/deepseek-r1',
    'deepseek/deepseek-chat',
    'google/gemini-3.8-flash',
  ],
  // xAI Grok 3 -> GPT-5 -> Gemini Pro
  'x-ai/grok-3': [
    'x-ai/grok-3',
    'openai/gpt-5.6-luna-pro',
    'google/gemini-3.1-pro-preview',
  ],
  // Gemini 3.8 Flash -> 3.7 Flash -> 3.5 Flash Lite
  'google/gemini-3.8-flash': [
    'google/gemini-3.8-flash',
    'google/gemini-3.7-flash',
    'google/gemini-3.5-flash-lite',
  ],
  // Gemini 3.5 Flash Lite -> 3.6 Flash -> DeepSeek Chat
  'google/gemini-3.5-flash-lite': [
    'google/gemini-3.5-flash-lite',
    'google/gemini-3.6-flash',
    'deepseek/deepseek-chat',
  ],
};

/**
 * Returns the fallback array for a given model ID.
 */
export function getModelFallbackArray(primaryModelId: string): string[] {
  if (MODEL_FALLBACK_CASCADES[primaryModelId]) {
    return MODEL_FALLBACK_CASCADES[primaryModelId];
  }
  // Generic fallback: primary model -> Gemini 3.8 Flash -> Gemini 3.5 Flash Lite
  return [
    primaryModelId,
    'google/gemini-3.8-flash',
    'google/gemini-3.5-flash-lite',
  ];
}

/**
 * Helper to get tier limit safely with fallback to free
 */
export function getTierLimits(tier?: string | null): TierModelLimit {
  if (!tier || !(tier in TIER_MODEL_LIMITS)) {
    return TIER_MODEL_LIMITS.free;
  }
  return TIER_MODEL_LIMITS[tier as SubscriptionTier];
}

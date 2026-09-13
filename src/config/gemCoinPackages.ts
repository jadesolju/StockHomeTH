export interface GemCoinTopupPackage {
  id: string;
  name: string;
  iconType: 'piggy' | 'wallet' | 'briefcase' | 'roadster' | 'crown' | 'rocket' | 'castle' | 'whale';
  promoPrice: number; // ฿ Promo Price (1st Month only)
  regularPrice: number; // ฿ Regular Price
  gemCoins: number;
  bonusCoins: number;
  tag?: string;
  popular?: boolean;
  bestValue?: boolean;
}

export const PROMO_CAMPAIGN_TEXT = '⏳ ราคาโปรโมชั่นเปิดตัวเฉพาะ 1 เดือนแรกเท่านั้น';

export const GEMCOIN_TOPUP_PACKAGES: GemCoinTopupPackage[] = [
  {
    id: 'pack-piggy',
    name: 'งบน้อย',
    iconType: 'piggy',
    promoPrice: 19,
    regularPrice: 39,
    gemCoins: 1500,
    bonusCoins: 0,
    tag: 'ลด 51%',
  },
  {
    id: 'pack-wallet',
    name: 'พอมีเงิน',
    iconType: 'wallet',
    promoPrice: 39,
    regularPrice: 69,
    gemCoins: 3500,
    bonusCoins: 500,
  },
  {
    id: 'pack-briefcase',
    name: 'มีตังค์เหลือๆ',
    iconType: 'briefcase',
    promoPrice: 89,
    regularPrice: 149,
    gemCoins: 9000,
    bonusCoins: 1500,
    popular: true,
    tag: 'ยอดนิยม',
  },
  {
    id: 'pack-roadster',
    name: 'พร้อมบวก',
    iconType: 'roadster',
    promoPrice: 199,
    regularPrice: 349,
    gemCoins: 25000,
    bonusCoins: 5000,
  },
  {
    id: 'pack-crown',
    name: 'เสี่ยสั่งลุย',
    iconType: 'crown',
    promoPrice: 499,
    regularPrice: 890,
    gemCoins: 70000,
    bonusCoins: 15000,
  },
  {
    id: 'pack-rocket',
    name: 'เจ้าสัวพอร์ตโต',
    iconType: 'rocket',
    promoPrice: 999,
    regularPrice: 1790,
    gemCoins: 150000,
    bonusCoins: 40000,
    tag: 'แตะหลักพัน',
  },
  {
    id: 'pack-castle',
    name: 'ป๋าบุญทุ่ม',
    iconType: 'castle',
    promoPrice: 1999,
    regularPrice: 3590,
    gemCoins: 350000,
    bonusCoins: 100000,
  },
  {
    id: 'pack-whale',
    name: 'วาฬสถาบัน (Whale God)',
    iconType: 'whale',
    promoPrice: 3999,
    regularPrice: 6990,
    gemCoins: 800000,
    bonusCoins: 250000,
    bestValue: true,
    tag: 'คุ้มค่าสูงสุด',
  },
];

export interface GemCoinSubscriptionTierInfo {
  tier: 'free' | 'lite' | 'pro' | 'vip' | 'whale' | 'dev';
  name: string;
  promoPriceMonthly: number;
  regularPriceMonthly: number;
  /** Yearly price (≈ 10 months – 2 months free) */
  promoPriceYearly: number;
  regularPriceYearly: number;
  dailyGemCoins: number;
  permanentTopupBonus: number;
  unlockedModels: { id: string; name: string; tag: string }[];
  highlight: string;
}

export const GEMCOIN_SUBSCRIPTION_TIERS: GemCoinSubscriptionTierInfo[] = [
  {
    tier: 'free',
    name: 'Free Plan',
    promoPriceMonthly: 0,
    regularPriceMonthly: 0,
    promoPriceYearly: 0,
    regularPriceYearly: 0,
    dailyGemCoins: 500,
    permanentTopupBonus: 0,
    unlockedModels: [
      { id: 'google/gemini-3.8-flash', name: 'Gemini 3.8 Flash', tag: 'Fast' },
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', tag: 'Finance' },
    ],
    highlight: '500 GemCoins ต่อวัน (รีเซ็ตทุกเที่ยงคืน) ฟรีตลอดชีพ',
  },
  {
    tier: 'lite',
    name: 'Lite Plan',
    promoPriceMonthly: 89,
    regularPriceMonthly: 149,
    promoPriceYearly: 890,   // ≈ 74 THB/เดือน (ประหยัด 2 เดือน)
    regularPriceYearly: 1490,
    dailyGemCoins: 2500,
    permanentTopupBonus: 12000,
    unlockedModels: [
      { id: 'google/gemini-3.8-flash', name: 'Gemini 3.8 Flash', tag: 'Fast' },
      { id: 'google/gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', tag: 'Deep Reasoning' },
    ],
    highlight: 'แถม 12,000 GemCoins ถาวร + 2,500 ต่อวัน ไร้โฆษณา',
  },
  {
    tier: 'pro',
    name: 'Pro Plan',
    promoPriceMonthly: 299,
    regularPriceMonthly: 490,
    promoPriceYearly: 2990,  // ≈ 249 THB/เดือน (ประหยัด 2 เดือน)
    regularPriceYearly: 4900,
    dailyGemCoins: 10000,
    permanentTopupBonus: 45000,
    unlockedModels: [
      { id: 'google/gemini-3.8-flash', name: 'Gemini 3.8 Flash', tag: 'Fast' },
      { id: 'google/gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', tag: 'Deep Reasoning' },
      { id: 'openai/gpt-5.6-luna-pro', name: 'GPT-5 (Luna Pro)', tag: 'OpenAI Flagship' },
      { id: 'anthropic/claude-sonnet-5', name: 'Claude Sonnet 5', tag: 'Anthropic Flagship' },
    ],
    highlight: 'แถม 45,000 GemCoins ถาวร + 10,000 ต่อวัน + Real-time Stock Context',
  },
  {
    tier: 'vip',
    name: 'VIP Investor',
    promoPriceMonthly: 999,
    regularPriceMonthly: 1690,
    promoPriceYearly: 9990,  // ≈ 833 THB/เดือน (ประหยัด 2 เดือน)
    regularPriceYearly: 16900,
    dailyGemCoins: 50000,
    permanentTopupBonus: 180000,
    unlockedModels: [
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', tag: 'Reasoning Master' },
      { id: 'google/gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', tag: 'Deep Reasoning' },
      { id: 'anthropic/claude-3.5-opus', name: 'Claude 3.5 Opus', tag: 'Top Tier' },
      { id: 'openai/gpt-5.6-luna-pro', name: 'GPT-5 (Luna Pro)', tag: 'OpenAI Flagship' },
    ],
    highlight: 'แถม 180,000 GemCoins ถาวร + 50,000 ต่อวัน + Fast-Track Priority Speed',
  },
  {
    tier: 'whale',
    name: 'Whale Fund',
    promoPriceMonthly: 2499,
    regularPriceMonthly: 4500,
    promoPriceYearly: 24990, // ≈ 2,083 THB/เดือน (ประหยัด 2 เดือน)
    regularPriceYearly: 45000,
    dailyGemCoins: 150000,
    permanentTopupBonus: 500000,
    unlockedModels: [
      { id: 'openai/gpt-6-astra', name: 'GPT-6 Astra', tag: 'OpenAI Elite' },
      { id: 'anthropic/claude-fable-5.1', name: 'Claude Fable 5.1', tag: 'Narrative Master' },
      { id: 'anthropic/claude-opus-5', name: 'Claude Opus 5', tag: 'Top Frontier' },
      { id: 'x-ai/grok-4.6', name: 'Grok 4.6', tag: 'Institutional Real-time' },
    ],
    highlight: 'แถม 500,000 GemCoins ถาวร + 150,000 ต่อวัน + Luxury Institutional Full Access ปลดล็อก GPT-6 & Claude Fable/Opus 5',
  },
  {
    tier: 'dev',
    name: '👑 Dev + Owner (God Mode)',
    promoPriceMonthly: 0,
    regularPriceMonthly: 0,
    promoPriceYearly: 0,
    regularPriceYearly: 0,
    dailyGemCoins: 10000000,
    permanentTopupBonus: 99999999,
    unlockedModels: [
      { id: 'google/gemini-3.8-flash', name: 'Gemini 3.8 Flash', tag: 'Fast' },
      { id: 'google/gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', tag: 'Deep Reasoning' },
      { id: 'openai/gpt-5.6-luna-pro', name: 'GPT-5 (Luna Pro)', tag: 'OpenAI Flagship' },
      { id: 'anthropic/claude-sonnet-5', name: 'Claude Sonnet 5', tag: 'Anthropic Flagship' },
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', tag: 'Finance' },
    ],
    highlight: '👑 แผนผู้พัฒนาและเจ้าของระบบ (สิทธิ์สูงสุด ปลดล็อก AI ทุกตัว + GemCoins ไม่อั้น ฟรีตลอดชีพ)',
  },
];


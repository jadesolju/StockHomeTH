/**
 * curated-models.ts
 * คัดโมเดลดีที่สุดแต่ละตระกูล (GPT, Claude, Gemini, DeepSeek, Grok, Qwen, Gemma)
 * จาก OpenRouter — up-to-date & most popular ณ ปี 2026
 * ไม่มีอีโมจิ: ทุก icon เป็น Pure SVG Vector ผ่าน ModelFamilyIcons.tsx
 */

export type ModelFamily = 'gemini' | 'gpt' | 'claude' | 'deepseek' | 'grok' | 'qwen' | 'gemma';

export interface ModelFamilyMeta {
  key: ModelFamily;
  label: string;        // Full brand name
  shortLabel: string;   // Short name for chips/tabs
  color: string;        // Brand primary color (hex)
  // NOTE: No emoji field — use FAMILY_ICON_MAP from ModelFamilyIcons.tsx instead
}

export const MODEL_FAMILIES: ModelFamilyMeta[] = [
  { key: 'gemini',    label: 'Google Gemini',    shortLabel: 'Gemini',   color: '#4285F4' },
  { key: 'gpt',       label: 'OpenAI GPT',        shortLabel: 'GPT',      color: '#10a37f' },
  { key: 'claude',    label: 'Anthropic Claude',  shortLabel: 'Claude',   color: '#d97706' },
  { key: 'deepseek',  label: 'DeepSeek',          shortLabel: 'DeepSeek', color: '#3b82f6' },
  { key: 'grok',      label: 'xAI Grok',          shortLabel: 'Grok',     color: '#E2E8F0' },
  { key: 'qwen',      label: 'Alibaba Qwen',       shortLabel: 'Qwen',     color: '#f97316' },
  { key: 'gemma',     label: 'Google Gemma',      shortLabel: 'Gemma',    color: '#8b5cf6' },
];

export interface ModelSpec {
  id: string;             // OpenRouter model ID (e.g. "google/gemini-2.5-flash")
  name: string;           // Short display name
  family: ModelFamily;
  tag: string;            // Short badge label (e.g. "Fast", "Reasoning")
  context: string;        // Context window (e.g. "1M", "200K")
  gemCoinsEstimate?: number; // Estimated GemCoins per query (e.g. 4, 6, 12, 25)
  priceInput?: string;    // Deprecated for end-users, kept for internal reference
  priceOutput?: string;   // Deprecated for end-users, kept for internal reference
  highlight: string;      // Thai one-liner description
  isNew?: boolean;        // Show NEW badge
  isPopular?: boolean;    // Show HOT badge
  isFree?: boolean;       // Free community model
  minTier: 'free' | 'lite' | 'pro' | 'vip' | 'whale';
}

export const CURATED_MODELS: ModelSpec[] = [

  // ──────────────────────────────────────────────
  // Google Gemini
  // ──────────────────────────────────────────────
  {
    id: 'google/gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash Lite',
    family: 'gemini',
    tag: 'Lite',
    context: '1M',
    priceInput: '$0.05',
    priceOutput: '$0.10',
    highlight: 'เบาสุด เร็วสุด ราคาถูกที่สุดในซีรีส์ Gemini',
    minTier: 'free',
  },
  {
    id: 'google/gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    family: 'gemini',
    tag: 'Flash',
    context: '1M',
    priceInput: '$0.10',
    priceOutput: '$0.30',
    highlight: 'Flash รุ่นใหม่ — เร็วดี สมดุล ราคาย่อมเยา',
    isPopular: true,
    minTier: 'free',
  },
  {
    id: 'google/gemini-3.7-flash',
    name: 'Gemini 3.7 Flash',
    family: 'gemini',
    tag: 'Flash+',
    context: '1M',
    priceInput: '$0.15',
    priceOutput: '$0.50',
    highlight: 'Flash อัปเกรด — ฉลาดขึ้น ยังเร็ว',
    isNew: true,
    minTier: 'free',
  },
  {
    id: 'google/gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    family: 'gemini',
    tag: 'Flash Pro',
    context: '1M',
    priceInput: '$0.20',
    priceOutput: '$0.60',
    highlight: 'Flash รุ่นล่าสุด — ใกล้เคียง Pro แต่เร็วกว่า',
    isNew: true,
    isPopular: true,
    minTier: 'free',
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    family: 'gemini',
    tag: 'Stable',
    context: '1M',
    priceInput: '$0.15',
    priceOutput: '$0.60',
    highlight: 'Stable production — นิยมสูงสุด ใช้ทั่วไป',
    isPopular: true,
    minTier: 'free',
  },
  {
    id: 'google/gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro Preview',
    family: 'gemini',
    tag: 'Pro Preview',
    context: '2M',
    priceInput: '$1.00',
    priceOutput: '$4.00',
    highlight: 'Pro รุ่น preview — Reasoning ลึก ทดสอบฟีเจอร์ใหม่',
    isNew: true,
    minTier: 'free',
  },
  {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    family: 'gemini',
    tag: 'Pro',
    context: '1M',
    priceInput: '$1.25',
    priceOutput: '$5.00',
    highlight: 'Pro stable — วิเคราะห์หุ้น งบการเงิน กราฟ',
    minTier: 'free',
  },

  // ──────────────────────────────────────────────
  // OpenAI GPT
  // ──────────────────────────────────────────────
  {
    id: 'openai/gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    family: 'gpt',
    tag: 'Mini',
    context: '128K',
    priceInput: '$0.08',
    priceOutput: '$0.30',
    highlight: 'GPT-4 คุณภาพ ราคาต่ำสุด ตอบเร็ว',
    isPopular: true,
    minTier: 'free',
  },
  {
    id: 'openai/gpt-5.4',
    name: 'GPT-5.4',
    family: 'gpt',
    tag: 'Balanced',
    context: '128K',
    priceInput: '$2.00',
    priceOutput: '$8.00',
    highlight: 'GPT-5 รุ่นกลาง — คุณภาพดี ราคาพอสมควร',
    minTier: 'free',
  },
  {
    id: 'openai/gpt-5.6-luna',
    name: 'GPT-5.6 Luna',
    family: 'gpt',
    tag: 'Fast',
    context: '256K',
    priceInput: '$1.50',
    priceOutput: '$6.00',
    highlight: 'GPT-5.6 variant เร็ว — เหมาะ chat ทั่วไป',
    isNew: true,
    minTier: 'free',
  },
  {
    id: 'openai/gpt-5.6-sol',
    name: 'GPT-5.6 Sol',
    family: 'gpt',
    tag: 'Balanced',
    context: '256K',
    priceInput: '$3.00',
    priceOutput: '$12.00',
    highlight: 'GPT-5.6 variant สมดุล — flagship สำหรับงานหนัก',
    isNew: true,
    isPopular: true,
    minTier: 'free',
  },
  {
    id: 'openai/gpt-5.6-terra',
    name: 'GPT-5.6 Terra',
    family: 'gpt',
    tag: 'Heavy',
    context: '256K',
    priceInput: '$5.00',
    priceOutput: '$20.00',
    highlight: 'GPT-5.6 variant ใหญ่ — งานซับซ้อน วิเคราะห์เชิงลึก',
    isNew: true,
    minTier: 'free',
  },
  {
    id: 'openai/gpt-6-astra',
    name: 'GPT-6 Astra',
    family: 'gpt',
    tag: 'Elite',
    context: '512K',
    priceInput: '$10.00',
    priceOutput: '$40.00',
    highlight: 'GPT-6 รุ่นแรก — ฉลาดสุดในจักรวาล OpenAI',
    isNew: true,
    minTier: 'free',
  },

  // ──────────────────────────────────────────────
  // Anthropic Claude
  // ──────────────────────────────────────────────
  {
    id: 'anthropic/claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    family: 'claude',
    tag: 'Balanced',
    context: '200K',
    priceInput: '$3.00',
    priceOutput: '$15.00',
    highlight: 'Sonnet flagship — วิเคราะห์ข่าว ตลาด ยุทธศาสตร์',
    isPopular: true,
    minTier: 'free',
  },
  {
    id: 'anthropic/claude-sonnet-4.6',
    name: 'Claude Sonnet 4.6',
    family: 'claude',
    tag: 'Balanced+',
    context: '200K',
    priceInput: '$4.00',
    priceOutput: '$20.00',
    highlight: 'Sonnet รุ่นใหม่ — ฉลาดขึ้น reasoning ดีขึ้น',
    isNew: true,
    minTier: 'free',
  },
  {
    id: 'anthropic/claude-sonnet-5',
    name: 'Claude Sonnet 5',
    family: 'claude',
    tag: 'Flagship Sonnet',
    context: '200K',
    priceInput: '$5.00',
    priceOutput: '$25.00',
    highlight: 'Sonnet 5 — สุดยอด balanced ทุกด้าน',
    isNew: true,
    isPopular: true,
    minTier: 'free',
  },
  {
    id: 'anthropic/claude-fable-5.1',
    name: 'Claude Fable 5.1',
    family: 'claude',
    tag: 'Creative',
    context: '200K',
    priceInput: '$8.00',
    priceOutput: '$40.00',
    highlight: 'Claude variant ใหม่ — สร้างสรรค์ เชี่ยวชาญ narrative',
    isNew: true,
    minTier: 'free',
  },
  {
    id: 'anthropic/claude-opus-4.7',
    name: 'Claude Opus 4.7',
    family: 'claude',
    tag: 'Opus',
    context: '200K',
    priceInput: '$12.00',
    priceOutput: '$60.00',
    highlight: 'Opus รุ่นกลาง — วิเคราะห์ลึก กลยุทธ์ระยะยาว',
    minTier: 'free',
  },
  {
    id: 'anthropic/claude-opus-4.8',
    name: 'Claude Opus 4.8',
    family: 'claude',
    tag: 'Opus+',
    context: '200K',
    priceInput: '$13.00',
    priceOutput: '$65.00',
    highlight: 'Opus อัปเกรด — ข้อมูลซับซ้อน งานหนัก',
    isNew: true,
    minTier: 'free',
  },
  {
    id: 'anthropic/claude-opus-5',
    name: 'Claude Opus 5',
    family: 'claude',
    tag: 'Elite',
    context: '200K',
    priceInput: '$15.00',
    priceOutput: '$75.00',
    highlight: 'ระดับเทพสุดของ Claude — ข้อมูลซับซ้อนที่สุด',
    isNew: true,
    minTier: 'free',
  },

  // ──────────────────────────────────────────────
  // xAI Grok
  // ──────────────────────────────────────────────
  {
    id: 'x-ai/grok-4.3',
    name: 'Grok 4.3',
    family: 'grok',
    tag: 'Fast',
    context: '131K',
    priceInput: '$0.30',
    priceOutput: '$0.50',
    highlight: 'Grok เร็ว ราคาต่ำ เหมาะ realtime market chat',
    isPopular: true,
    minTier: 'free',
  },
  {
    id: 'x-ai/grok-4.5',
    name: 'Grok 4.5',
    family: 'grok',
    tag: 'Balanced',
    context: '131K',
    priceInput: '$2.00',
    priceOutput: '$10.00',
    highlight: 'xAI balanced — ตอบตรงประเด็น ข้อมูลใหม่',
    isNew: true,
    minTier: 'free',
  },
  {
    id: 'x-ai/grok-4.6',
    name: 'Grok 4.6',
    family: 'grok',
    tag: 'Flagship',
    context: '131K',
    priceInput: '$3.00',
    priceOutput: '$15.00',
    highlight: 'xAI flagship รุ่นล่าสุด — ฉลาดสุด ข้อมูลสดกว่าใคร',
    isNew: true,
    isPopular: true,
    minTier: 'free',
  },

  // ──────────────────────────────────────────────
  // Alibaba Qwen
  // ──────────────────────────────────────────────
  {
    id: 'qwen/qwen3.7-flash',
    name: 'Qwen3.7 Flash',
    family: 'qwen',
    tag: 'Flash',
    context: '128K',
    priceInput: '$0.05',
    priceOutput: '$0.15',
    highlight: 'Qwen3 เร็วสุด ราคาถูก — เหมาะคำถามทั่วไป',
    isPopular: true,
    minTier: 'free',
  },
  {
    id: 'qwen/qwen3.8-flash',
    name: 'Qwen3.8 Flash',
    family: 'qwen',
    tag: 'Flash+',
    context: '128K',
    priceInput: '$0.10',
    priceOutput: '$0.20',
    highlight: 'Qwen3.8 Flash — อัปเกรดเล็ก ยังเร็วและถูก',
    isNew: true,
    minTier: 'free',
  },
  {
    id: 'qwen/qwen3.7-plus',
    name: 'Qwen3.7 Plus',
    family: 'qwen',
    tag: 'Plus',
    context: '128K',
    priceInput: '$0.15',
    priceOutput: '$0.50',
    highlight: 'Qwen3 Plus — performance ระดับ GPT-4 ราคาถูกกว่า',
    minTier: 'free',
  },
  {
    id: 'qwen/qwen3.8-27b',
    name: 'Qwen3.8 27B',
    family: 'qwen',
    tag: 'Powerhouse',
    context: '128K',
    priceInput: '$0.20',
    priceOutput: '$0.60',
    highlight: 'Qwen3.8 ใหญ่ 27B — MoE คุณภาพสูง ราคาคุ้ม',
    isNew: true,
    isPopular: true,
    minTier: 'free',
  },

  // ──────────────────────────────────────────────
  // DeepSeek
  // ──────────────────────────────────────────────
  {
    id: 'deepseek/deepseek-v4-flash-0731',
    name: 'DeepSeek V4 Flash',
    family: 'deepseek',
    tag: 'Flash',
    context: '64K',
    priceInput: '$0.20',
    priceOutput: '$0.60',
    highlight: 'DeepSeek V4 เร็ว — วิเคราะห์ตลาดสด real-time',
    isNew: true,
    isPopular: true,
    minTier: 'free',
  },
  {
    id: 'deepseek/deepseek-v4-pro-0813',
    name: 'DeepSeek V4 Pro',
    family: 'deepseek',
    tag: 'Pro Reasoning',
    context: '64K',
    priceInput: '$0.80',
    priceOutput: '$2.40',
    highlight: 'DeepSeek V4 Pro — Chain-of-thought ลึก วิเคราะห์การเงิน',
    isNew: true,
    minTier: 'free',
  },

  // ──────────────────────────────────────────────
  // Google Gemma (Open Source)
  // ──────────────────────────────────────────────
  {
    id: 'google/gemma-4-26b-a4b-it',
    name: 'Gemma 4 26B',
    family: 'gemma',
    tag: 'Open',
    context: '128K',
    priceInput: '$0.10',
    priceOutput: '$0.20',
    highlight: 'Gemma 4 26B open source — ทดสอบได้ ไม่จ่ายแพง',
    isNew: true,
    minTier: 'free',
  },
  {
    id: 'google/gemma-4-31b-it',
    name: 'Gemma 4 31B',
    family: 'gemma',
    tag: 'Open+',
    context: '128K',
    priceInput: '$0.15',
    priceOutput: '$0.30',
    highlight: 'Gemma 4 31B — ใหญ่กว่า ฉลาดกว่า ยังคุ้มราคา',
    isNew: true,
    isPopular: true,
    minTier: 'free',
  },
];

/** Default model to use when none is selected */
export const DEFAULT_MODEL_ID = 'google/gemini-3.8-flash';

/**
 * Calculates estimated GemCoins consumed per user query
 * Clean abstraction so users only see GemCoins and never raw dollar token prices
 */
export function getModelGemCoinsEst(model: ModelSpec): number {
  if (model.gemCoinsEstimate) return model.gemCoinsEstimate;
  if (model.id.includes('claude-3-7-sonnet') || model.id.includes('gpt-5')) return 35;
  if (model.minTier === 'whale' || model.minTier === 'vip' || model.id.includes('claude') || model.id.includes('gpt-4o')) return 25;
  if (model.minTier === 'pro' || model.id.includes('gemini-3.1-pro') || model.id.includes('gemini-2.5-pro') || model.id.includes('deepseek-r1')) return 15;
  if (model.minTier === 'lite') return 10;
  if (model.isFree || model.id.includes('flash-lite')) return 4;
  return 6;
}

import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.resolve(process.cwd(), 'translation_cache.json');
const USAGE_FILE = path.resolve(process.cwd(), 'deepl_usage.json');

// DeepL Free tier: 500,000 chars/month.
// We set strict conservative safety ceilings to guarantee zero overages.
const MONTHLY_MAX_CHARS = 450_000;
const DAILY_MAX_CHARS = 25_000;
const MAX_ITEM_LENGTH = 140; // Truncate text before sending to DeepL to save quota

export interface DeepLUsageStatus {
  month: string;
  monthCharCount: number;
  monthlyLimit: number;
  monthlyRemaining: number;
  day: string;
  dayCharCount: number;
  dailyLimit: number;
  dailyRemaining: number;
  cachedEntriesCount: number;
  isAvailable: boolean;
}

interface UsageData {
  month: string;
  monthCharCount: number;
  day: string;
  dayCharCount: number;
}

// In-memory cache for 0ms lookups
const memCache = new Map<string, string>();

/**
 * Clean & normalize text before caching/translation to maximize cache hit rate and save quota
 */
function sanitizeTextForTranslation(text: string): string {
  return text
    .replace(/\s*-\s*(สำนักข่าว|Kaohoon|BangkokBizNews|Thunhoon|Prachachat|Yahoo Finance|Reuters|Bloomberg|CNBC).*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_ITEM_LENGTH);
}

/**
 * Load persistent translation cache from disk
 */
function loadDiskCache(): void {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
      const json = JSON.parse(raw);
      if (typeof json === 'object' && json !== null) {
        for (const [k, v] of Object.entries(json)) {
          if (typeof v === 'string') memCache.set(k, v);
        }
      }
    }
  } catch (err) {
    console.warn('[DeepL] Cache read warning:', err);
  }
}

/**
 * Save persistent translation cache to disk
 */
function saveDiskCache(): void {
  try {
    const obj: Record<string, string> = {};
    for (const [k, v] of memCache.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[DeepL] Cache save warning:', err);
  }
}

// Initialize disk cache immediately
loadDiskCache();

/**
 * Get current DeepL usage telemetry
 */
export function getDeepLUsageStatus(): DeepLUsageStatus {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentDay = now.toISOString().slice(0, 10);

  let monthCharCount = 0;
  let dayCharCount = 0;

  try {
    if (fs.existsSync(USAGE_FILE)) {
      const raw = fs.readFileSync(USAGE_FILE, 'utf-8');
      const parsed: UsageData = JSON.parse(raw);
      if (parsed.month === currentMonth) {
        monthCharCount = parsed.monthCharCount || 0;
      }
      if (parsed.day === currentDay) {
        dayCharCount = parsed.dayCharCount || 0;
      }
    }
  } catch {
    // fallback
  }

  const effectiveKey = process.env.DEEPL_API_KEY || process.env.DEEPL_AUTH_KEY;

  return {
    month: currentMonth,
    monthCharCount,
    monthlyLimit: MONTHLY_MAX_CHARS,
    monthlyRemaining: Math.max(0, MONTHLY_MAX_CHARS - monthCharCount),
    day: currentDay,
    dayCharCount,
    dailyLimit: DAILY_MAX_CHARS,
    dailyRemaining: Math.max(0, DAILY_MAX_CHARS - dayCharCount),
    cachedEntriesCount: memCache.size,
    isAvailable: Boolean(effectiveKey) && (monthCharCount < MONTHLY_MAX_CHARS) && (dayCharCount < DAILY_MAX_CHARS)
  };
}

/**
 * Check and record DeepL usage quota
 */
function checkAndUpdateUsage(charsToAdd: number): boolean {
  try {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentDay = now.toISOString().slice(0, 10);

    let usage: UsageData = {
      month: currentMonth,
      monthCharCount: 0,
      day: currentDay,
      dayCharCount: 0,
    };

    if (fs.existsSync(USAGE_FILE)) {
      const raw = fs.readFileSync(USAGE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.month === currentMonth) {
        usage.monthCharCount = parsed.monthCharCount || 0;
      }
      if (parsed.day === currentDay) {
        usage.dayCharCount = parsed.dayCharCount || 0;
      }
    }

    if (usage.monthCharCount + charsToAdd > MONTHLY_MAX_CHARS) {
      console.warn(`[DeepL Quota Guard] Monthly limit ceiling reached (${usage.monthCharCount}/${MONTHLY_MAX_CHARS}). Skipping API call.`);
      return false;
    }

    if (usage.dayCharCount + charsToAdd > DAILY_MAX_CHARS) {
      console.warn(`[DeepL Quota Guard] Daily limit ceiling reached (${usage.dayCharCount}/${DAILY_MAX_CHARS}). Skipping API call.`);
      return false;
    }

    usage.monthCharCount += charsToAdd;
    usage.dayCharCount += charsToAdd;

    fs.writeFileSync(USAGE_FILE, JSON.stringify(usage, null, 2), 'utf-8');
    return true;
  } catch {
    return true;
  }
}

/**
 * Translate text using DeepL Free API with aggressive caching, text budgeting, and quota safety
 */
export async function translateWithDeepL(
  text: string,
  targetLang: 'EN' | 'TH',
  apiKey?: string
): Promise<string | null> {
  const clean = sanitizeTextForTranslation(text);
  if (!clean) return '';

  const cacheKey = `deepl:${targetLang}:${clean}`;
  if (memCache.has(cacheKey)) {
    return memCache.get(cacheKey)!;
  }

  const effectiveKey = apiKey || process.env.DEEPL_API_KEY || process.env.DEEPL_AUTH_KEY;
  if (!effectiveKey) {
    return null;
  }

  // Quota guard check before making HTTP request
  const charLength = clean.length;
  if (!checkAndUpdateUsage(charLength)) {
    return null;
  }

  try {
    const params = new URLSearchParams();
    params.append('text', clean);
    params.append('target_lang', targetLang === 'EN' ? 'EN-US' : 'TH');

    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${effectiveKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      console.warn(`[DeepL API] Response ${response.status}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    if (data && Array.isArray(data.translations) && data.translations.length > 0) {
      const translated = data.translations[0].text?.trim();
      if (translated) {
        memCache.set(cacheKey, translated);
        saveDiskCache();
        return translated;
      }
    }
  } catch (err) {
    console.warn('[DeepL API] Translation error:', err);
  }

  return null;
}

import {
  translateClean,
  translateListClean,
  isPrimarilyThai
} from '../utils/newsTranslationEngine';

/**
 * Async clean translation prioritizing cache/rules first, and falling back to DeepL Free API if needed & budgeted
 */
export async function translateCleanAsync(text: string | undefined, targetLang: 'th' | 'en'): Promise<string> {
  if (!text) return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  const isTargetTh = targetLang === 'th';
  const hasThai = isPrimarilyThai(trimmed);

  // If already in target language, return immediately with 0 API calls
  if (isTargetTh && hasThai) return trimmed;
  if (!isTargetTh && !hasThai) return trimmed;

  // 1. First attempt synchronous high-speed pattern engine
  const ruleResult = translateClean(trimmed, targetLang);
  const ruleHasThai = isPrimarilyThai(ruleResult);

  if ((isTargetTh && ruleHasThai && !ruleResult.startsWith('รายงานสารสนเทศตลาดสากล:')) || 
      (!isTargetTh && !ruleHasThai && !ruleResult.startsWith('Market Intelligence Report:'))) {
    return ruleResult;
  }

  // Check persistent disk cache before any network call
  const cacheKey = `deepl:${isTargetTh ? 'TH' : 'EN'}:${sanitizeTextForTranslation(trimmed)}`;
  if (memCache.has(cacheKey)) {
    return memCache.get(cacheKey)!;
  }

  // 2. If it's an unmapped short headline and DeepL is configured, invoke DeepL economically
  if (trimmed.length <= MAX_ITEM_LENGTH) {
    try {
      const deeplResult = await translateWithDeepL(trimmed, isTargetTh ? 'TH' : 'EN');
      if (deeplResult && deeplResult.trim()) {
        return deeplResult.trim();
      }
    } catch (err) {
      console.warn('[deeplTranslationService] DeepL async translation skipped:', err);
    }
  }

  // Fallback to rule result
  return ruleResult;
}

/**
 * Async translation for list items with quota awareness
 */
export async function translateListCleanAsync(list: string[] | undefined, targetLang: 'th' | 'en'): Promise<string[]> {
  if (!list || !Array.isArray(list)) return [];
  const results = await Promise.all(list.map((item) => translateCleanAsync(item, targetLang)));
  return results.filter(Boolean);
}

/**
 * Async enrichment for individual StockNewsItem (Zero-API for native fields)
 */
export async function enrichDualLanguageNewsItemAsync(item: any): Promise<any> {
  const isSrcThai = isPrimarilyThai(item.title || item.summary || item.title_th);

  // 1. Authentic Native Fields (100% Free, Zero API calls)
  const title_th = item.title_th || (isSrcThai ? item.title : await translateCleanAsync(item.title, 'th'));
  const title_en = item.title_en || (!isSrcThai ? item.title : await translateCleanAsync(item.title, 'en'));

  const summary_th = item.summary_th || (isSrcThai ? item.summary : (item.summary && isPrimarilyThai(item.summary) ? item.summary : 'รายงานสรุปสารสนเทศและภาพรวมตลาดการเงินโดย StockHomeTH'));
  const summary_en = item.summary_en || (!isSrcThai ? item.summary : (item.summary && !isPrimarilyThai(item.summary) ? item.summary : 'Executive market intelligence and strategic summary by StockHomeTH.'));

  const keyTakeaways_th = (item.keyTakeaways_th && item.keyTakeaways_th.length > 0)
    ? item.keyTakeaways_th
    : (isSrcThai ? item.keyTakeaways : await translateListCleanAsync(item.keyTakeaways, 'th'));

  const keyTakeaways_en = (item.keyTakeaways_en && item.keyTakeaways_en.length > 0)
    ? item.keyTakeaways_en
    : (!isSrcThai ? item.keyTakeaways : await translateListCleanAsync(item.keyTakeaways, 'en'));

  const periodLabel_th = item.periodLabel_th || translateClean(item.periodLabel, 'th');
  const periodLabel_en = item.periodLabel_en || translateClean(item.periodLabel, 'en');

  const fullContent_th = item.fullContent_th || (isSrcThai ? item.fullContent : `${title_th}\n\n${summary_th}`);
  const fullContent_en = item.fullContent_en || (!isSrcThai ? item.fullContent : `${title_en}\n\n${summary_en}`);

  return {
    ...item,
    title: isSrcThai ? title_th : title_en,
    title_th,
    title_en,
    summary: isSrcThai ? summary_th : summary_en,
    summary_th,
    summary_en,
    keyTakeaways: isSrcThai ? keyTakeaways_th : keyTakeaways_en,
    keyTakeaways_th,
    keyTakeaways_en,
    periodLabel: isSrcThai ? periodLabel_th : periodLabel_en,
    periodLabel_th,
    periodLabel_en,
    fullContent: isSrcThai ? fullContent_th : fullContent_en,
    fullContent_th,
    fullContent_en,
  };
}

/**
 * Async enrichment for DigestSummary
 */
export async function enrichDualLanguageDigestSummaryAsync(digest: any): Promise<any> {
  if (!digest) return digest;

  const mainHeadline_th = digest.mainHeadline_th || await translateCleanAsync(digest.mainHeadline, 'th');
  const mainHeadline_en = digest.mainHeadline_en || await translateCleanAsync(digest.mainHeadline, 'en');

  const overviewSummary_th = digest.overviewSummary_th || await translateCleanAsync(digest.overviewSummary, 'th');
  const overviewSummary_en = digest.overviewSummary_en || await translateCleanAsync(digest.overviewSummary, 'en');

  const keyCatalysts_th = digest.keyCatalysts_th || await translateListCleanAsync(digest.keyCatalysts, 'th');
  const keyCatalysts_en = digest.keyCatalysts_en || await translateListCleanAsync(digest.keyCatalysts, 'en');

  const thaiCatalysts_th = digest.thaiCatalysts_th || await translateListCleanAsync(digest.thaiCatalysts, 'th');
  const thaiCatalysts_en = digest.thaiCatalysts_en || await translateListCleanAsync(digest.thaiCatalysts, 'en');

  const usCatalysts_th = digest.usCatalysts_th || await translateListCleanAsync(digest.usCatalysts, 'th');
  const usCatalysts_en = digest.usCatalysts_en || await translateListCleanAsync(digest.usCatalysts, 'en');

  const periodLabel_th = digest.periodLabel_th || translateClean(digest.periodLabel, 'th');
  const periodLabel_en = digest.periodLabel_en || translateClean(digest.periodLabel, 'en');

  return {
    ...digest,
    mainHeadline: digest.mainHeadline,
    mainHeadline_th,
    mainHeadline_en,
    overviewSummary: digest.overviewSummary,
    overviewSummary_th,
    overviewSummary_en,
    keyCatalysts: digest.keyCatalysts || [],
    keyCatalysts_th,
    keyCatalysts_en,
    thaiCatalysts: digest.thaiCatalysts || [],
    thaiCatalysts_th,
    thaiCatalysts_en,
    usCatalysts: digest.usCatalysts || [],
    usCatalysts_th,
    usCatalysts_en,
    periodLabel: digest.periodLabel,
    periodLabel_th,
    periodLabel_en,
  };
}


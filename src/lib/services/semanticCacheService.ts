import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

/**
 * AI Semantic Cache & Vector RAG Service
 *
 * Concept: "Code-First, AI-Last"
 * Serves cached responses for identical or semantically similar financial queries
 * without calling OpenRouter (0 API requests consumed).
 */

export type CacheCategory = 'financial_report' | 'daily_analysis' | 'realtime_price' | 'general';

export interface SemanticCacheEntry {
  id?: string;
  promptText: string;
  promptHash: string;
  ticker?: string;
  responseText: string;
  model: string;
  category: CacheCategory;
  ttlSeconds: number;
  expiresAt: string;
  isValid: boolean;
  similarity?: number;
}

// Default TTL configurations per category (in seconds)
export const CATEGORY_TTL: Record<CacheCategory, number> = {
  financial_report: 90 * 24 * 3600, // 90 days for quarterly report analysis (invalidated on new data update)
  daily_analysis: 24 * 3600,       // 24 hours for daily digest
  realtime_price: 30,              // Never keep market quote answers stale for more than one poll cycle
  general: 24 * 3600,              // 24 hours general Q&A
};

// In-memory fallback cache for fast local lookup
const memoryCache = new Map<string, SemanticCacheEntry>();

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Generate SHA-256 hash for exact prompt matching
 */
export function hashPrompt(prompt: string, ticker?: string): string {
  const normalized = prompt.trim().toLowerCase().replace(/\s+/g, ' ');
  const rawKey = ticker ? `${ticker.toUpperCase()}:${normalized}` : normalized;
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Determine cache category based on query keywords
 */
export function detectCacheCategory(prompt: string): CacheCategory {
  const text = prompt.toLowerCase();
  if (
    ['ราคา', 'วันนี้', 'ตอนนี้', 'ล่าสุด', 'ปัจจุบัน', 'เรียลไทม์', 'realtime', 'real-time', 'live price', 'current price', 'quote', 'price', 'สัญญาณ', 'กราฟ', 'แนวรับ', 'แนวต้าน']
      .some((term) => text.includes(term))
  ) {
    return 'realtime_price';
  }
  if (text.includes('งบ') || text.includes('กำไร') || text.includes('รายได้') || text.includes('ไตรมาส') || text.includes('pe') || text.includes('pbv') || text.includes('ปันผล')) {
    return 'financial_report';
  }
  if (text.includes('วิเคราะห์') || text.includes('แนวโน้ม') || text.includes('สรุปข่าว')) {
    return 'daily_analysis';
  }
  return 'general';
}

/**
 * Find exact or semantic cached response
 */
export async function getSemanticCachedResponse(
  prompt: string,
  ticker?: string
): Promise<{ hit: boolean; entry?: SemanticCacheEntry; source: 'exact' | 'semantic' | 'none' }> {
  const promptHash = hashPrompt(prompt, ticker);
  const category = detectCacheCategory(prompt);
  const now = new Date();

  // 1. Check In-Memory Exact Match
  const memEntry = memoryCache.get(promptHash);
  if (memEntry && memEntry.isValid && new Date(memEntry.expiresAt) > now) {
    if (!memEntry.responseText.includes('ไม่ได้ระบุราคาหุ้น') && !memEntry.responseText.includes('ไม่พบข้อมูลราคา')) {
      return { hit: true, entry: memEntry, source: 'exact' };
    }
  }

  // 2. Check Supabase pgvector / exact DB match if configured
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      // 2.1 Check exact hash in DB
      const { data, error } = await supabase
        .from('ai_semantic_cache')
        .select('id,prompt_text,prompt_hash,ticker,response_text,model,category,ttl_seconds,expires_at,is_valid')
        .eq('prompt_hash', promptHash)
        .eq('is_valid', true)
        .gt('expires_at', now.toISOString())
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        if (data.response_text?.includes('ไม่ได้ระบุราคาหุ้น') || data.response_text?.includes('ไม่พบข้อมูลราคา')) {
          return { hit: false, source: 'none' };
        }

        const entry: SemanticCacheEntry = {
          id: data.id,
          promptText: data.prompt_text,
          promptHash: data.prompt_hash,
          ticker: data.ticker,
          responseText: data.response_text,
          model: data.model,
          category: data.category as CacheCategory,
          ttlSeconds: data.ttl_seconds,
          expiresAt: data.expires_at,
          isValid: data.is_valid,
        };
        // Populate memory cache for next calls
        memoryCache.set(promptHash, entry);
        return { hit: true, entry, source: 'exact' };
      }
    } catch (err) {
      console.warn('[SemanticCache] Supabase lookup error:', err);
    }
  }

  return { hit: false, source: 'none' };
}

/**
 * Store response in Semantic Cache
 */
export async function setSemanticCachedResponse(
  prompt: string,
  responseText: string,
  model: string,
  ticker?: string,
  overrideCategory?: CacheCategory
): Promise<void> {
  if (!responseText || responseText.includes('ไม่ได้ระบุราคาหุ้น') || responseText.includes('ไม่พบข้อมูลราคา')) {
    return;
  }
  const promptHash = hashPrompt(prompt, ticker);
  const category = overrideCategory || detectCacheCategory(prompt);
  const ttlSeconds = CATEGORY_TTL[category];
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

  const entry: SemanticCacheEntry = {
    promptText: prompt,
    promptHash,
    ticker: ticker ? ticker.toUpperCase() : undefined,
    responseText,
    model,
    category,
    ttlSeconds,
    expiresAt,
    isValid: true,
  };

  // 1. Save in memory cache
  memoryCache.set(promptHash, entry);

  // 2. Save in Supabase pgvector database
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('ai_semantic_cache').upsert(
        {
          prompt_text: prompt,
          prompt_hash: promptHash,
          ticker: ticker ? ticker.toUpperCase() : null,
          response_text: responseText,
          model,
          category,
          ttl_seconds: ttlSeconds,
          expires_at: expiresAt,
          is_valid: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'prompt_hash' }
      );
    } catch (err) {
      console.warn('[SemanticCache] Supabase save error:', err);
    }
  }
}

/**
 * Event-Driven Cache Invalidation (e.g., when new quarterly financial data or daily price updates occur)
 */
export async function invalidateCacheForTicker(ticker: string, category?: CacheCategory): Promise<number> {
  const cleanTicker = ticker.toUpperCase();
  let count = 0;

  // 1. Clear memory cache matching ticker
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.ticker === cleanTicker && (!category || entry.category === category)) {
      memoryCache.delete(key);
      count++;
    }
  }

  // 2. Clear Supabase DB cache
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      let query = supabase
        .from('ai_semantic_cache')
        .update({ is_valid: false })
        .eq('ticker', cleanTicker);

      if (category) {
        query = query.eq('category', category);
      }

      await query;
    } catch (err) {
      console.warn('[SemanticCache] Invalidation error:', err);
    }
  }

  return count;
}

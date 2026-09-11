import fs from 'fs';
import path from 'path';

/**
 * OpenRouter Guard Service
 * 
 * Manages rate limiting, response caching, and idle-protection for OpenRouter API.
 * Requirement: "ถ้าไม่มีคนใช้เลยให้ยิง API แค่ 1 ครั้งต่อวันพอ"
 * (If no users are active, limit background/idle API calls to at most 1 time per day)
 */

const USAGE_FILE = path.resolve(process.cwd(), 'openrouter_usage.json');
const RESPONSE_CACHE_FILE = path.resolve(process.cwd(), 'openrouter_cache.json');

// Idle threshold: 30 minutes of no user message qualifies as idle state
const IDLE_THRESHOLD_MS = 30 * 60 * 1000;
// Cache TTL for identical question & model: 12 hours
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

export interface OpenRouterDailyUsage {
  date: string; // YYYY-MM-DD
  userRequestsToday: number;
  idleRequestsToday: number; // strictly capped at 1 per day
  lastUserActivity: number; // timestamp ms
  lastApiRequestTime: number; // timestamp ms
}

// In-memory cache for recent responses
const responseCache = new Map<string, { timestamp: number; content: string; model: string }>();

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Load usage data from persistent JSON file
 */
export function loadOpenRouterUsage(): OpenRouterDailyUsage {
  const today = getTodayString();
  const defaultUsage: OpenRouterDailyUsage = {
    date: today,
    userRequestsToday: 0,
    idleRequestsToday: 0,
    lastUserActivity: 0,
    lastApiRequestTime: 0,
  };

  try {
    if (fs.existsSync(USAGE_FILE)) {
      const raw = fs.readFileSync(USAGE_FILE, 'utf-8');
      const data = JSON.parse(raw) as OpenRouterDailyUsage;
      if (data.date === today) {
        return data;
      }
      // New day: reset daily counters, keep lastUserActivity
      return {
        ...defaultUsage,
        lastUserActivity: data.lastUserActivity || 0,
      };
    }
  } catch (err) {
    console.warn('[OpenRouter Guard] Failed to read usage file:', err);
  }

  return defaultUsage;
}

/**
 * Save usage data to persistent JSON file
 */
export function saveOpenRouterUsage(usage: OpenRouterDailyUsage): void {
  try {
    fs.writeFileSync(USAGE_FILE, JSON.stringify(usage, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[OpenRouter Guard] Failed to write usage file:', err);
  }
}

/**
 * Load disk cache for identical responses
 */
function initDiskCache(): void {
  try {
    if (fs.existsSync(RESPONSE_CACHE_FILE)) {
      const raw = fs.readFileSync(RESPONSE_CACHE_FILE, 'utf-8');
      const data = JSON.parse(raw);
      const now = Date.now();
      for (const [k, v] of Object.entries(data)) {
        const item = v as { timestamp: number; content: string; model: string };
        if (now - item.timestamp < CACHE_TTL_MS) {
          responseCache.set(k, item);
        }
      }
    }
  } catch {}
}

initDiskCache();

function persistDiskCache(): void {
  try {
    const obj: Record<string, any> = {};
    for (const [k, v] of responseCache.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(RESPONSE_CACHE_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch {}
}

/**
 * Check if a request can proceed to OpenRouter.
 * 
 * Rules:
 * 1. If it is an automated / background / idle check (no active user within IDLE_THRESHOLD):
 *    Allow ONLY 1 request per day!
 * 2. If a real user is asking:
 *    Record user activity and allow with rate protection.
 */
export function canExecuteOpenRouterRequest(isRealUserAction: boolean): {
  allowed: boolean;
  reason?: string;
  isIdle: boolean;
} {
  const usage = loadOpenRouterUsage();
  const now = Date.now();
  const timeSinceLastUser = now - (usage.lastUserActivity || 0);
  const isIdle = !isRealUserAction && (usage.lastUserActivity === 0 || timeSinceLastUser > IDLE_THRESHOLD_MS);

  if (isIdle) {
    // Idle / background ping: STRICT LIMIT 1 TIME PER DAY
    if (usage.idleRequestsToday >= 1) {
      return {
        allowed: false,
        reason: 'ไม่มีผู้ใช้งาน active ในขณะนี้: ระบบจำกัดการเรียก OpenRouter API อัตโนมัติไว้ที่ 1 ครั้งต่อวันเพื่อประหยัดโควตา',
        isIdle: true,
      };
    }
  }

  return { allowed: true, isIdle };
}

/**
 * Record successful OpenRouter request
 */
export function recordOpenRouterRequest(isRealUserAction: boolean): void {
  const usage = loadOpenRouterUsage();
  const now = Date.now();

  if (isRealUserAction) {
    usage.userRequestsToday += 1;
    usage.lastUserActivity = now;
  } else {
    usage.idleRequestsToday += 1;
  }

  usage.lastApiRequestTime = now;
  saveOpenRouterUsage(usage);
}

/**
 * Generate a cache key for chat messages
 */
export function getChatCacheKey(model: string, lastUserMessage: string): string {
  const clean = lastUserMessage.trim().toLowerCase().slice(0, 150);
  return `${model}:${clean}`;
}

/**
 * Look up in-memory / persistent response cache
 */
export function getCachedChatResponse(key: string): string | null {
  const cached = responseCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    responseCache.delete(key);
    return null;
  }
  return cached.content;
}

/**
 * Store response in cache
 */
export function setCachedChatResponse(key: string, content: string, model: string): void {
  responseCache.set(key, { timestamp: Date.now(), content, model });
  // Persist periodically
  persistDiskCache();
}

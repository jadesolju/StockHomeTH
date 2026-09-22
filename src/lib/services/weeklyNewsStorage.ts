import fs from 'fs';
import path from 'path';
import type { StockNewsItem, DigestSummary } from '../schemas/newsSchema';
import { StockNewsItemSchema, DigestSummarySchema } from '../schemas/newsSchema';
import { putJsonToR2, getJsonFromR2 } from './cloudflareR2Service';

// Dynamic cache path supporting local filesystem and Vercel /tmp serverless writable storage
const isVercel = process.env.VERCEL === '1';
const CACHE_FILE_PATH = isVercel
  ? path.resolve('/tmp', 'weekly_news_cache.json')
  : path.resolve(process.cwd(), 'weekly_news_cache.json');
const OVERVIEW_CACHE_PATH = isVercel
  ? path.resolve('/tmp', 'weekly_overview_cache.json')
  : path.resolve(process.cwd(), 'weekly_overview_cache.json');

const R2_DIGEST_KEY = 'news/weekly_digest.json';

// In-memory hot cache
let inMemoryNews: StockNewsItem[] | null = null;
let inMemoryOverview: DigestSummary | null = null;

/**
 * Save weekly news items to persistent storage (R2 Cloud Object Storage & Local JSON Cache)
 */
export async function saveWeeklyNewsToStorage(items: StockNewsItem[]): Promise<boolean> {
  try {
    if (!items || items.length === 0) return false;
    inMemoryNews = items;

    // 1. Write to local JSON cache file (graceful write)
    const payload = {
      timestamp: new Date().toISOString(),
      count: items.length,
      overview: inMemoryOverview || null,
      data: items,
      items: items,
    };

    try {
      fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
    } catch {}

    // 2. Offload to Cloudflare R2 (Zero Egress storage) in background
    putJsonToR2(R2_DIGEST_KEY, payload, { maxAge: 600 }).catch((err) => {
      console.warn('[WeeklyStorage] R2 putJson error:', err);
    });

    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Load weekly news items from persistent storage (Memory -> R2 -> Local JSON)
 */
export async function loadWeeklyNewsFromStorage(): Promise<StockNewsItem[] | null> {
  // 1. Hot Memory Cache
  if (inMemoryNews && inMemoryNews.length > 0) return inMemoryNews;

  // 2. Cloudflare R2 Distributed Storage
  try {
    const r2Data = await getJsonFromR2<{ data?: unknown[]; items?: unknown[] } | unknown[]>(R2_DIGEST_KEY);
    if (r2Data) {
      const rawList = Array.isArray(r2Data) ? r2Data : r2Data.data || r2Data.items;
      if (rawList && Array.isArray(rawList) && rawList.length > 0) {
        const validated = rawList
          .map((item: unknown) => {
            try {
              return StockNewsItemSchema.parse(item);
            } catch {
              return null;
            }
          })
          .filter((i: StockNewsItem | null): i is StockNewsItem => i !== null);

        if (validated.length > 0) {
          inMemoryNews = validated;
          return validated;
        }
      }
    }
  } catch (err) {
    // Graceful fallback to disk
  }

  // 3. Fallback to Local Disk Cache
  try {
    if (!fs.existsSync(CACHE_FILE_PATH)) return null;

    const raw = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    const rawList = Array.isArray(parsed) ? parsed : Array.isArray(parsed.data) ? parsed.data : parsed.items;

    if (rawList && rawList.length > 0) {
      const validated = rawList
        .map((item: unknown) => {
          try {
            return StockNewsItemSchema.parse(item);
          } catch {
            return null;
          }
        })
        .filter((i: StockNewsItem | null): i is StockNewsItem => i !== null);

      if (validated.length > 0) {
        inMemoryNews = validated;
        return validated;
      }
    }
  } catch (err) {
    // Graceful fallback
  }
  return null;
}

/**
 * Save weekly digest overview to persistent storage (R2 & Local Disk)
 */
export async function saveWeeklyOverviewToStorage(overview: DigestSummary): Promise<boolean> {
  try {
    if (!overview) return false;
    inMemoryOverview = overview;

    const payload = {
      timestamp: new Date().toISOString(),
      data: overview,
    };

    try {
      fs.writeFileSync(OVERVIEW_CACHE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
    } catch {}

    // Also update R2 package if news items are present
    if (inMemoryNews && inMemoryNews.length > 0) {
      const combinedPayload = {
        timestamp: new Date().toISOString(),
        count: inMemoryNews.length,
        overview,
        data: inMemoryNews,
        items: inMemoryNews,
      };
      putJsonToR2(R2_DIGEST_KEY, combinedPayload, { maxAge: 600 }).catch(() => {});
    }

    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Load weekly digest overview from persistent storage (Memory -> R2 -> Local Disk)
 */
export async function loadWeeklyOverviewFromStorage(): Promise<DigestSummary | null> {
  // 1. Hot Memory Cache
  if (inMemoryOverview) return inMemoryOverview;

  // 2. Cloudflare R2 Distributed Storage
  try {
    const r2Data = await getJsonFromR2<{ overview?: unknown; data?: unknown }>(R2_DIGEST_KEY);
    if (r2Data && (r2Data.overview || r2Data.data)) {
      const candidate = r2Data.overview || r2Data.data;
      try {
        const val = DigestSummarySchema.parse(candidate);
        inMemoryOverview = val;
        return val;
      } catch {}
    }
  } catch {}

  // 3. Fallback to Local Disk Cache
  try {
    if (!fs.existsSync(OVERVIEW_CACHE_PATH)) return null;

    const raw = fs.readFileSync(OVERVIEW_CACHE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    const rawData = parsed.data || parsed;

    if (rawData) {
      const val = DigestSummarySchema.parse(rawData);
      inMemoryOverview = val;
      return val;
    }
  } catch (err) {
    // Graceful fallback
  }
  return null;
}

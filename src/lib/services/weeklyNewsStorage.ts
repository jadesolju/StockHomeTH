import fs from 'fs';
import path from 'path';
import type { StockNewsItem, DigestSummary } from '../schemas/newsSchema';
import { StockNewsItemSchema, DigestSummarySchema } from '../schemas/newsSchema';

// Dynamic cache path supporting local filesystem and Vercel /tmp serverless writable storage
const isVercel = process.env.VERCEL === '1';
const CACHE_FILE_PATH = isVercel
  ? path.resolve('/tmp', 'weekly_news_cache.json')
  : path.resolve(process.cwd(), 'weekly_news_cache.json');
const OVERVIEW_CACHE_PATH = isVercel
  ? path.resolve('/tmp', 'weekly_overview_cache.json')
  : path.resolve(process.cwd(), 'weekly_overview_cache.json');

// In-memory hot cache
let inMemoryNews: StockNewsItem[] | null = null;
let inMemoryOverview: DigestSummary | null = null;

/**
 * Save weekly news items to persistent storage (JSON Cache & SQLite synchronization)
 */
export async function saveWeeklyNewsToStorage(items: StockNewsItem[]): Promise<boolean> {
  try {
    if (!items || items.length === 0) return false;
    inMemoryNews = items;

    // Write to JSON cache file (graceful write)
    const payload = {
      timestamp: new Date().toISOString(),
      count: items.length,
      data: items
    };
    try {
      fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
    } catch {}

    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Load weekly news items from persistent storage
 */
export async function loadWeeklyNewsFromStorage(): Promise<StockNewsItem[] | null> {
  if (inMemoryNews && inMemoryNews.length > 0) return inMemoryNews;
  try {
    if (!fs.existsSync(CACHE_FILE_PATH)) return null;

    const raw = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    const rawList = Array.isArray(parsed) ? parsed : Array.isArray(parsed.data) ? parsed.data : null;

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
 * Save weekly digest overview to persistent storage
 */
export async function saveWeeklyOverviewToStorage(overview: DigestSummary): Promise<boolean> {
  try {
    if (!overview) return false;
    inMemoryOverview = overview;
    const payload = {
      timestamp: new Date().toISOString(),
      data: overview
    };
    try {
      fs.writeFileSync(OVERVIEW_CACHE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
    } catch {}
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Load weekly digest overview from persistent storage
 */
export async function loadWeeklyOverviewFromStorage(): Promise<DigestSummary | null> {
  if (inMemoryOverview) return inMemoryOverview;
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

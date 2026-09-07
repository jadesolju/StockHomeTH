import fs from 'fs';
import path from 'path';
import type { StockNewsItem, DigestSummary } from '../schemas/newsSchema';
import { StockNewsItemSchema, DigestSummarySchema } from '../schemas/newsSchema';

const CACHE_FILE_PATH = path.resolve(process.cwd(), 'weekly_news_cache.json');
const OVERVIEW_CACHE_PATH = path.resolve(process.cwd(), 'weekly_overview_cache.json');

/**
 * Save weekly news items to persistent storage (JSON Cache & SQLite synchronization)
 */
export async function saveWeeklyNewsToStorage(items: StockNewsItem[]): Promise<boolean> {
  try {
    if (!items || items.length === 0) return false;

    // 1. Write to JSON cache file
    const payload = {
      timestamp: new Date().toISOString(),
      count: items.length,
      data: items
    };
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(payload, null, 2), 'utf-8');

    return true;
  } catch (err) {
    console.warn('[weeklyNewsStorage] Save error:', err);
    return false;
  }
}

/**
 * Load weekly news items from persistent storage
 */
export async function loadWeeklyNewsFromStorage(): Promise<StockNewsItem[] | null> {
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
        return validated;
      }
    }
  } catch (err) {
    console.warn('[weeklyNewsStorage] Load error:', err);
  }
  return null;
}

/**
 * Save weekly digest overview to persistent storage
 */
export async function saveWeeklyOverviewToStorage(overview: DigestSummary): Promise<boolean> {
  try {
    if (!overview) return false;
    const payload = {
      timestamp: new Date().toISOString(),
      data: overview
    };
    fs.writeFileSync(OVERVIEW_CACHE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.warn('[weeklyNewsStorage] Save overview error:', err);
    return false;
  }
}

/**
 * Load weekly digest overview from persistent storage
 */
export async function loadWeeklyOverviewFromStorage(): Promise<DigestSummary | null> {
  try {
    if (!fs.existsSync(OVERVIEW_CACHE_PATH)) return null;

    const raw = fs.readFileSync(OVERVIEW_CACHE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    const rawData = parsed.data || parsed;

    if (rawData) {
      return DigestSummarySchema.parse(rawData);
    }
  } catch (err) {
    console.warn('[weeklyNewsStorage] Load overview error:', err);
  }
  return null;
}

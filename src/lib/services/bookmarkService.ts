import type { StockNewsItem as NewsItem } from '../schemas/newsSchema';

const STORAGE_KEY_PREFIX = 'stockhome_user_bookmarks_';

function isStorageAvailable(): boolean {
  return typeof localStorage !== 'undefined';
}

function getLocalBookmarks(uid: string): any[] {
  if (!isStorageAvailable() || !uid) return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${uid}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalBookmarks(uid: string, items: any[]) {
  if (!isStorageAvailable() || !uid) return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${uid}`, JSON.stringify(items));
    // Save simple id array scoped by user uid for backward compatibility
    localStorage.setItem(`stockhome_bookmarked_ids_${uid}`, JSON.stringify(items.map(i => i.newsId || i.id)));
  } catch {}
}

export async function isNewsBookmarked(uid: string, newsId: string): Promise<boolean> {
  if (!uid || !newsId) return false;
  const local = getLocalBookmarks(uid);
  return local.some(b => (b.newsId || b.id) === newsId);
}

export async function toggleBookmark(uid: string, newsItem: NewsItem, currentlyBookmarked: boolean): Promise<boolean> {
  if (!uid || !newsItem || !newsItem.id) return currentlyBookmarked;

  // 1. Update Local Storage instantly
  const local = getLocalBookmarks(uid);
  let updatedLocal: any[] = [];
  if (currentlyBookmarked) {
    updatedLocal = local.filter(b => (b.newsId || b.id) !== newsItem.id);
  } else {
    updatedLocal = [
      {
        id: `bm-${newsItem.id}`,
        newsId: newsItem.id,
        title: newsItem.title,
        link: newsItem.link || newsItem.sourceUrl || '',
        source: newsItem.source || 'StockHomeTH',
        symbols: newsItem.tickers || [],
        savedAt: new Date().toISOString(),
      },
      ...local.filter(b => (b.newsId || b.id) !== newsItem.id)
    ];
  }
  saveLocalBookmarks(uid, updatedLocal);

  // 2. Persist to Supabase via Server API Route (Vercel & Local ready)
  try {
    const res = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: uid,
        newsItem,
        isBookmarked: currentlyBookmarked
      })
    });
    if (res.ok) {
      const json = await res.json();
      return json.isBookmarked ?? !currentlyBookmarked;
    }
  } catch (error) {
    console.warn('Network error saving bookmark to Supabase:', error);
  }

  return !currentlyBookmarked;
}

export function migrateGuestBookmarksToUser(uid: string): void {
  if (!isStorageAvailable() || !uid || uid === 'guest') return;
  try {
    const guestBookmarks = getLocalBookmarks('guest');
    const legacyRaw = localStorage.getItem('stockhome_bookmarked_ids');
    let legacyIds: string[] = [];
    if (legacyRaw) {
      try {
        const parsed = JSON.parse(legacyRaw);
        if (Array.isArray(parsed)) legacyIds = parsed;
      } catch {}
    }

    if (guestBookmarks.length === 0 && legacyIds.length === 0) return;

    const userBookmarks = getLocalBookmarks(uid);
    const userMap = new Map();
    for (const b of userBookmarks) {
      userMap.set(b.newsId || b.id, b);
    }

    let migrated = false;
    for (const gb of guestBookmarks) {
      const key = gb.newsId || gb.id;
      if (key && !userMap.has(key)) {
        userMap.set(key, gb);
        migrated = true;
      }
    }

    if (migrated) {
      const merged = Array.from(userMap.values());
      saveLocalBookmarks(uid, merged);
    }

    localStorage.removeItem(`${STORAGE_KEY_PREFIX}guest`);
    localStorage.removeItem('stockhome_bookmarked_ids_guest');
  } catch (err) {
    console.warn('[bookmarkService] Guest bookmark migration failed:', err);
  }
}

export async function getUserBookmarks(uid: string) {
  if (!uid) return [];
  if (uid !== 'guest') {
    migrateGuestBookmarksToUser(uid);
  }
  const local = getLocalBookmarks(uid);

  try {
    const res = await fetch(`/api/bookmarks?userId=${encodeURIComponent(uid)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.bookmarks)) {
        // Merge Supabase items with local items
        const mergedMap = new Map();
        for (const b of json.bookmarks) {
          mergedMap.set(b.newsId, b);
        }
        for (const b of local) {
          if (!mergedMap.has(b.newsId || b.id)) {
            mergedMap.set(b.newsId || b.id, b);
          }
        }
        const merged = Array.from(mergedMap.values());
        saveLocalBookmarks(uid, merged);
        return merged;
      }
    }
  } catch (error) {
    console.warn('Error fetching bookmarks from Supabase:', error);
  }

  return local;
}



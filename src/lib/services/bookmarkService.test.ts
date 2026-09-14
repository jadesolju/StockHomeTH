import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isNewsBookmarked,
  migrateGuestBookmarksToUser,
  getUserBookmarks,
} from './bookmarkService';

describe('BookmarkService & Guest Migration', () => {
  beforeEach(() => {
    // Clear mock localStorage
    const storage: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage[key] || null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        for (const k in storage) delete storage[k];
      },
    });
  });

  it('checks if news is bookmarked correctly', async () => {
    const isBm = await isNewsBookmarked('test_user', 'news_123');
    expect(isBm).toBe(false);
  });

  it('migrates guest bookmarks into authenticated user bookmarks on login', async () => {
    const guestBookmarks = [
      {
        id: 'bm-news-1',
        newsId: 'news-1',
        title: 'SpaceX Starship Orbital Test',
        source: 'StockHomeTH',
      },
      {
        id: 'bm-news-2',
        newsId: 'news-2',
        title: 'NVDA AI Chip Demand Surges',
        source: 'TechNews',
      },
    ];

    // Seed guest bookmarks in localStorage
    localStorage.setItem('stockhome_user_bookmarks_guest', JSON.stringify(guestBookmarks));
    localStorage.setItem('stockhome_bookmarked_ids', JSON.stringify(['news-1', 'news-2']));

    // Migrate to logged-in user
    const userUid = 'user_firebase_777';
    migrateGuestBookmarksToUser(userUid);

    // Guest storage should be cleaned up
    expect(localStorage.getItem('stockhome_user_bookmarks_guest')).toBeNull();

    // User bookmarks should now contain the migrated items
    const userRaw = localStorage.getItem(`stockhome_user_bookmarks_${userUid}`);
    expect(userRaw).not.toBeNull();
    const userBookmarks = JSON.parse(userRaw!);
    expect(userBookmarks.length).toBe(2);
    expect(userBookmarks[0].newsId).toBe('news-1');
    expect(userBookmarks[1].newsId).toBe('news-2');

    // Scoped bookmarked ids should also be saved
    const userIdsRaw = localStorage.getItem(`stockhome_bookmarked_ids_${userUid}`);
    expect(userIdsRaw).not.toBeNull();
    const userIds = JSON.parse(userIdsRaw!);
    expect(userIds).toEqual(['news-1', 'news-2']);
  });
});

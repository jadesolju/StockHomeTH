import { describe, it, expect, beforeEach, vi } from 'vitest';

// In-memory localStorage mock for node environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'window', {
  value: globalThis,
  writable: true,
});

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => {
  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnValue({
      then: vi.fn().mockReturnValue({ catch: vi.fn() }),
      catch: vi.fn(),
    }),
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          then: vi.fn().mockReturnValue({ catch: vi.fn() }),
          catch: vi.fn(),
        }),
        then: vi.fn().mockReturnValue({ catch: vi.fn() }),
        catch: vi.fn(),
      }),
      then: vi.fn().mockReturnValue({ catch: vi.fn() }),
      catch: vi.fn(),
    }),
  };

  return {
    supabase: {
      from: vi.fn().mockReturnValue(mockQueryBuilder),
      channel: vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnValue({}),
      }),
      removeChannel: vi.fn().mockResolvedValue({}),
    },
  };
});

import {
  getUserStorageKey,
  loadUserSessions,
  saveUserSessions,
  createSession,
  updateSession,
  deleteSession,
  migrateGuestSessionsToUser,
  subscribeToUserCloudSessions,
  ChatSession,
} from './aiChatHistoryService';

describe('aiChatHistoryService', () => {
  const userUid = 'test_user_123';

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getUserStorageKey', () => {
    it('returns user key when userUid is provided', () => {
      expect(getUserStorageKey(userUid)).toBe('stockhome_ai_sessions_user_test_user_123');
    });

    it('returns guest key when userUid is null or empty', () => {
      expect(getUserStorageKey(null)).toBe('stockhome_ai_sessions_guest');
    });
  });

  describe('loadUserSessions and saveUserSessions', () => {
    it('saves and loads sessions correctly from localStorage', () => {
      const mockSessions: ChatSession[] = [
        {
          id: 'sess_1',
          title: 'Test Session 1',
          modelId: 'gpt-4o',
          messages: [{ id: 'm1', role: 'user', content: 'Hello', timestamp: '2025-01-01' }],
          createdAt: 1000,
          updatedAt: 1000,
        },
      ];

      saveUserSessions(userUid, mockSessions);
      const loaded = loadUserSessions(userUid);

      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe('sess_1');
      expect(loaded[0].title).toBe('Test Session 1');
    });

    it('returns empty array if no sessions stored', () => {
      expect(loadUserSessions(userUid)).toEqual([]);
    });
  });

  describe('createSession', () => {
    it('creates a new session with truncated prompt as title', () => {
      const session = createSession(
        userUid,
        'วิเคราะห์หุ้น PTT ในตลาด SET',
        'gpt-4o',
        [{ id: 'm1', role: 'user', content: 'วิเคราะห์หุ้น PTT ในตลาด SET', timestamp: '2025-01-01' }]
      );

      expect(session.id).toBeDefined();
      expect(session.title).toBe('วิเคราะห์หุ้น PTT ในตลาด SET');
      expect(session.modelId).toBe('gpt-4o');

      const loaded = loadUserSessions(userUid);
      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe(session.id);
    });
  });

  describe('updateSession', () => {
    it('updates an existing session with new messages', () => {
      const session = createSession(userUid, 'Initial', 'gpt-4o');
      const updatedMessages = [
        { id: 'm1', role: 'user' as const, content: 'Initial', timestamp: '2025-01-01' },
        { id: 'm2', role: 'assistant' as const, content: 'Response', timestamp: '2025-01-01' },
      ];

      const sessions = updateSession(userUid, session.id, updatedMessages);
      expect(sessions[0].messages).toHaveLength(2);
      expect(sessions[0].messages[1].content).toBe('Response');
    });
  });

  describe('deleteSession', () => {
    it('deletes a session from local storage', () => {
      const session1 = createSession(userUid, 'Session 1', 'gpt-4o');
      const session2 = createSession(userUid, 'Session 2', 'gpt-4o');

      expect(loadUserSessions(userUid)).toHaveLength(2);

      const remaining = deleteSession(userUid, session1.id);
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(session2.id);
    });
  });

  describe('migrateGuestSessionsToUser', () => {
    it('migrates guest sessions into user account and clears guest key', () => {
      localStorage.setItem('gemcoin_user_id', 'guest_123');
      const guestKey = 'stockhome_ai_sessions_guest_guest_123';
      const guestSessions: ChatSession[] = [
        {
          id: 'guest_sess_1',
          title: 'Guest Chat',
          modelId: 'gpt-4o',
          messages: [{ id: 'm1', role: 'user', content: 'Guest prompt', timestamp: '2025-01-01' }],
          createdAt: 500,
          updatedAt: 500,
        },
      ];
      localStorage.setItem(guestKey, JSON.stringify(guestSessions));

      migrateGuestSessionsToUser(userUid);

      const userSessions = loadUserSessions(userUid);
      expect(userSessions).toHaveLength(1);
      expect(userSessions[0].id).toBe('guest_sess_1');
      expect(localStorage.getItem(guestKey)).toBeNull();
    });
  });

  describe('subscribeToUserCloudSessions', () => {
    it('establishes realtime subscription and returns cleanup unsubscribe function', () => {
      let updatedSessions: ChatSession[] = [];
      const unsub = subscribeToUserCloudSessions(userUid, (sessions) => {
        updatedSessions = sessions;
      });

      expect(typeof unsub).toBe('function');
      unsub();
    });
  });
});

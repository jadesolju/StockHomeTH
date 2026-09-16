/**
 * AI Chat History Service
 * Manages isolated chat sessions and message histories per user account.
 * Features Real-Time Cloud Sync across PC and Mobile via Supabase PostgreSQL & Server API.
 */

import { supabase } from '@/lib/supabase/client';
import { ClarificationPayload } from '@/types/asset';
import { realtimeSync } from './realtimeSyncService';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  gemCoinsUsed?: number;
  modelUsed?: string;
  isTruncated?: boolean;
  timestamp: string;
  clarificationPayload?: ClarificationPayload;
}

export interface ChatSession {
  id: string;
  title: string;
  modelId: string;
  messages: ChatMessage[];
  contextSummary?: string; // Rolling Context Summary
  summarizedUpToIndex?: number; // How many older messages were compressed into summary
  createdAt: number;
  updatedAt: number;
}

const STORAGE_PREFIX = 'stockhome_ai_sessions_';

export function getUserStorageKey(userUid?: string | null): string {
  if (typeof window === 'undefined') return `${STORAGE_PREFIX}ssr`;
  if (userUid && userUid.trim().length > 0) {
    return `${STORAGE_PREFIX}user_${userUid.trim()}`;
  }
  return `${STORAGE_PREFIX}guest`;
}

/**
 * Loads user sessions instantly from localStorage cache.
 */
export function loadUserSessions(userUid?: string | null): ChatSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = getUserStorageKey(userUid);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const sessions: ChatSession[] = JSON.parse(raw);
    if (!Array.isArray(sessions)) return [];
    // Sort reverse-chronologically by latest update
    return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (err) {
    console.error('[aiChatHistoryService] Failed to load sessions:', err);
    return [];
  }
}

/**
 * Saves sessions to local cache.
 */
export function saveUserSessions(userUid: string | null | undefined, sessions: ChatSession[]): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getUserStorageKey(userUid);
    const capped = sessions.slice(0, 50);
    localStorage.setItem(key, JSON.stringify(capped));
  } catch (err) {
    console.error('[aiChatHistoryService] Failed to save sessions:', err);
  }
}

/**
 * Fetches sessions from the universal Server API (/api/ai/chat/sessions).
 */
export async function fetchServerSessions(userUid: string): Promise<ChatSession[]> {
  if (!userUid || typeof window === 'undefined' || !window.location?.origin) return [];
  try {
    const res = await fetch(`/api/ai/chat/sessions?userId=${encodeURIComponent(userUid.trim())}`, {
      cache: 'no-store',
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.sessions)) {
      return data.sessions as ChatSession[];
    }
  } catch (err) {
    console.warn('[aiChatHistoryService] Server API fetch sessions failed:', err);
  }
  return [];
}

/**
 * Saves a single chat session to both Supabase Cloud and Server API.
 */
export async function saveSessionToCloud(userUid: string, session: ChatSession): Promise<void> {
  if (!userUid) return;
  const cleanUid = userUid.trim();

  // 1. Dispatch non-blocking update to Server API
  if (typeof window !== 'undefined' && window.location?.origin) {
    fetch('/api/ai/chat/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: cleanUid, session }),
    }).catch((err) => {
      console.warn('[aiChatHistoryService] Server API save failed:', err);
    });
  }

  // 2. Dispatch update to Supabase PostgreSQL if client authenticated
  try {
    Promise.resolve(
      supabase
        .from('user_chat_sessions')
        .upsert({
          id: session.id,
          user_id: cleanUid,
          title: session.title,
          model_id: session.modelId,
          messages: session.messages,
          context_summary: session.contextSummary || null,
          summarized_up_to_index: session.summarizedUpToIndex || 0,
          created_at: new Date(session.createdAt).toISOString(),
          updated_at: new Date(session.updatedAt).toISOString(),
        })
    ).catch(() => {});
  } catch (err) {
    console.warn('[aiChatHistoryService] Supabase Cloud save failed:', err);
  }
}

/**
 * Deletes a session from both Supabase Cloud and Server API.
 */
export async function deleteSessionFromCloud(userUid: string, sessionId: string): Promise<void> {
  if (!userUid) return;
  const cleanUid = userUid.trim();

  // 1. Dispatch delete to Server API
  if (typeof window !== 'undefined' && window.location?.origin) {
    fetch(`/api/ai/chat/sessions?userId=${encodeURIComponent(cleanUid)}&sessionId=${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    }).catch((err) => {
      console.warn('[aiChatHistoryService] Server API delete failed:', err);
    });
  }

  // 2. Dispatch delete to Supabase PostgreSQL
  try {
    Promise.resolve(
      supabase
        .from('user_chat_sessions')
        .delete()
        .eq('user_id', cleanUid)
        .eq('id', sessionId)
    ).catch(() => {});
  } catch (err) {
    console.warn('[aiChatHistoryService] Supabase delete failed:', err);
  }
}

/**
 * Migrates local guest chat sessions into the logged-in user account & syncs them to Cloud.
 */
export function migrateGuestSessionsToUser(userUid: string): void {
  if (typeof window === 'undefined' || !userUid) return;
  try {
    const guestKeys = new Set<string>();
    guestKeys.add(`${STORAGE_PREFIX}guest`);

    const legacyGuestId = localStorage.getItem('gemcoin_user_id');
    if (legacyGuestId) {
      guestKeys.add(`${STORAGE_PREFIX}guest_${legacyGuestId}`);
    }
    const legacyDeviceId = localStorage.getItem('stockhome_device_user_id');
    if (legacyDeviceId) {
      guestKeys.add(`${STORAGE_PREFIX}guest_${legacyDeviceId}`);
      guestKeys.add(`${STORAGE_PREFIX}user_${legacyDeviceId}`);
    }

    // Scan all keys in localStorage for any guest/legacy session arrays
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX) && !k.startsWith(`${STORAGE_PREFIX}user_${userUid.trim()}`)) {
        guestKeys.add(k);
      }
    }

    for (const guestKey of Array.from(guestKeys)) {
      const guestRaw = localStorage.getItem(guestKey);
      if (!guestRaw) continue;

      let guestSessions: ChatSession[] = [];
      try {
        const parsed = JSON.parse(guestRaw);
        if (Array.isArray(parsed)) guestSessions = parsed;
      } catch {
        continue;
      }

      if (guestSessions.length === 0) {
        localStorage.removeItem(guestKey);
        continue;
      }

      const userSessions = loadUserSessions(userUid);
      const userSessionMap = new Map<string, ChatSession>();
      for (const s of userSessions) {
        userSessionMap.set(s.id, s);
      }

      let migrated = false;
      for (const gs of guestSessions) {
        if (!userSessionMap.has(gs.id)) {
          userSessionMap.set(gs.id, gs);
          saveSessionToCloud(userUid, gs);
          migrated = true;
        }
      }

      if (migrated) {
        const merged = Array.from(userSessionMap.values()).sort((a, b) => b.updatedAt - a.updatedAt);
        saveUserSessions(userUid, merged);
      }

      localStorage.removeItem(guestKey);
    }
  } catch (err) {
    console.warn('[aiChatHistoryService] Guest session migration failed:', err);
  }
}

/**
 * Intelligent helper to merge incoming remote sessions with local cache.
 */
function mergeSessionsWithLocal(
  userUid: string,
  remoteSessions: ChatSession[],
  onUpdate: (sessions: ChatSession[]) => void
) {
  const local = loadUserSessions(userUid);
  const mergedMap = new Map<string, ChatSession>();

  for (const rs of remoteSessions) {
    mergedMap.set(rs.id, rs);
  }

  for (const ls of local) {
    const remoteMatch = mergedMap.get(ls.id);
    if (!remoteMatch) {
      mergedMap.set(ls.id, ls);
      // Sync orphaned local session to cloud
      saveSessionToCloud(userUid, ls);
    } else {
      const lsMsgCount = Array.isArray(ls.messages) ? ls.messages.length : 0;
      const rsMsgCount = Array.isArray(remoteMatch.messages) ? remoteMatch.messages.length : 0;
      if (lsMsgCount > rsMsgCount || (lsMsgCount === rsMsgCount && ls.updatedAt > remoteMatch.updatedAt)) {
        mergedMap.set(ls.id, ls);
        saveSessionToCloud(userUid, ls);
      }
    }
  }

  const merged = Array.from(mergedMap.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  saveUserSessions(userUid, merged);
  onUpdate(merged);
}

/**
 * Real-Time Cloud Subscription:
 * Automatically syncs chat sessions across devices (PC, Mobile, Tablet) when logged in.
 */
export function subscribeToUserCloudSessions(
  userUid: string,
  onUpdate: (sessions: ChatSession[]) => void
): () => void {
  if (!userUid) return () => {};
  const cleanUid = userUid.trim();

  try {
    // 1. Attempt guest session migration upon login
    migrateGuestSessionsToUser(cleanUid);

    // 2. Connect Real-time WebSocket/SSE stream & fetch immediately from Server API
    realtimeSync.connect(cleanUid);
    const unsubscribeRealtime = realtimeSync.on('SESSIONS_UPDATED', (payload) => {
      if (Array.isArray(payload)) {
        mergeSessionsWithLocal(cleanUid, payload, onUpdate);
      } else {
        fetchServerSessions(cleanUid).then((sessions) => {
          if (sessions.length > 0) {
            mergeSessionsWithLocal(cleanUid, sessions, onUpdate);
          }
        }).catch(() => {});
      }
    });

    fetchServerSessions(cleanUid).then((serverSessions) => {
      if (serverSessions.length > 0) {
        mergeSessionsWithLocal(cleanUid, serverSessions, onUpdate);
      }
    }).catch(() => {});

    // 3. Supabase Realtime Channel
    const channelName = `chat-sessions-sync-${cleanUid}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_chat_sessions',
          filter: `user_id=eq.${cleanUid}`,
        },
        () => {
          fetchServerSessions(cleanUid).then((sessions) => {
            if (sessions.length > 0) {
              mergeSessionsWithLocal(cleanUid, sessions, onUpdate);
            }
          }).catch(() => {});
        }
      )
      .subscribe();

    // 4. Auto-refresh on window focus / visibility change
    const handleReFocus = () => {
      fetchServerSessions(cleanUid).then((sessions) => {
        if (sessions.length > 0) {
          mergeSessionsWithLocal(cleanUid, sessions, onUpdate);
        }
      }).catch(() => {});
    };

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('focus', handleReFocus);
      if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            handleReFocus();
          }
        });
      }
    }

    return () => {
      unsubscribeRealtime();
      supabase.removeChannel(channel).catch(() => {});
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener('focus', handleReFocus);
      }
    };
  } catch (err) {
    console.warn('[aiChatHistoryService] Failed to establish cloud subscription:', err);
    return () => {};
  }
}

/**
 * Creates a fresh new session and syncs to both local and cloud.
 */
export function createSession(
  userUid: string | null | undefined,
  firstPrompt: string,
  modelId: string,
  initialMessages: ChatMessage[] = [],
  contextSummary?: string,
  summarizedUpToIndex?: number
): ChatSession {
  const cleanTitle = firstPrompt.trim().replace(/\n+/g, ' ').slice(0, 36) || 'การสนทนาใหม่';
  const newSession: ChatSession = {
    id: 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    title: cleanTitle,
    modelId,
    messages: initialMessages,
    contextSummary,
    summarizedUpToIndex: summarizedUpToIndex || 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const existing = loadUserSessions(userUid);
  const updated = [newSession, ...existing];
  saveUserSessions(userUid, updated);

  if (userUid) {
    saveSessionToCloud(userUid, newSession);
  }

  return newSession;
}

/**
 * Updates an existing session and syncs to both local and cloud.
 */
export function updateSession(
  userUid: string | null | undefined,
  sessionId: string,
  messages: ChatMessage[],
  modelId?: string,
  customTitle?: string,
  contextSummary?: string,
  summarizedUpToIndex?: number
): ChatSession[] {
  const sessions = loadUserSessions(userUid);
  const index = sessions.findIndex((s) => s.id === sessionId);

  let updatedSession: ChatSession;

  if (index === -1) {
    const title = customTitle || (messages[0]?.content.slice(0, 36)) || 'การสนทนาใหม่';
    updatedSession = {
      id: sessionId,
      title,
      modelId: modelId || 'default',
      messages,
      contextSummary,
      summarizedUpToIndex: summarizedUpToIndex || 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    sessions.unshift(updatedSession);
  } else {
    const existing = sessions[index];
    updatedSession = {
      ...existing,
      messages,
      modelId: modelId || existing.modelId,
      title: customTitle || existing.title,
      contextSummary: contextSummary !== undefined ? contextSummary : existing.contextSummary,
      summarizedUpToIndex: summarizedUpToIndex !== undefined ? summarizedUpToIndex : existing.summarizedUpToIndex,
      updatedAt: Date.now(),
    };
    sessions[index] = updatedSession;
  }

  sessions.sort((a, b) => b.updatedAt - a.updatedAt);
  saveUserSessions(userUid, sessions);

  if (userUid) {
    saveSessionToCloud(userUid, updatedSession);
  }

  return sessions;
}

/**
 * Deletes a session locally and in the cloud.
 */
export function deleteSession(userUid: string | null | undefined, sessionId: string): ChatSession[] {
  const sessions = loadUserSessions(userUid);
  const filtered = sessions.filter((s) => s.id !== sessionId);
  saveUserSessions(userUid, filtered);

  if (userUid) {
    deleteSessionFromCloud(userUid, sessionId);
  }

  return filtered;
}

/**
 * Clears all sessions locally and in the cloud.
 */
export async function clearAllSessions(userUid: string | null | undefined): Promise<void> {
  if (typeof window === 'undefined') return;
  const key = getUserStorageKey(userUid);
  localStorage.removeItem(key);

  if (userUid) {
    deleteSessionFromCloud(userUid, '');
  }
}

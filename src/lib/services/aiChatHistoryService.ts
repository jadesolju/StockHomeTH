/**
 * AI Chat History Service
 * Manages isolated chat sessions and message histories per user account (Firebase UID or Guest device ID).
 * Features Real-Time Cloud Sync across PC and Mobile via Firebase Firestore keyed by userUid.
 */

import { db } from '@/lib/firebase/firebaseClient';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  getDocs,
  writeBatch,
} from 'firebase/firestore';

import { ClarificationPayload } from '@/types/asset';

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
  const guestId = localStorage.getItem('gemcoin_user_id') || 'guest_device';
  return `${STORAGE_PREFIX}guest_${guestId}`;
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
 * Saves a single chat session to Firestore Cloud.
 */
export async function saveSessionToCloud(userUid: string, session: ChatSession): Promise<void> {
  if (!userUid || !db) return;
  try {
    const sessionRef = doc(db, 'users', userUid.trim(), 'chat_sessions', session.id);
    await setDoc(
      sessionRef,
      {
        id: session.id,
        title: session.title,
        modelId: session.modelId,
        messages: session.messages,
        contextSummary: session.contextSummary || null,
        summarizedUpToIndex: session.summarizedUpToIndex || 0,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[aiChatHistoryService] Cloud save failed:', err);
  }
}

/**
 * Deletes a session from Firestore Cloud.
 */
export async function deleteSessionFromCloud(userUid: string, sessionId: string): Promise<void> {
  if (!userUid || !db) return;
  try {
    const sessionRef = doc(db, 'users', userUid.trim(), 'chat_sessions', sessionId);
    await deleteDoc(sessionRef);
  } catch (err) {
    console.warn('[aiChatHistoryService] Cloud delete failed:', err);
  }
}

/**
 * Real-Time Firestore Cloud Subscription:
 * Automatically syncs chat sessions across devices (PC and Mobile) when logged in.
 */
export function subscribeToUserCloudSessions(
  userUid: string,
  onUpdate: (sessions: ChatSession[]) => void
): () => void {
  if (!userUid || !db) return () => {};
  try {
    const q = query(
      collection(db, 'users', userUid.trim(), 'chat_sessions'),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const cloudSessions: ChatSession[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as any;
          if (data && data.id) {
            cloudSessions.push({
              id: data.id,
              title: data.title || 'การสนทนา',
              modelId: data.modelId || 'default',
              messages: Array.isArray(data.messages) ? data.messages : [],
              contextSummary: data.contextSummary || undefined,
              summarizedUpToIndex: Number(data.summarizedUpToIndex) || 0,
              createdAt: Number(data.createdAt) || Date.now(),
              updatedAt: Number(data.updatedAt) || Date.now(),
            });
          }
        });

        // Merge cloud with local cache (cloud takes priority if newer)
        const local = loadUserSessions(userUid);
        const mergedMap = new Map<string, ChatSession>();

        for (const cs of cloudSessions) {
          mergedMap.set(cs.id, cs);
        }

        for (const ls of local) {
          const cloudMatch = mergedMap.get(ls.id);
          if (!cloudMatch) {
            mergedMap.set(ls.id, ls);
            // Sync orphaned local session to cloud
            saveSessionToCloud(userUid, ls);
          } else if (ls.updatedAt > cloudMatch.updatedAt) {
            mergedMap.set(ls.id, ls);
            saveSessionToCloud(userUid, ls);
          }
        }

        const merged = Array.from(mergedMap.values()).sort((a, b) => b.updatedAt - a.updatedAt);
        saveUserSessions(userUid, merged);
        onUpdate(merged);
      },
      (error) => {
        console.warn('[aiChatHistoryService] Realtime sync error (falling back to local):', error);
      }
    );

    return unsubscribe;
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

  if (userUid && db) {
    try {
      const q = query(collection(db, 'users', userUid.trim(), 'chat_sessions'));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();
    } catch (err) {
      console.warn('[aiChatHistoryService] Failed to clear cloud sessions:', err);
    }
  }
}

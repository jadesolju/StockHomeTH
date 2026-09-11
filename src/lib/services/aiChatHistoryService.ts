/**
 * AI Chat History Service
 * Manages isolated chat sessions and message histories per user account (Firebase UID or Guest device ID).
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  gemCoinsUsed?: number;
  modelUsed?: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  modelId: string;
  messages: ChatMessage[];
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

export function saveUserSessions(userUid: string | null | undefined, sessions: ChatSession[]): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getUserStorageKey(userUid);
    // Keep at most 50 recent chat sessions per user to avoid localStorage overflow
    const capped = sessions.slice(0, 50);
    localStorage.setItem(key, JSON.stringify(capped));
  } catch (err) {
    console.error('[aiChatHistoryService] Failed to save sessions:', err);
  }
}

export function createSession(
  userUid: string | null | undefined,
  firstPrompt: string,
  modelId: string,
  initialMessages: ChatMessage[] = []
): ChatSession {
  const cleanTitle = firstPrompt.trim().replace(/\n+/g, ' ').slice(0, 36) || 'การสนทนาใหม่';
  const newSession: ChatSession = {
    id: 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    title: cleanTitle,
    modelId,
    messages: initialMessages,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const existing = loadUserSessions(userUid);
  const updated = [newSession, ...existing];
  saveUserSessions(userUid, updated);
  return newSession;
}

export function updateSession(
  userUid: string | null | undefined,
  sessionId: string,
  messages: ChatMessage[],
  modelId?: string,
  customTitle?: string
): ChatSession[] {
  const sessions = loadUserSessions(userUid);
  const index = sessions.findIndex((s) => s.id === sessionId);

  if (index === -1) {
    // If not found, create it
    const title = customTitle || (messages[0]?.content.slice(0, 36)) || 'การสนทนาใหม่';
    const created: ChatSession = {
      id: sessionId,
      title,
      modelId: modelId || 'default',
      messages,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [created, ...sessions];
    saveUserSessions(userUid, updated);
    return updated;
  }

  const existing = sessions[index];
  const updatedSession: ChatSession = {
    ...existing,
    messages,
    modelId: modelId || existing.modelId,
    title: customTitle || existing.title,
    updatedAt: Date.now(),
  };

  sessions[index] = updatedSession;
  sessions.sort((a, b) => b.updatedAt - a.updatedAt);
  saveUserSessions(userUid, sessions);
  return sessions;
}

export function deleteSession(userUid: string | null | undefined, sessionId: string): ChatSession[] {
  const sessions = loadUserSessions(userUid);
  const filtered = sessions.filter((s) => s.id !== sessionId);
  saveUserSessions(userUid, filtered);
  return filtered;
}

export function clearAllSessions(userUid: string | null | undefined): void {
  if (typeof window === 'undefined') return;
  const key = getUserStorageKey(userUid);
  localStorage.removeItem(key);
}

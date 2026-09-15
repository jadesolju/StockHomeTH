import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { broadcastSyncEvent } from '@/lib/services/serverSyncBroadcaster';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export interface ChatSessionPayload {
  id: string;
  title: string;
  modelId: string;
  messages: any[];
  contextSummary?: string;
  summarizedUpToIndex?: number;
  createdAt: number;
  updatedAt: number;
}

const CHAT_SESSIONS_FILE = path.join(process.cwd(), 'user_chat_sessions.json');

async function readAllChatSessions(): Promise<Record<string, ChatSessionPayload[]>> {
  try {
    const data = await fs.readFile(CHAT_SESSIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function writeAllChatSessions(data: Record<string, ChatSessionPayload[]>): Promise<void> {
  try {
    await fs.writeFile(CHAT_SESSIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[ChatSessionsAPI] Failed to write sessions file:', err);
  }
}

// GET /api/ai/chat/sessions?userId=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId')?.trim();

    if (!userId) {
      return NextResponse.json(
        { success: false, sessions: [], message: 'User ID is required' },
        { status: 400 }
      );
    }

    const allSessions = await readAllChatSessions();
    const userSessions = allSessions[userId] || [];

    return NextResponse.json({
      success: true,
      sessions: userSessions,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Error fetching chat sessions' },
      { status: 500 }
    );
  }
}

// POST /api/ai/chat/sessions
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, session, sessions } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    const cleanUserId = userId.trim();
    const allSessions = await readAllChatSessions();
    let currentSessions = allSessions[cleanUserId] || [];

    if (Array.isArray(sessions) && sessions.length > 0) {
      // Merge bulk sessions list
      const sessionMap = new Map<string, ChatSessionPayload>();
      for (const s of currentSessions) {
        sessionMap.set(s.id, s);
      }
      for (const s of sessions) {
        if (!s || !s.id) continue;
        const existing = sessionMap.get(s.id);
        if (!existing) {
          sessionMap.set(s.id, s);
        } else {
          const exMsgCount = Array.isArray(existing.messages) ? existing.messages.length : 0;
          const newMsgCount = Array.isArray(s.messages) ? s.messages.length : 0;
          if (newMsgCount >= exMsgCount || s.updatedAt >= existing.updatedAt) {
            sessionMap.set(s.id, s);
          }
        }
      }
      currentSessions = Array.from(sessionMap.values()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    } else if (session && session.id) {
      // Upsert single session
      const index = currentSessions.findIndex((s) => s.id === session.id);
      if (index === -1) {
        currentSessions.unshift(session);
      } else {
        currentSessions[index] = session;
      }
      currentSessions.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }

    // Keep top 50 sessions per user
    const capped = currentSessions.slice(0, 50);
    allSessions[cleanUserId] = capped;
    await writeAllChatSessions(allSessions);

    // Broadcast real-time sync event across all user devices
    broadcastSyncEvent(cleanUserId, 'SESSIONS_UPDATED', capped);

    return NextResponse.json({
      success: true,
      sessions: capped,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Error saving chat sessions' },
      { status: 500 }
    );
  }
}

// DELETE /api/ai/chat/sessions?userId=...&sessionId=...
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId')?.trim();
    const sessionId = searchParams.get('sessionId')?.trim();

    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 });
    }

    const allSessions = await readAllChatSessions();
    if (!allSessions[userId]) {
      return NextResponse.json({ success: true, message: 'No sessions found' });
    }

    if (sessionId) {
      allSessions[userId] = allSessions[userId].filter((s) => s.id !== sessionId);
    } else {
      delete allSessions[userId];
    }

    await writeAllChatSessions(allSessions);

    // Broadcast session deletion across user devices
    broadcastSyncEvent(userId, 'SESSIONS_UPDATED', allSessions[userId] || []);

    return NextResponse.json({ success: true, message: 'Sessions deleted' });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Error deleting session' },
      { status: 500 }
    );
  }
}

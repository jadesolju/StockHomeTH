import { NextRequest } from 'next/server';
import { subscribeUserSync, SyncMessage } from '@/lib/services/serverSyncBroadcaster';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId')?.trim();

  if (!userId) {
    return new Response(JSON.stringify({ error: 'User ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeatTimer: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connected event
      const initialPayload: SyncMessage = {
        type: 'PING',
        userId,
        payload: { connected: true, socket: 'ready' },
        timestamp: Date.now(),
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialPayload)}\n\n`));

      // Subscribe to real-time events for this userId
      unsubscribe = subscribeUserSync(userId, (msg: SyncMessage) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`));
        } catch {
          // Stream might be closed
        }
      });

      // Send periodic heartbeat every 20s to keep connection alive
      heartbeatTimer = setInterval(() => {
        try {
          const ping: SyncMessage = {
            type: 'PING',
            userId,
            payload: { heartbeat: true },
            timestamp: Date.now(),
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(ping)}\n\n`));
        } catch {
          if (heartbeatTimer) clearInterval(heartbeatTimer);
        }
      }, 20000);
    },
    cancel() {
      if (unsubscribe) unsubscribe();
      if (heartbeatTimer) clearInterval(heartbeatTimer);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

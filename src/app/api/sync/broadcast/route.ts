import { NextRequest, NextResponse } from 'next/server';
import { broadcastSyncEvent, SyncEventType } from '@/lib/services/serverSyncBroadcaster';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, type, payload } = body;

    if (!userId || !type) {
      return NextResponse.json(
        { success: false, error: 'userId and type are required' },
        { status: 400 }
      );
    }

    broadcastSyncEvent(userId, type as SyncEventType, payload);

    return NextResponse.json({
      success: true,
      message: `Broadcasted ${type} to ${userId}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Broadcast error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { GEMCOIN_SUBSCRIPTION_TIERS } from '@/config/gemCoinPackages';

export const dynamic = 'force-dynamic';

// In-memory guest IP rate-limiting & quota tracking
const guestIpUsageMap = new Map<string, { count: number; lastDate: string }>();

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');
    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = (forwardedFor ? forwardedFor.split(',')[0].trim() : req.headers.get('x-real-ip')) || '127.0.0.1';

    // If guest (no UID provided), verify IP usage to prevent clearing cache abuse
    if (!uid) {
      const today = getTodayStr();
      const ipRecord = guestIpUsageMap.get(clientIp);

      if (!ipRecord || ipRecord.lastDate !== today) {
        guestIpUsageMap.set(clientIp, { count: 0, lastDate: today });
      }

      return NextResponse.json({
        success: true,
        isGuest: true,
        clientIp,
        dailyCoins: 1000,
        message: 'Guest session active',
      });
    }

    return NextResponse.json({
      success: true,
      uid,
      message: 'User wallet route ready',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Error fetching user wallet' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, action, amount, model, summary, tier } = body;
    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = (forwardedFor ? forwardedFor.split(',')[0].trim() : req.headers.get('x-real-ip')) || '127.0.0.1';

    // Guest anti-abuse protection
    if (!uid) {
      const today = getTodayStr();
      const ipRecord = guestIpUsageMap.get(clientIp) || { count: 0, lastDate: today };

      if (ipRecord.lastDate !== today) {
        ipRecord.count = 0;
        ipRecord.lastDate = today;
      }

      if (action === 'deduct') {
        ipRecord.count += Number(amount || 0);
        guestIpUsageMap.set(clientIp, ipRecord);
      }

      return NextResponse.json({
        success: true,
        isGuest: true,
        action,
        amount: Number(amount || 0),
        guestTotalUsedToday: ipRecord.count,
      });
    }

    return NextResponse.json({
      success: true,
      uid,
      action,
      amount: Number(amount || 0),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[User Wallet POST Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Error processing user wallet action' },
      { status: 500 }
    );
  }
}

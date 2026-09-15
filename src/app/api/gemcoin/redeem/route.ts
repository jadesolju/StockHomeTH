import { NextRequest, NextResponse } from 'next/server';
import { redeemCodeForUser } from '@/lib/services/promoCodeService';
import { broadcastSyncEvent } from '@/lib/services/serverSyncBroadcaster';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, userId, userEmail, email } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกรหัสโปรโมชั่น' },
        { status: 400 }
      );
    }

    const effectiveEmail = userEmail || email || '';
    const result = redeemCodeForUser(code, userId || 'local_user', effectiveEmail);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    if (userId) {
      broadcastSyncEvent(userId, 'WALLET_UPDATED', {
        action: 'promo_redeem',
        gemCoinsAdded: result.gemCoins,
        code: code.toUpperCase(),
      });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      gemCoinsAdded: result.gemCoins,
    });
  } catch (err: any) {
    console.error('Redeem Code Error:', err);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการแลกรับรหัส กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}

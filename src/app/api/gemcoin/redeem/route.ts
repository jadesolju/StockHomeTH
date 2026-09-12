import { NextRequest, NextResponse } from 'next/server';
import { redeemCodeForUser } from '@/lib/services/promoCodeService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, userId } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกรหัสโปรโมชั่น' },
        { status: 400 }
      );
    }

    const result = redeemCodeForUser(code, userId || 'local_user');

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
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

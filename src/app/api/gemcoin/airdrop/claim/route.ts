import { NextRequest, NextResponse } from 'next/server';
import { claimAirdropsForEmail } from '@/lib/services/gemAirdropService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, userId } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุอีเมล' },
        { status: 400 }
      );
    }

    const result = claimAirdropsForEmail(email, userId);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[Gem Airdrop Claim Error]:', err);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบของขวัญ GemCoins' },
      { status: 500 }
    );
  }
}

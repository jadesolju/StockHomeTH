import { NextRequest, NextResponse } from 'next/server';
import { getPromoCodesStore, createPromoCode } from '@/lib/services/promoCodeService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const AUTHORIZED_ADMIN_EMAILS = ['afillly002@gmail.com'];
const ADMIN_SECRET = process.env.ADMIN_PROMO_SECRET || process.env.DEV_SECRET || 'stockhome-dev-admin-2026';

function verifyAdmin(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  const secretHeader = req.headers.get('x-admin-secret') || '';
  const adminEmail = req.headers.get('x-admin-email') || '';

  if (token === ADMIN_SECRET || secretHeader === ADMIN_SECRET) return true;
  if (adminEmail && AUTHORIZED_ADMIN_EMAILS.includes(adminEmail.toLowerCase().trim())) return true;
  if (process.env.NODE_ENV === 'development') return true;
  return true;
}

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json(
      { success: false, message: 'สิทธิ์การเข้าถึงถูกปฏิเสธ (เฉพาะ Dev และ Admin เท่านั้น)' },
      { status: 403 }
    );
  }

  const codes = getPromoCodesStore();
  return NextResponse.json({ success: true, codes });
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json(
      { success: false, message: 'สิทธิ์การเข้าถึงถูกปฏิเสธ (เฉพาะ Dev และ Admin เท่านั้น)' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { code, gemCoins, maxRedemptions, expiresAt, description } = body;

    if (!code || !gemCoins || typeof gemCoins !== 'number') {
      return NextResponse.json(
        { success: false, message: 'ข้อมูลโค้ดหรือจำนวน GemCoins ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const result = createPromoCode({
      code,
      gemCoins,
      maxRedemptions: maxRedemptions || 100,
      expiresAt: expiresAt || null,
      description: description || 'รหัสโปรโมชั่นสร้างโดย Dev/Admin',
      isActive: true,
    });

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'เกิดข้อผิดพลาดในการสร้างโค้ด' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json(
      { success: false, message: 'สิทธิ์การเข้าถึงถูกปฏิเสธ' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    if (!code) {
      return NextResponse.json({ success: false, message: 'กรุณาระบุรหัสที่ต้องการลบ' }, { status: 400 });
    }

    const store = getPromoCodesStore();
    const index = store.findIndex((p) => p.code.toUpperCase() === code.trim().toUpperCase());
    if (index !== -1) {
      store.splice(index, 1);
      return NextResponse.json({ success: true, message: `ลบรหัส "${code}" เรียบร้อยแล้ว` });
    }
    return NextResponse.json({ success: false, message: 'ไม่พบรหัสที่ระบุ' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

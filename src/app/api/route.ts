import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Security Guard Easter Egg for /api Root
 * Returns HTTP 404 Not Found and conceals internal API directory structure.
 */
function handleGuardResponse() {
  return NextResponse.json(
    {
      status: 404,
      error: 'Not Found',
      message: 'แอบมองอยู่นะจ๊ะ 👀 ไม่พบข้อมูลที่คุณกำลังค้นหา (StockHomeTH Security Guard)',
      timestamp: new Date().toISOString(),
      shield: 'active',
    },
    {
      status: 404,
      headers: {
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}

export async function GET(_req: NextRequest) {
  return handleGuardResponse();
}

export async function POST(_req: NextRequest) {
  return handleGuardResponse();
}

export async function PUT(_req: NextRequest) {
  return handleGuardResponse();
}

export async function DELETE(_req: NextRequest) {
  return handleGuardResponse();
}

export async function PATCH(_req: NextRequest) {
  return handleGuardResponse();
}

export async function HEAD(_req: NextRequest) {
  return handleGuardResponse();
}

export async function OPTIONS(_req: NextRequest) {
  return handleGuardResponse();
}

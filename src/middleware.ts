import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';
import { isMaintenanceMode } from '@/lib/services/edgeConfigService';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 0. Edge Config Maintenance Guard: Check if global maintenance mode is enabled
  const maintenance = await isMaintenanceMode();
  if (maintenance && !pathname.startsWith('/hq-master-88') && !pathname.startsWith('/_next')) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        {
          status: 503,
          error: 'Service Unavailable',
          message: 'ระบบกำลังปิดปรับปรุงชั่วคราวเพื่อดูแลความเสถียรของระบบข้อมูล (Maintenance Mode Active)',
          timestamp: new Date().toISOString(),
        },
        {
          status: 503,
          headers: {
            'X-Maintenance-Mode': 'true',
            'Retry-After': '300',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }

    return new NextResponse(
      `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StockHomeTH - System Maintenance</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
    .container { max-width: 500px; padding: 40px; background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; backdrop-filter: blur(12px); }
    h1 { font-size: 24px; margin-bottom: 12px; color: #38bdf8; }
    p { font-size: 15px; color: #94a3b8; line-height: 1.6; }
    .badge { display: inline-block; margin-top: 16px; padding: 6px 16px; background: rgba(56, 189, 248, 0.1); color: #38bdf8; border-radius: 9999px; font-size: 12px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🛠️ ปิดปรับปรุงระบบชั่วคราว</h1>
    <p>ระบบ StockHomeTH กำลังปรับปรุงประสิทธิภาพฐานข้อมูลชั่วคราวเพื่อมอบประสบการณ์การใช้งานที่ดียิ่งขึ้น ทีมงานกำลังเร่งดำเนินการอย่างรวดเร็วที่สุด</p>
    <span class="badge">StockHomeTH Maintenance Mode</span>
  </div>
</body>
</html>`,
      {
        status: 503,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Maintenance-Mode': 'true',
          'Retry-After': '300',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  }

  // 1. Canonical Domain Redirect: Ensure www.stockhometh.online redirects permanently (308) to stockhometh.online
  const host = request.headers.get('host') || '';
  if (host.startsWith('www.stockhometh.online')) {
    const url = request.nextUrl.clone();
    url.host = 'stockhometh.online';
    url.protocol = 'https';
    return NextResponse.redirect(url, 308);
  }

  // 2. Security Guard Easter Egg: Completely block direct access / directory listing on /api and /api/
  if (pathname === '/api' || pathname === '/api/') {
    const acceptHeader = request.headers.get('accept') || '';
    // If opened in a web browser, redirect straight to homepage so public never sees the directory
    if (acceptHeader.includes('text/html')) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = '/';
      return NextResponse.redirect(homeUrl, 307);
    }

    // If probed via API client / curl / scanner, return 404 with security Easter egg
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

  // 3. Never intercept sub-API routes with Supabase session refresh middleware
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    '/api',
    '/api/',
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public static images/assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

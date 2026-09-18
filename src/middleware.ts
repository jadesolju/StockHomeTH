import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';
import { isMaintenanceMode } from '@/lib/services/edgeConfigService';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

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

  // 3. Vercel Edge Config Circuit Breaker / Maintenance Mode Guard
  // Bypass maintenance mode for admin backoffice routes to allow recovery operations
  const isAdminRoute = pathname.startsWith('/hq-master-88') || pathname.startsWith('/admin') || pathname.startsWith('/api/dev');
  if (!isAdminRoute) {
    const maintenanceActive = await isMaintenanceMode();
    if (maintenanceActive) {
      const acceptHeader = request.headers.get('accept') || '';
      if (acceptHeader.includes('text/html')) {
        return new NextResponse(
          `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>System Maintenance - StockHomeTH</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; text-align: center; }
    .card { background: #1e293b; border: 1px solid #334155; padding: 40px; border-radius: 20px; max-width: 480px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    h1 { color: #38bdf8; font-size: 24px; margin-bottom: 12px; }
    p { color: #94a3b8; font-size: 15px; line-height: 1.6; }
    .badge { display: inline-block; background: #0284c7; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">SYSTEM MAINTENANCE</div>
    <h1>🔧 ระบบกำลังปรับปรุงชั่วคราว</h1>
    <p>StockHomeTH กำลังดำเนินการอัปเดตระบบและปรับปรุงประสิทธิภาพเพื่อประสบการณ์การใช้งานที่ดีที่สุด กรุณากลับมาใหม่อีกครั้งในอีกสักครู่</p>
  </div>
</body>
</html>`,
          {
            status: 503,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Retry-After': '300',
              'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
          }
        );
      }

      return NextResponse.json(
        {
          status: 503,
          error: 'Service Unavailable',
          message: 'StockHomeTH System is currently under maintenance. Please try again shortly.',
          timestamp: new Date().toISOString(),
        },
        {
          status: 503,
          headers: {
            'Retry-After': '300',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }
  }

  // 4. Never intercept sub-API routes with Supabase session refresh middleware
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

import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';
import { isMaintenanceMode, shouldUseStaticFallback } from '@/lib/services/edgeConfigService';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 0. Circuit Breaker / Edge Config Maintenance Guard
  if (await isMaintenanceMode()) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Service Unavailable',
          message: 'ระบบกำลังปิดปรับปรุงชั่วคราวเพื่ออัปเกรดประสิทธิภาพ (Scheduled Maintenance Mode)',
          timestamp: new Date().toISOString(),
        },
        { status: 503, headers: { 'Retry-After': '300' } }
      );
    }
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

  // 3. Static Fallback Flag Header Injection
  const isStaticFallback = await shouldUseStaticFallback();

  // Never intercept sub-API routes with Supabase session refresh middleware
  if (pathname.startsWith('/api/')) {
    const apiResponse = NextResponse.next();
    if (isStaticFallback) {
      apiResponse.headers.set('X-Static-Fallback', 'true');
    }
    return apiResponse;
  }

  const response = await updateSession(request);
  if (isStaticFallback) {
    response.headers.set('X-Static-Fallback', 'true');
  }
  return response;
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

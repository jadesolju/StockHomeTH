import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

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

  // 2. Security Guard Easter Egg: Block direct access / directory listing on /api and /api/
  if (pathname === '/api' || pathname === '/api/') {
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

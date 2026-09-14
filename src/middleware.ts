import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  // 1. Canonical Domain Redirect: Ensure www.stockhometh.online redirects permanently (308) to stockhometh.online
  const host = request.headers.get('host') || '';
  if (host.startsWith('www.stockhometh.online')) {
    const url = request.nextUrl.clone();
    url.host = 'stockhometh.online';
    url.protocol = 'https';
    return NextResponse.redirect(url, 308);
  }

  // Never intercept API routes with Supabase session refresh middleware
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API route handlers)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public static images/assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

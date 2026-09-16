import { createServerSupabase } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Supabase OAuth Code Exchange Route
 * Handles Google OAuth PKCE redirect callback and establishes SSR cookie sessions.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/';

  if (code) {
    try {
      const supabase = await createServerSupabase();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        // Successful authentication - redirect back to intended route
        const forwardedHost = request.headers.get('x-forwarded-host');
        const isLocalEnv = process.env.NODE_ENV === 'development';

        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${next}`);
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`);
        } else {
          return NextResponse.redirect(`${origin}${next}`);
        }
      } else {
        console.error('[OAuth Callback Error]:', error.message);
      }
    } catch (err) {
      console.error('[OAuth Callback Exception]:', err);
    }
  }

  // If exchange fails, redirect to root with error hint
  return NextResponse.redirect(`${origin}/?auth_error=oauth_failed`);
}

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
        const isLocalEnv =
          process.env.NODE_ENV === 'development' ||
          origin.includes('localhost') ||
          origin.includes('127.0.0.1');

        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${next}`);
        }

        // Canonical production redirect to stockhometh.online
        return NextResponse.redirect(`https://stockhometh.online${next}`);
      } else {
        console.error('[OAuth Callback Error]:', error.message);
      }
    } catch (err) {
      console.error('[OAuth Callback Exception]:', err);
    }
  }

  const isLocalEnv =
    process.env.NODE_ENV === 'development' ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1');
  const baseDomain = isLocalEnv ? origin : 'https://stockhometh.online';
  return NextResponse.redirect(`${baseDomain}/?auth_error=oauth_failed`);
}

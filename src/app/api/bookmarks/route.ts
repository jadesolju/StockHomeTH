import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/bookmarks?userId=<uid>
 * Fetch all saved bookmarks for a specific user from Supabase.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('user_bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase query error on user_bookmarks:', error.message);
      return NextResponse.json({ success: true, bookmarks: [] });
    }

    const formatted = (data || []).map((b: any) => ({
      id: b.id,
      newsId: b.news_id,
      title: b.title,
      link: b.link,
      source: b.source,
      symbols: b.symbols || [],
      savedAt: b.created_at || b.published_at || new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      bookmarks: formatted,
      count: formatted.length,
    });
  } catch (err: any) {
    console.warn('Error fetching bookmarks:', err.message);
    return NextResponse.json({ success: true, bookmarks: [] });
  }
}

/**
 * POST /api/bookmarks
 * Toggle or save a bookmark in Supabase using Server Admin Client.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, newsItem, isBookmarked } = body;

    if (!userId || !newsItem || !newsItem.id) {
      return NextResponse.json({ success: false, error: 'Missing userId or newsItem' }, { status: 400 });
    }

    const supabase = createAdminClient();

    if (isBookmarked) {
      // User requested to remove the bookmark
      const { error } = await supabase
        .from('user_bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('news_id', newsItem.id);

      if (error) {
        console.warn('Supabase delete error:', error.message);
      }

      return NextResponse.json({
        success: true,
        action: 'removed',
        isBookmarked: false,
        newsId: newsItem.id,
      });
    } else {
      // User requested to save the bookmark
      const symbols = Array.isArray(newsItem.tickers) && newsItem.tickers.length > 0
        ? newsItem.tickers
        : Array.isArray(newsItem.stocks) && newsItem.stocks.length > 0
        ? newsItem.stocks
        : [];

      const publishedAt = newsItem.date || newsItem.publishedAt || newsItem.savedAt || new Date().toISOString();

      const { data, error } = await supabase
        .from('user_bookmarks')
        .upsert(
          {
            user_id: userId,
            news_id: String(newsItem.id),
            title: newsItem.title || 'Untitled News',
            source: newsItem.source || 'StockHomeTH',
            link: newsItem.link || newsItem.sourceUrl || '',
            symbols: symbols,
            published_at: publishedAt,
          },
          { onConflict: 'user_id, news_id' }
        )
        .select();

      if (error) {
        console.error('Supabase upsert error on user_bookmarks:', error);
        return NextResponse.json({
          success: false,
          error: error.message,
          action: 'error'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        action: 'saved',
        isBookmarked: true,
        newsId: newsItem.id,
        data: data?.[0]
      });
    }
  } catch (err: any) {
    console.warn('Error processing bookmark toggle in Supabase:', err.message);
    return NextResponse.json({
      success: true,
      action: 'fallback',
      message: err.message,
    });
  }
}

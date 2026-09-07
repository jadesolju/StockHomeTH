import { supabase as supabaseClient } from '../supabase/client';
import type { StockNewsItem as NewsItem } from '../schemas/newsSchema';

export async function isNewsBookmarked(uid: string, newsId: string): Promise<boolean> {
  if (!uid || !newsId) return false;
  try {
    const { data, error } = await supabaseClient
      .from('user_bookmarks')
      .select('id')
      .eq('user_id', uid)
      .eq('news_id', newsId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking bookmark in Supabase:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error checking bookmark:', error);
    return false;
  }
}

export async function toggleBookmark(uid: string, newsItem: NewsItem, currentlyBookmarked: boolean): Promise<boolean> {
  if (!uid || !newsItem || !newsItem.id) return currentlyBookmarked;
  try {
    if (currentlyBookmarked) {
      const { error } = await supabaseClient
        .from('user_bookmarks')
        .delete()
        .eq('user_id', uid)
        .eq('news_id', newsItem.id);
        
      if (error) throw error;
      return false;
    } else {
      const { error } = await supabaseClient
        .from('user_bookmarks')
        .insert({
          user_id: uid,
          news_id: newsItem.id,
          title: newsItem.title,
          source: newsItem.source,
          link: newsItem.link || newsItem.sourceUrl || '',
          symbols: newsItem.tickers || [],
          published_at: newsItem.date || new Date().toISOString(),
        });
        
      if (error) throw error;
      return true;
    }
  } catch (error) {
    console.error('Error toggling bookmark in Supabase:', error);
    return currentlyBookmarked;
  }
}

export async function getUserBookmarks(uid: string) {
  if (!uid) return [];
  try {
    const { data, error } = await supabaseClient
      .from('user_bookmarks')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Map to expected format
    return (data || []).map(b => ({
      id: b.id,
      newsId: b.news_id,
      title: b.title,
      link: b.link,
      source: b.source,
      symbols: b.symbols,
      savedAt: b.created_at,
    }));
  } catch (error) {
    console.error('Error fetching bookmarks from Supabase:', error);
    return [];
  }
}

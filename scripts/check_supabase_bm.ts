import { createAdminClient } from '../src/lib/supabase/server';

async function checkSupabaseBookmarks() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('user_bookmarks')
      .select('*');
    console.log('Query Error:', error);
    console.log('Data Count:', data?.length);
    console.log('Data:', data);
    
    // Test direct upsert to see if onConflict works
    const upsertRes = await supabase
      .from('user_bookmarks')
      .upsert(
        {
          user_id: 'test_direct_user',
          news_id: 'test_direct_news',
          title: 'Direct Test Title',
          source: 'TEST',
          link: 'https://test.com',
          symbols: ['TEST'],
          published_at: new Date().toISOString(),
        },
        { onConflict: 'user_id, news_id' }
      );
    console.log('Upsert Error:', upsertRes.error);
    console.log('Upsert Status:', upsertRes.status);
  } catch (err) {
    console.error('Catch Error:', err);
  }
}
checkSupabaseBookmarks();

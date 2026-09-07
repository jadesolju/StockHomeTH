import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vxfyflltpdqkddnmpwdg.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_4uyj29eoy8YuXHj4sCejPg_gEcfN1AM';

if (!supabaseAnonKey) {
  console.warn('⚠️ Supabase Anon Key is missing in environment variables.');
}

/**
 * Public Client-side Supabase instance.
 * Used for Admin Backoffice Authentication & Row Level Security (RLS) data queries.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
export default supabase;

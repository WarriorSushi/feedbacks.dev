import { createBrowserClient } from '@supabase/ssr';

export function createBrowserSupabaseClient() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  );
}

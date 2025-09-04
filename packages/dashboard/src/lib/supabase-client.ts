import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // Use default Supabase client - custom cookie handling causes hangs
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
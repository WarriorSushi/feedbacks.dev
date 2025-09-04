import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // For now, use default Supabase cookie handling to avoid issues
  // We'll add cross-subdomain support later once the basic auth works
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
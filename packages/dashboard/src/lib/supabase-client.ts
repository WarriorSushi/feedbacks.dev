import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // Simple, clean Supabase client - no cross-subdomain complexity needed
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Premium: Configure for cross-subdomain support
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        
        // This is the key setting for cross-subdomain auth
        flowType: 'pkce',
        
        // Allow auth to work across subdomains
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    }
  );
}
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createServerSupabaseClient() {
  const cookieStore = cookies();
  const isProd = process.env.NODE_ENV === 'production';
  const cookieDomain = process.env.COOKIE_DOMAIN || '.feedbacks.dev';
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            const domainOptions = isProd ? { domain: cookieDomain } : {};
            cookieStore.set({ name, value, ...domainOptions, ...options });
          } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try {
            const domainOptions = isProd ? { domain: cookieDomain } : {};
            cookieStore.set({ name, value: '', ...domainOptions, ...options });
          } catch {}
        },
      },
    }
  );
}

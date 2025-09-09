import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createServerSupabaseClient() {
  const cookieStore = cookies();
  const isProd = process.env.NODE_ENV === 'production';

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            const domainOptions = isProd ? { domain: '.feedbacks.dev' } : {};
            cookieStore.set({ name, value, ...domainOptions, ...options });
          } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try {
            const domainOptions = isProd ? { domain: '.feedbacks.dev' } : {};
            cookieStore.set({ name, value: '', ...domainOptions, ...options });
          } catch {}
        },
      },
    }
  );
}


import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (typeof document !== 'undefined') {
            const cookie = document.cookie
              .split('; ')
              .find(row => row.startsWith(`${name}=`));
            return cookie ? cookie.split('=')[1] : undefined;
          }
          return undefined;
        },
        set(name: string, value: string, options: any) {
          if (typeof document !== 'undefined') {
            let cookie = `${name}=${value}`;
            cookie += '; Path=/';
            cookie += '; SameSite=lax';
            
            if (options?.maxAge) {
              cookie += `; Max-Age=${options.maxAge}`;
            }
            if (options?.secure !== false) {
              cookie += '; Secure';
            }
            
            document.cookie = cookie;
          }
        },
        remove(name: string, options: any) {
          if (typeof document !== 'undefined') {
            document.cookie = `${name}=; Path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          }
        },
      },
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        flowType: 'pkce',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    }
  );
}
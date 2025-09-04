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
            
            // Standard practice: Domain=.feedbacks.dev for cross-subdomain sharing
            cookie += '; Domain=.feedbacks.dev';
            cookie += '; Path=/';
            cookie += '; SameSite=lax';
            cookie += '; Secure';
            
            if (options?.maxAge) {
              cookie += `; Max-Age=${options.maxAge}`;
            }
            
            document.cookie = cookie;
          }
        },
        remove(name: string, options: any) {
          if (typeof document !== 'undefined') {
            document.cookie = `${name}=; Domain=.feedbacks.dev; Path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          }
        },
      },
    }
  );
}
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Check if we're on the client side
          if (typeof document !== 'undefined') {
            return document.cookie
              .split('; ')
              .find(row => row.startsWith(`${name}=`))
              ?.split('=')[1];
          }
          return undefined;
        },
        set(name: string, value: string, options: any) {
          // Check if we're on the client side
          if (typeof document !== 'undefined') {
            let cookie = `${name}=${value}`;
            
            // Set domain to .feedbacks.dev for cross-subdomain sharing
            cookie += '; Domain=.feedbacks.dev';
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
          // Check if we're on the client side
          if (typeof document !== 'undefined') {
            document.cookie = `${name}=; Domain=.feedbacks.dev; Path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          }
        },
      },
    }
  );
}
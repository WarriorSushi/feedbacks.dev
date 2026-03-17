# Rate Limiting

## Upstash Redis (Recommended)

- Create a free Upstash Redis database
- Copy the REST URL and REST token
- Set env vars for the dashboard app:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`

The middleware `packages/dashboard/src/middleware.ts` enforces 10 requests/min per IP for `/api/feedback`.

## Supabase Table Alternative

If you prefer Supabase-only:

- Create a `rate_limits` table with columns: `key text primary key`, `count int`, `reset_at timestamptz`
- Write an RPC to atomically increment and reset within a window
- Call the RPC from `middleware.ts` or inside the API route using the service role key

This trades a bit of latency for fewer external dependencies.


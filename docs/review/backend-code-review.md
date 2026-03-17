# Backend Code Review — feedbacks.dev

**Date:** 2026-03-17
**Reviewer:** Automated deep-read audit
**Scope:** All API routes, lib files, middleware, MCP server, widget source, SQL migrations

---

## Summary Ratings

| Category | Worst Finding | Count |
|---|---|---|
| CRITICAL | 3 | Security holes, data loss, unbypassable bugs |
| HIGH | 8 | Reliability, data integrity, auth gaps |
| MEDIUM | 9 | Performance, design inconsistencies |
| LOW | 7 | Polish, edge cases |

---

## CRITICAL

### C-1: Rate limiting is trivially bypassable — `unknown` IP key collision
**File:** `src/lib/rate-limit.ts` line 14–32
**File:** `src/app/api/feedback/route.ts` line 63–65

When `x-forwarded-for` and `x-real-ip` are both absent (e.g. direct calls, some proxies), `ip` falls back to the string literal `"unknown"`. Every such request shares the same rate-limit bucket. This means:

- On serverless (Vercel), local development, or behind certain proxies, **all anonymous callers share one 10-req/min bucket**. Legitimate users can be rate-limited by an unrelated request.
- An attacker who can strip those headers completely bypasses per-IP limiting (they share with everyone else, not with themselves).

Additionally, the rate limit implementation performs a DELETE then INSERT on every allowed request — two sequential DB writes — with no locking. Under concurrent load the count read and insert are not atomic, so the window can be exceeded.

**Fix:** Require a real IP; reject or use a project-scoped key as fallback. Use an atomic upsert or a Postgres advisory lock.

---

### C-2: Captcha failure-open — verification service error silently allows through
**File:** `src/app/api/feedback/route.ts` line 27–58

```typescript
  } catch {
    // Verification service failure — allow through
  }
  return true   // <— always true on network error
```

If the Turnstile or hCaptcha endpoint is unreachable (even briefly), `verifyCaptcha` returns `true`, bypassing captcha entirely. This defeats the spam protection completely during any outage of Cloudflare/hCaptcha.

**Fix:** On catch, return `false` and return a 503 to the client, or at minimum log and return `false`.

---

### C-3: Vote deletion has no ownership check — anyone can delete any vote
**File:** `src/app/api/boards/[slug]/vote/route.ts` line 72–74
**File:** `sql/004_fix_public_board.sql` line 57–60

```typescript
await admin.from('votes').delete().eq('id', existingVote.id)
```

The `voterIdentifier` is used to find the existing vote, so only the same IP-derived hash can find their own vote to toggle. This part is fine in the API.

However, the RLS policy is:
```sql
CREATE POLICY "Anyone can delete own votes" ON votes FOR DELETE USING (true);
```

`USING (true)` means **any authenticated or anonymous user can delete ANY vote row via direct Supabase client calls** (bypassing the API). There is no ownership check in the policy at all.

**Fix:** Change the policy to `USING (voter_identifier = current_setting('request.jwt.claims', true)::json->>'sub')` or remove the blanket policy and rely solely on service-role (admin) client for vote mutations.

---

## HIGH

### H-1: Webhook delivery creates a new admin Supabase client on every single delivery attempt
**File:** `src/lib/webhook-delivery.ts` line 98

```typescript
const admin = await createAdminSupabase()
```

This is called inside `deliverSingle`, which is called for every endpoint on every feedback submission. `createAdminSupabase` does a dynamic `import('@supabase/supabase-js')` on each invocation. In a high-volume environment this creates unnecessary module resolution overhead per webhook. In a retry loop with up to 3 attempts this can instantiate the client 3 times per endpoint.

**Fix:** Create the admin client once at module level or pass it in as a parameter.

---

### H-2: Schema mismatch between `webhook_deliveries` table and insert in webhook-delivery.ts
**File:** `src/lib/webhook-delivery.ts` lines 147–158
**File:** `sql/001_initial_schema.sql` lines 230–260

The table schema defines columns: `endpoint_id`, `event`, `kind`, `url`, `status`, `status_code`, `error`, `payload`, `response_time_ms`, `response_body`, `attempt`.

The insert in code uses: `endpoint_type`, `endpoint_url`, `response_code`, `attempts` — **none of these column names match the schema**. Every webhook delivery log insert will fail silently (errors are explicitly ignored with the comment `// ignore insert errors`).

This means webhook delivery history is never actually recorded.

**Fix:** Align the insert fields with the actual schema columns (`kind` not `endpoint_type`, `url` not `endpoint_url`, `status_code` not `response_code`, `attempt` not `attempts`, `event` is required but never set).

---

### H-3: Schema mismatch — `rate_limits` table has `key`/`route` columns; code uses `ip`
**File:** `src/lib/rate-limit.ts` lines 12–36
**File:** `sql/001_initial_schema.sql` lines 268–276

The `rate_limits` table has columns `key` and `route`. The code inserts and queries using column `ip` (which does not exist). Every rate-limit check and insert will fail. **Rate limiting is entirely non-functional.**

The table also has an index on `(key, route, created_at)` but the code queries `eq('ip', ip)` and deletes `eq('ip', ip)`.

**Fix:** Either rename the column from `key`/`route` to `ip` in SQL, or update the code to use `key` and provide a `route` value.

---

### H-4: Project deletion is not atomic — partial deletes possible on error
**File:** `src/app/api/projects/[id]/route.ts` lines 95–99

```typescript
await admin.from('feedback').delete().eq('project_id', id)
await admin.from('webhook_deliveries').delete().eq('project_id', id)
const { error } = await admin.from('projects').delete().eq('id', id)
```

These three statements run sequentially with no transaction. If the projects delete fails, feedback and deliveries are already deleted with no rollback. The feedback `ON DELETE CASCADE` on `project_id` means the projects delete would cascade anyway — making the manual feedback delete redundant AND creating a window where feedback is deleted but the project persists.

**Fix:** Remove the manual deletes (rely on `ON DELETE CASCADE`), or wrap in a Postgres RPC that runs in a transaction.

---

### H-5: `url` field in feedback table has a `CHECK url ~ '^https?://'` constraint but code inserts `board:{slug}` and empty string
**File:** `sql/001_initial_schema.sql` line 87: `url text not null check (url ~ '^https?://')`
**File:** `src/app/api/boards/[slug]/submit/route.ts` line 59: `url: \`board:${slug}\``
**File:** `src/app/api/feedback/route.ts` line 223: `url: url ?? ''`

Three problems:
1. Board submissions insert `board:{slug}` which will **fail the URL constraint**, causing all public board submissions to silently error with 500.
2. If the widget sends no URL, the code inserts an empty string `''` which also **fails the constraint** (not `https://`).
3. The v1 API inserts `url: body.url?.trim() || ''` — same empty-string problem.

**Fix:** Make `url` nullable in the schema, or default to an empty string and remove the `https?://` check, or validate that a URL is always provided.

---

### H-6: MCP `update_feedback_status` tool makes two API round-trips when one would do
**File:** `packages/mcp-server/src/index.ts` lines 85–98

```typescript
const projectRes = await apiRequest('/projects') as { data: { id: string }[] }
const projectId = projectRes.data?.[0]?.id
```

Every call to `update_feedback_status` first fetches the full projects list just to get the project ID, then makes the PATCH. For an MCP tool called in tight loops this adds latency and wasted API quota. The API key already scopes to exactly one project.

The same pattern is used in `get_project_stats`.

**Fix:** Cache the project ID after the first call, or have the API return it directly in a header/token.

---

### H-7: No pagination on public board feedback — unbounded query
**File:** `src/app/api/boards/[slug]/route.ts` lines 24–35

```typescript
const { data: feedback } = await admin
  .from('feedback')
  .select('id, message, type, status, vote_count, created_at, email')
  .eq('project_id', board.project_id)
  .eq('is_public', true)
  // ...
  .order('vote_count', { ascending: false })
  // NO .limit() or .range()
```

A project with thousands of public feedback items will return all of them in one response, potentially causing memory pressure and slow responses.

**Fix:** Add `.limit(100)` at minimum, or implement cursor/page-based pagination with a `page` query param.

---

### H-8: `is_public` defaults to `false` in migration 002 but `true` in migration 004
**File:** `sql/002_public_board_voting.sql` line 33: `ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;`
**File:** `sql/004_fix_public_board.sql` line 6: `ALTER TABLE feedback ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;`

Migration 002 sets `DEFAULT false`; migration 004 (run after) tries to set `DEFAULT true` via `ADD COLUMN IF NOT EXISTS` — but since the column already exists from migration 002, the `IF NOT EXISTS` means the default is never updated. So `is_public` stays `DEFAULT false` on the actual table.

This means all widget-submitted feedback has `is_public = false` by default, and the public board will never show it unless the owner explicitly makes items public. The code in `feedback/route.ts` does not set `is_public` at all (no field in `feedbackRow`), so it relies entirely on the DB default — which is `false`.

**Fix:** Run `ALTER TABLE feedback ALTER COLUMN is_public SET DEFAULT true` explicitly, and decide which default is correct. Also explicitly set `is_public` in the insert for widget submissions.

---

## MEDIUM

### M-1: `verifyCaptcha` sends an empty string secret key when env var is missing
**File:** `src/app/api/feedback/route.ts` lines 33–34, 43–44

```typescript
secret: process.env.TURNSTILE_SECRET_KEY ?? '',
```

If the env var is not set, the verification call sends an empty secret. Cloudflare/hCaptcha will reject this with an error, which triggers the catch-and-allow-through bug (see C-2). This is a compound problem: missing env var → request error → spam allowed through.

**Fix:** Check for the secret key at startup or in the function and return an error if it is missing.

---

### M-2: `VALID_TYPES` in widget types.ts does not include `question`
**File:** `packages/widget/src/types.ts` line 25: `export type CategoryType = 'bug' | 'idea' | 'praise';`
**File:** `src/lib/types.ts` line 61: `export type FeedbackType = 'bug' | 'idea' | 'praise' | 'question';`

The server accepts `question` as a valid feedback type, but the widget UI only offers `bug`, `idea`, `praise`. If an agent submits `question` via the API, it stores fine, but the widget can never produce it. This is minor but creates a discrepancy in the API contract.

---

### M-3: `search` query parameter is passed directly to `ilike` — no length cap
**File:** `src/app/api/v1/feedback/route.ts` line 142
**File:** `src/app/api/v1/projects/[id]/feedback/route.ts` line 58

```typescript
if (search) query = query.ilike('message', `%${search}%`)
```

There is no length limit on the `search` param. An attacker can send a 100KB search string which Postgres will process in a sequential scan pattern match. Should be capped to ~200 characters.

---

### M-4: `PATCH /api/projects/[id]` accepts arbitrary `settings` and `webhooks` without validation
**File:** `src/app/api/projects/[id]/route.ts` lines 75–76

```typescript
if (body.settings !== undefined) updates.settings = body.settings
if (body.webhooks !== undefined) updates.webhooks = body.webhooks
```

Any JSON shape can be stored. No validation that `settings` matches `ProjectSettings` type or that `webhooks` matches `WebhookConfig`. A malformed webhook config here would cause runtime errors in `webhook-delivery.ts` where the config is destructured without guards.

---

### M-5: Code duplication — `getAuthedUserAndProject` repeated across multiple route files
**Files:** `src/app/api/projects/[id]/route.ts`, `src/app/api/projects/[id]/webhooks/route.ts`, `src/app/api/projects/[id]/feedback.csv/route.ts`

Three separate route files implement their own version of "get authed user, verify project ownership, return 401/404". This should be a single shared helper. Any auth logic change requires updating multiple files.

---

### M-6: No `Content-Security-Policy` or `X-Frame-Options` headers set anywhere
**File:** `src/middleware.ts`

The middleware only handles auth redirects. There are no security headers being added. Public-facing endpoints (boards, widget submit) lack any clickjacking or XSS mitigations at the HTTP header level.

---

### M-7: `sign-out` route clears hardcoded cookie names that may not match actual Supabase SSR cookies
**File:** `src/app/api/sign-out/route.ts` lines 11–15

```typescript
const cookieNames = ['sb-access-token', 'sb-refresh-token']
```

Supabase SSR (`@supabase/ssr`) uses dynamic cookie names that include the project reference: `sb-<project-ref>-auth-token`. The hardcoded names will never actually clear the real session cookies. The `supabase.auth.signOut()` call handles the actual server-side invalidation, but the cookies on the client browser won't be cleared.

---

### M-8: `feedback.csv` export uses anon client but other routes for the same resource use admin client
**File:** `src/app/api/projects/[id]/feedback.csv/route.ts` lines 8–9

```typescript
const supabase = await createServerSupabase()  // anon/user client
const { data } = await supabase.from('feedback').select(...)
```

All other project-feedback routes use `createAdminSupabase`. This relies on RLS policies to scope the result. The RLS policy for `feedback` requires a subquery join to `projects` on every row — this is potentially much slower than using the admin client with an explicit `eq('owner_user_id', user.id)` at the project level. Also inconsistent with the rest of the API pattern.

---

### M-9: `verifyCaptcha` has no timeout — can hang the entire feedback request
**File:** `src/app/api/feedback/route.ts` lines 27–58

The captcha verification `fetch` calls have no timeout or `AbortController`. If the Turnstile/hCaptcha endpoint hangs, the serverless function will block until the platform's default timeout (typically 10–30s on Vercel), degrading the widget experience for all users.

**Fix:** Wrap in `AbortController` with a 3-second timeout.

---

## LOW

### L-1: `html2canvas` is loaded from an external CDN at runtime without SRI
**File:** `packages/widget/src/widget.ts` line 546

```typescript
s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
```

No `integrity` attribute. If jsDelivr is compromised, arbitrary JavaScript executes in the context of the host page with access to all DOM content (including passwords, tokens). This is particularly bad for a feedback widget embedded on third-party sites.

**Fix:** Add a `crossorigin="anonymous"` attribute and a SHA-384 SRI hash.

---

### L-2: `autoInit` in `packages/widget/src/index.ts` does not guard against multiple initializations on the same script element
**File:** `packages/widget/src/index.ts` lines 8–51

If the script tag is duplicated in the page (user error or CMS injecting it twice), `autoInit` will call `new FeedbacksWidget(config)` twice for each `data-project` script, resulting in two launchers and two event listeners.

**Fix:** Mark initialized script elements with a data attribute and skip if already initialized.

---

### L-3: `destroy()` method on widget does not remove the keydown event listener
**File:** `packages/widget/src/widget.ts` lines 669–674

The `openOnKey` listener added at line 100 and the ESC listener added at line 234 are not removed in `destroy()`. If `destroy()` is called and a new instance created, the old listeners remain active.

---

### L-4: `createAdminSupabase` uses a dynamic import on every call — unnecessary overhead
**File:** `src/lib/supabase-server.ts` lines 29–35

```typescript
export async function createAdminSupabase() {
  const { createClient } = await import('@supabase/supabase-js')
  ...
}
```

`@supabase/supabase-js` is a static dependency. The dynamic `import()` is unnecessary and adds microtask overhead on every admin client creation (multiple times per request). Use a static `import` at the top of the file.

---

### L-5: Environment variables not validated at startup
**Files:** `src/lib/supabase-server.ts`, `src/middleware.ts`, `src/app/api/feedback/route.ts`

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are all accessed with non-null assertions (`!`). If any are missing the app silently starts and fails at runtime with a cryptic error. A startup check or `zod` validation of env vars would surface this immediately.

---

### L-6: `vote_count` can go negative due to vote trigger counting down-votes
**File:** `sql/002_public_board_voting.sql` lines 49–52

```sql
SELECT COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE -1 END), 0)
```

The trigger sums up-votes as +1 and all non-up-votes as -1. A `vote_type = 'down'` entry (which the schema allows via `CHECK (vote_type IN ('up', 'down'))`) will produce negative vote counts. The public board API returns `vote_count` directly to clients. The vote route only ever inserts `'up'` votes, but the schema allows down-votes from direct DB access.

Migration 004 defines a different trigger (`update_feedback_vote_count`) that counts `up` votes minus `down` votes separately — two different trigger implementations exist for the same table, both named differently. **Both triggers will fire on every vote insert/delete**, causing the vote_count to be updated twice (double-counting).

**Fix:** Drop one of the two triggers. Keep the one in migration 002 (more correct), and ensure migration 004 removes the old trigger definition before creating a new one.

---

### L-7: MCP server has no `get_project_stats_by_session` tool — listed in CLAUDE.md but missing
**File:** `packages/mcp-server/src/index.ts`
**File:** `CLAUDE.md` listing under MCP Server tools: `submit_feedback, list_feedback, update_feedback_status, get_project_stats, search_feedback`

The five listed tools all exist. No gap from the stated spec. (This is a clean-bill item.)

---

## Additional Observations

### OA-1: `deliverWebhooks` is fire-and-forget but runs inside a serverless function lifecycle
**File:** `src/lib/webhook-delivery.ts` line 220, `src/app/api/feedback/route.ts` line 246

```typescript
Promise.allSettled(promises).catch(() => {})
```

In a serverless environment (Vercel Edge/Node), the function response is returned immediately, but the platform may kill the process before the promises resolve. Webhook deliveries that take longer than the response time will be silently dropped. This is a known serverless limitation — the comment says "fire and forget" but the platform does not guarantee the work completes.

**Fix:** Use Vercel `waitUntil` (from `@vercel/functions`) to extend function lifetime, or queue webhook delivery via a separate background job (Supabase Edge Function, queue, etc.).

---

### OA-2: `feedback/route.ts` — base64 screenshot size is not bounded
**File:** `src/app/api/feedback/route.ts` line 175

A base64-encoded screenshot string in `fields.screenshot` has no size check before being decoded and uploaded. A malicious client could send a 50MB base64 string, consuming server memory and Supabase Storage quota.

**Fix:** Add a length check on `fields.screenshot` before processing (e.g. `fields.screenshot.length > 10_000_000` → reject).

---

### OA-3: `CORS_HEADERS` uses `Access-Control-Allow-Origin: *` on the feedback submission endpoint
**File:** `src/app/api/feedback/route.ts` line 8

This is intentional for an embeddable widget, but it means **any site can submit feedback to any project** using that project's API key if they obtain it (the key is shipped in the widget script). There is no `domain` allowlist check in the CORS origin validation — the `domain` field on the project is stored but never enforced in the CORS headers.

**Fix:** If `project.domain` is set, use it as the `Access-Control-Allow-Origin` value instead of `*`. This prevents other sites from submitting to that project's endpoint.

---

### OA-4: `packages/widget/src/widget.ts` applies theme CSS vars to `document.documentElement` (`:root`)
**File:** `packages/widget/src/widget.ts` lines 137–156

Setting CSS custom properties on `:root` will affect the host page's own CSS if it uses the same variable names (`--fb-font`, `--fb-primary`, etc. should be unlikely to collide, but `--fb-font` especially modifies the font of the entire document). This is a widget isolation concern.

**Fix:** Scope CSS vars to a widget-specific container element, or use a Shadow DOM for full isolation.

---

## File Reference Index

| File | Issues |
|---|---|
| `src/lib/rate-limit.ts` | C-1, H-3 |
| `src/lib/webhook-delivery.ts` | H-1, H-2, OA-1 |
| `src/lib/api-auth.ts` | L-4 (indirect via admin client) |
| `src/lib/supabase-server.ts` | L-4, L-5 |
| `src/middleware.ts` | M-6, L-5 |
| `src/app/api/feedback/route.ts` | C-1, C-2, H-5, M-1, M-9, OA-2, OA-3 |
| `src/app/api/projects/route.ts` | M-5 |
| `src/app/api/projects/[id]/route.ts` | H-4, M-4, M-5 |
| `src/app/api/projects/[id]/webhooks/route.ts` | M-5 |
| `src/app/api/projects/[id]/feedback.csv/route.ts` | M-8 |
| `src/app/api/auth-status/route.ts` | Clean |
| `src/app/api/sign-out/route.ts` | M-7 |
| `src/app/api/boards/[slug]/route.ts` | H-7 |
| `src/app/api/boards/[slug]/submit/route.ts` | H-5 |
| `src/app/api/boards/[slug]/vote/route.ts` | C-3 |
| `src/app/api/v1/feedback/route.ts` | M-3, H-5 |
| `src/app/api/v1/projects/route.ts` | Clean |
| `src/app/api/v1/projects/[id]/route.ts` | H-6 |
| `src/app/api/v1/projects/[id]/feedback/route.ts` | M-3 |
| `packages/mcp-server/src/index.ts` | H-6 |
| `packages/mcp-server/src/tools.ts` | Clean |
| `packages/widget/src/widget.ts` | L-1, L-3, OA-4 |
| `packages/widget/src/index.ts` | L-2 |
| `packages/widget/src/types.ts` | M-2 |
| `sql/001_initial_schema.sql` | H-2 (schema mismatch), H-3 (column names) |
| `sql/002_public_board_voting.sql` | C-3 (RLS), L-6 (double trigger) |
| `sql/003_agent_support.sql` | Clean |
| `sql/004_fix_public_board.sql` | C-3 (RLS), H-5 (url default), H-8 (is_public default conflict), L-6 (duplicate trigger) |

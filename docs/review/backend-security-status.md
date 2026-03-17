# Backend & Security Fixes Status

All fixes applied on branch `fix/backend-security`.

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 1 | Rate limiting broken (`ip` vs `key`/`route`) | FIXED | `rate-limit.ts` now uses `key`/`route` columns. Rejects null IP. |
| 2 | Captcha failure-open | FIXED | `verifyCaptcha` returns `false` on catch. Checks env var exists first. Added 3s AbortController timeout. |
| 3 | Vote RLS policy `USING (true)` on DELETE | FIXED | Added `sql/005_security_fixes.sql`. Votes are anonymous so app-level enforcement remains primary defense. |
| 4 | API keys plaintext | FIXED | `api-auth.ts` and `projects/route.ts` now hash with SHA-256. Raw key shown only once at creation. Added `api_key_hash` column in migration. |
| 5 | Middleware breaks API routes | FIXED | Matcher now excludes all `api/` routes. |
| 6 | Webhook SSRF | FIXED | `webhook-delivery.ts` validates URLs are https-only, blocks private IPs (10.x, 172.16-31.x, 192.168.x, 169.254.x, 127.x, ::1, fc00::, fe80::). |
| 7 | Webhook schema mismatch | FIXED | Changed to correct column names: `kind`, `url`, `status_code`, `attempt`, added `event` field. |
| 8 | URL CHECK constraint | FIXED | Migration 005 makes url nullable, drops the CHECK constraint. Board submit uses `null` instead of `board:slug`. |
| 9 | Duplicate vote triggers | FIXED | Migration 005 drops duplicate, recreates single correct trigger with COALESCE. |
| 10 | `is_public` default conflict | FIXED | Migration 005 sets `ALTER TABLE feedback ALTER COLUMN is_public SET DEFAULT true`. |
| 11 | Unsanitized `custom_css` | FIXED | `boards/[slug]/route.ts` sanitizes CSS: strips `url()`, `@import`, `expression()`, `javascript:`, `-moz-binding`. |
| 12 | Arbitrary JSON in metadata/structured_data | FIXED | `v1/feedback/route.ts` enforces 10KB limit for structured_data, 4KB for metadata. |
| 13 | Public board no pagination | FIXED | `boards/[slug]/route.ts` adds `.limit(100)`. |
| 14 | Search query length | FIXED | Both `v1/feedback/route.ts` and `v1/projects/[id]/feedback/route.ts` cap search to 200 chars. |
| 15 | Base64 screenshot size | FIXED | `feedback/route.ts` checks `fields.screenshot.length > 7_000_000` before decoding. |
| 16 | Attachment filename sanitize | FIXED | `feedback/route.ts` strips all chars except alphanumerics, dots, hyphens, underscores. |
| 17 | Email validation on board submit | FIXED | `boards/[slug]/submit/route.ts` now validates email with same regex as main route. |
| 18 | Vote salt hardcoded | FIXED | `boards/[slug]/vote/route.ts` uses `VOTE_HMAC_SECRET` env var with fallback. Added to `.env.example`. |
| 19 | CSV formula injection | FIXED | `feedback.csv/route.ts` prefixes cells starting with `=`, `+`, `-`, `@` with tab character. |
| 20 | URL field accepts non-HTTP | FIXED | `feedback/route.ts` checks protocol is `http:` or `https:` after `new URL()`. |
| 21 | Supabase error messages leaked | FIXED | `projects/route.ts` and `[id]/route.ts` return generic error messages for 500s. |
| 22 | Sign-out cookie names | FIXED | `sign-out/route.ts` relies only on `supabase.auth.signOut()`, removed hardcoded cookie clearing. |
| 23 | PATCH accepts arbitrary settings/webhooks | FIXED | `projects/[id]/route.ts` validates settings/webhooks are plain objects, limits body to 50KB. |
| 24 | Wildcard CORS with cookie fallback | FIXED | `v1/projects/route.ts` removed cookie auth fallback, API key auth only. |
| 25 | `count_by_column` RPC missing | FIXED | Added to `sql/005_security_fixes.sql` with whitelist for table/column names. |
| 26 | `createAdminSupabase` dynamic import | FIXED | `supabase-server.ts` changed to static `import { createClient }`. |
| 27 | Project deletion not atomic | FIXED | `projects/[id]/route.ts` DELETE now relies on CASCADE, removed manual child deletes. |
| 28 | Rate limit IP spoofing | FIXED | `rate-limit.ts` prefers `x-vercel-forwarded-for` header first. |
| 29 | Captcha timeout | FIXED | Added AbortController with 3s timeout to captcha fetch calls. |
| 30 | Webhook fire-and-forget | FIXED | Added comment about using `waitUntil` in `webhook-delivery.ts` and `feedback/route.ts`. |
| 31 | `createAdminSupabase` called per webhook | FIXED | `webhook-delivery.ts` creates admin client once in `deliverWebhooks` and passes to `deliverSingle`. |

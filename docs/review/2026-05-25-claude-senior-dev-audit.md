  feedbacks.dev - Senior-Dev Audit

  What this is

  A monorepo SaaS for collecting product feedback. Three real shipping surfaces:

  1. Widget - vanilla TS, ~11KB gzipped, modal/inline/trigger modes, captchas, screenshots, attachments.
  2. Dashboard - Next.js 15 / React 19 / Supabase / shadcn. Inbox, projects, public voting boards, integrations (Slack,
  Discord, GitHub Issues, generic), webhooks with retry queue, Dodo Payments billing with quotas/entitlements.
  3. AI Agent layer - REST /api/v1/* (X-API-Key) + MCP server package (@feedbacks/mcp-server) exposing 5 tools to
  Claude/Cursor/etc.

  Roughly 122 TS/TSX files in dashboard, 12 SQL migrations, 50 API routes, 2 cron jobs. Build, lint, type-check, and 7
  unit tests all green.

  Overall verdict

  Mature, near-launch-ready. This is not a prototype - it's a thoughtfully built product with real security baselines
  (RLS on every table, hashed API keys, SSRF blocklist on outbound webhooks, idempotent billing webhooks, durable retry
  queue, captcha integration, honeypot, rate limiting). Several real issues to fix before hard launch, but no
  architectural showstoppers.

  ---
  Health check results

  ┌─────────────────┬────────────────────────────────────────────────────────────────┐
  │      Gate       │                             Result                             │
  ├─────────────────┼────────────────────────────────────────────────────────────────┤
  │ pnpm install    │ clean (509 packages)                                           │
  ├─────────────────┼────────────────────────────────────────────────────────────────┤
  │ pnpm type-check │ passes across all 6 packages                                   │
  ├─────────────────┼────────────────────────────────────────────────────────────────┤
  │ pnpm lint       │ clean                                                          │
  ├─────────────────┼────────────────────────────────────────────────────────────────┤
  │ pnpm build      │ passes - 30 static pages, 38 dynamic routes, middleware 82.1KB │
  ├─────────────────┼────────────────────────────────────────────────────────────────┤
  │ pnpm test:unit  │ 7/7 pass (Dodo webhook + widget snippet tests)                 │
  ├─────────────────┼────────────────────────────────────────────────────────────────┤
  │ Widget gzip     │ 10.9KB / 20KB budget - well under target                       │
  └─────────────────┴────────────────────────────────────────────────────────────────┘

  E2E suite (pnpm test:e2e) needs E2E_AUTH_BYPASS_SECRET + working Supabase; not exercised here.

  ---
  Bugs and risks, by severity

  🔴 High - fix before launch

  1. Cron config split-brain - vercel.json (repo root) declares webhook-jobs every 5 min + notification-digests daily.
  packages/dashboard/vercel.json declares only webhook-jobs daily. Whichever directory you linked in Vercel wins; the
  other file is dead. If dashboard/ is the linked root (your DEPLOYMENT.md says it is), then notification-digests never
  runs in production and webhook retries are once-a-day instead of every 5 minutes. Pick one file, delete the other.
  2. Two RPCs called but never created in any migration:
    - avg_rating_for_project - called at packages/dashboard/src/app/api/projects/[id]/route.ts:28. Result is
  destructured without checking the error, so the endpoint always returns avgRating: null instead of the real average.
  Silently broken.
    - reset_webhook_failures - called at packages/dashboard/src/lib/webhook-delivery.ts:207. Wrapped in try/catch so
  it's just dead code, but the auto-disable counter never resets on success - meaning a flaky-then-recovered webhook
  still gets disabled on its next failure cluster.
  3. Widget html2canvas integrity hash is malformed. packages/widget/src/widget.ts:563 has
  integrity="sha384-Lhp4gBQSCMq2fNDEx53VsXFnGBi3FuQVnh6k6c3GFsuqJMuqlHwaJM3BRzb/0nT". That's 63 base64 chars; a real
  SHA-384 is 64 chars + = padding, and this specific hash doesn't match the v1.4.1 distribution. Browser blocks the
  script → screenshot capture silently fails on every page that uses it. Either generate the correct hash or drop SRI
  and pin a specific version. (Note: e2e fixtures/playwright-test-findings.md likely already noticed this; haven't
  checked.)

  🟡 Medium

  4. notification_digests table has no RLS. Every other table enables RLS - sql/011_notification_digests.sql:14 just
  creates the table and stops. No ALTER TABLE ... ENABLE ROW LEVEL SECURITY, no policies. Currently only admin client
  touches it, so not exploitable today, but it violates the project's own baseline and Supabase advisors will flag it.
  5. Rate limiter is race-prone and write-heavy. lib/rate-limit.ts does DELETE → SELECT COUNT → INSERT as three separate
   round trips, all non-atomic. Under burst load: two requests can both see current < limit and both insert. Also
  creates write amplification on the busiest endpoint in the system. Acceptable for now; move to a single INSERT ... ON
  CONFLICT upsert with a window-bucket key, or Upstash Redis if traffic grows.
  6. Domain inconsistency. Widget falls back to https://app.feedbacks.dev/api/feedback; README + landing page +
  CLAUDE.md say https://feedbacks.dev; MCP server defaults to https://app.feedbacks.dev. Pick one canonical origin and
  propagate.
  7. Dodo signature scheme is custom, not Standard Webhooks. The verified format is hex HMAC of id.timestamp.payload.
  The unit test confirms self-consistency, but Dodo's published Standard Webhooks spec uses v1,<base64>. Either Dodo's
  implementation does what you do (then fine), or your production webhooks will fail signature verification on first
  delivery. Worth one staging end-to-end to confirm.
  8. Replay window on Dodo webhooks is unbounded. verifyDodoWebhook reads webhook-timestamp but never compares it to
  Date.now(). Idempotency via webhook_id covers replay of the same event; but if a secret leak ever happens, the lack of
   timestamp tolerance means old captured events stay valid forever. Add a Math.abs(now - timestamp) < 5 * 60 * 1000
  check.

  🟢 Low / polish

  9. Project webhooks shape drift. Schema default is '[]'::jsonb (array); POST /api/projects inserts {} (object); all
  code paths treat it as object (WebhookConfig). Older v1 projects could still have [] in the DB and break enumeration.
  Either backfill or harden normalizeWebhookConfig.
  10. Auth callback redirect param is unvalidated. app/auth/callback/route.ts:13 does ${origin}${redirect} with no check
   that redirect starts with a single /. Not an exploitable open redirect today (browsers treat the result as a
  same-origin path), but constraining it is two lines of code.
  11. env.ts throws at import. requireEnv raises during module load, which means a missing var breaks the Next.js build
  (not just runtime). Friendly for catching mistakes, hostile for partial Vercel setups. Consider deferring to first
  call site.
  12. packages/widget/dist/widget.js is committed (10KB gzipped binary in git). The build pipeline produces it; no need
  for it in source control.
  13. Dashboard dev log files in repo root - dashboard-dev.out.log, dashboard-dev.err.log. Likely already noisy in PR
  diffs.
  14. Untracked file at repo root - where-codex-left-work.md (124KB). Looks like an old handoff doc; either commit it
  under docs/ or delete.

  ---
  What works really well

  - Security baselines are unusually solid for a project this size: SSRF blocklist (IPv4 private ranges, IPv6 loopback,
  localhost), api_key hashed at rest with last_four shown, fail-closed captcha, honeypot, body-size limits on PATCH,
  rate limits on every public surface.
  - Webhook reliability - durable webhook_jobs table with next_attempt_at, stale-lock recovery, exponential backoff
  capped at 10 min, auto-disable after 3 consecutive failures with user notification. This is more than most YC seed
  teams ship.
  - Billing isolation - entitlements/usage in shared package, history-day cutoff applied uniformly on reads,
  schema-missing fallback that warns once instead of crashing.
  - RLS coverage - every table except notification_digests enforces owner-based policies, and policies use (SELECT
  auth.uid()) instead of bare auth.uid() (a small but meaningful perf optimization on Postgres planner).
  - AI capability - yes, this is genuinely AI-capable today. MCP server exposes 5 tools with zod schemas, REST /api/v1
  is keyed and rate-limited, and the project page surfaces both setup snippets to users.

  ---
  Quick answers to your questions

  - Does it work? Yes. Build, tests, types, lint all green. The three known broken paths are: avg rating (returns null),
   reset_webhook_failures (dead code), screenshot SRI (blocked).
  - Is it AI-capable? Yes - REST + MCP both shipped. Gated behind the Pro entitlement (assertFeatureAccess('mcp')).
  - Connect Supabase to dig further? Worth it if you want me to: (a) inspect live RLS coverage (compare to migration
  list), (b) replay a fake Dodo webhook end-to-end, (c) check production data for the webhooks: [] vs {} drift. Say the
  word and I'll wire up a service-role key.

  Recommended next 1-day fix list

  1. Pick one vercel.json, delete the other.
  2. Add avg_rating_for_project + reset_webhook_failures migrations (or remove the calls).
  3. Fix the html2canvas SRI hash (or remove it).
  4. Add ENABLE ROW LEVEL SECURITY + a deny-all policy to notification_digests.
  5. Add a 5-minute timestamp window to verifyDodoWebhook.
  6. Decide the canonical origin and update README/widget/MCP defaults.
# Operations Hardening Checklist

Last updated: 2026-07-30

Use this before staging or production signoff. It complements `pnpm supabase:check`, which verifies required tables, columns, and storage buckets through the Supabase Data API.

## Supabase Schema Checks

Run:

```bash
pnpm supabase:check
pnpm supabase:types
```

Then verify index and policy health through Supabase:

```bash
supabase db advisors --type security
supabase db advisors --type performance
```

If the CLI is not authenticated, use the Supabase MCP advisors for the live project.

Latest live advisor and traffic snapshot from 2026-06-23:

- Performance: the agent setup `auth_rls_initplan` warning was cleared by `sql/020_optimize_agent_setup_rls.sql` and verified on the live project.
- Performance: the `usage_counters` multiple-permissive SELECT warning was cleared by `sql/021_split_usage_counter_write_rls.sql` and verified on the live project.
- Performance: public board/read multiple-permissive SELECT warnings were cleared by `sql/022_consolidate_public_board_read_rls.sql` and verified on the live project.
- Performance: unused-index review completed against live `pg_stat_user_indexes` and `pg_stat_user_tables` after production smoke traffic. Zero-scan indexes remain tiny, mostly 8-40 kB, and the relevant tables are still low volume. Keep them through launch and revisit after sustained production traffic instead of removing launch-support indexes early.
- Performance follow-up on 24 June 2026 reached the same conclusion: zero-scan indexes remain small and the live tables still do not have sustained traffic. No index was removed.

Required areas:

- `feedback.read_at`
- public board settings, follows, watches, reports, and announcements
- billing accounts, billing events, usage counters, and entitlement helpers
- notification digests
- cron run audit rows
- webhook digest item queue
- webhook jobs and deliveries
- `feedback_screenshots` and `feedback_attachments` buckets

## Cron And Queue Checks

Confirm Vercel cron schedules are present and monitored:

- `/api/cron/webhook-jobs`
- `/api/cron/notification-digests`
- `/api/cron/e2e-cleanup`
- `/api/cron/account-deletions`

Query the authenticated `/api/internal/health` endpoint and require:

- every required cron fresh and successful
- webhook backlog under 100 and fewer than 20 failures in 24 hours
- zero failed or stale billing events
- zero failed or blocked account-deletion jobs
- production-only activation counts (E2E is excluded by environment)

Vercel Web Analytics and Speed Insights are mounted in the root layout. Review page acquisition and p75
Core Web Vitals by route and device. Runtime events use structured JSON with request IDs. See
`docs/operations-runbook.md` for containment and recovery procedures.

GitHub Actions also calls:

- `/api/cron/webhook-jobs` every five minutes
- `/api/cron/notification-digests` daily at 13:15 UTC

Check for:

- recent `cron_runs` rows for both jobs after production deploy
- webhook jobs stuck in `pending`, `processing`, or `retrying`
- notification digest rows missing for opted-in users
- billing webhook rejects or stale billing state
- repeated rate-limit spikes on public submission routes

24 June 2026 live snapshot:

- latest `webhook_jobs` heartbeat succeeded at `2026-06-24 08:46 UTC`
- webhook job backlog had zero pending, processing, retrying, or failed rows
- the stored webhook digest item was `succeeded`
- all recorded webhook, test, and digest deliveries in the last seven days were successful
- the Vercel notification digest schedule was present, but its latest heartbeat was still from 22 June; the external GitHub Actions fallback was added so this route no longer depends on one scheduler
- GitHub Actions workflow run `28090709830` succeeded and recorded a new `notification_digests` heartbeat at `2026-06-24 10:01:50 UTC`

## Production Smoke Tests

Run these after deploy:

1. Widget submission creates feedback with URL and browser context.
2. Hosted verification page creates a project-scoped inbox item.
3. Public board submission appears on the board and in the owner inbox.
4. Board watch/follow receives email fanout for status changes and team replies when email env is enabled.
5. Slack, Discord, GitHub Issues, and generic webhook test deliveries write delivery logs.
6. Generic webhook replay works and preserves payload `version`.
7. Billing webhook updates entitlement state from a verified Dodo event.
8. REST API and MCP list, submit, search, and update project-scoped feedback with a trusted API key.

Latest smoke result from 2026-06-23:

- Passed with disposable login `test@test.com` against `https://app.feedbacks.dev`.
- Verified hosted project creation, hosted verify, widget submission, inbox/mobile density, public board submit/duplicate/report/moderation/follow/watch, Slack/Discord/GitHub/generic webhook test sends and replays, generic daily digest delivery, REST API list/update, cron audit rows, GitHub Actions scheduler dispatch, and final production runtime logs.
- Fixed and redeployed smoke issues found during launch hardening: mobile directory card overflow, auth-page legal-link cross-origin prefetch console noise, cross-surface board navigation prefetch noise, report-only CSP warning noise, and public-board date hydration mismatch.
- Final post-push smoke on `dpl_H5xCf7tkuX7kWCHhedcYGZvrZh3x` verified public board, board directory, landing, and auth surfaces with no browser console/page errors and no mobile horizontal overflow.

## Storage Retention

Screenshots and image attachments use private Supabase Storage buckets. Owners retrieve clean media
through the authenticated `/api/feedback/[id]/media/[kind]` route; anonymous access and cross-project
access are rejected. Project and account deletion remove registered media paths idempotently.
The retention decision for the current launch surface is owner-scoped retention: media is retained
with the feedback record and removed when the owning project or account is deleted. There is no
automatic time-based purge for launch.

Before larger production rollout:

- keep retention expectations aligned in customer-facing privacy copy
- add per-item media deletion only if individual feedback deletion becomes part of the shipped surface
- verify bucket MIME and size limits match `docs/DEPLOYMENT.md`
- keep a production smoke test for project/account deletion media cleanup before launch

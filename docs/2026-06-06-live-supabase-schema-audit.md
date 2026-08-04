# Live Supabase Schema Audit - 6th June 2026

## Scope

Read-only Supabase MCP checks against project `xiiaugllydxxmjbtzfux` (`feedbacks.dev`).

Live migrations were applied after the initial read-only audit:

- `013_launch_security_hardening`
- `014_fix_rate_limit_uuid_generation`
- `015_server_managed_votes`

## Project

- Status: active and healthy
- Region: `eu-west-2`
- Postgres: 17.6.1

## Migration History

Live migration history currently contains:

- `20260326112053 phase6_typed_board_profile_columns`
- `20260326112113 phase6_board_announcements`
- `20260326112134 phase6_follows_watches_reports`
- `20260326112148 phase6_webhook_jobs`
- `20260405220327 009_billing_and_entitlements`
- `20260405224008 010_api_key_hardening`
- `20260405224016 011_notification_digests`
- `20260605152552 project_stats_and_digest_rls`
- `20260606074137 013_launch_security_hardening`
- `20260606074308 014_fix_rate_limit_uuid_generation`
- `20260606074420 015_server_managed_votes`

Repo deployment docs now use the ordered `sql/001` through `sql/015` chain as the canonical source of truth.

Correction made during this pass:

- `docs/DEPLOYMENT.md` now includes `002_public_board_voting.sql` and `003_agent_support.sql`.
- `004_fix_public_board.sql` now drops/recreates duplicate board/vote policies so it can run after `002_public_board_voting.sql`.
- `005_security_fixes.sql`, `006_public_board_comments.sql`, and `009_billing_and_entitlements.sql` now drop/recreate named policies or triggers before creating them.

Risk:

- The live migration ledger does not show the base `001` through `008` files as applied migrations, likely because the live project was built from earlier manual or branch-style SQL.
- Before high-risk schema work, keep live migration history reconciled with the repo's ordered SQL chain so internal staging/recovery databases and the live project are explainable from the same source.

## RLS Inventory

All public tables reported RLS enabled.

One live-only drift table was found:

- `public.widget_config_events`: RLS enabled, zero policies, and not present in the repo's canonical SQL files.

Action applied:

- `sql/013_launch_security_hardening.sql` added a compatibility deny-all policy because `widget_config_events` exists in live Supabase.

## Advisor Findings

Initial security advisor findings:

- Several SECURITY DEFINER functions were executable by `anon` and `authenticated`.
- `update_board_settings_updated_at` and `update_feedback_vote_count` had mutable search paths.
- `votes` previously had permissive anonymous insert/delete policies for public voting.

After migrations `013`, `014`, and `015`, the remaining app-side findings were resolved or moved into observation:

- Security-definer execute grants were restricted.
- Function search paths were fixed.
- Public vote writes were moved behind server routes.

Performance advisor findings:

- Several Phase 6 foreign keys lacked covering indexes.
- Several RLS policies used direct `auth.uid()` instead of `(select auth.uid())`.
- Some indexes are unused, likely because the project has low production traffic or the surfaces are new.

## 14 June 2026 Advisor Refresh

Read-only Supabase MCP advisor refresh:

- Performance advisor reports unused indexes and multiple permissive policy warnings on newer board, feedback, usage, and widget configuration surfaces.

Decision: Performance warnings should be reviewed after real traffic or in a separate RLS/index cleanup pass; do not drop indexes just because the pre-launch project has not used them yet.

## Action Taken In Repo

Added and applied `sql/013_launch_security_hardening.sql` to:

- add atomic `public.check_rate_limit(...)`
- revoke direct client execution from server-only SECURITY DEFINER functions
- add Phase 6 foreign-key indexes surfaced by advisors
- set search paths on older trigger functions
- replace direct `auth.uid()` in advisor-flagged policies
- add a live-drift deny-all policy for `widget_config_events` if the table exists

Added and applied `sql/014_fix_rate_limit_uuid_generation.sql` because the first live RPC verification found `uuid_generate_v4()` was not visible from `check_rate_limit`'s locked function `search_path`.

Added and applied `sql/015_server_managed_votes.sql` so public board vote writes go through Next.js server routes instead of direct Supabase client policies.

Updated `packages/dashboard/src/lib/rate-limit.ts` to prefer the new RPC and fall back to the old path only when migration `013` is missing.

## Verification

After the repo changes:

- `pnpm type-check` passed
- `pnpm lint` passed
- `pnpm test:unit` passed
- `pnpm test:e2e:required` passed, 10/10 browser tests

After applying live migrations:

- `check_rate_limit('codex-live-verify-014', 'migration-014', 2, 60)` returned allowed, allowed, then blocked across three calls.
- Live `votes` policies now allow public reads and deny direct client insert/update/delete.
- `pnpm test:e2e:required` passed again after live migrations, 10/10 browser tests.

## 9 June 2026 Reconciliation Update

The migration story is now documented in `docs/2026-06-09-migration-history-reconciliation.md`.

Internal staging/recovery projects should run `sql/001` through `sql/015` in order.

The live hosted project should not replay `001` through `012`; its ledger reflects older branch-style work plus applied hardening migrations `013`, `014`, and `015`.

Fresh empty-database verification is still required before relying on a new staging/recovery database or doing high-risk production schema work. It could not run from the current machine because Docker and `psql` are unavailable, and Supabase branching is not enabled on the current plan. This is not customer setup work for hosted feedbacks.dev users.

## Still To Do

1. Run a true disposable internal fresh-database `001` through the current migration chain from an environment with Docker, `psql`, branching, or a throwaway project.
2. Keep unused-index performance advisor findings under observation after real production traffic.

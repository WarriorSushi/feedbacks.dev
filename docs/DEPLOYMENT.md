# feedbacks.dev - Hosted Production Deployment Guide

This is a maintainer/operator runbook for the official hosted feedbacks.dev service. It is not customer setup documentation. Customers should create an account on `https://feedbacks.dev` and install the hosted widget from `https://app.feedbacks.dev`.

Hosted convention:

- `https://feedbacks.dev` is the marketing and docs origin.
- `https://app.feedbacks.dev` is the hosted dashboard, API, widget, and public-board origin.
- Internal staging or private operator deployments should replace the app origin with that deployment's dashboard domain, shown below as `https://your-app-domain.com`.

## Prerequisites
- Access to the feedbacks.dev Supabase project, or a dedicated staging/recovery project
- Access to the feedbacks.dev Vercel project
- GitHub OAuth app ownership
- Production secrets managed outside the repository

---

## Step 1: Database State And Internal Migrations

For the official hosted production project, do not replay the full SQL chain. The live project was built from older branch-style/manual migrations and is now reconciled through the launch hardening migrations. See `docs/2026-06-09-migration-history-reconciliation.md` before touching the migration ledger.

For a new internal staging, recovery, or disposable verification project, run these files in order:

1. `sql/001_initial_schema.sql` - base tables (projects, feedback, webhook_deliveries, etc.)
2. `sql/002_public_board_voting.sql` - public board settings, votes, board indexes, and initial board RLS
3. `sql/003_agent_support.sql` - agent fields and indexes for AI/API submissions
4. `sql/004_fix_public_board.sql` - public board consistency fixes, vote-count trigger repair, and public defaults
5. `sql/005_security_fixes.sql` - security fixes, vote-count repair, and API key hardening prerequisites
6. `sql/006_public_board_comments.sql` - public admin comments on board items
7. `sql/007_phase6_hardening.sql` - typed board profile fields, announcements, follows, watches, reports, and durable webhook jobs
8. `sql/008_board_display_name.sql` - public board display name support
9. `sql/009_billing_and_entitlements.sql` - billing accounts, events, usage counters, and quota helpers
10. `sql/010_api_key_hardening.sql` - final API-key storage hardening
11. `sql/011_notification_digests.sql` - digest scheduling support
12. `sql/012_project_stats_and_digest_rls.sql` - project stats RPCs and notification digest RLS coverage
13. `sql/013_launch_security_hardening.sql` - atomic rate-limit RPC, function exposure hardening, advisor indexes, and RLS cleanup
14. `sql/014_fix_rate_limit_uuid_generation.sql` - fixes rate-limit UUID generation on locked function search paths
15. `sql/015_server_managed_votes.sql` - removes direct client vote writes; board votes go through server API routes
16. `sql/016_agent_setup_audit.sql` - audit log for short-lived AI setup packet creation and reads
17. `sql/017_agent_setup_token_revocation.sql` - revocable agent setup packet token registry
18. `sql/018_feedback_read_state.sql` - adds `feedback.read_at` so inbox read state stays separate from workflow status
19. `sql/019_feedback_read_state_backfill.sql` - marks existing non-`new` feedback as read so triaged items do not appear unread
20. `sql/020_optimize_agent_setup_rls.sql` - wraps agent setup owner checks in `(select auth.uid())` to clear per-row RLS auth evaluation
21. `sql/021_split_usage_counter_write_rls.sql` - splits usage counter write-deny policies away from SELECT to reduce RLS advisor noise
22. `sql/022_consolidate_public_board_read_rls.sql` - consolidates public board/announcement/note SELECT policies and splits owner writes
23. `sql/023_cron_run_audit.sql` - adds service-role cron run audit rows for webhook and notification digest heartbeat checks
24. `sql/024_webhook_digest_items.sql` - adds the durable webhook digest queue for daily batched endpoint delivery
25. `sql/025_dashboard_stats.sql` - adds a service-only, owner-scoped aggregate for fast project and all-project dashboards
26. `sql/026_activation_milestones.sql` - adds privacy-preserving, one-time activation funnel milestones without page-view or visitor tracking
27. `sql/027_operational_health_indexes.sql` - keeps delivery and installation-health probes indexed as history grows
28. `sql/028_product_updates.sql` - Product Updates settings, owner-authored releases, daily aggregate metrics, RLS, service-only RPCs, and the `product_update_images` bucket
29. `sql/029_project_embed_installations.sql` - privacy-preserving current-embed heartbeat and module detection
30. `sql/030_product_update_activation_events.sql` - aggregate Updates activation milestones
31. `sql/031_atomic_project_modules.sql` - atomically saves Feedback and Updates module choices through a service-only RPC
32. `sql/032_plan_foreign_key_indexes.sql` - indexes plan and entitlement relationship lookups
33. `sql/033_split_publishable_and_private_project_keys.sql` - separates browser-safe publishable keys from hashed private credentials
34. `sql/034_encrypt_integration_secrets.sql` - encrypts integration credentials at rest
35. `sql/035_redact_integration_operational_data.sql` - removes credentials from browser, queue, and delivery-log surfaces
36. `sql/036_project_environment_isolation.sql` - separates production, test, and expiring verification projects
37. `sql/037_quarantine_legacy_production_e2e_data.sql` - quarantines historical production test fixtures
38. `sql/038_activation_environment_partition.sql` - excludes test environments from activation metrics
39. `sql/039_private_feedback_media.sql` - stores feedback media privately with explicit scan state
40. `sql/040_atomic_billing_event_processing.sql` - makes billing webhook processing safely claimable and retryable
41. `sql/041_audit_integration_secret_changes.sql` - records integration secret lifecycle events
42. `sql/042_billing_customer_summary.sql` - exposes a bounded customer billing summary
43. `sql/043_durable_account_deletion_jobs.sql` - creates resumable, auditable account-deletion work
44. `sql/044_public_board_directory_migration_marker.sql` - records the hosted directory migration boundary
45. `sql/045_bounded_public_board_directory.sql` - moves public directory ranking and totals into a bounded service-only aggregate
46. `sql/046_feedback_activity_and_update_accessibility.sql` - records feedback history and update accessibility metadata
47. `sql/047_api_idempotency_keys.sql` - prevents duplicate API mutations on retries
48. `sql/048_idempotency_request_fingerprint.sql` - rejects idempotency-key reuse with a different request
49. `sql/049_idempotent_project_creation.sql` - makes project creation retry-safe and uniquely keyed
50. `sql/050_cursor_public_board_directory.sql` - adds snapshot-stable keyset pagination to public-board discovery
51. `sql/051_advisor_security_hardening.sql` - removes remaining callable trigger internals, makes service-only RLS intent explicit, and fixes advisor indexes
52. `sql/052_resend_delivery_events.sql` - records signed Resend delivery events and suppresses bounced or complained recipients without storing plaintext email addresses
53. `sql/053_versioned_product_update_publish.sql` - rejects stale Product Update publication requests inside the database lock
54. `sql/054_multiple_product_update_ctas.sql` - supports multiple validated call-to-action links on Product Updates
55. `sql/055_private_feedback_by_default.sql` - makes non-board feedback private by default and marks its collection source
56. `sql/056_growth_referrals_and_marketing.sql` - adds consent-aware lead and conversion records, five-use referrals, a one-time complimentary Pro month, and service-only growth data access
57. `sql/057_referral_and_downgrade_safeguards.sql` - adds layered referral qualification, final-three-paid-days cancellation warnings, reversible project freezing, and server-only lifecycle controls
58. `sql/058_internal_product_feedback_project.sql` - creates the administrator-owned system project used by Settings feedback and product updates
59. `sql/059_product_update_visibility_toggle.sql` - adds independent release-note visibility and an atomic service-only toggle that preserves publication and seen-state identity
60. `sql/060_referral_review_resolution.sql` - validates stored abuse-signal digests and adds a service-only manual review resolver that still reuses the atomic maturation and activation checks
61. `sql/061_require_server_feedback_referral_activation.sql` - requires a server-observed first feedback submission before a matured referral can qualify for complimentary Pro
62. `sql/062_constrain_public_feedback_note_visibility.sql` - prevents public team replies from remaining readable after their parent feedback is archived/private or their board is disabled/private
63. `sql/063_atomic_free_plan_quota_writes.sql` - serializes project and feedback creation per owner, atomically enforces Free quotas, and removes direct Data API project mutations that could bypass server controls
64. `sql/064_founding_beta_applications.sql` - retains the legacy cohort application records used during the programme rename
65. `sql/065_early_adopter_programme.sql` - adds the Early Adopter lifecycle, mandatory onboarding reward, monthly feedback renewal, and service-only programme controls
66. `sql/066_claim_early_adopter_seats_on_activation.sql` - makes email submission claim-ready without consuming capacity and atomically allocates a seat only when onboarding activates Pro

Hosted schema note, 22 August 2026: migrations through `066` are applied and verified on the live project. Product Updates tables and storage exist with RLS enabled, embed heartbeats are service-managed, module choices are atomic, public-directory pagination is snapshot-stable, stale writes, publications, and visibility changes are rejected atomically, email bounces and complaints are replay-safe and suppress future sends, referral rewards require a server-observed first feedback submission, public replies inherit their parent feedback and board visibility, project and feedback quotas are enforced by serialized service-only writes, manual referral reviews have a service-only resolution path, the internal product-feedback project exists, and Early Adopter email claims do not consume a seat until the locked onboarding-completion operation assigns one and activates Pro. Generated types are current, and `pnpm supabase:check` passes. The remaining Supabase security advisory is the project-level leaked-password-protection setting, not a database migration issue.

**How for internal/staging use:** apply the files through the Supabase CLI or copy-paste the contents of each file into the SQL Editor and click "Run".

The hosted live project has older branch-style migration history plus the launch hardening migrations; see `docs/2026-06-09-migration-history-reconciliation.md` before touching its migration ledger.

Do not treat `sql/000_full_reset_v2-ran this one for v2. nothing else needed.sql` as the canonical production migration path. It is a reset snapshot for local recovery, not the ordered migration source of truth.

---

## Step 2: Supabase Auth Configuration

For signup abuse protection, configure hCaptcha or Cloudflare Turnstile in Supabase Authentication → Bot and Abuse Protection, then set the matching `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` or `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in the dashboard deployment. If both public site keys are set, auth follows the hCaptcha configuration. The auth page passes the resulting token directly to Supabase Auth. Never expose `HCAPTCHA_SECRET_KEY` or `TURNSTILE_SECRET_KEY` in a `NEXT_PUBLIC_` variable.

Go to **Supabase Dashboard** → **Authentication**:

### Email (Magic Link)
1. **Providers → Email** → Enabled ✅
2. Enable "Confirm email" (recommended for production)
3. Set the Site URL (see below)

### GitHub OAuth
1. **Providers → GitHub** → Enabled ✅
2. Go to [GitHub Developer Settings](https://github.com/settings/developers) → **OAuth Apps** → **New OAuth App**
3. Fill in:
   - **Application name:** feedbacks.dev
   - **Homepage URL:** `https://app.feedbacks.dev`
   - **Authorization callback URL:** `https://your-supabase-project.supabase.co/auth/v1/callback`
4. Copy the **Client ID** and **Client Secret** back into Supabase GitHub provider settings

### Google OAuth
1. In Google Auth Platform, create an OAuth client with **Web application** as the application type.
2. Add the application origins:
   - `http://localhost:3000` for local development
   - `https://app.feedbacks.dev` for production
3. Add the Supabase Auth callback shown on **Supabase Dashboard → Authentication → Providers → Google** as an authorized redirect URI. For a hosted project it is `https://YOUR_PROJECT.supabase.co/auth/v1/callback`.
4. Add the `openid`, `userinfo.email`, and `userinfo.profile` scopes in Google Auth Platform.
5. Copy the Google **Client ID** and **Client Secret** into the Supabase Google provider and enable it.
6. Keep development and production Supabase projects separate. Configure each project with its own allowed application URLs and preferably its own Google OAuth client.

### URL Configuration
1. **Authentication → URL Configuration**:
   - **Site URL:** `https://app.feedbacks.dev` for production
   - **Redirect URLs:** Add both:
     - `http://localhost:3000/auth/callback`
     - `https://app.feedbacks.dev/auth/callback`

Use staging app origins for staging projects. Do not point production Auth redirects at preview deployments unless they are intentionally allowed for a launch rehearsal.

The app uses a PKCE callback at `/auth/callback` for Google, GitHub, and email links. Do not add Google client secrets to application environment variables; Supabase stores the provider secret.

---

## Step 3: Supabase Storage (for screenshots)

1. Go to **Storage** → **New Bucket**
2. Create bucket: `feedback_screenshots` → Private
3. Create bucket: `feedback_attachments` → Public ✅
4. Recommended bucket limits:
   - `feedback_screenshots`: `image/png`, `image/jpeg`, max `3 MB`
   - `feedback_attachments`: `image/png`, `image/jpeg`, `application/pdf`

`sql/028_product_updates.sql` also creates the public `product_update_images` bucket. It accepts JPEG, PNG, and WebP only, with a 2 MB limit. Do not create browser upload policies for this bucket: dashboard owner routes upload and remove files through the server-side admin client.

The widget API validates PNG/JPEG magic bytes, re-encodes images to strip metadata, and enforces the
3 MB screenshot limit. Image attachments are private and capped at 5 MB. PDF attachments remain
disabled until a production malware scanner and quarantine workflow are configured.

---

## Step 4: Environment Variables

### For local development
Copy `packages/dashboard/.env.local.example` to `packages/dashboard/.env.local`, then fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_ORIGIN=http://127.0.0.1:3000
# CRON_SECRET=your-cron-secret
```

Find these in **Supabase Dashboard → Settings → API**.

Optional but recommended for the new reliability and moderation surfaces:

```
WEBHOOK_JOB_SECRET=your-webhook-job-secret
BOARD_REPORT_SALT=your-board-report-salt
E2E_AUTH_BYPASS_SECRET=your-e2e-auth-bypass-secret
VOTE_HMAC_SECRET=your-vote-hmac-secret
AGENT_SETUP_TOKEN_SECRET=your-agent-setup-token-secret
```

`E2E_AUTH_BYPASS_SECRET` is only needed for the local Playwright acceptance flow.

`BOARD_REPORT_SALT` and `VOTE_HMAC_SECRET` are required in production so public board reports and votes do not use development fallback salts.

### For Vercel
Add the required server/runtime variables in **Vercel → Project Settings → Environment Variables** for Production and any staging environments that run the app. Keep `SUPABASE_SERVICE_ROLE_KEY`, webhook secrets, billing secrets, and email keys server-only. Only `NEXT_PUBLIC_*` values should reach the browser.

Production requires:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_ORIGIN=https://app.feedbacks.dev
CRON_SECRET
WEBHOOK_JOB_SECRET
BOARD_REPORT_SALT
VOTE_HMAC_SECRET
AGENT_SETUP_TOKEN_SECRET
```

Add billing, captcha, and email variables only when those surfaces are enabled in production.

When email notifications are enabled, configure all three server-only values:

```text
RESEND_API_KEY
RESEND_FROM_EMAIL
RESEND_WEBHOOK_SECRET
```

In Resend, create a webhook for
`https://app.feedbacks.dev/api/webhooks/resend`, subscribe to `email.bounced`,
`email.complained`, `email.suppressed`, `email.failed`,
`email.delivery_delayed`, `email.sent`, and `email.delivered`, then copy its
`whsec_…` signing secret into `RESEND_WEBHOOK_SECRET`. The route verifies the
raw-body Svix signature and timestamp, deduplicates on `svix-id`, stores only
hashed recipients, and prevents future sends to bounced, suppressed, or
complaining recipients.

### Cron plan note

Vercel Hobby accounts reject cron schedules that run more than once per day. The checked-in Vercel config therefore uses daily cron schedules so Hobby production deploys can succeed.

The hosted production project uses a two-layer free scheduler setup:

- Vercel cron remains daily as the platform-managed backup.
- GitHub Actions calls `/api/cron/webhook-jobs` every 5 minutes with `Authorization: Bearer <CRON_SECRET>`.

Keep `CRON_SECRET` configured in both Vercel production env and GitHub Actions repository secrets. If GitHub Actions is delayed or disabled, webhook retries fall back to the daily Vercel cron. If the product later needs stricter retry timing, upgrade the Vercel project to a plan that supports `*/5 * * * *` or move the scheduler to a dedicated queue/worker.

---

## Step 5: Deploy to Vercel

Current production status, refreshed 23 June 2026:

- Vercel project: `feedbacks-dev-dashboard`
- Team/scope: `warriorsushis-projects`
- Root directory: `packages/dashboard`
- Production origin: `https://app.feedbacks.dev`
- Latest verified production runtime commit: `2435a2ac28a0ca2a516eb987a10473133ecc84ab`
- Latest verified production runtime deployment: `dpl_H5xCf7tkuX7kWCHhedcYGZvrZh3x`
- Authenticated production smoke used disposable login `test@test.com` and verified project creation, install/customize/API/integrations pages, hosted verify, widget submission, inbox/mobile density, public board submission/duplicate/report/moderation/follow/watch, webhook test sends/replays, generic digest delivery, REST API list/update, and billing page mobile density.
- Cron audit smoke: `/api/cron/webhook-jobs` and `/api/cron/notification-digests` both returned `200` from production with `cron_runs` rows recorded at `2026-06-22 19:26 UTC`.
- GitHub Actions scheduler path smoke: workflow dispatch run `27978342902` succeeded and recorded a `webhook_jobs` `cron_runs` row at `2026-06-22 19:27 UTC`.
- Latest Vercel production runtime error/fatal log check returned no entries for the final smoke window.
- Post-push polish smoke on deployment `dpl_H5xCf7tkuX7kWCHhedcYGZvrZh3x` verified public board, board directory, landing, and auth surfaces with no browser console/page errors and no mobile horizontal overflow. GitHub Actions cron dispatch run `27982508167` succeeded and recorded a `webhook_jobs` heartbeat at `2026-06-22 20:40 UTC`.

The deployment was performed through the Vercel CLI after reconnecting the GitHub integration and granting the requested repository permissions. If Git auto-deploy appears stuck again, first check whether the project is receiving GitHub deployment records, then run:

```bash
vercel link --yes --project feedbacks-dev-dashboard --scope warriorsushis-projects
vercel deploy --prod --scope warriorsushis-projects --yes
```

### Option A: Via Vercel Dashboard
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `packages/dashboard`
   - **Build Command:** `cd ../.. && pnpm build`
   - **Install Command:** `cd ../.. && pnpm install`
4. Add environment variables (Step 4)
5. Deploy

### Option B: Via CLI
```bash
# Install Vercel CLI
pnpm add -g vercel

# From the project root
vercel

# Follow prompts, set root directory to packages/dashboard
```

### Vercel Settings to Check
- **Node.js Version:** 20.x (Settings → General)
- **Framework:** Next.js (should auto-detect)
- Make sure "Include source files outside root directory" is ON (for monorepo)

---

## Step 6: Production Domains

1. **Vercel → Domains** → Add `feedbacks.dev` and `app.feedbacks.dev`
2. Update DNS records as Vercel instructs
3. Update Supabase **Site URL** and **Redirect URLs** to use `https://app.feedbacks.dev`
4. Update GitHub OAuth callback URL in the OAuth app
5. Confirm the widget snippet and public-board URLs use `https://app.feedbacks.dev`

---

## Step 7: Post-Deploy Verification

Test this checklist:

- [x] Landing page loads at `/`
- [x] Can sign in via GitHub OAuth
- [x] Can sign in via magic link email
- [x] Dashboard loads at `/dashboard`
- [x] Can create a new project
- [x] Widget install tab shows correct script URL
- [x] Widget works when embedded on a test page
- [x] Can submit feedback through the widget
- [x] Feedback appears in the inbox
- [x] Can change feedback status
- [x] Can add internal notes
- [x] Public board works at `/p/[slug]`
- [x] Board follow/watch/report flows work when signed in
- [x] Announcements appear on the public board
- [x] `/boards` directory reflects public vs unlisted/private visibility
- [x] Voting works on the public board
- [x] Webhook test send and resend work from the integrations screen
- [x] Webhook retries are processed by the cron-backed queue
- [x] Daily digest webhook endpoints create `feedback.digest` delivery logs from `webhook_digest_items`
- [x] `cron_runs` has recent `webhook_jobs` and `notification_digests` rows after scheduled runs
- [x] API key auth works for `/api/v1/` endpoints
- [x] CSV export downloads at `/api/projects/[id]/feedback.csv`
- [x] Privacy and Terms pages load

23 June 2026 evidence: authenticated production smoke covered dashboard/project/widget/inbox/board/integration/API/mobile flows on `https://app.feedbacks.dev`. A follow-up authenticated browser check fetched `/api/projects/51e80367-9ac2-46d0-8f27-431a09464190/feedback.csv` with HTTP `200` and CSV headers. Supabase `cron_runs` has recent successful `webhook_jobs` and `notification_digests` rows, and recent delivery logs include `feedback.digest`, `feedback.new`, and `feedback.test` successes. Final post-push browser smoke also verified public board, board directory, landing, and auth pages on mobile widths without console/page errors or horizontal overflow.

---

## Supabase RLS Policies

The migration files set up RLS, but verify these are active:

| Table | Policy | Who |
|-------|--------|-----|
| projects | Users see own projects | `owner_user_id = auth.uid()` |
| feedback | Users see feedback from their projects | Via project ownership |
| feedback_notes | Users manage notes on their feedback | Via project ownership |
| public_board_settings | Anyone reads enabled boards | `enabled = true` |
| votes | Anyone can read public vote totals | Direct client writes denied; vote writes go through server API routes |

Check in **Supabase → Authentication → Policies** that each table has RLS enabled.

---

## Widget Installation

Hosted users install the widget with:

```html
<script
  src="https://app.feedbacks.dev/widget/latest.js"
  data-project="PROJECT_KEY"
  data-api-url="https://app.feedbacks.dev/api/feedback"
  defer
></script>
```

Internal staging deployments can replace the origin with their staging app origin.

## Generic Webhook Signatures

Generic webhook endpoints can optionally set a signing secret. When configured, feedbacks.dev sends:

```text
X-Feedbacks-Timestamp: <unix seconds>
X-Feedbacks-Signature: v1=<hex hmac sha256>
```

The signed message is:

```text
<timestamp>.<raw request body>
```

Receivers should recompute the HMAC with the endpoint secret, compare it using a timing-safe comparison, and reject stale timestamps.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Invalid project key" on widget | Check the browser-safe `fb_pub_…` project key in Install & verify |
| OAuth redirect fails | Verify callback URLs in Supabase + GitHub |
| No feedback appearing | Check RLS policies, ensure feedback table has data |
| Widget not loading | Check browser console, verify script URL |
| Build fails on Vercel | Ensure root directory is `packages/dashboard`, Node 20+ |
| Public board empty | Verify the ordered migration chain through `015` ran, then check `is_public` and `public_board_settings` rows |
| Rate limiting behaves like the old non-atomic path | Verify migration `013` or later ran so `public.check_rate_limit(...)` exists |

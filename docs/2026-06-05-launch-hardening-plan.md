# feedbacks.dev Launch Hardening Plan - 5th June 2026

## Why This Plan Exists

This plan is the current checkpoint after the interrupted hardening work and the latest pushed commits on `main`.

The goal is not to add more product surface right now. The goal is to make the product trustworthy enough to launch:

- copy-paste install must work
- browser acceptance must be repeatable
- Slack, Discord, GitHub, generic webhooks, Dodo billing, and MCP must be proven with real integrations
- docs must match the actual repo
- the UI must feel calm, sharp, and developer-trustworthy

`feedbacks.dev` is no longer a toy prototype. It has a real widget, dashboard, public boards, billing, webhooks, REST API, and MCP server. The remaining work is launch hardening, reliability, docs trust, and UX polish.

## Current Repo Status

Current branch:

```text
main == origin/main after the 15 June 2026 push
latest pushed commit before this doc refresh: eccd204 Make Vercel cron config Hobby compatible
```

Known local files not part of the pushed product work:

```text
packages/dashboard/tsconfig.tsbuildinfo
latest audit 25th may 2026 by claude code.md
output/
where-codex-left-work.md
```

These should not be committed unless we deliberately move the markdown notes into `docs/review/` and ignore or clean generated artifacts.

## What Changed Since The Earlier Audit

Claude's 25 May audit was useful, but several items it listed are now fixed.

Fixed since then:

- Cron config split-brain is fixed. Only `packages/dashboard/vercel.json` remains. On Vercel Hobby it uses daily cron schedules; fast webhook retries need Vercel Pro or an external scheduler.
- Vercel production is deployed again as of 15 June 2026 after the Hobby cron limit blocked the earlier five-minute webhook schedule.
- Project stats RPCs are covered by `sql/012_project_stats_and_digest_rls.sql`.
- `notification_digests` now has RLS and policies in `sql/012_project_stats_and_digest_rls.sql`.
- Widget `html2canvas` SRI is fixed and unit-tested.
- Dodo webhook replay protection now has a 5-minute timestamp tolerance.
- Dodo webhook verification now accepts Standard Webhooks `v1,<base64-signature>` signatures and the earlier internal hex-HMAC test format.
- `POST /api/v1/feedback` now defaults missing or null `metadata` to `{}`.
- The temporary password login screen was removed.
- Favicon metadata and project stats migration work were completed.
- Phase 6 board primitives are largely present: typed board profile migration, follows, watches, reports, announcements, and board E2E coverage.
- Webhook integrations are real product paths: Slack, Discord, generic webhook, GitHub Issues, test sends, delivery logs, and replay.
- MCP server exists as `@feedbacks/mcp-server` with tools for submitting, listing, searching, updating feedback, and fetching project stats.

Still true:

- The full Playwright suite passed locally on 6th June 2026, but should stay part of every launch-hardening pass.
- Real Slack, Discord, GitHub, and Dodo sandbox/live flows still need manual verification.
- Domain naming still needs one canonical story: `feedbacks.dev` versus `app.feedbacks.dev`.
- Rate limiting now prefers the atomic database RPC added in `sql/013_launch_security_hardening.sql`.
- MCP exists, but public setup docs and package verification need launch polish.
- UI/UX should get a focused Impeccable pass before public launch.

## Product Surfaces That Exist Today

Core product:

- embeddable widget
- dashboard project management
- install snippet generation
- hosted verification page
- feedback inbox
- feedback detail view
- status, priority, tags, filtering
- CSV export

Public boards:

- board publishing
- voting
- public replies
- status changes
- hide/moderation flow
- board directory
- category filtering
- board reports
- follows and watches
- announcements/feed model

Integrations:

- Slack webhook delivery
- Discord webhook delivery
- generic HTTPS webhook delivery
- GitHub Issues creation
- test sends
- delivery logs
- replay
- retry queue and cron processing

Billing:

- Dodo billing webhook route
- Dodo signature verification
- Dodo replay protection
- Free and Pro entitlement model
- feature gating for webhooks and MCP

AI/agents:

- REST `/api/v1` API with `X-API-Key`
- MCP server package
- agent metadata on feedback
- agent filtering/support in the feedback surface

## Impeccable UI/UX Read

Impeccable context loaded successfully from `PRODUCT.md`.

Register: product UI.

Design direction to follow:

- calm, precise, mature, developer-first
- light-first by default
- restrained neutral structure with controlled green accent
- compact information hierarchy
- crisp borders
- stronger contrast
- public boards should feel credible and editorial, not playful or social-toy-like
- no flashy decoration where task clarity matters

Design note:

- `DESIGN.md` now exists and should be used with `PRODUCT.md` for future UI changes.

Recommended UI/UX improvements to include in the launch work:

1. First-run project flow should put "Copy snippet" and "Run hosted verification" ahead of customization.
2. Install, Customize, Integrations, Public Board, API, and Settings should keep the same action vocabulary and button hierarchy.
3. Integrations should make saved/tested/replayed state more scannable, with consistent health labels and clear endpoint rows.
4. Public boards should use sharper hierarchy for vote count, status, replies, and team response, avoiding pill overload.
5. Board directory should feel curated, not like an endless generic card pile. Ranking/category controls should be compact and obvious.
6. Empty states should teach the next action: create project, send first test feedback, add first endpoint, publish first board.
7. Error states should be explicit and recoverable, especially for install verification, webhook tests, billing sync, and MCP/API keys.
8. Loading states should use skeletons inside the actual layout, not generic spinners that hide the user's next task.
9. Copy should stay direct: no repeated headings, no decoration-first claims, no vague "powerful workflow" language.
10. Mobile should keep tasks available without cramming desktop density into a narrow viewport.

## Sequential 5-Step Plan

### Step 1 - Baseline Cleanup And Trust Check

Purpose:

Get the repo into a clean, known state before deeper work.

Tasks:

1. Decide what to do with the two root markdown notes:
   - move `latest audit 25th may 2026 by claude code.md` into `docs/review/`, or delete it
   - move `where-codex-left-work.md` into `docs/review/`, or delete it
2. Add or confirm ignore behavior for generated files:
   - `output/`
   - `packages/dashboard/tsconfig.tsbuildinfo`
3. Run the stable baseline:
   - `pnpm test:unit`
   - `pnpm type-check`
   - `pnpm lint`
   - `pnpm build`
4. Confirm no widget files changed unexpectedly.
5. If widget files changed, run:
   - `pnpm widget:build`
   - `pnpm widget:check-size`

Acceptance criteria:

- `git status` has only intentional docs or code changes.
- Unit tests, type-check, lint, and build pass.
- Any generated artifacts are ignored or cleaned.

### Step 2 - Stabilize Full Browser Acceptance

Purpose:

Make the full product flow repeatable, not just individually passable.

Tasks:

1. Run:
   - `pnpm test:e2e:required`
2. If full suite fails, identify whether it is:
   - app bug
   - Playwright timing issue
   - database seed buildup
   - dev-server instability
   - missing environment
3. Stabilize the known acceptance flows:
   - install flow
   - hosted widget verify flow
   - webhook configuration, test send, and replay
   - board submit duplicate/spam checks
   - board moderation reply/status/hide flow
   - board directory category filtering
4. Reduce `/boards` test data load if large seeded history slows hydration.
5. Improve E2E setup docs and `.env.local.example` so another developer can run acceptance without guessing.

Acceptance criteria:

- `pnpm test:e2e:required` passes as a full suite from a fresh shell.
- Failing specs no longer need to be rerun individually to prove confidence.
- The exact E2E env requirements are documented.

### Step 3 - Real Connector And Billing Verification

Purpose:

Prove the paid surfaces work with real external services.

Execution runbook:

- `docs/2026-06-06-real-connector-and-billing-verification.md`

Status on 6th June 2026:

- Deferred by operator decision because the local environment does not currently include real connector or Dodo credentials.
- The skipped work is documented in `docs/2026-06-06-real-connector-and-billing-verification.md`.
- Step 4 may proceed, but Step 3 must be revisited before launch.

Tasks:

1. Slack:
   - configure a real Slack incoming webhook
   - send a test delivery
   - verify Slack receives the expected message
   - verify delivery log records success
   - replay the delivery
2. Discord:
   - configure a real Discord webhook
   - send a test delivery
   - verify Discord receives the expected message
   - verify delivery log records success
   - replay the delivery
3. Generic webhook:
   - use a real HTTPS inspection endpoint
   - verify payload shape
   - verify logs and replay
4. GitHub Issues:
   - configure a real test repo and token
   - create a test issue
   - verify labels/body/title
   - verify logs and replay behavior
5. Dodo:
   - test checkout in sandbox or staging
   - receive a real webhook
   - confirm real Dodo sender works with the Standard Webhooks-compatible verifier
   - confirm timestamp replay protection accepts current events and rejects stale events
6. Entitlements:
   - verify Free blocks Pro-only webhooks/MCP
   - verify Pro allows webhooks/MCP
   - verify browser redirect alone does not grant Pro without webhook-backed state

Acceptance criteria:

- At least one real successful delivery exists for each connector.
- Dodo webhook verification is proven against real Dodo payloads.
- Free/Pro gating is verified through UI and server routes.

### Step 4 - Launch Hardening And Docs Alignment

Purpose:

Remove the last trust gaps that would make a new developer hesitate.

Canonical origin decision on 6th June 2026:

- `https://feedbacks.dev` is the marketing and docs origin.
- `https://app.feedbacks.dev` is the hosted product origin for the dashboard, API, widget assets, and public boards.
- Self-hosted deployments replace the app origin with their own dashboard domain through `NEXT_PUBLIC_APP_ORIGIN`.

Tasks:

1. Pick and document canonical origins:
   - marketing site: likely `https://feedbacks.dev`
   - app/API/widget: likely `https://app.feedbacks.dev`
2. Update every snippet and default to match that decision:
   - README
   - landing page
   - install tab
   - widget fallback
   - MCP default API URL
   - deployment docs
3. Review rate limiting:
   - keep current implementation for launch if acceptable
   - or move to an atomic database function / bucket model
   - document the decision
4. Review stored integration secrets:
   - GitHub token handling
   - webhook endpoint display
   - logs and response body truncation
5. Consider outbound webhook signatures:
   - done for generic webhooks on 9 June 2026
   - generic endpoints can set an optional signing secret
   - signed deliveries include `X-Feedbacks-Timestamp` and `X-Feedbacks-Signature`
   - Slack, Discord, and GitHub keep native delivery formats
6. Confirm migrations from empty Supabase:
   - ordered migration list works
   - no manual-only SQL remains required
   - live Supabase schema matches repo migrations
   - blocked on the current machine because Docker and `psql` are unavailable and Supabase branching requires a paid plan
7. Create `DESIGN.md` from the current product UI:
   - typography
   - spacing
   - colors
   - component vocabulary
   - loading/empty/error state standards

Acceptance criteria:

- A new developer can follow docs without finding mismatched domains or missing SQL.
- Production secrets and integrations have a clear security posture.
- Design guidance exists outside memory and screenshots.

### Step 5 - MCP And Impeccable Product Polish

Purpose:

Make the AI and UI story feel launch-ready, not merely implemented.

MCP tasks:

1. Verify `@feedbacks/mcp-server` build and package entry:
   - `pnpm --filter @feedbacks/mcp-server build`
2. Test with a real local MCP client config.
3. Write setup docs for:
   - Cursor
   - Claude Code
   - generic MCP clients
4. Add clear examples:
   - agent submits a bug
   - agent searches feedback
   - agent updates status
   - agent gets project stats
5. Consider adding:
   - `get_feedback_detail`
   - `add_internal_note`
   - `list_projects` if multi-project agent workflows become important

Impeccable UI/UX tasks:

1. First-run install polish:
   - make "copy snippet" the strongest action
   - make "run hosted verification" the second strongest action
   - keep customization clearly after first success
2. Integrations polish:
   - endpoint rows should show configured, tested, failed, replayed states clearly
   - make health labels consistent across sections
   - make test-send failure messages actionable
3. Public board polish:
   - reduce pill overload
   - sharpen vote/status/reply hierarchy
   - make team replies feel official and easy to scan
   - make report/watch/follow actions feel secondary but discoverable
4. Directory polish:
   - make category filters compact
   - make "why this board is ranked here" easier to infer
   - avoid endless generic card feel
5. Dashboard polish:
   - improve empty states
   - make agent-submitted feedback visually distinct without making it noisy
   - keep UI density high enough for repeated triage
6. Error and loading polish:
   - no silent failures on save/test/send actions
   - skeletons should preserve layout
   - retry actions should be visible where possible

Acceptance criteria:

- A developer can install the widget and verify it in under 10 minutes.
- A developer can connect MCP in under 10 minutes.
- Public boards feel credible enough to share with real users.
- Integrations feel operational, not decorative.

## Recommended Work Order

Do the steps in this order:

1. Baseline cleanup
2. Full E2E stabilization
3. Real connector and Dodo verification
4. Docs/security hardening
5. MCP and UI/UX polish

Do not start new product features until steps 1 through 3 are green.

## Immediate Next Action

Start with Step 1:

1. decide whether to move or delete the two root markdown handoff files
2. clean or ignore generated artifacts
3. run `pnpm test:unit`, `pnpm type-check`, `pnpm lint`, and `pnpm build`
4. then run `pnpm test:e2e:required`

If the browser suite fails again, treat that failure as the next implementation target.

# feedbacks.dev Product Implementation Status

Last updated: 2026-09-09

## September 9 release-readiness refresh

- The canonical hosted script is now the only advertised Website, React, Vue, WordPress, and site-builder install path. Unpublished framework packages are no longer shown to customers.
- The hosted MCP tarball connects in Claude Code, all nine tools initialize, and the documented Claude CLI argument order matches the current client. The Cursor JSON contract matches current Cursor stdio and environment-interpolation documentation.
- Production dependencies have zero known advisories. The release gate now checks low-severity advisories, TypeScript, ESLint, all 269 unit tests, every package build, widget size, and dashboard route budgets.
- The live Supabase schema, storage buckets, policies, and service-only database functions pass `pnpm supabase:check`.
- GitHub Actions now monitors `/api/internal/health` externally. The cron credential was rotated across Vercel and GitHub, the retry worker and health monitor passed after rotation, and schedules avoid GitHub's high-load clock boundaries.
- Production deployment `dpl_BwHVhBW3AjuJk3i2uZVpFYJjVwwb` is Ready on all canonical aliases. Live public Playwright smoke, hosted widget and MCP asset checks, authorization-boundary probes, and the post-deploy Vercel error-log scan are clean.
- Dodo remains intentionally in test mode. Live promotion requires one coherent live Dodo API key, product set, webhook secret, environment switch, redeploy, and real checkout verification.
- Three account-side gates remain: configure the signed Resend production webhook, enable Supabase leaked-password protection when the plan supports it, and provision a non-production Supabase project before enabling the isolated data-mutating Playwright job.

This document tracks the stable product status after the full product audit in `docs/review/2026-06-21-full-product-audit-and-phase-plan.md`. Use it as the short source of truth for what is shipped, what is intentionally deferred, and what should not be promoted as complete yet.

## Implemented

- Drop-in widget install path with generated snippets, setup packets, hosted verification guidance, and browser-safe project keys.
- Widget customization for placement, labels, color, optional fields, rating/type controls, screenshot/attachment behavior, and saved install configuration.
- Widget screenshot capture records the visible viewport at the user's current scroll position, compresses it to JPEG within a 1920x1080 client envelope, and is backed by an image-only 3 MB Supabase Storage limit. Feedback detail shows a compact preview that opens in a keyboard-accessible in-app viewer.
- Feedback inbox with search, unified filter pills, project/tag filters, bulk status/tag/read actions, source labels, unread filtering, and read/unread state via `feedback.read_at`.
- Feedback detail view that marks an item read without changing workflow status.
- Internal notes, tags, priority, public/private board state, and workflow statuses.
- Adaptive dashboard guidance shows one focused install/test action before first feedback, then collapses into compact tutorial and navigation-tour entry points so inbox health and recent activity stay prominent.
- Guided navigation tour with persisted skip/finish state in `user_settings.preferences`, manual retake entry points in the authenticated sidebar and Settings, focused setup progress, sparse board directory empty states, and verified desktop/mobile sidebar highlighting across all nine tour steps.
- Tutorial Center with seven route-aware spotlight lessons for navigation, project creation, form customization, installation, inbox triage, board publishing, and routing. Lessons run on real product surfaces, support skip/back/next/finish, and keep resumable browser progress without a separate practice mode. Spotlight cutouts inherit each target's computed corner radius, retry delayed/off-screen targets, and place the measured message panel beside or above/below the target without covering it.
- Public boards with submissions, voting, comments/team replies, moderation tab/report queue, reports, announcements, branding, visibility, directory discovery, visible board follow/unfollow, and follower/watcher email fanout for status changes and team replies.
- Public board request rows and hero hierarchy have been tightened for a calmer, more product-grade scan path.
- Signed-in public board navigation keeps owners inside the app board directory instead of sending them to the public marketing directory.
- Signed-in app sessions visiting the marketing homepage are detected through an exact-origin credentialed auth check and redirected to the app dashboard without broadening session cookies to other subdomains.
- Public board discovery renders 24 boards per page with bounded previous/next navigation. The authenticated Public Boards route is a separate owner-management view with per-project publication state, public-request count, preview, and setup/manage actions.
- Public board discovery uses a compressed mobile hero, compact three-column metrics, search-first controls, horizontally discoverable sort/category rails, and 44px mobile controls so board results enter the first viewport sooner.
- Public board directory categories are normalized through a curated category helper, shown with readable labels/counts, and exposed as suggested owner setup chips.
- Public board settings include owner-facing guidance for review cadence, status discipline, and privacy expectations before promotion.
- Integrations for Slack, Discord, GitHub Issues, and generic webhooks with endpoint rules, immediate or daily digest delivery, delivery logs, replay, retry jobs, SSRF checks, optional generic HMAC signing, additive webhook payload versioning, and documented recipes.
- Email notification settings and server-side Resend delivery paths for owner alerts, webhook failure alerts, billing failure alerts, and daily digests.
- Dodo Payments billing state with checkout, portal, verified webhooks, usage limits, and entitlement checks. Dodo remains in test mode until final production launch.
- Project-scoped REST API and MCP server for trusted backend/agent workflows. Production builds package the MCP server as a versioned tarball at `/mcp/feedbacks-mcp-server-1.0.0.tgz`, and the documented `npm exec` command was verified to initialize and advertise all nine tools.
- Generated Supabase database types and a repeatable `pnpm supabase:check` schema/bucket verification command.
- Updates / What’s New is a first-class project product with Updates-only, Feedback-only, and combined module choices; stable sidebar routes; state-driven setup; remote activation for current embeds; list-first authoring; private previews; lifecycle actions; aggregate analytics; and plain-language settings. The live schema includes `sql/028_product_updates.sql` through `sql/031_atomic_project_modules.sql`. RLS/grants, generated types, the 15,333-byte gzip widget, and the 24-test required browser gate were verified on 19 July 2026.
- Supabase RLS policy optimization for agent setup audit/token reads via `sql/020_optimize_agent_setup_rls.sql`, applied and verified on the live project.
- Supabase RLS cleanup for `usage_counters` write-deny policies via `sql/021_split_usage_counter_write_rls.sql`, applied and verified on the live project.
- Supabase RLS cleanup for public board, announcement, and public note SELECT policies via `sql/022_consolidate_public_board_read_rls.sql`, applied and verified on the live project.
- Project and account deletion clean up associated screenshot and attachment objects from Supabase Storage before deleting owned records.
- Cron routes write service-role-only `cron_runs` heartbeat rows for webhook retry and notification digest production verification.
- GitHub Actions provides external scheduler fallbacks for webhook retries and daily notification digests while the Vercel project remains on Hobby cron limits.
- Webhook digest delivery stores `webhook_digest_items`, batches daily digest endpoint deliveries through the webhook cron, and records `feedback.digest` delivery logs.
- HTML escaping for user-supplied feedback content in notification emails.
- Inbox and public-board search/sort controls have persistent accessible names; mobile inbox and project navigation rails use edge fades, snap points, and compact setup steps to make overflow discoverable without widening the viewport.
- Project navigation uses the global project switcher plus one project workspace menu; the redundant nested project tree was removed. Dark mode now uses neutral elevated surfaces and reserves brand green for action and state.
- Project selection persists across authenticated routes. The Projects screen lists every project and marks the current one; the sidebar switcher owns project context, and Integrations/API open the selected project workspace directly instead of presenting another project picker.
- Public developer documentation is available under `/docs` with 16 task-oriented guides covering quickstart, project/key concepts, Website/framework installation, customization, verification, inbox triage, public boards, routing, REST, MCP, captured context, security, limits, and troubleshooting. It includes full-text guide search, copyable examples, mobile navigation, per-page contents, and previous/next paths.
- Primary authenticated routes use distinct browser titles, and compact mobile navigation, project-picker, directory, pagination, menu, and sign-out controls meet a 40-44px target without increasing desktop density.
- Production smoke on 23 June 2026 verified the hosted authenticated loop, public board loop, webhook test/replay loop, generic digest loop, REST API list/update loop, hosted verify page, cron audit rows, and mobile density for directory, inbox, integrations, board settings, and billing. Post-push polish smoke on deployment `dpl_H5xCf7tkuX7kWCHhedcYGZvrZh3x` also verified public board, directory, landing, and auth surfaces with no browser console/page errors or mobile horizontal overflow. On 24 June, deployment `dpl_CEeZgLrUWd7SrpYkGY8Hy88WA7Zm` shipped the mobile-safe guided tour, hosted MCP package, and notification digest scheduler fallback; the hosted package initialized all nine MCP tools and the deployment had no error-level runtime logs.

## Promises To Avoid Until Implemented

- Linear as a first-class integration.
- Multi-seat team management, assignment queues, mentions, and role-based collaboration.
- AI or automatic recurring-theme detection in the dashboard.

## Current Product Positioning

Use this language:

- "Drop-in feedback widget"
- "Triage dashboard"
- "Public voting boards"
- "Slack, Discord, GitHub Issues, and generic webhooks"
- "Immediate or daily digest webhook delivery"
- "REST API and MCP for trusted agents"
- "In-app Updates / What’s New"
- "Webhook-backed billing truth"

Avoid this language for now:

- "Smart dashboard" when implying automatic intelligence.
- "Assign feedback" or "team discussions" when implying multi-user workflow.
- "Linear integration" unless referring to future roadmap or a generic webhook recipe.

## Next Implementation Phases

1. Operations: continue monitoring scheduled `cron_runs` and webhook backlog under real usage. The 24 June snapshot had no active or failed webhook jobs; the notification digest scheduler now has a GitHub Actions fallback.
2. Performance: repeat unused-index review after sustained production traffic, not just smoke traffic.
3. Billing launch: keep Dodo in test mode until the final go-live decision and production credentials are intentionally enabled.
4. Product polish: continue reducing decorative public-board/landing surfaces where they distract from product proof.

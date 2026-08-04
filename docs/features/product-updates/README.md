# Product Updates / What's New

Status: MVP and the modular navigation/onboarding redesign were completed and release-verified on 2026-07-19.

This folder is the implementation handoff for an in-app changelog popup in the `feedbacks.dev` ecosystem.

The dashboard product is labeled **Release notes** and explains that it publishes in-product “What’s new” announcements. The end-user surface is named **What's New**. The approved naming and remote-configuration amendment is [remote-configuration-and-naming-decision-2026-07-20.md](./remote-configuration-and-naming-decision-2026-07-20.md).

## Modular redesign

The dated implementation plan for making Updates a first-class sidebar product, supporting Updates-only installation, and simplifying onboarding is:

- `ux-navigation-redesign-implementation-plan-2026-07-18.md`

The server-resolved bootstrap now supersedes the MVP's one-time `data-enable-updates` activation requirement and supplies the browser-safe feedback-form configuration. Existing current-runtime embeds can activate Release notes or change the Feedback form remotely, while bootstrap failure preserves legacy behavior. The MVP security, privacy, content, metrics, and widget-size guardrails remain authoritative.

## Goal

Allow a developer to publish a polished product update from the `feedbacks.dev` dashboard and show it inside their own SaaS application through the existing feedback widget installation.

After the shared embed is installed, activating or publishing later updates must not require another code deployment in the customer's application.

## Required reading order

An implementation agent must read these files in order before editing code:

1. `README.md` - decisions, scope, and completion contract
2. `product-spec.md` - user behavior and product requirements
3. `technical-design.md` - schema, API, widget, security, and file boundaries
4. `implementation-plan.md` - ordered implementation tasks
5. `test-and-rollout-plan.md` - verification, rollout, and rollback

The repository-level `AGENTS.md` and its required product documents still apply.

## Product summary

A project owner can:

- create a draft update;
- add a version label, title, summary, highlights, image, and CTA;
- preview the exact mobile and desktop presentation;
- publish immediately or, on Pro, schedule publication;
- archive an update;
- configure theme, accent color, delay, and path targeting;
- see approximate impressions, dismissals, and CTA clicks.

An end user can:

- see the newest unseen update once;
- dismiss it with a close button or Escape;
- open the latest update through a developer-provided trigger;
- click a safe CTA;
- avoid seeing the same update automatically on every page load.

## Non-negotiable decisions

These decisions are already made. Do not reopen them while implementing the MVP.

1. Extend the existing widget and wrappers. Do not create a second customer-facing script or package.
2. Resolve Feedback and Release notes modules plus the browser-safe feedback-form configuration from the server bootstrap. Keep legacy attributes only as an outage fallback for older explicit installations; do not emit configuration attributes in current snippets.
3. Store Product Updates separately from `board_announcements`. Their lifecycle, audience, presentation, and metrics are different.
4. Use structured plain text. Do not accept arbitrary HTML, Markdown, JavaScript, iframes, or custom CSS.
5. Render text with DOM `textContent`, never `innerHTML` with customer content.
6. Store seen/dismissed state in browser `localStorage`. Do not add cookies, fingerprinting, or per-viewer identities.
7. Keep analytics aggregate and approximate. Do not store IP addresses, user IDs, emails, URLs, or raw viewer events.
8. Show only one automatic Product Update at a time: the newest eligible unseen update.
9. Never show the feedback dialog and What's New dialog simultaneously.
10. Respect `prefers-reduced-motion`, keyboard navigation, focus trapping, focus restoration, and mobile viewport boundaries.
11. Ship one centered modal presentation in the MVP. A compact corner toast is a later enhancement.
12. Keep the widget below the existing hard limit of 20 KB gzipped; target 16 KB or less after this feature.
13. Free and Pro both receive the core feature. Free keeps feedbacks.dev branding and up to three live updates. Pro receives unlimited live updates, scheduling, longer metrics history, and branding removal through the existing `customBranding` entitlement.
14. Do not change the public board announcement editor as part of the MVP.

## MVP boundary

Included:

- dashboard list, editor, preview, publish, schedule, archive, and delete;
- one responsive modal design;
- optional image hosted by feedbacks.dev;
- optional CTA;
- project-level appearance and path settings;
- automatic newest-unseen display;
- manual trigger support;
- local seen state;
- aggregate daily metrics;
- Free/Pro enforcement;
- documentation and installation snippets.

Excluded:

- user segmentation or targeting by email, account, role, or plan;
- server-synchronized read state across devices;
- rich text, arbitrary Markdown, custom HTML, or custom CSS;
- reactions, comments, voting, or feedback inside the update dialog;
- email changelog delivery;
- automatic generation from Git commits or GitHub releases;
- AI writing, summarization, or release-note generation;
- A/B testing;
- a compact toast layout;
- automatic mirroring into public-board announcements;
- a standalone changelog website.

## Implementation completion contract

The feature is complete only when all of the following are true:

- A project owner can create a draft and publish it.
- The public widget endpoint never returns drafts, archived, expired, or future updates.
- A widget with updates disabled performs no update network request.
- A widget with updates enabled shows the newest unseen eligible update.
- Reloading does not automatically show the same update again.
- A manual trigger can reopen published updates.
- Feedback and update overlays cannot overlap.
- CTA and image input are sanitized and bounded.
- Owner routes verify authentication and project ownership.
- Public routes apply origin restrictions, rate limits, request-size limits, and CORS.
- Free/Pro limits are enforced on the server, not only hidden in the UI.
- Daily aggregate metrics are visible to the owner.
- Project/account deletion removes update rows, metrics, and update media.
- Generated database types and Supabase schema checks include the new objects.
- Website, React, and Vue installation paths support the feature.
- Unit, E2E, accessibility, mobile, and widget-size checks pass.
- The feature has been dogfooded on feedbacks.dev before broad release.

## Suggested implementation branch strategy

Implement in small commits matching the phases in `implementation-plan.md`. Keep schema, server contracts, dashboard, widget, and rollout changes separable so a failed rollout can disable the feature without reverting unrelated product behavior.

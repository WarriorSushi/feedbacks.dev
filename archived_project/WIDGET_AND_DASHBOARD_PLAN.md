# Widget + Dashboard: Phased UX and Feature Plan

This plan focuses on the end-to-end widget experience (code → on‑site/app rendering → dashboard setup) and the dashboard flows/UI. It confirms current behavior, outlines gaps, and proposes a straightforward, phased roadmap.

## Quick Confirmations

- Default widget behavior: `embedMode` defaults to `modal` (floating button + popup), not inline.
  - Source: `packages/widget/src/widget.ts:1` (`this.config = { position: 'bottom-right', embedMode: 'modal', ... }`)
- Supported modes today: Modal (floating button), Inline (embed), Trigger (attach to existing button).
- The “copy code” on the project page currently presents an inline embed snippet, which can make it seem “inline by default” from the dashboard UI perspective, even though the library default is modal.
- CDN/global exposure: Ensure the CDN build attaches a global (e.g., `window.FeedbacksWidget`) so script-tag users can instantiate without bundlers.
- Docs mismatch to code: Some docs reference `apiKey`/`mode` while code uses `projectKey`/`embedMode`. Unify in this plan.

## Goals

- Provide an intuitive, premium setup flow that lets users choose how the widget appears (modal/inline/trigger) and where they will install it (website, React/Next, Vue, RN/Flutter, etc.), with a copy‑ready snippet.
- Add a fast, lightweight visual customizer and live preview (no device load increase by default; lazy-load customizer-only code).
- Upgrade dashboard displays (replace mock data, richer filters, clear empty states), then introduce analytics and integrations.

---

## Phase 1 — Foundation & Setup Experience (1 week)

Focus: Clarity and correctness without heavy build-out.

1) Widget Type Selector (Project → Widget Installation)
- Mode selection: Modal (floating button), Inline (embed), Trigger (attach to selector).
- Position (for modal): Bottom‑right/left, Top‑right/left.
- Primary color & Button text (optional, basic customization).
- Clear “What you’ll get” explanation per mode.

2) Platform Selector + Snippet Generator
- “Where will you install?” options generate tailored code:
  - Website (script tag, inline or floating button)
  - React/Next.js
  - Vue
  - React Native (WebView wrapper)
  - Flutter (WebView wrapper)
  - WordPress (shortcode)
  - Shopify (Liquid)
  - Webflow/Framer (embed instructions)
- Ensure parameter names match code (`projectKey`, `embedMode`, `target`).

3) Live Preview (Basic)
- Show a small, real widget preview on the installation tab using an iframe sandbox.
- Toggle between Desktop/Mobile viewport. No additional runtime weight on the user’s site.

4) Dashboard Data Consistency
- Replace mock data on dashboard/feedback pages with real queries + server-side pagination.
- Add quick filters (All/Bug/Idea/Praise, Rating 1–5) consistently across pages.

5) Hygiene and Trust
- Confirm CDN global exposure for `FeedbacksWidget`.
- Align docs/labels with actual API (`projectKey`/`embedMode`).
- Clean visible encoding artifacts in prominent docs/pages.

Acceptance Criteria
- Users can pick a mode + platform, copy a correct snippet, and preview how it looks.
- Dashboard feedback views all use real data with consistent filters.

---

## Phase 2 — Visual Customizer MVP (1–2 weeks)

Focus: Premium customization without adding runtime weight to end-users.

1) Customizer Surface
- Host at Project → “Customize Widget” or within the Installation tab.
- Controls: Mode, Position, Primary Color, Button Text, Required Email (on/off), Category options, Rating on/off.
- Responsive Preview: Iframe with Mobile/Desktop toggle and safe isolation.
- Persist per-project default config (saved in DB), applied to generated snippets.

2) Code Generator Integration
- Generate code per platform using the saved configuration.
- Provide a one-click “Test in Demo” link that opens `/widget-demo?apiKey=...&config=...` (URL-safe serialized config) without impacting bundle size.

3) A11y & UX Polish
- Full focus trap and return-focus on modal close.
- Clear success states and empty states with consistent styles.

Acceptance Criteria
- Users can visually tweak primary design aspects and immediately see the result.
- Generated snippets match customizer settings across platforms.

---

## Phase 3 — Premium Capture & Form Enhancements (2 weeks)

Focus: High‑value features still light on default runtime cost.

1) Optional Screenshot Capture
- Lazy-load on demand (opt‑in in customizer), upload to Supabase Storage, link in feedback.
- Provide basic privacy note and toggle for organizations disallowing screenshots.

2) File Attachments (Optional)
- Single file (small size) with type/size guard, stored securely.

3) Custom Fields (Optional)
- Declarative additions: Priority, Department, Tags; required/optional flags; minimal UI.

4) Success Message Customization
- Editable title/text; option to include CTA (e.g., “Join our community”).

5) Advanced Triggers (Optional)
- Open on selector click, on page path match, after idle, or when a user presses a keyboard shortcut. All opt‑in to avoid added default cost.

Acceptance Criteria
- All premium options are off by default; enabling them adds minimal, lazy-loaded code.
- Submissions include new metadata safely; dashboard displays new fields.

---

## Phase 4 — Analytics, Management, Integrations (2 weeks)

Focus: Make the dashboard powerful and collaborative.

1) Analytics & Insights
- Trends: volume over time, by type/rating.
- Sentiment (starter: rule-based or simple keyword cues; AI optional later).

2) Feedback Management
- Batch operations: mark read/unread, tag, export.
- Statuses: new, in-progress, resolved; simple assignment.

3) Integrations
- Webhooks (Slack/Discord + generic webhook per project).
- One-click GitHub/Linear issue creation; store external IDs.

4) Public Feedback (Optional)
- Opt-in simple board for ideas/upvotes to drive adoption and visibility.

Acceptance Criteria
- Teams can act on feedback at scale and wire into their tools with minimal setup.

---

## Phase 5 — Docs, QA, and Release Hygiene (ongoing)

1) Documentation
- Unify parameter naming (`projectKey`, `embedMode`, `target`) across all docs and examples.
- Add SRI hash generation instructions with copy‑paste commands.
- CSP recipes per deployment (marketing/app subdomains).
- Integration cookbook for each platform.

2) QA & Observability
- Expand e2e to cover the customizer + install flows.
- Error tracking (Sentry) on dashboard; widget stays minimal (opt‑in telemetry only).

3) Release Hygiene
- Ensure `WIDGET_VERSION` references are updated programmatically.
- Keep CDN artifacts out of git except via release packaging.

Acceptance Criteria
- Users can self-serve install with correct, consistent docs; CI verifies bundle budgets and critical flows.

---

## Widget Type Matrix (What we’ll offer in UI)

- Modal (Floating Button)
  - Best for quick drop‑in feedback with minimal page intrusion.
  - Options: position, color, button text, open via API/trigger.
- Inline (Embed)
  - Best for dedicated feedback pages/sections.
  - Options: size, heading/subtitle visibility; inherits host styles.
- Trigger (Attach)
  - Best when sites already have a “Feedback” button.
  - Options: CSS selector(s), optional debounce/guard.

Each mode + platform combination yields a tailored snippet and usage notes in the dashboard.

---

## UI/UX Improvements Overview

Dashboard
- Replace all mock lists with real data + consistent filters.
- More actionable empty states and skeletons; quick actions on cards.
- Sidebar information architecture: Feedback, Projects, Analytics, Settings.
- Mobile: ensure bottom navigation covers primary tasks, reduce tap count.

Widget
- Maintain current premium look and a11y; add focus trap tests.
- Keep footprint low; advanced features remain opt‑in and lazy‑loaded.

---

## Notes on Prior External Analysis

- Alignment: Strong agreement on priorities (visual customizer, mock data removal, rate‑limit fallback, docs cleanup).
- Clarifications
  - Default mode is Modal via code; inline appears “default” only because the project page currently shows an inline snippet.
  - Ensure global `FeedbacksWidget` exposure in CDN bundle for frictionless script‑tag installs.

---

## Success Metrics

- Time‑to‑first‑feedback: Copy snippet to first submission in < 2 minutes.
- Customizer adoption: >50% of projects save a custom config in first month.
- Widget performance: <20KB gzipped; <100ms load via CDN; 60fps animations; respects reduced motion.
- Dashboard engagement: Increased batch actions and exports; reduced bounce on installation pages.


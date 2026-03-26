# feedbacks.dev Rebuild - Walkthrough, Gap Checklist, Inspiration, and Improvement Plan

- Date: 2026-03-25
- Time: 16:05:36 +05:30
- Workspace: `C:\coding\feedbacks.dev`

## Review Baseline

This review follows the required repo reading order and treats the current root docs as authoritative:

1. `README.md`
2. `docs/product-brief.md`
3. `docs/prd.md`
4. `docs/user-stories.md`
5. `docs/mvp-scope.md`
6. `docs/technical-direction.md`

The archived app is used only as reference material.

## Build and Verification Status

- `pnpm type-check` passed
- `pnpm lint` passed
- `pnpm build` passed
- built widget size at review time: about 9.3 KB gzipped

## Executive Read

The current rebuild is substantial. It already has a credible dashboard, widget, public board system, and AI/MCP integration layer. The best parts are real and usable. The main weakness is also the most important one according to the product docs: the install experience is still not canonical enough to deserve full developer trust.

The path forward should not be "start over." It should be:

1. lock down install correctness
2. simplify and stabilize onboarding
3. tighten triage workflow gaps
4. selectively mine the archived app for useful operational depth
5. intentionally expand public boards into an ecosystem, rather than letting that happen accidentally

## 1. Page-by-Page Walkthrough

### `/`

Purpose:
Marketing landing page.

What exists now:

- premium hero with interactive widget demo
- install strip with code sample
- AI/MCP positioning
- public board positioning
- pricing
- CTA flow into auth

Assessment:

- visually strong
- feels intentional, not generic
- currently over-indexes on AI/public boards relative to the install-first docs
- install snippet is plausible here, but not yet canonical across the product

Primary files:

- `packages/dashboard/src/app/page.tsx`
- `packages/dashboard/src/app/widget-demo-client.tsx`

### `/auth`

Purpose:
Sign-in surface for GitHub OAuth and magic-link email.

What exists now:

- polished split-screen layout
- strong visual treatment
- left-side install sample and feature positioning

Assessment:

- good design quality
- contains an outdated/conflicting code sample using `data-api-key`
- this is an avoidable trust leak because it contradicts the actual widget auto-init API

Primary file:

- `packages/dashboard/src/app/auth/page.tsx`

### `/dashboard`

Purpose:
Overview and zero-state onboarding.

What exists now:

- empty-state onboarding when no projects exist
- stat cards
- recent activity feed
- type breakdown
- seven-day trend chart
- links into inbox and new project

Assessment:

- solid product dashboard foundation
- the onboarding framing is directionally good
- still missing a truly connected "create project -> install -> verify live -> send test feedback" guided loop

Primary file:

- `packages/dashboard/src/app/(dashboard)/dashboard/page.tsx`

### `/projects`

Purpose:
Project list.

What exists now:

- project cards
- masked API key
- feedback counts
- create-project CTA

Assessment:

- functional and clean
- enough for MVP
- could later support sorting, health indicators, and board visibility state

Primary file:

- `packages/dashboard/src/app/(dashboard)/projects/page.tsx`

### `/projects/new`

Purpose:
Fast project creation.

What exists now:

- one main field: name
- optional domain
- direct redirect to project detail/install flow

Assessment:

- aligned with docs
- implementation path should be unified with the server API route

Primary file:

- `packages/dashboard/src/app/(dashboard)/projects/new/page.tsx`

### `/projects/[id]`

Purpose:
Main project setup and management workspace.

Tabs that exist now:

- Install
- Customize
- Integrations
- Public Board
- API
- Settings

Assessment:

- good separation of concerns
- closer to the intended architecture than the archived all-in-one setup surface
- install examples are the biggest correctness problem here
- customize tab needs clearer saved-vs-preview semantics

Primary files:

- `packages/dashboard/src/app/(dashboard)/projects/[id]/project-tabs.tsx`
- `packages/dashboard/src/app/(dashboard)/projects/[id]/api-docs.tsx`
- `packages/dashboard/src/app/(dashboard)/projects/[id]/board-settings.tsx`

### `/feedback`

Purpose:
Inbox and triage.

What exists now:

- search
- status and type filters
- bulk selection
- bulk status changes
- project labels
- rating display
- agent badge
- pagination

Assessment:

- already strong
- one of the best-built surfaces in the repo
- tags still need to become a first-class workflow, not just stored metadata

Primary file:

- `packages/dashboard/src/app/(dashboard)/feedback/page.tsx`

### `/feedback/[id]`

Purpose:
Feedback detail and action surface.

What exists now:

- message
- metadata
- screenshot
- attachments
- internal notes
- status update
- archive
- tags display
- timeline

Assessment:

- strong detail view
- supports real triage work
- would benefit from visible tag editing and richer structured-data display for agent submissions

Primary files:

- `packages/dashboard/src/app/(dashboard)/feedback/[id]/page.tsx`
- `packages/dashboard/src/app/(dashboard)/feedback/[id]/feedback-actions.tsx`

### `/p/[slug]`

Purpose:
Public board for voting and public submissions.

What exists now:

- voting
- search
- sort and type filtering
- submit modal
- updates section
- public admin comments

Assessment:

- beyond MVP in a good way
- already credible as a standalone product surface
- strongest candidate for future ecosystem expansion
- needs a product definition for discovery, ranking, moderation, and network effects

Primary files:

- `packages/dashboard/src/app/p/[slug]/page.tsx`
- `packages/dashboard/src/app/p/[slug]/public-board.tsx`

### Static pages

Purpose:
Support and policy pages.

What exists now:

- privacy
- terms

Assessment:

- sufficient for now

## 2. Docs-vs-Implementation Gap Checklist

Legend:

- `Done`: materially implemented and aligned
- `Partial`: implemented but not fully aligned
- `Missing`: not materially implemented
- `Drifted`: implemented in a way that conflicts with current docs

| Area | Status | Notes |
| --- | --- | --- |
| Homepage explains product quickly | Partial | Clear enough, but message is drifting toward AI/public boards over install-first clarity |
| Real install snippet on homepage | Partial | Exists, but there is no shared canonical generator |
| Create project with one clear form | Done | Name-first flow is good |
| Success redirects to install instructions | Done | Current redirect behavior supports this |
| Website install is default recommended path | Done | Install tab leads with HTML |
| React example exists | Drifted | Example is not backed by a real React component |
| Vue example exists | Drifted | Example is not backed by a real Vue component |
| Install guidance is plain language | Partial | Snippets exist, but verification guidance is still light |
| Advanced options are secondary | Done | Better than archived app |
| Floating modal widget | Done | Implemented |
| Inline widget support | Done | Implemented |
| Custom trigger support | Done | Implemented |
| Auto context capture | Done | URL and user agent captured |
| Optional email | Done | Implemented |
| Optional screenshot | Done | Implemented |
| Optional category/type | Done | Implemented |
| Anti-spam controls | Partial | Runtime support exists, but dashboard UX is not yet mature |
| Inbox view | Done | Implemented well |
| Status workflow | Done | Implemented well |
| Tag workflow | Partial | Data model exists, UI workflow is incomplete |
| Detail view | Done | Implemented well |
| Slack/email/webhook notifications | Partial | Webhook direction exists; email is not there yet |
| Canonical config model | Partial | There is config storage, but not yet a clear shared generator contract |
| Canonical snippet generator | Missing | Biggest technical-direction gap |
| Explicit saved vs preview state | Partial | Save exists, but state model is not clearly surfaced |

## 3. What to Reuse from `archived_project`

## Bring Forward

### Snippet generation patterns

Bring forward:

- shared snippet generation logic
- inline/modal/trigger snippet variations
- stronger copy-paste affordances
- live preview framing

Why:

This is the single most valuable archived capability because it directly supports the current product thesis.

### Widget config versioning and sanitization

Bring forward:

- server-side config sanitization
- version/history model
- safer saved config retrieval patterns

Why:

This can solve current saved-vs-preview ambiguity and future-proof the setup experience without bloating the UI.

### Mature webhook operations

Bring forward:

- per-endpoint rules
- delivery logs
- resend flow
- endpoint health state
- digest/immediate delivery choices

Why:

The current app already points toward outbound workflow routing. The archived implementation has a deeper operational model worth mining.

### Anti-spam and embed hardening references

Bring forward:

- clearer captcha setup guidance
- honeypot/rate-limit operational notes
- CSP/SRI installation guidance

Why:

This improves developer trust and installation confidence without adding product clutter.

### Small UI flourishes, not whole screens

Bring forward selectively:

- stronger code snippet presentation
- better preview framing
- small delivery health indicators
- a few analytics primitives like sparklines

Why:

These improve perceived quality without reintroducing complexity.

## Leave Behind

### Giant all-in-one setup surfaces

Do not bring back:

- oversized installation/customizer pages
- too many setup branches
- pre-install versioning or publish ceremony

Why:

The archived app already taught the exact lesson the new docs encode: too many choices too early slow first value.

### Theme/config sprawl

Do not bring back:

- preset-heavy UI
- theme-first customization
- configuration depth before install success

Why:

The rebuild should win on trust, clarity, and speed to value, not on visual configurability.

### Analytics-first detours

Do not bring back:

- dashboard surfaces that distract from triage
- productized analytics before inbox quality is complete

Why:

The docs prioritize collection and triage, not analytics breadth.

## 4. Public Board Ecosystem Opportunity

## Strategic Thesis

Public boards should not only be per-project utilities. They can become a discovery and trust layer for developer tools and software products:

- users discover products through active public boards
- buyers see how responsive a team is
- teams get distribution through visible product momentum
- feedbacks.dev becomes not just infrastructure, but the network where software roadmaps live

This is a real product opportunity, but only if it is structured deliberately.

## What Current Market Patterns Suggest

### Canny

Observed pattern:

- multiple public boards
- user-facing categories
- toggles for post creation, comments, vote visibility, dates, anonymity
- public boards can be shown on a main home page and indexed in search engines

Source:

- [Canny board settings](https://help.canny.io/en/articles/4968514-board-settings)
- [Canny public boards](https://help.canny.io/en/articles/3832293-public-boards)

Takeaway:

Discovery and public visibility are productized, not accidental.

### Nolt

Observed pattern:

- strong reputation for simplicity and clean public roadmap usage
- public API at the board level
- users praise setup speed and minimal UI

Sources:

- [Nolt public API](https://nolt.io/help/api)
- [Nolt G2 reviews](https://www.g2.com/products/nolt/reviews)

Takeaway:

Simple and beautiful still matters a lot in this category. Discovery features should not cost the product its clarity.

### Frill

Observed pattern:

- roadmap + announcements + widget positioning
- micro-roadmaps for different products/topics
- notifications, reactions, pinned ideas, Jira/Trello/Slack flows
- public-facing "submit ideas / roadmap / announcements" bundle

Sources:

- [Frill roadmap feature page](https://frill.co/features/roadmap)
- [Frill announcement examples](https://super.frill.co/announcements/welcome-to-our-new-feedback-platform)
- [Frill roadmap widget announcement](https://feedback.frill.co/announcements/roadmap-now-available-as-a-widget)

Takeaway:

Boards become much stickier when paired with updates and announcements, not just request collection.

### Featurebase

Observed pattern:

- segmented boards and roadmaps
- changelog and help-center adjacency
- user/group-specific access

Source:

- [Featurebase access controls](https://help.featurebase.app/articles/7040564-user-specific-access-to-featurebase)

Takeaway:

A mature ecosystem needs board scoping and audience controls, not just one public wall per product.

## Ecosystem Direction for feedbacks.dev

### Core idea

Add an opt-in ecosystem layer above individual public boards:

- every project can have a board
- some boards can remain private or unlisted
- some boards can opt into a public network
- users can browse and discover active software boards across the network

### Ecosystem surfaces

#### 1. Board directory

Users can browse:

- newest boards
- trending boards
- fastest-shipping boards
- most-loved boards
- most-active boards this week
- indie tools
- SaaS products
- internal tools
- AI products

#### 2. Product profile pages

Each project can optionally expose:

- product name
- logo
- short description
- website link
- board link
- changelog highlights
- response-time stats
- ship cadence
- top requested features

#### 3. Cross-board discovery

From one board, a user can discover:

- similar tools
- boards in the same category
- "users also follow" products
- alternatives solving similar problems

#### 4. Trust and quality signals

Rank or badge boards by:

- recent team replies
- request-to-update ratio
- ship rate
- average time to first admin response
- number of public roadmap updates
- consistency over time

The goal is not "most votes wins." The goal is "which teams actually listen and ship."

#### 5. Changelog and update layer

Boards should evolve into a small public product hub:

- requests
- roadmap/status
- shipped updates
- release notes

This is the strongest ecosystem path because it makes boards useful even for users who never submit feedback.

### Guardrails

To keep the ecosystem good:

- make participation opt-in
- support unlisted boards
- support project-level moderation controls
- prevent spam boards and clone products
- avoid making public discovery mandatory for core widget users
- keep the board itself usable even if the ecosystem layer does not exist yet

## 5. Full Task-Based Improvement Plan

## Phase 0 - Lock the product truth

Goal:
Make the codebase obey the current docs before adding more surface area.

Tasks:

1. Define one canonical widget config shape shared across dashboard, widget runtime, and snippet generation.
2. Define one canonical install snippet generator for Website, React, and Vue outputs.
3. Decide whether React/Vue support means:
   - real wrapper components, or
   - framework-specific script-install guidance only.
4. Remove or rewrite any snippet that does not match shipped behavior.
5. Unify naming across:
   - `projectKey`
   - `apiKey`
   - `data-project`
   - `embedMode`
   - runtime docs

Exit criteria:

- every snippet in marketing, auth, dashboard, and docs comes from one generator or one shared contract
- first-run installation examples are accurate

## Phase 1 - Repair first-run onboarding

Goal:
Make the install path unmistakably trustworthy.

Tasks:

1. Move project creation to one server-backed path.
2. After project creation, land users directly into an install-first surface with:
   - snippet above the fold
   - one visible copy button
   - plain-language "where this goes"
   - plain-language "what you should see next"
3. Add a real verification step:
   - "widget visible"
   - "test feedback submitted"
   - "feedback received in inbox"
4. Add a contextual created-project banner to the install tab.
5. Make advanced customization visibly secondary.

Exit criteria:

- a first-time user can create project -> copy snippet -> verify widget -> send test feedback without guessing

## Phase 2 - Clarify widget configuration state

Goal:
Make customization safe and understandable.

Tasks:

1. Separate:
   - saved config
   - current unsaved edits
   - preview state
2. Add unsaved-changes visibility.
3. Replace static install-tab mock preview with a config-aware preview.
4. Decide whether preview is live-updating or refresh-on-save.
5. Add retrievable saved-config history only if it stays out of the critical path.

Exit criteria:

- users always know whether they are previewing, editing, or publishing saved settings

## Phase 3 - Finish MVP triage workflows

Goal:
Make the inbox and detail view truly complete for small teams.

Tasks:

1. Add add/remove tag UI in feedback detail and inbox workflow.
2. Add tag filtering in the inbox.
3. Improve structured-data display for agent-submitted feedback.
4. Add lightweight project-scoped filtering shortcuts.
5. Add better notification setup UX for webhook/Slack/email directions.

Exit criteria:

- bugs, ideas, praise, and question flows are triageable without leaving the dashboard

## Phase 4 - Bring forward the best archived capabilities

Goal:
Mine the archived app without reimporting its bloat.

Tasks:

1. Port snippet presentation and preview ideas.
2. Port widget config sanitization/versioning backend patterns.
3. Port stronger webhook operations:
   - logs
   - resend
   - endpoint health
   - rules
4. Port anti-spam guidance and CSP/SRI installation documentation.
5. Reuse only the small analytics/UI primitives that strengthen clarity.

Exit criteria:

- operational maturity increases without making setup heavier

## Phase 5 - Public board v2

Goal:
Make the current public board a standout product surface.

Tasks:

1. Add better board branding controls.
2. Add richer admin reply tools and public activity feed.
3. Add board moderation controls.
4. Add follow/watch features for end users.
5. Add request deduplication and related-post suggestions.
6. Add better empty-state and onboarding copy for boards.
7. Add optional changelog/announcement stream attached to each board.

Exit criteria:

- each public board feels like a lightweight public product hub, not just a vote list

## Phase 6 - Public board ecosystem

Goal:
Turn boards into a discoverable network.

Tasks:

1. Add project-level public profile metadata.
2. Add board directory and browse page.
3. Add ranking models:
   - trending
   - active
   - responsive
   - shipping fast
4. Add category system for boards and products.
5. Add unlisted/private/public visibility tiers.
6. Add trust and moderation systems:
   - report board
   - report post
   - suspicious activity detection
   - spam prevention
7. Add cross-board recommendations.
8. Add discovery pages for:
   - top boards
   - new boards
   - AI tools
   - SaaS
   - indie tools
9. Add ecosystem analytics for project owners:
   - views
   - follows
   - conversions to product site

Exit criteria:

- feedbacks.dev becomes a credible place to discover living product boards, not just host isolated ones

## Phase 7 - Message and positioning cleanup

Goal:
Align what the product says with what it does best.

Tasks:

1. Rebalance homepage copy toward:
   - install in minutes
   - useful context captured automatically
   - quick triage
   - routing into workflows
2. Keep AI/MCP and public boards as differentiators, not the primary promise.
3. Align marketing snippet, auth snippet, dashboard snippet, and docs wording.
4. Add clearer product narrative around public boards:
   - project-level utility first
   - ecosystem second

Exit criteria:

- messaging and product behavior support the same thesis

## 6. Recommended Build Order

Recommended order:

1. Canonical snippet/config system
2. Accurate install examples
3. Unified project creation flow
4. Install verification loop
5. Saved-vs-preview clarity
6. Tags and triage completion
7. Webhook/email notification maturity
8. Public board polishing
9. Public board ecosystem and discovery

## 7. Approval Recommendation

Recommended approval scope for the first build wave:

Approve Phase 0 through Phase 3 first, plus design/system preparation for Phase 5.

Reason:

- this fixes the most important trust gaps first
- it aligns the product back to the docs
- it preserves the current momentum instead of discarding it
- it gives us a clean base before expanding into the larger public-board ecosystem

Then approve Phase 4 through Phase 6 as the second wave, where public boards become a deliberate strategic wedge instead of an accidental side feature.

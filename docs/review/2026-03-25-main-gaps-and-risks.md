# feedbacks.dev Rebuild - Main Gaps and Risks

- Date: 2026-03-25
- Time: 16:05:36 +05:30
- Workspace: `C:\coding\feedbacks.dev`
- Validation status at review time:
  - `pnpm type-check` passed
  - `pnpm lint` passed
  - `pnpm build` passed

## Summary

The rebuild is materially real and already includes a working dashboard, widget, public board flow, public submission API, API-key API, and MCP server. The strongest product area is not the install path, though, and that is the main strategic risk: the codebase is already shipping more advanced surfaces while the install experience still has trust-breaking inconsistencies.

## Main Gaps and Risks

### 1. Canonical install trust is still broken

Severity: Critical

The product docs repeatedly prioritize copy-paste trust and canonical install examples, but the implementation currently has conflicting install snippets and incompatible example styles:

- marketing uses `data-project`
- auth uses `data-api-key`
- the widget runtime auto-inits from `script[data-project]`
- project setup claims React and Vue component APIs that do not exist in the current widget package

This is the single biggest product risk because it directly undermines the product thesis: "install in minutes and trust the snippet."

### 2. Framework examples are inaccurate

Severity: Critical

The project install tab advertises React and Vue examples using `FeedbackWidget`, but the package currently exports `FeedbacksWidget` and a script auto-init flow, not framework-native components.

This creates a high-likelihood first-run failure for exactly the users the docs say should be supported: Website, React, and Vue developers.

### 3. No canonical snippet generator exists yet

Severity: High

The technical direction explicitly calls for one canonical snippet generator shared across marketing and dashboard. That does not exist yet. Snippets are hand-authored in multiple places, which already caused drift.

If this is not fixed early, the repo will keep reintroducing inconsistent naming, inconsistent code samples, and stale install docs.

### 4. Project creation is split across inconsistent flows

Severity: High

The browser-based create-project page creates projects directly through Supabase and generates raw API keys client-side, while the server API route hashes keys and treats raw keys as one-time return values.

This creates unnecessary divergence in security posture, data lifecycle, and future maintenance. It also makes it harder to guarantee a single reliable onboarding path.

### 5. Saved state vs preview state is not modeled clearly enough

Severity: High

The docs and user stories explicitly require clear save semantics and visible unsaved changes. The active project workspace allows saving customization values, but the preview is static and not clearly tied to:

- current saved config
- current unsaved edits
- install snippet output

This is a subtle but important trust risk for configuration-heavy flows.

### 6. Scope sequencing has drifted

Severity: High

Public boards, voting, updates sections, and public comments are already more advanced than the MVP docs require. At the same time, the install path and framework examples remain the weakest part of the product.

This is not just a scope issue. It is a sequencing issue:

- advanced features are landing before first-run trust is locked down
- the repo is getting broader before the core "minutes to value" promise is stable

### 7. Product messaging has drifted from install-first to AI/public-board-first

Severity: Medium-High

The landing page is visually strong, but the story is now led heavily by:

- AI agent API
- public voting boards
- real-time inbox

Those are good strengths, but the docs frame the primary win as simple installation, clean context capture, and fast triage. If messaging continues to drift, the product may attract interest for secondary features while underdelivering on the primary promise.

### 8. Tags exist in the data model but not in the real workflow

Severity: Medium

Tags are stored and visible in feedback detail, and the API supports updating them, but the current dashboard does not appear to expose a usable add/remove tag workflow. This means part of the triage story is only partially implemented in practice.

### 9. Email notifications are not implemented yet

Severity: Medium

The settings page explicitly says email notifications are coming soon. The docs call for basic outbound notifications including Slack, email, and webhook. The current implementation is closer to webhook-first with partial Slack/Discord support.

This is acceptable as a staging choice, but it should be treated as a declared gap rather than assumed complete.

### 10. Public board ecosystem direction is powerful but still undefined

Severity: Medium

The repo already has the foundations of a good standalone public board product:

- shareable boards
- voting
- public submissions
- public admin comments
- status updates

What is not yet defined is whether boards are:

- isolated per project only
- discoverable across the platform
- ranked and browsable
- connected into a larger ecosystem of public software boards

If this expands without a clear product model, it could become noisy, low-trust, or off-thesis. If defined carefully, it could become a real differentiator.

## Immediate Priorities

1. Establish one canonical snippet/config generation system.
2. Make Website, React, and Vue examples accurate or remove unsupported ones.
3. Unify project creation through one canonical backend path.
4. Clarify saved vs preview state in project setup.
5. Re-sequence product work so install trust lands before more ecosystem breadth.

## Working Assessment

This rebuild has real momentum and a much better foundation than the archived implementation. The main risk is not lack of progress. The main risk is building outward faster than the first-run path becomes dependable.

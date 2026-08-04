# Design and edge-case sweep - 2026-08-04

## Direction

The interface should feel precise, tactile, and calm:

- warm neutral work surfaces with color reserved for state and emphasis
- a visible grainy color field on acquisition surfaces
- fast ease-out feedback for direct input
- ease-in-out motion for state changes and carousel travel
- restrained spring settling for cards, icons, and controls
- motion primarily through `transform` and `opacity`
- all automatic and decorative motion disabled or reduced through `prefers-reduced-motion`

The shared workspace shell, controls, cards, empty states, loading states, error states, navigation, and toasts carry this language across authenticated routes.

## Surface and state coverage

| Journey | Screens and actions reviewed | Required states |
| --- | --- | --- |
| Understand | landing, pricing, FAQ, docs, boards directory, early access | normal, compact viewport, dark, Windows 98, reduced motion, consent not chosen/chosen |
| Authenticate | sign in, new account, GitHub, magic link, password, captcha, invite entry | idle, focused, submitting, sent, resend cooldown, invalid credentials, expired link, invalid/full invite, provider failure |
| First project | no-project prerequisite, project list, create project | empty, submitting, validation error, free-plan limit, duplicate/network failure, success redirect |
| Install | Website, React, Vue, copy snippet, setup packet, verify | code copy success/failure, stable snippet, pending detection, detected install, timeout, retry, wrong origin |
| Customize | form copy, placement, fields, screenshot, captcha, theme, origin restriction | preview-only edits, unsaved changes, saving, saved, validation error, publish failure, advanced section collapsed/expanded |
| Inbox | project scope, saved views, filters, CSV export, feedback list | no project, empty inbox, no filter results, unread/read, loading, export limit/failure, archived/frozen project |
| Feedback detail | status, priority, tags, note, archive, delete, screenshot/context | missing item, foreign project, optimistic save, conflict, network error, missing media, destructive confirmation |
| Public board | enable/setup, identity, content, visibility, submit, vote, follow, comment, report, moderate | disabled, private, empty, validation, duplicate vote, rate limit, reported/hidden, auth-required action, success |
| Product updates | setup, settings, draft, edit, image, publish, visibility, archive/restore | empty, draft, published, hidden, upload crop/error, publish warning, persistent seen-state warning, plan limit |
| Integrations | Slack, Discord, GitHub, generic webhook, delivery logs, replay | no project, disconnected, validation, encrypted secret, test success/failure, retrying, auto-disabled, replay result |
| API and MCP | keys, rotate, copy, REST examples, setup packet | no project, Free-plan gate, key visible once, rotation confirmation, copy result, request error |
| Billing | Free/Pro, checkout, portal, sync, cancellation/downgrade | checkout unavailable, processing, active, past due, scheduled cancellation, expired, complimentary month, frozen excess projects |
| Invites | copy link, five-slot progress, pending qualification, reward | zero/partial/full, maturation pending, rejected duplicate/self referral, reward granted/expired, copy failure |
| Settings | profile, alerts, appearance, product feedback, account deletion | loading, dirty, saving, saved, validation, request failure, disabled dependencies, destructive typed confirmation |
| Tutorials | checklist and contextual product tours | no project, next action, in progress, resume, complete, dismissed, target missing |
| Global recovery | route loading, not found, application error, unauthorized redirect | skeleton, safe retry, known-good navigation, reference ID, no unintended mutation |

## Interaction rules applied

- Buttons lift slightly on hover, compress on activation, retain visible focus, and stop moving when disabled or reduced motion is requested.
- Inputs transition border, surface, and focus shadow without shifting layout.
- Workspace routes enter with a short opacity/vertical transition.
- Panels strengthen their border on focus-within so complex forms have a clear active region.
- Checkboxes and radios compress on direct activation.
- Tutorial cards use a small spring lift and directional arrow response.
- Toasts enter with a bounded spring and expose a named dismiss action.
- Empty, error, missing-route, and project-required states share one clear recovery pattern.

## Signup carousel requirements

- Starts rotating automatically when motion is allowed and the page is visible.
- Shows visible playback state and progress.
- Pauses while hovered.
- Stops after keyboard focus enters the carousel and only restarts through the playback control.
- Provides previous, next, and direct slide controls.
- Uses labeled carousel and slide semantics.
- Keeps automatic changes out of the live region while rotating.
- Disables automatic/decorative motion for reduced-motion users.

## Verification gates

- TypeScript and ESLint
- unit tests
- production build and route budgets
- public-route desktop and compact screenshots
- carousel progression, pause, playback, and manual controls
- canonical marketing-home destination in production
- horizontal-overflow checks
- reduced-motion duration checks
- material WCAG checks where the local E2E environment is available
- production deployment status and post-deploy public-route smoke test

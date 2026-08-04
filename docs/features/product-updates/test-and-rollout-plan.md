# Test and Rollout Plan: Product Updates / What's New

## 1. Purpose

This plan defines the proof required before Product Updates can move from development to general availability.

The feature touches the owner dashboard, public APIs, Supabase, Storage, the customer-installed widget, React/Vue wrappers, accessibility, privacy, and deletion. Passing a dashboard happy path alone is not sufficient.

## 2. Test environments

Use four distinct environments:

| Environment | Purpose | Data rules |
| --- | --- | --- |
| Local | Fast unit, component, widget, and migration tests | Synthetic data only. |
| Development Supabase + local dashboard | RLS, RPC, Storage, and API integration | Synthetic data only. Never point local destructive tests at production. |
| Vercel preview + development Supabase | Browser and cross-origin end-to-end tests | Synthetic projects and host apps. |
| Production dogfood | feedbacks.dev team validation before wider access | Feature default off; allowlisted projects only at first. |

Do not run deletion, reset, bucket cleanup, or migration experiments against production.

## 3. Required fixtures

Create deterministic fixtures for:

- owner A and project A;
- owner B and project B;
- Free project at zero, three, and four attempted live updates;
- Pro project;
- disabled and enabled Product Update settings;
- draft, future scheduled, live, expired, and archived records;
- update with all optional fields;
- update with text only;
- same-origin and external CTA;
- public image, broken image, and no image;
- path rules with includes and excludes;
- metric rows over 7, 30, and 90 days;
- host pages for plain script, React, and Vue installations.

Use fixed clocks wherever scheduling, expiry, day aggregation, or the 750 ms seen threshold is tested.

## 4. Automated test layers

### 4.1 Shared validation unit tests

Test every boundary at `limit - 1`, `limit`, and `limit + 1` where applicable.

Required groups:

- title, summary, version, highlights, CTA label, and CTA URL limits;
- image type and size metadata validation;
- color normalization;
- delay bounds;
- include/exclude path count, syntax, prefix behavior, deduplication, and precedence;
- timestamp parsing and expiry ordering;
- derived Draft, Scheduled, Live, Expired, and Archived states;
- live eligibility at exact publication/expiry boundaries;
- plan entitlement values;
- public URL builders.

Security strings to include:

```text
<script>alert(1)</script>
<img src=x onerror=alert(1)>
javascript:alert(1)
data:text/html,<script>alert(1)</script>
//evil.example/path
https://user:password@example.com
```

The strings may be stored as harmless text in content fields within their size limits, but they must never execute. CTA values using unsafe schemes or credentials must be rejected.

### 4.2 Database and RLS tests

Verify with real authenticated and anonymous database roles, not only mocked service code.

| Case | Expected result |
| --- | --- |
| Owner A selects project A settings/updates/metrics | Allowed according to operation policies. |
| Owner A selects project B data | Zero rows / denied. |
| Owner A writes project B update | Denied. |
| Anonymous role selects any Product Updates table | Denied. |
| Authenticated owner directly inserts metrics | Denied. |
| Anonymous or authenticated role calls metric RPC | Permission denied. |
| Anonymous or authenticated role calls publish RPC | Permission denied. |
| Service role calls metric RPC for matching project/update | Count increments atomically. |
| Service role calls RPC with mismatched project/update | Rejected. |
| Direct privileged insert uses mismatched project/update | Composite foreign key rejects it. |
| Two increments arrive concurrently | Final count increases by two. |
| Two Free publish requests race for the final live slot | Exactly one publishes; the other receives the plan-limit result. |
| Project is deleted | Settings, updates, and metrics cascade. |
| Update is deleted | Its metrics cascade. |

Also verify:

- all new public-schema tables have RLS enabled;
- policy roles use `TO` clauses;
- update policies include `USING` and `WITH CHECK`;
- ownership lookup columns and publication query columns are indexed;
- both `SECURITY INVOKER` RPCs have a fixed `pg_catalog` search path, fully qualified application tables, and revoked public execution;
- intended table privileges still work with the target project's Data API exposure settings;
- database/security advisors introduce no unresolved warning caused by this feature.

### 4.3 Owner API integration tests

Test every method and lifecycle route with unauthenticated, owner, and non-owner callers.

Required cases:

- create draft;
- reject published status on collection POST;
- edit draft content;
- reject lifecycle fields on generic PATCH;
- publish immediately;
- schedule on Pro;
- reject schedule on Free;
- archive and restore to draft;
- create a separate new update ID after a live update already exists;
- edit a live record without changing its ID;
- enforce Free live limit under concurrent publish attempts;
- ignore UI tampering that tries to remove Free branding;
- enforce metrics lookback server-side;
- upload valid JPEG, PNG, and WebP;
- reject SVG, executable, mismatched signature, and files over 2 MB;
- replace and delete image without an orphan on success;
- reject update IDs belonging to another project;
- respond with `Cache-Control: no-store`.

### 4.4 Public API integration tests

For updates GET:

- valid project and origin returns settings and live records;
- disabled project returns an empty update array;
- draft, future, expired, and archived records never appear;
- results are ordered newest first and limited to 20;
- response fields exactly match the public allowlist;
- relative and absolute CTA values remain valid;
- image paths become public URLs but raw storage paths do not leak;
- response stays below 50 KB for maximum valid content;
- `Cache-Control`, `Vary`, ETag, and CORS headers are correct;
- matching `If-None-Match` returns `304` without a body;
- invalid project key, denied origin, and rate limit follow existing safe error conventions.

For events POST:

- accepts 1–10 valid events;
- rejects an empty batch, 11 events, body over 8 KB, invalid UUID, invalid event type, and unknown update;
- rejects an update from another project;
- denies disallowed origin;
- ignores/rejects any supplied viewer identifier, URL, IP, or metric date rather than storing it;
- uses the server's UTC date;
- increments only aggregate rows;
- returns `202` for accepted best-effort events;
- applies a rate limit independent from feedback submission.

### 4.5 Dashboard component and browser tests

Run at desktop and mobile widths.

Authoring flow:

1. Open a project and select Updates.
2. Confirm the empty state explains the outcome.
3. Create an update with title, summary, highlights, image, and CTA.
4. Switch preview between desktop/mobile and light/dark.
5. Save a draft and reload.
6. Publish now.
7. Confirm the list shows Live and metrics at zero.
8. Edit the live record and confirm the warning that existing seen state is unchanged.
9. Use **New update** and confirm it creates a separate ID/row.
10. Archive and restore to draft.

Plan flow:

- Free limit and scheduling restrictions are explained before submission and enforced after forged requests;
- Pro can schedule and remove branding;
- plan downgrade forces branding in public settings and prevents new over-limit publications without deleting existing records.

Failure flow:

- API error preserves form data;
- image upload error allows a retry;
- deletion requires confirmation;
- empty, loading, error, and no-metrics states are readable;
- rapid double-clicks do not create two updates or publish twice.

### 4.6 Widget unit and integration tests

Configuration:

- omitted/false `enableUpdates` creates no fetch, timer, or trigger behavior;
- true config uses default URLs;
- explicit endpoint overrides are sanitized;
- website, React, and Vue inputs produce equivalent runtime config.

Selection and state:

- newest unseen eligible update is selected;
- seen records are skipped for auto-show;
- manual open may reopen the newest seen record;
- only one auto-show occurs per full page load;
- storage key is project-scoped;
- invalid/corrupt localStorage is recovered safely;
- localStorage quota/security errors fall back to memory;
- pruning keeps the newest 100 IDs.

Overlay and lifecycle:

- update waits for an open feedback dialog;
- feedback launcher closes update before opening feedback;
- manual update open returns false while feedback is open;
- destroy aborts fetches and removes timers/listeners/dialog/backdrop;
- reinitialization produces one controller, not duplicate listeners;
- two widget instances for one project produce one Product Updates owner;
- multiple projects retain separate seen state.

Navigation:

- current pathname is evaluated on initialization;
- exclusions win;
- `popstate` re-evaluates path eligibility;
- custom refresh event calls `refreshUpdates()`;
- no browser History methods are monkeypatched;
- SPA navigation does not auto-show a second update in the same full page load.

Rendering and CTA:

- every customer string renders as text, including HTML-looking content;
- broken image falls back to text-only presentation;
- external CTA opens a safe new tab;
- same-origin CTA uses the current tab;
- metrics failure never blocks close or navigation.

### 4.7 Accessibility tests

Automated checks are necessary but not sufficient.

Verify:

- `role="dialog"`, `aria-modal`, labelled title, and described summary;
- focus moves inside on open;
- Tab and Shift+Tab remain trapped;
- Escape closes;
- focus returns to the exact prior element when possible;
- close button has at least a 44 x 44 px mobile target;
- background cannot scroll while open;
- preexisting body overflow style is restored exactly;
- dialog content remains reachable at 200% zoom;
- colors meet WCAG AA in light and dark modes;
- reduced-motion preference removes nonessential transitions;
- screen reader output is concise and does not repeatedly announce the full dialog;
- mouse, keyboard-only, and touch operation all succeed.

Perform at least one manual pass with NVDA on Windows because automated accessibility tools cannot prove focus behavior or spoken output.

### 4.8 Performance and regression tests

- record widget gzip size before and after;
- target 16 KB or less, hard failure at 20 KB;
- no new runtime dependency is added to the widget without bundle analysis;
- disabled feature performs no update request;
- enabled feature performs at most one initial fetch per project instance;
- maximum API payload is under 50 KB excluding image bytes;
- image does not block initial feedback widget readiness;
- feedback launcher open time and feedback submission success do not regress materially;
- metrics retries are bounded and never create a loop;
- all resources are cleaned on widget destruction;
- full repository build and existing feedback E2E suite pass.

## 5. Manual browser matrix

Minimum supported matrix:

| Platform | Browser | Required checks |
| --- | --- | --- |
| Windows | Current Chrome | Full dashboard and host flow, NVDA pass. |
| Windows | Current Edge | Full host flow. |
| macOS | Current Safari | Host flow, focus, storage, CTA. |
| iOS | Current Safari | Mobile viewport, `100dvh`, touch, scroll lock. |
| Android | Current Chrome | Mobile viewport, keyboard/touch, image. |
| Desktop | Current Firefox | Focus trap, storage, CTA, reduced motion. |

Also test a browser with third-party cookies blocked. The feature should be unaffected because it uses no cookies.

## 6. Cross-origin host fixtures

The Vercel preview test must use a separate host origin from the feedbacks.dev API. Include:

- unrestricted project origin;
- allowed exact origin;
- rejected origin;
- localhost development origin;
- plain HTML script installation;
- React wrapper installation;
- Vue wrapper installation.

Verify CORS preflight, project origin restriction, relative CTA resolution against the host origin, and that full project keys never appear in browser events or logs.

## 7. Security and privacy review

Before rollout, a reviewer must answer yes to every item:

- [ ] Is all customer content rendered without `innerHTML`?
- [ ] Are CTA schemes allowlisted and credentials rejected?
- [ ] Are owner routes authenticated and project-scoped at query time?
- [ ] Can no public response reveal drafts, internal IDs, metrics, owner IDs, storage paths, or plan data?
- [ ] Are request sizes, array lengths, string lengths, and file sizes bounded server-side?
- [ ] Are public endpoints origin-checked and independently rate-limited?
- [ ] Is the Supabase secret/service-role key absent from browser bundles?
- [ ] Is RLS enabled and cross-owner isolation tested?
- [ ] Are both Product Updates RPCs `SECURITY INVOKER` and executable only by service role?
- [ ] Are Storage upload paths server-generated?
- [ ] Is SVG excluded from image upload?
- [ ] Does seen state contain only update IDs and timestamps?
- [ ] Do aggregate metrics contain no IP, email, user ID, page URL, user agent, or raw event record?
- [ ] Do logs avoid full project keys, update bodies, CTA URLs, and viewer information?
- [ ] Does deletion clean database rows and media?

## 8. Release gates

The feature cannot advance if any gate fails.

### Gate A - merge-ready

- all unit, integration, component, and existing regression tests pass;
- migration and RLS tests pass in development;
- database/security advisors have no unresolved feature-caused warning;
- widget is below 20 KB gzipped;
- accessibility automated checks pass;
- privacy/security checklist is complete.

### Gate B - preview-ready

- Vercel preview uses the development Supabase project;
- plain script, React, and Vue host fixtures pass cross-origin flows;
- publication is visible within the documented 60-second cache window;
- archive removes public visibility within the same window;
- metrics appear approximately in the owner dashboard;
- feedback submission remains healthy when updates API and metrics API are deliberately failed.

### Gate C - dogfood-ready

- production migration is reviewed and backed up according to the normal deployment procedure;
- feature is default off;
- at least one feedbacks.dev production project is explicitly enabled;
- rollback switch is tested;
- operational dashboard/log queries are prepared;
- a responsible person is available during the first release window.

### Gate D - beta-ready

- feedbacks.dev has used at least two updates without a critical issue;
- frequency and seen behavior feel non-intrusive;
- five invited projects can be enabled individually;
- no unresolved P0/P1 issue;
- support documentation states the limitations and one-time install flag clearly.

### Gate E - general-availability-ready

- at least three beta projects have published more than one update;
- public fetch success is at least 95% over the beta window, excluding clearly invalid requests;
- no measurable decline in feedback submission success;
- no known cross-project access, XSS, unsafe-link, or deletion issue;
- support and rollback procedures are documented;
- plan entitlements and billing copy are final.

## 9. Staged rollout

### Stage 0 - merged but dormant

- Deploy schema and code with Product Updates settings disabled by default.
- Do not emit `enableUpdates` in existing snippets.
- Confirm existing widgets make no new update request.

### Stage 1 - feedbacks.dev dogfood

- Enable the runtime flag on feedbacks.dev's own application.
- Enable one internal project in dashboard settings.
- Publish one text-only update, then one update with image and CTA.
- Observe public API errors, widget errors, feedback submission health, and qualitative annoyance.
- Run for at least several normal product sessions, not only a scripted test.

### Stage 2 - invited beta

- Invite up to five projects representing plain script, React, and Vue installs.
- Keep enablement explicit per project.
- Collect setup time, publish time, visual issues, and frequency feedback.
- Do not add deferred features during beta unless they block the MVP's core job.

### Stage 3 - controlled availability

- Expose the Updates tab to all projects.
- Keep project settings and runtime flag off until an owner opts in.
- Add install documentation and plan-limit copy.
- Monitor errors and feedback health for one release cycle.

### Stage 4 - general availability

- Announce the feature after Gate E passes.
- Keep one-time runtime enablement explicit; do not silently make every historical widget fetch updates.
- Continue tracking payload size, public endpoint reliability, and feedback submission regressions.

## 10. Observability

Track service health without creating viewer analytics.

Allowed operational signals:

- request count by endpoint and response status;
- latency percentiles;
- rate-limit counts;
- aggregate cache hit/304 rate;
- RPC/database error count;
- Storage upload/delete error count;
- widget build gzip size in CI;
- feedback submission success rate before/after rollout.

Do not log or attach:

- full project keys;
- update content;
- CTA URLs;
- image contents;
- page URLs;
- IP addresses beyond infrastructure's unavoidable short-lived security logs;
- viewer IDs, emails, or application account IDs.

Recommended alerts during beta:

- public updates endpoint 5xx rate above 2% for 10 minutes;
- p95 public updates latency above 1 second for 10 minutes;
- metric endpoint 5xx rate above 5% for 15 minutes;
- Storage delete failures above zero sustained after retry;
- feedback submission success drops by more than 2 percentage points from baseline.

Metrics endpoint failure is lower severity than feedback submission failure because Product Update analytics are approximate.

## 11. Rollback plan

Rollback must preserve owner content while stopping visitor impact.

### Fastest safe rollback

1. Disable Product Updates in project settings for affected projects.
2. If the issue is broad, use the server-side rollout flag/configuration to make the public endpoint return empty update arrays.
3. Remove `enableUpdates` from feedbacks.dev's own host configuration if the widget itself is involved.
4. Redeploy the last known-good widget/dashboard build when necessary.

### What rollback must not do

- Do not drop tables or delete owner-authored updates during an incident.
- Do not remove the Storage bucket while database rows reference images.
- Do not roll back a Supabase migration by destructive SQL unless separately reviewed.
- Do not disable feedback collection merely because Product Updates is unhealthy.

### After rollback

- Confirm public updates endpoint is empty or disabled.
- Confirm feedback submission works.
- Confirm no update overlay appears on test host pages.
- Preserve logs and reproduction data that contain no customer secrets or viewer PII.
- Fix forward, rerun the failed release gate, and restart at the prior rollout stage.

## 12. Launch acceptance checklist

- [ ] First update can be authored and published in under three minutes.
- [ ] Later publications require no customer application deployment after the initial enablement.
- [ ] Disabled widgets make no update network request.
- [ ] Only the newest unseen eligible update auto-opens.
- [ ] Reload does not auto-show it again.
- [ ] Manual trigger can reopen the newest live update.
- [ ] Feedback and update overlays never overlap.
- [ ] Draft, future, archived, and expired updates remain private.
- [ ] Free/Pro limits match the product specification.
- [ ] Metrics are aggregate, approximate, and privacy-safe.
- [ ] Project/account deletion cleans rows and media.
- [ ] All three install modes pass.
- [ ] Accessibility and mobile checks pass.
- [ ] Widget is below 20 KB gzipped.
- [ ] Preview, dogfood, beta, and GA gates are recorded.
- [ ] Rollback has been exercised once before beta.

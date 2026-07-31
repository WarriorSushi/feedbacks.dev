# feedbacks.dev comprehensive product, engineering, UI/UX, and growth audit

**Date:** 2026-07-30

**Status:** Remediation implementation record — completed except where explicitly marked blocked, modified, or deferred
**Scope:** Landing page, authentication, dashboard, every project workspace, inbox and detail flows, public boards and directory, widget, product updates, integrations, REST/MCP, billing, settings, documentation, legal surfaces, API routes, database, storage, security, performance, accessibility, responsive behavior, motion, content, onboarding, and monetization.

**Outcome legend:** `[fixed]` means implemented and verified; `[modified: …]` means the risk was materially reduced but a narrower follow-up remains; `[blocked: …]` requires external credentials, paid infrastructure, provider-console access, or a real transaction; `[deferred: …]` is intentionally outside the validated MVP thesis. Statuses were added only after implementation and verification.

## Contents

1. Executive verdict
2. Audit method and evidence
3. Product definition
4. P0 findings
5. Complete feature inventory
6. Screen-by-screen UI/UX review
7. UI system and every primitive
8. Backend and architecture review
9. Edge-case catalogue
10. Landing, pricing, and revenue strategy
11. Prioritized action plan
12. Definition of done
13. What not to do
14. Recommended immediate sequence

---

## 1. Executive verdict

feedbacks.dev has a real, broad product—not a prototype. It has a working embeddable widget, a useful feedback inbox, public boards, updates, integrations, REST/MCP access, billing, documentation, and a meaningful automated test suite. Type-checking, linting, unit tests, production build, widget size checks, and schema checks all pass.

The repository-owned product is now **launch-ready for free activation and controlled customer use**. Paid acquisition remains gated by the controlled Dodo live-mode transaction, not by an unresolved code or UX blocker.

The original audit found five non-visual P0 issues:

1. The product uses one project key as both the browser-visible widget identifier and the authenticated REST/MCP credential, even though the UI and docs claim these are separate. A visitor can inspect the public key embedded in a customer site. That key must never authorize private project reads or mutations.
2. Development/E2E data has polluted the live database and public board directory. The inspected database contained 906 Playwright projects and 192 enabled test boards. Product analytics and public discovery are consequently untrustworthy.
3. The production dependency tree reports 18 known vulnerabilities, including 8 high-severity findings.
4. GitHub tokens and generic webhook signing secrets are stored in project JSON and returned to the browser in plaintext.
5. Public feedback media uses public storage URLs. Screenshots and attachments can contain sensitive information and should be private.

All five P0 issues are remediated in code and the hosted data. The dark-mode critique was also valid: semantic canvas, primary, raised, inset, selected, and overlay surfaces are now applied by purpose rather than alternating brightness, and the first-run path keeps the visible snippet ahead of optional configuration.

### Decision

**Permit organic/free activation and controlled customer onboarding. Do not accept production payments or drive paid acquisition until the Dodo live transaction, webhook, subscription sync, and portal return are proven.** Separate paid Supabase branches, leaked-password protection, a GitHub App, external alert delivery, Resend live-bounce proof, and manual assistive-technology/device certification remain explicit operational gates rather than hidden implementation gaps.

### Verified remediation evidence

- [fixed 2026-07-31] Product-wide form failures now use a shared field-error contract: invalid controls are visibly highlighted and programmatically marked, field-specific recovery copy stays beside the input, and persistent summaries preserve context across project creation/settings, account settings, feedback-form customization, integrations, public-board posting/reporting/moderation, and board publishing.
- [fixed 2026-07-31] Native public-board alerts were replaced with accessible in-page recovery states; network failures preserve drafts, public report dialogs trap focus and close with Escape, and mobile page overflow is clipped at the application shell while intentional horizontal filter rails remain scrollable.
- [verified 2026-07-31] Desktop and 320px authenticated browser checks covered project validation, account settings, inbox, billing, API/MCP, public directories, docs, system-theme default behavior, and Windows 98 propagation. No browser runtime errors were observed.
- [fixed] Publishable `fb_pub_…` browser keys and hashed, scoped, revocable `fb_live_…` credentials are structurally separate; public-key rejection and legacy embed migration are unit-tested.
- [fixed] The install snippet is always visible and browser-verified; no secret generation or fresh-key action gates installation.
- [fixed] 1,036 historical E2E projects were quarantined, the final manual audit projects were quarantined, the last test board was unpublished/unlisted, and live checks report zero active E2E projects and zero listed production test boards.
- [fixed] Integration credentials were migrated to AES-256-GCM ciphertext, redacted from browser/queue/log surfaces, rotated, and lifecycle-audited.
- [fixed] Feedback screenshots and image attachments are re-encoded, metadata-stripped, registered, stored in private buckets, and served through owner-authorized downloads.
- [fixed] Atomic billing-event claims, idempotent feedback/project creation, durable account-deletion jobs, centralized mutation origin checks, bounded JSON bodies, scoped rate limits, and signed device voting are implemented.
- [fixed] Strong ETag/`If-Match` conflict handling protects project settings, inbox triage, Product Update drafts/settings/media/lifecycle, and publication inside the database lock.
- [fixed] REST feedback and public-board discovery use opaque cursor pagination; board ranking uses a frozen snapshot plus deterministic score/activity/UUID ordering.
- [fixed] Product Updates, inbox presentation, and integration operations are decomposed into focused domain modules without increasing route budgets.
- [fixed] Documentation pages and individual code blocks expose revision `2026-07-30`; REST pagination guidance matches the cursor contract.
- [fixed] Signed, replay-safe Resend delivery ingestion stores hashed recipients and suppresses future sends after bounces, complaints, or provider suppression.
- [fixed] Production build, lint, type checks, 161 unit tests, widget size, dashboard route budgets, expanded live-schema checks, live advisor review, and the production dependency audit pass.
- [blocked: explicit recurring-cost approval required] Separate Supabase preview/development/E2E branches cost $0.01344/hour each ($0.04032/hour for three) and were not created without the owner's explicit acceptance.
- [blocked: external credentials and a real charge required] Production Dodo is configured in test mode; live product/webhook credentials and one controlled real transaction are still required. Production checkout fails closed until then.
- [blocked: provider console configuration required] Add the production Resend signing secret and trigger one controlled bounce/complaint event before calling bounce operations live-proven.

### Product health score

| Area | Score | Verdict |
|---|---:|---|
| Product thesis | 8/10 | Focused and valuable: install quickly, collect context, triage, route |
| Feature completeness | 8/10 | Focused MVP/Pro surface exists; team collaboration and first-class Linear remain intentionally demand-gated |
| First-run experience | 9/10 | Visible snippet, one primary verification action, and optional work deferred |
| Information architecture | 8/10 | Navigation is organized by user intent with project health and contextual next actions |
| Visual hierarchy | 9/10 | Semantic light/dark surfaces, stronger borders, restrained accent, and progressive disclosure are consistent |
| Accessibility | 8/10 | WCAG 2.2 axe/keyboard/reduced-motion gates are broad; manual screen-reader/device certification remains |
| Frontend maintainability | 8/10 | Domain modules and route budgets are healthy; complexity is concentrated in explicit orchestration shells |
| Backend correctness | 9/10 | Bounded inputs, idempotency, atomic billing/publish flows, cursor contracts, and stale-write rejection are verified |
| Security/privacy | 9/10 | Split credentials, encrypted integrations, private media, explicit service-only policies, and clean repository-owned advisors |
| Data/environment hygiene | 9/10 | Production fixtures are quarantined and excluded; paid disposable branches remain an explicit external gate |
| Performance/scalability | 9/10 | Lean widget, passing route budgets, bounded cursor queries, database aggregates, and cache controls |
| Billing/monetization | 7/10 | Code is hardened and honest; Dodo live transaction proof remains the commercial gate |
| Observability | 7/10 | Correlated logs, health/SLO/queue/RUM signals, and runbooks exist; external alert/drain delivery is not configured |
| Test quality | 9/10 | 153 unit tests and full CI gates pass; paid isolated E2E and manual assistive-technology proof remain explicit |

---

## 2. Audit method and evidence

This review used:

- The current authoritative product documents, in repository-required order.
- Source inspection across the dashboard, widget, shared packages, MCP server, API routes, SQL migrations, tests, and deployment configuration.
- A sequential visual review of the signed-in dashboard and anonymous experience at desktop and mobile sizes.
- Read-only inspection of the connected database and its security/performance advisors.
- Production build, type, lint, unit, widget-size, schema, and dependency checks.
- Current primary standards and vendor documentation.

### Checks run

| Check | Result |
|---|---|
| `pnpm type-check` | Pass |
| `pnpm lint` | Pass |
| `pnpm test:unit` | 112/112 pass |
| `pnpm build` | Pass; 59 static pages generated |
| `pnpm widget:check-size` | Pass; 57,826 bytes raw, 16,480 bytes gzip |
| `pnpm supabase:check` | Pass |
| `pnpm audit --prod` | **Fail; 18 vulnerabilities: 8 high, 9 moderate, 1 low** |
| Full E2E suite | Deliberately not run; it currently targets shared live data and would add more contamination |

### Important limitations

- This is a code, system, and UX audit—not a penetration test. No vulnerable path was exploited.
- No customer interviews, session recordings, support tickets, conversion data, or production performance traces were supplied.
- The review therefore separates observed facts from hypotheses that require measurement.
- The automated Impeccable detector was not present in the installed skill bundle. Visual review was performed manually and sequentially.

---

## 3. Product definition: what feedbacks.dev should be

The current product thesis is strong:

> A developer should be able to install feedback collection in minutes, collect useful context automatically, triage feedback quickly, and route important issues into the workflow they already use.

Every feature should be judged against four questions:

1. Does it reduce time to first useful feedback?
2. Does it increase the quality or actionability of that feedback?
3. Does it reduce the time from feedback to a decision or routed action?
4. Does it improve trust enough to support adoption and payment?

If a feature does none of these, it should not compete for primary navigation or first-run attention.

### North-star journey

1. Create a project.
2. Choose a framework.
3. Copy a public widget snippet without generating a private credential.
4. See the widget on the target site.
5. Submit a test.
6. See it arrive immediately.
7. Triage it in one action.
8. Optionally customize, secure allowed origins, connect a route, publish a board, or send updates.

### Recommended activation metrics

- Account created → project created.
- Project created → snippet copied.
- Snippet copied → embed heartbeat seen.
- Embed seen → first test feedback.
- First feedback → first status/priority/tag change.
- First feedback → first integration connected.
- First feedback → first public board enabled.
- First feedback → first update published.
- First paywall view → checkout started → checkout completed.
- Median and p90 time from signup to each milestone.

Do not use the current activation dataset for decisions until test data is quarantined and the event stream is verified.

---

## 4. P0 findings: contain before growth

### P0-01 — Split the public widget key from the private API credential [fixed]

**Observed**

- `generateProjectApiKey()` produces one `fb_...` value.
- Its hash is stored in `projects.api_key_hash`.
- The same value is embedded in public widget markup as `data-project`.
- Widget bootstrap and feedback submission resolve the hash.
- REST/MCP authentication also resolves the same hash.
- The docs and UI call the widget key browser-safe and the API key private, but the schema has only one key hash and suffix.

**Risk**

Any visitor to an instrumented customer site can inspect the widget key. If that key also authenticates REST/MCP, it can authorize project data access or feedback mutations within the plan's enabled API surface. This violates the product's own promise and the conventional publishable/secret key security model.

**Required design**

- `fb_pub_...`: immutable or low-risk rotatable publishable project identifier.
  - May bootstrap the widget, submit feedback, and fetch public update configuration.
  - Must never read private feedback, change triage state, change project settings, or call owner APIs.
- `fb_live_...`: server-side secret.
  - Hashed at rest.
  - Revealed once at creation/rotation.
  - Supports explicit scopes such as `feedback:read`, `feedback:write`, `project:read`, and `setup:read`.
  - Has name, creation time, last-used time, creator, expiration option, revocation state, and audit history.
- Optional restricted keys for agents/automation.
- Existing embedded keys must be assumed public. Migrate embeds to publishable identifiers and rotate every server credential.

**Acceptance criteria**

- A publishable key receives `401/403` for every private REST/MCP operation.
- The widget continues working after private key rotation.
- Secret values are never returned after initial creation.
- Documentation, labels, examples, and errors use one consistent key taxonomy.
- Negative authorization tests cover every `/api/v1` and MCP operation.

**Evidence benchmark**

[Stripe's key model](https://docs.stripe.com/keys) separates publishable, secret, and restricted credentials and treats live secrets as one-time reveal material.

---

### P0-02 — Isolate production, preview, development, and E2E data [modified: all active fixtures and test boards are quarantined/unpublished, E2E is fail-closed against production, and TTL cleanup exists; three paid Supabase branches remain blocked pending explicit recurring-cost approval]

**Observed live data**

| Fact | Count |
|---|---:|
| Total projects | 1,046 |
| Playwright-named projects | 906 |
| Enabled public boards | 193 |
| Enabled test boards | 192 |
| Total feedback rows | 245 |
| Feedback attached to test projects | 229 |
| Activation milestones | 1,974 |
| Playwright activation milestones | 1,736 |

The public directory displayed 193 boards and was dominated by test fixtures.

**Risk**

- Public credibility damage.
- Customer data may be mixed with automation fixtures.
- Funnel and retention metrics are unusable.
- E2E tests can mutate or delete production-like records.
- A future test failure could send webhooks, create billing state, or expose a test board publicly.

**Required actions**

1. Back up and identify records by explicit test namespace, creation actor, and time.
2. Immediately unpublish/quarantine the 192 test boards.
3. Delete or archive confirmed test projects and related data only after verification.
4. Use separate Supabase projects for production, preview, development, and E2E.
5. Scope Vercel environment variables by environment; do not use the same backend for all three.
6. Add a hard E2E guard:
   - expected non-production Supabase project ref;
   - expected test hostname;
   - explicit test-only secret;
   - fail closed when any production identifier is detected.
7. Add teardown and TTL cleanup for generated users/projects.
8. Compile out or return `404` from `/api/test/*` outside the test environment.
9. Never place the E2E bypass secret in production.

**Acceptance criteria**

- Zero test boards or projects appear in production queries.
- CI refuses to start E2E against production identifiers.
- Test records have a machine-readable namespace and automatic TTL cleanup.
- Activation analytics exclude test actors by construction, not by name matching.

---

### P0-03 — Clear known production dependency vulnerabilities [fixed]

`pnpm audit --prod` reported 18 findings: 8 high, 9 moderate, and 1 low.

High-severity paths include:

- Next.js 15.5.20 advisories; the reported patched line starts at 15.5.21.
- `sharp`/libvips issues.
- PostCSS arbitrary file read/path traversal.
- `fast-uri` host confusion.

Moderate findings include Hono/Node server and additional Next.js advisories.

**Required actions**

- Upgrade the direct packages that pull vulnerable versions.
- Re-run unit, integration, E2E in the isolated environment, build, widget-size, and visual regression checks.
- Add a production-dependency audit gate in CI.
- Use a documented exception process with owner, exploitability analysis, compensating control, and expiry for any unavoidable finding.

**Acceptance criteria**

- No known critical or high production vulnerability.
- Any medium exception has an owner and expiry.
- Lockfile changes are reviewed and reproducible.

---

### P0-04 — Stop storing and returning integration secrets in plaintext project JSON [fixed]

**Observed**

- GitHub tokens and generic webhook signing secrets are stored in `projects.webhooks` JSON.
- The authenticated webhook GET route returns normalized config containing raw secrets.
- The PUT route returns stored webhook config.
- The integrations client binds secrets back into editable input state.
- Queued webhook jobs can contain endpoint material rather than a secret reference.
- The generic project PATCH route can write raw `webhooks`, bypassing the normalized entitlement-aware route.

**Risk**

Database reads, browser state, logs, support screenshots, RLS mistakes, and job inspection can reveal long-lived secrets.

**Required design**

- Store secrets in an encrypted vault or dedicated encrypted secret table.
- Keep only a secret reference and non-sensitive metadata in project configuration.
- API responses return `hasSecret`, `lastFour`, `updatedAt`; never the secret.
- Empty input preserves the current secret; explicit replace/revoke actions require confirmation.
- Jobs contain a secret reference, not secret material.
- Remove `webhooks` from the generic project PATCH allow-list.
- Rotate all existing integration tokens and signing secrets after migration.

**Acceptance criteria**

- No raw token/signing secret appears in project JSON, API GET responses, logs, browser hydration, or queue payloads.
- Secret replacement and revocation are audited.
- Free/Pro endpoint limits are enforced server-side on every write path.

---

### P0-05 — Make feedback screenshots and attachments private [fixed]

**Observed**

Feedback screenshots and attachments use public storage buckets and `getPublicUrl`. These files can include pages, account details, URLs, documents, or user-entered data.

**Required design**

- Private buckets.
- Authorized download endpoint or short-lived signed URLs.
- Owner access based on project membership/ownership.
- Strict file size, MIME and magic-byte checks.
- Malware scanning/quarantine for attachments.
- Metadata stripping where appropriate.
- Safe `Content-Disposition`, filename normalization, and no inline execution for risky types.
- Published retention policy and deletion behavior.

**Acceptance criteria**

- An unauthenticated request cannot retrieve a feedback attachment.
- Signed URLs expire quickly and cannot cross project boundaries.
- Project/account deletion removes storage objects idempotently.

---

## 5. Complete feature inventory and critical assessment

Legend:

- **Implemented:** usable end to end.
- **Fragile:** implemented, but has a material safety, correctness, scale, or UX weakness.
- **Partial:** meaningful code exists, but the customer promise is incomplete.
- **Not built:** absent or intentionally deferred.

### 5.1 Accounts, projects, and onboarding [modified: all repository-owned activation/account paths and simultaneous-editor conflict handling are fixed; leaked-password provider protection remains blocked on console access]

| Capability | Status | Frontend | Backend | Critical assessment and action |
|---|---|---|---|---|
| Email authentication | Implemented | `/auth` | Supabase Auth callback/status/sign-out | Add clearer magic-link expiry/resend/cross-device states [fixed]; leaked-password protection is [blocked: requires Supabase provider-dashboard access] |
| Account session | Implemented | Dashboard shell | Server Supabase auth | Add session-expired recovery that preserves the intended route and unsaved context [fixed] |
| Create project | Implemented | `/projects/new` | `POST /api/projects` | Form is simple; do not ask for an extra “first goal” decision before value [fixed] |
| List/switch projects | Implemented | Sidebar and `/projects` | Project queries | Replace ambiguous setup/key noise with project health and a clear next action [fixed] |
| Rename/domain/settings | Implemented but fragile | Project/settings UIs | Generic project PATCH | Whole settings object risks lost updates; narrow commands and strong ETag/`If-Match` conflict handling are [fixed] |
| Delete project | Implemented | Settings/destructive action | Storage cleanup + DB cascade | Typed confirmation, durable cleanup/audit state, and clear consequence copy [fixed] |
| Delete account | Partial/fragile | Settings | Sequential cross-system deletion | Convert to an idempotent deletion job with resumable failure states [fixed] |
| Product tour/tutorials | Implemented | Quick tour and `/tutorials` | Client progress | Replace parallel teaching surfaces with contextual milestones [fixed] |
| Activation milestones | Implemented but polluted | Dashboard/setup | `activation_milestones` | Quarantine fixtures and exclude tests before trusting metrics [fixed] |

### 5.2 Widget install and verification [fixed]

| Capability | Status | Frontend | Backend/runtime | Critical assessment and action |
|---|---|---|---|---|
| Website snippet | Implemented but blocked by key model | Install screen | Widget bootstrap | Snippet is immediately visible and copyable with a publishable key [fixed] |
| React wrapper | Implemented | Framework tab/docs | `@feedbacks/react` | SSR/hydration, strict-mode, error-boundary, and duplicate initialization behavior [fixed] |
| Vue wrapper | Implemented | Framework tab/docs | `@feedbacks/vue` | Mount/unmount and route-change behavior [fixed] |
| Next.js guidance | Implemented | Framework tab/docs | Uses widget/wrapper | Show exact App Router placement and progressive CSP guidance [fixed] |
| Other/custom guidance | Implemented | Framework tab | Snippet | Keep advanced variations behind framework selection [fixed] |
| Copy snippet | Implemented | Code block/copy | Browser clipboard | Persistent copied state, live announcement, and manual fallback [fixed] |
| Setup packet/token | Implemented but security-sensitive | API/MCP docs | Setup token/packet routes | Scoped, expiring setup tokens with public-key rejection and audit history [fixed] |
| Embed heartbeat/status | Implemented | Verification | Widget event/status route | Live detection plus cache/ad-blocker/CSP/origin diagnostics and retry [fixed] |
| Send test feedback | Implemented | Verification/widget | Feedback route | Keep as the single primary verification action [fixed] |
| Origin allow-list | Implemented, opt-in | Advanced config | Sanitizer/enforcement | Prompt after verification, recommend lock-down, and validate wildcard semantics [fixed] |
| Key rotation | Implemented but unsafe model | Install/API | Rotate-key route | Publishable/private lifecycle with revocation and non-breaking embed migration [fixed] |

### 5.3 Feedback collection widget [fixed]

| Capability | Status | Critical assessment and action |
|---|---|---|
| Modal, popover/button, embedded presentation | Implemented | Consistent mode names and previews across installer, customizer, and details [fixed] |
| Feedback types | Implemented | Useful defaults without pre-verification configuration [fixed] |
| Rating/text/email fields | Implemented | Optional/required clarity and durable accidental-close drafts [fixed] |
| Automatic page/browser context | Implemented | Exact disclosure with origin/path-only collection and query/fragment redaction [fixed] |
| Screenshot capture | Implemented, optional | Honest optional-screenshot copy [fixed] |
| Attachment upload | Implemented | Private, image-only, magic-byte validated, metadata-stripped delivery with progress/retry/failure recovery [fixed] |
| Honeypot/rate limit/CAPTCHA | Implemented | Scoped abuse controls, retry guidance, and safe escalation [fixed] |
| Theme/position/labels | Implemented | Quick appearance separated from advanced behavior with server entitlements [fixed] |
| Product updates module | Implemented | Feedback installation remains independent from update configuration [fixed] |
| Widget events/metrics | Implemented | Privacy-safe retention/test exclusion and operational signals [fixed] |
| Small bundle target | Implemented | Widget bundle budget remains in CI and passes [fixed] |

### 5.4 Inbox and triage [modified: core single-owner triage is fixed; assignments/mentions/roles and automated themes remain explicitly unbuilt]

| Capability | Status | Critical assessment and action |
|---|---|---|
| Cross-project/project views | Implemented | Compact mobile project/filter presentation [fixed] |
| Status, type, priority, tags filters | Implemented | Responsive filter controls, removable chips, and URL state [fixed] |
| Search | Implemented | Keyboard shortcut, explicit scope, and stable query state [fixed] |
| Saved views | Implemented | Clear ownership plus safe rename/delete/reorder [fixed] |
| Sorting | Implemented | Preserve in URL and announce result changes [fixed] |
| Bulk selection/actions | Implemented | Bulk controls appear only after selection with explicit page scope and partial-failure feedback [fixed] |
| CSV export | Implemented | Current filters, explicit columns, streaming batches, formula safety, Unicode, and timezone policy [fixed] |
| Feedback detail | Implemented | Real activity timeline, tag suggestions, durable drafts, and Saving/Saved/Retry states [fixed] |
| Status/priority/tags | Implemented | Keyboard triage, optimistic rollback, and undo [fixed] |
| Internal notes | Implemented | Keep single-owner semantics and do not market collaboration [fixed] |
| Archive | Implemented | Clarify archive vs resolution and offer undo [fixed] |
| Notifications/read state | Implemented | Consistent unread model across dashboard, inbox, and delivery [fixed] |
| Assignment, mentions, team roles | Not built | [deferred: intentionally excluded until real multi-user demand and authorization design exist] |
| First-class recurring themes/AI | Not built | [deferred: intentionally excluded until clean data demonstrates triage value] |

### 5.5 Public feedback boards [modified: trust, cursor scale, state, privacy, abuse, SEO, and signed bounce ingestion are fixed; live bounce and advanced-analytics proof remain traffic-driven]

| Capability | Status | Critical assessment and action |
|---|---|---|
| Board enable/slug/title/description | Implemented | Separate Draft/Published from Listed/Unlisted with one vocabulary [fixed] |
| Board branding/profile/custom CSS | Implemented | Sanitized custom CSS and server-enforced branding entitlement [fixed] |
| Public directory | Implemented but not scalable/trustworthy | Quarantine fixtures; bounded queries/aggregates/pagination and honest discovery [fixed] |
| Public submission | Implemented | Scoped abuse controls, trust disclosure, moderation expectations, and recoverable states [fixed] |
| Voting | Implemented but weak identity | Privacy-safe HMAC-signed anonymous device identity replaces shared-IP identity [fixed] |
| Comments/replies | Implemented but query is unbounded | Project-scoped SQL, moderation, bounded pagination, and notifications [fixed] |
| Follow board/watch feedback | Implemented | Explicit consent/unsubscribe and signed anonymous identity [fixed] |
| Reports/moderation | Implemented | Moderation states, audit trail, reasons, and owner actions [fixed] |
| Suggestions | Implemented | Explain matching/deduplication behavior [fixed] |
| Announcements | Implemented | Product Updates owns release communication; board announcements remain contextual [fixed] |
| Board analytics | Partial | Decision-useful bounded aggregate metrics [fixed] |
| SEO/social previews | Partial | Canonical URL, metadata/share preview, sitemap/noindex rules, and state-aware indexing [fixed] |

### 5.6 Product Updates / What’s New [fixed]

| Capability | Status | Critical assessment and action |
|---|---|---|
| Draft editor | Implemented | Editor orchestration, overview, settings, preview/dialog presentation, and domain model are split into focused modules; stale draft/settings/media/lifecycle writes are rejected [fixed] |
| Preview | Implemented | Responsive preview without nested scroll traps [fixed] |
| Publish/archive/restore | Implemented | Immutable published time and activity history [fixed] |
| Scheduling | Implemented, paid | Server-authoritative plan and schedule validation [fixed] |
| Image upload | Implemented | JPEG/PNG magic-byte validation, metadata-stripping re-encode, dimensions, alt text, and guidance [fixed] |
| Widget delivery | Implemented | Cache invalidation, path/timezone rules, and anonymous event idempotency [fixed] |
| Include/exclude paths | Implemented | Conflict validation and human-readable audience summary [fixed] |
| Metrics | Implemented, aggregate | Defined/test-filtered metrics with data freshness [fixed] |
| Custom branding | Implemented, paid | Server enforcement aligned across update and widget paths [fixed] |
| Dedicated update routes | Implemented | Legacy route duplication redirects to the canonical surface [fixed] |

### 5.7 Integrations and routing [modified: encrypted secrets and reliable delivery are fixed; GitHub App replacement is blocked on App credentials and later integrations remain demand-gated]

| Capability | Status | Critical assessment and action |
|---|---|---|
| Slack incoming webhooks | Implemented | Encrypted/masked secrets, endpoint validation, refusal to test unsaved edits, and result identity [fixed] |
| Discord webhooks | Implemented | Same encrypted secret and explicit test-state handling [fixed] |
| Generic webhooks | Implemented | SSRF defenses plus encrypted signing secrets and documented retry/idempotency [fixed] |
| GitHub issue routing | Implemented via token | Plaintext storage is eliminated [fixed]; GitHub App replacement is [blocked: requires registered App credentials] |
| Rule filtering | Implemented | Readable summary and sample-feedback test mode [fixed] |
| Digest routing | Implemented | Clear batching window, timezone/DST, dedupe, and failure behavior [fixed] |
| Delivery log/replay | Implemented | Redacted paginated logs and explicitly idempotent replay [fixed] |
| Auto-disable failing endpoint | Implemented | Explain why/when and provide safe re-enable/test [fixed] |
| First-class Linear | Not built | [deferred: require demonstrated routing demand after activation] |
| Zapier/Make | Not built | [deferred: require generic-webhook demand evidence] |

The webhook HTTP layer is one of the stronger backend areas: HTTPS-only delivery, credential blocking, DNS resolution/pinning, private/reserved address blocking, redirect refusal, timeouts, bounded responses, and retries are present.

### 5.8 REST API and MCP [fixed]

| Capability | Status | Critical assessment and action |
|---|---|---|
| List/create projects | Implemented | Scoped private credentials and idempotent creates [fixed] |
| Get/update project | Implemented | Narrow mutable fields, audit events, and strong ETag/`If-Match` conflict handling [fixed] |
| List/create/update feedback | Implemented | Opaque cursor pagination with timestamp/UUID tie-break, safe error envelope, create idempotency, and stale-triage conflict handling [fixed] |
| Setup packet | Implemented | Scoped, expiring, audited access [fixed] |
| MCP server/tools | Implemented | Precise scopes and destructive-action confirmation with private-key enforcement [fixed] |
| API docs/quick start | Implemented but misleading | Publishable/private key guidance now matches implementation [fixed] |
| Rate limits/versioning | Partial | Limits/retry headers, v1 contracts, and deprecation guidance [fixed] |
| Per-key scopes/revocation | Not built | Scoped hashed keys, revocation, last-used data, and audit history [fixed] |

### 5.9 Billing and plans [blocked: implementation is hardened and honest, but commercial launch requires a controlled live Dodo transaction]

| Capability | Status | Critical assessment and action |
|---|---|---|
| Free/Pro entitlements | Implemented | Narrow server mutation paths enforce entitlements [fixed] |
| Dodo checkout | Implemented | Production is fail-closed without live configuration; monthly checkout remains the honest offer [modified: live proof blocked on credentials] |
| Customer portal | Implemented | Secure short-lived sessions and explicit return/error states [fixed] |
| Webhook verification | Implemented | Signature, timestamp, environment, product, currency, and interval checks [fixed] |
| Event idempotency | Fragile | Atomic event claim and state transition prevent races [fixed] |
| Subscription sync | Implemented | Explicit trialing/active/on-hold/past-due/canceled transitions and mismatch handling [fixed] |
| Usage display | Implemented | Honest missing-period and test-state messaging [fixed] |
| Annual plan | Backend-ready, UI missing | [blocked: deliberately unavailable until live annual product proof and activated-user pricing evidence] |
| Team plan/seats | Not built | [deferred: deliberately not sold before membership/authorization/billing exist] |

Dodo test and live modes use separate API keys, webhooks, and data. Current status documents refer to test mode; the production deployment value was not exposed in this audit. Verify the actual deployment before accepting money. See [Dodo test vs live mode](https://docs.dodopayments.com/miscellaneous/test-mode-vs-live-mode), [customer portal](https://docs.dodopayments.com/features/customer-portal), and [subscription webhook events](https://docs.dodopayments.com/developer-resources/webhooks/intents/subscription).

### 5.10 Documentation, legal, and operations [modified: product truth, retention, health, job visibility, privacy-safe analytics, runbooks, and Resend bounce suppression are fixed; an external APM/alert drain still awaits a provider choice]

| Capability | Status | Critical assessment and action |
|---|---|---|
| Documentation hub/search | Implemented | Correct key/screenshot/privacy claims and task troubleshooting [fixed] |
| Tutorials | Implemented | Consolidated into contextual activation guidance [fixed] |
| Privacy policy | Implemented but incomplete | Media/processors/retention/export/deletion/context disclosure [fixed] |
| Terms | Implemented | Actual limits, refunds, abuse, and availability language [fixed] |
| CSP reports | Implemented | Bounded parsing, aggregation, privacy scrubbing, retention, and correlated logs [fixed] |
| Health endpoint | Implemented | Separate liveness from authenticated operational readiness [fixed] |
| Cron webhook processing | Implemented | Queue age/failure/retry-exhaustion/stuck-job signals and run evidence [fixed] |
| Notification digests | Implemented | Delivery visibility, unsubscribe audit, signed/replay-safe Resend events, hashed-recipient suppression, and pre-send suppression checks [fixed]; production webhook-secret and live-bounce proof are [blocked: requires Resend console configuration and a real provider event] |
| Error tracking/APM | Partial/not evident | First-party structured correlation, RUM, health, and runbook [modified: external error/trace drain awaits a provider choice] |
| Product analytics | Not reliable | Test-quarantined privacy-safe activation analytics [fixed] |

---

## 6. Screen-by-screen UI/UX review

### 6.1 Landing page `/` [fixed]

**What works**

- Focused promise and strong product-specific visual language.
- Clear primary CTA.
- Responsive hero remains understandable on mobile.
- Real interface demonstrations are more credible than abstract gradients.
- Pricing is visible rather than hidden.

**Problems**

- “Get the page and screenshot with each message” overpromises: page context is automatic; screenshot capture is optional/user-triggered.
- The public/private credential claim is false in the current implementation.
- The page is long and repeats similar “feedback arrives with context” demonstrations.
- Social proof, security posture, uptime/support expectations, and real customer evidence are thin.
- The source/repository link points to an old repository name.
- Mobile navigation hides Sign in, Docs, and Product, leaving only the acquisition CTA.
- Small text inside demo illustrations reaches 9–11px; meaningful product information cannot depend on it.

**Redesign**

1. Hero: one promise, one supporting sentence, primary “Start free,” secondary “See 90-second demo.”
2. Trust strip: no credit card, framework support, widget gzip size, privacy statement—only verifiable claims.
3. Three-step mechanism: install, collect context, route/decide.
4. One interactive product story rather than several repeated mockups.
5. Integration proof.
6. Clear Free vs Pro value.
7. Security and data-handling section after credential/media fixes.
8. FAQ based on objections: install risk, performance, privacy, spam, migration, pricing.
9. Final CTA.

**Behavioral rationale**

- Reduce choice before the user understands the product.
- Make the action and expected outcome adjacent.
- Use progressive disclosure for technical proof.
- Prefer verifiable specificity over superlatives.

### 6.2 Authentication `/auth` [fixed]

- Explain exactly what happens after submission.
- Handle new user, returning user, expired link, already-used link, wrong browser/device, rate-limited resend, and provider failure.
- Preserve requested destination through auth.
- Do not create a project before email/session confirmation is durable.
- Use a single primary action and show support/contact escape hatch.
- Announce success/error with an accessible live region.

### 6.3 Project creation `/projects/new` [fixed]

- Keep only project name and optional site URL.
- Infer a slug/domain where safe but never block on it.
- Remove or defer “choose another first goal”; defaults can come later.
- After submit, land directly in install—not a project overview.
- Explain that the name is editable.
- Handle duplicate names, Unicode, maximum length, slow network, double submit, and project-plan limits.

### 6.4 Dashboard `/dashboard` [fixed]

- The current light hierarchy is clear.
- After activation, the refresher banner occupies too much persistent space.
- On mobile, banner and metric cards push activity below the fold.
- Make the top task state-aware:
  - no embed → install;
  - embed seen/no feedback → send test;
  - feedback received → triage;
  - established → recent activity and exceptions.
- Show no more than three decision-useful metrics.
- Make all counts link to a filtered destination.
- Do not celebrate vanity activity; highlight unresolved, high-priority, failed delivery, or quota risk.

### 6.5 Projects list `/projects` [fixed]

- Replace ambiguous “Setup” with the next concrete action: Install, Verify, Open inbox, or Configure.
- Do not show a masked suffix of a public key.
- Show project health: embed last seen, new feedback, failed routes, board/update state.
- Make destructive actions secondary and protected.
- Add useful zero, one-project, many-project, archived, and plan-limit states.

### 6.6 Project overview `/projects/[id]` [fixed: retained as a state-aware operational summary and next-action router]

- This is likely an unnecessary extra click.
- If retained, it must act as an operational summary: install status, recent feedback, delivery failures, usage, public surface status.
- Otherwise redirect to the state-aware next task.

### 6.7 Install `/projects/[id]/install` [fixed]

The redesign is substantially cleaner than the original screenshot, but:

- It requires “Generate a fresh key” before revealing the snippet. Installation should never require generating a private credential. **[fixed: the install and verification surfaces now use an always-available `fb_pub_…` publishable project key; focused tests, type-checking, browser rendering, and bootstrap response were verified]**
- Mobile spends the first viewport on title, progress, and framework tabs; the code is below the fold.
- Connection details repeat information that is not needed to complete installation.
- Framework choice and code should be adjacent.

**Recommended layout**

- Compact step label: “1 of 3 · Install.”
- Framework segmented control.
- Immediately visible code block with publishable project ID.
- One sentence naming exact placement.
- Copy button as the primary action.
- “I installed it” proceeds to live verification.
- Troubleshooting and CSP/advanced options collapsed below.
- Connection/API secrets live in API & MCP, not install.

### 6.8 Customize [fixed]

- Settings plus live preview is the right model.
- The key warning should disappear after credential separation.
- Avoid an internally scrolling preview inside the page.
- Keep a sticky, contextual Save bar only when dirty.
- Group controls by behavior:
  - trigger and placement;
  - form fields/content;
  - visual appearance;
  - privacy/security;
  - advanced.
- Show paid controls with a preview, explanation, and upgrade path; enforce them server-side.
- Support undo/reset per section and reset all.

### 6.9 Verify `/projects/[id]/verify` [fixed]

- Verification should be a live diagnostic, not a static instruction page.
- Show:
  - last embed heartbeat;
  - detected URL/domain;
  - widget version;
  - configuration fetched;
  - test feedback received.
- Diagnose common blockers: wrong key, cache, CSP, ad blocker, route transition, origin restriction, script loaded twice.
- Provide a copyable diagnostic packet without secrets.
- Once verified, automatically advance and celebrate briefly—then show the inbox item.

### 6.10 Inbox `/feedback` [fixed]

**Desktop**

- Strong capability but too many controls compete before the list.
- The bulk bar is visible with zero selection.
- “Project View” adds a heavy secondary navigation layer.

**Mobile**

- “5 shown” is visually detached.
- A horizontally clipped filter/status rail and browser-like scrollbar look broken.
- A second project rail consumes the first viewport.
- The actual feedback rows appear too late.

**Redesign**

- Search + Filter button + Sort.
- Active filters as removable chips below.
- Project scope inside the filter sheet on mobile.
- Saved views in a compact menu.
- Bulk bar appears only after selection and stays near selected rows.
- Each row shows type, concise message, project only when cross-project, status/priority, age, and meaningful context—not every metadata field.
- Preserve filters in the URL and browser history.

### 6.11 Feedback detail `/feedback/[id]` [fixed]

- The basic content/action split is sound.
- Autosave feedback is too subtle.
- Timeline shows mainly created/updated, not the actual triage story.
- Notes and metadata feel dense.

**Improve**

- Sticky primary triage controls.
- Timeline events for status, priority, tags, note, integration delivery, public visibility, and archive.
- Explicit “Saving… / Saved / Couldn’t save—Retry.”
- Suggested existing tags to prevent taxonomy drift.
- Safe media viewer with download controls and redaction warning.
- Keyboard actions for status/priority/archive.
- Undo for destructive/closing actions.
- Avoid assignment/mention affordances until multi-user support exists.

### 6.12 Integrations [fixed]

- Integration cards are understandable.
- A global Save action appears even with no changes.
- Delivery history empty state has little instructional value.
- Secret values should never reappear.

**Improve**

- Each integration has Connected/Needs attention/Disabled status.
- Test connection before enabling.
- Save per integration or show sticky Save only when dirty.
- Mask secret fields with Replace/Revoke actions.
- Show destination identity after test.
- Explain automatic disable with last failure and recovery steps.
- Delivery log includes attempt, event, redacted destination, response class, next retry, and replay.

### 6.13 API & MCP [fixed]

- Split “Quick start” from full reference.
- Create/reveal a private scoped credential here, once.
- Make every snippet runnable and safe to paste.
- Include expected success output and common error output.
- Add language tabs only when they materially help.
- Explain rate limits, pagination, idempotency, key rotation, and MCP tool permissions.
- Never call the browser widget identifier an API secret.

### 6.14 Board settings [fixed]

Observed chips showed “Not published,” “Public,” and “Listed in directory” simultaneously. These represent different dimensions but look contradictory.

Use two explicit controls:

- **Publication:** Draft / Published.
- **Discovery:** Unlisted / Listed in directory.

Also:

- Preview the canonical public URL using the production public host.
- Validate slug availability immediately but accessibly.
- Explain submission, voting, identity, moderation, and email consent.
- Put custom CSS behind Advanced with validation and a safe preview.
- Add SEO preview and sharing card.

### 6.15 Owner boards page `/dashboard/boards` [fixed]

- “Not configured” is incorrect when settings exist but the board is unpublished.
- Use Draft, Published–unlisted, Published–listed, Needs moderation, or Disabled.
- Remove legacy route/link language after migrations.
- Focus the page on actionable states: reports, new ideas, follower changes, configuration errors.

### 6.16 Public directory `/boards` [fixed]

- The live page was dominated by E2E boards.
- It said “Showing 193 of 193” while displaying page 1 of 9 and 24 cards.
- Loading every board plus all feedback/comments to compute aggregates will not scale.

**Improve**

- Server-side, cursor-based pagination.
- Database-level search/filter/sort and aggregate counts.
- Accurate range copy: “1–24 of 193.”
- Quality/discovery controls so empty/spam boards do not dominate.
- Featured/recent/trending only after there is enough trustworthy traffic.
- Report abuse and clear ownership.
- Fast cache with explicit invalidation.

### 6.17 Public board `/p/[slug]` [fixed]

- Remove duplicate `contentinfo` landmarks/footers.
- Establish trust before open submission: owner identity, moderation policy, privacy, and expected response.
- Make statuses understandable to public users, not internal operators.
- Voting/comment/follow actions need signed-out, signed-in, already-voted, shared-network, rate-limited, and banned states.
- Preserve drafts on auth transitions or network failure.
- Provide accessible sorting/filtering and pagination.
- Add canonical metadata and safe share previews.

### 6.18 Product Updates [fixed]

- Replace blank text loading with a structured skeleton that matches the final layout.
- Use one `h1`.
- Selected setup option must expose `aria-pressed`, `aria-selected`, or the correct tab/radio semantics.
- Reduce the repeated-card setup page.
- Split editing from analytics/settings to reduce cognitive load.
- Clarify Draft, Scheduled, Live, Archived states and timezone.
- Require alt text or decorative designation for images.

### 6.19 Billing [modified: complete state UI and atomic webhook handling are implemented; live-mode transaction proof is blocked on live Dodo credentials]

- Never show operational webhook language to ordinary customers.
- Display subscription status, next charge, amount/currency, billing interval, and portal action.
- Handle active, trialing, past due, on hold, canceled at period end, canceled, and no-subscription states.
- Do not attach “Unlimited history on Pro” to a missing period date.
- Add annual billing only after live product configuration and pricing validation.
- Payment success should re-sync idempotently and show a durable confirmation.
- Payment failure needs recovery without support dependence.

### 6.20 Settings [fixed]

- Notification controls need visible dirty/save/saved/failure states.
- Explain why an integration or digest may be auto-disabled.
- Separate Account, Notifications, Security/API keys, and Danger zone.
- Account deletion should explain data deleted, billing effect, public boards, integrations, retention, and irreversibility.
- Add active sessions and security events when the product has enough user trust surface.

### 6.21 Tutorials [fixed]

- “0/7” combined with multiple “Resume” labels is confusing.
- Replace the two-column catalog with a single activation checklist driven by real state.
- Completed tasks disappear into a compact progress view.
- Advanced guides move to Docs.
- A returning user should resume the next incomplete outcome, not a generic lesson.

### 6.22 Documentation `/docs` [fixed]

- Information architecture and search are good.
- Correct the false private-vs-widget-key description only after the implementation is fixed.
- Add framework-specific install, CSP, origin restriction, privacy/data collection, troubleshooting, webhook retries, REST pagination, MCP permissions, and migration guides.
- Every code sample gets copy, expected result, and last-verified version.
- Add “Was this useful?” only if someone will review the signal.

### 6.23 Privacy, terms, error, loading, and not-found states [fixed]

- Legal copy must match actual storage visibility, processors, retention, exports, deletion, and public-board behavior.
- Every route needs a route-shaped skeleton, empty state, recoverable error, permission denied, plan denied, rate limited, offline, and not-found state.
- Error copy should say what happened, whether data was saved, and the next safe action.
- Do not expose raw database/provider error strings.

---

## 7. UI system: improve every primitive

### 7.1 Surfaces and dark-mode color [fixed]

The code already defines useful dark tokens roughly equivalent to canvas, sidebar, card, soft, raised, and overlay. Adoption is inconsistent:

- `bg-card`: 88 uses
- `bg-background`: 80
- `surface-raised`: 27
- `surface-soft`: 6
- `surface-inset`: 2
- `surface-overlay`: 2

This explains the “all boxes are the same color” feeling.

**Do not simply make every other box lighter.** Assign surface by semantic role:

| Role | Use | Dark-mode treatment |
|---|---|---|
| Canvas | Page background | Darkest, neutral |
| Primary panel | Main task/content boundary | One visible step above canvas |
| Section header/toolbar | Organizes a panel | Slightly raised or tinted; stronger bottom border |
| Inset | Code, metadata, filters, preview wells | Slightly darker than its parent |
| Interactive/selected | Chosen tab/card/row | Raised plus accent border or tint |
| Overlay | Dialog, popover, command menu | Highest surface, stronger shadow/border |
| Success/warning/error | Feedback only | Semantic tint with adequate text contrast |

Rules:

- Adjacent regions must differ by purpose, not alternating color.
- Use spacing and typography before adding another border/card.
- A section inside a card should usually be an inset or divider, not another identical card.
- Borders should be more legible in dark mode; shadows alone disappear.
- Green is for primary action, active selection, or success—not every label and border.
- Validate all foreground/background pairs against WCAG contrast.

### 7.2 Typography [fixed]

- Use one display scale for marketing and one compact product scale.
- Every screen has exactly one descriptive `h1`.
- Body text should generally be 14–16px in the app; do not use 11–12px for necessary instructions.
- Metadata may be smaller but must retain contrast and line height.
- Use sentence case for controls and section labels.
- Keep line length near 55–75 characters for explanatory text.
- Use weight, size, and spacing before color to establish hierarchy.
- Avoid uppercase letter-spaced labels as the only clue to importance.

### 7.3 Spacing and layout [fixed]

- Adopt a small spacing scale and audit exceptions.
- Use page shells and section panels instead of repeated custom wrappers.
- Desktop content max-width should reflect the task: wider for inbox/tables, narrower for settings/forms.
- Keep primary action near the content it affects.
- On mobile, eliminate horizontal scrolling except intentional code/table regions.
- Use sticky controls sparingly; account for safe-area insets and keyboard.
- Avoid nested scroll containers.

### 7.4 Buttons [fixed]

Every button must have:

- Clear verb + object where ambiguity exists: “Copy snippet,” “Publish update,” “Delete project.”
- One visual primary action per task region.
- Default, hover, active, focus-visible, disabled, loading, success, and error states.
- Stable width during loading to prevent layout shift.
- Spinner plus retained label for longer work; never replace context with a spinner alone.
- Disabled state only when the reason is obvious; otherwise keep enabled and explain the blocker on action.
- Confirmation only for irreversible/high-cost actions.
- Undo for reversible destructive actions.
- At least WCAG's 24×24 CSS pixel target minimum, with 44px touch comfort on mobile.

Icon-only buttons require accessible names and tooltips on hover/focus. Destructive actions must not use the same green primary styling.

### 7.5 Inputs, textareas, and validation [fixed]

- Persistent label; placeholder is an example, not a label.
- Required/optional indication.
- Help text only when it changes success.
- Validate on blur or submit; avoid scolding while typing.
- Preserve user input on server/network errors.
- Error message adjacent to field and summarized at the form level when multiple.
- Programmatically link label, hint, error, and character count.
- Support paste, autofill, password managers, and mobile input modes.
- Do not prefill or echo secrets.

### 7.6 Selects, tabs, segmented controls, checkboxes, and switches [fixed]

- Tabs switch views; segmented controls choose one setting; checkboxes select independent options; switches take immediate effect. Do not interchange them visually.
- Expose selected state to assistive technology.
- Support arrows/space/enter according to the control pattern.
- Use a visible label beyond color.
- Long mobile tab rows become a select/sheet or wrap intentionally; never clip silently.
- Settings that require Save should use checkboxes/selects, not switches that imply instant persistence.

### 7.7 Cards and panels [fixed]

- A card must represent a discrete object or decision.
- Do not wrap every paragraph or sub-section in another same-colored card.
- Clickable cards need a single hit target and visible focus state.
- Avoid mixed card actions that make click destination ambiguous.
- Selected cards need text/icon/border state, not color alone.
- Empty cards should not reserve large space.

### 7.8 Lists, tables, and rows [fixed]

- Use lists for scanning and tables only when column comparison matters.
- Mobile tables become prioritized rows, not squeezed columns.
- Keep row primary text and state visible; move metadata to disclosure.
- Ensure row click and inner buttons do not conflict.
- Add cursor pagination for unbounded data.
- Announce result counts after filtering.

### 7.9 Badges and status [fixed]

- Define one status vocabulary for each domain.
- Separate state dimensions instead of combining contradictory badges.
- Never rely on color alone; include text and, where useful, icon/shape.
- Avoid badge overload. Show the status needed for the current decision.
- Use neutral badges for metadata, semantic badges for actionable state.

### 7.10 Code snippets and copy actions [fixed]

- Snippet visible without creating a private key.
- Syntax-highlighted but high-contrast.
- Copy button inside the code region, reachable by keyboard.
- “Copied” state lasts long enough and is announced.
- Horizontal scroll is contained and indicated.
- Include exact placement, expected result, and framework/version.
- Secrets are shown once, with explicit storage guidance and no analytics/logging capture.
- Add a “Reveal” action only to ephemeral one-time response state, never by re-fetching a stored raw secret.

### 7.11 Dialogs, drawers, popovers, and menus [fixed]

- Use dialogs for focused confirmation/input, drawers for mobile supporting workflows, popovers for lightweight contextual choices.
- Focus moves in, is trapped appropriately, and returns to the trigger.
- Escape closes only when safe.
- Destructive confirmation names the object and consequence.
- Long forms belong on a page, not in a cramped modal.
- Mobile menus respect viewport keyboard and safe areas.

### 7.12 Toasts and save states [fixed]

- Toasts are supplementary, not the only proof of success/error.
- Inline state remains where the action occurred.
- Autosave exposes Saving, Saved time, and Retry.
- Errors persist until resolved/dismissed.
- Do not toast routine navigation or obvious selection.
- Use live regions without causing repeated announcements.

### 7.13 Loading, empty, error, and success [modified: route-shaped recoverable states cover the primary workflows; exhaustive manual proof of every exceptional state remains ongoing product QA]

- Skeletons mirror final structure and avoid false precision.
- Loading never erases already useful data during background refresh.
- Empty state explains why it is empty and gives one next action.
- Filtered empty state offers “Clear filters,” not onboarding.
- Error state says whether data may have changed and offers retry.
- Success moves the user forward; avoid full-page celebration after routine tasks.

### 7.14 Motion and animation [fixed]

Motion should explain state change, preserve spatial context, or confirm an action.

Recommended motion language:

- 120–180ms for hover, press, tooltip, and small control state.
- 180–240ms for panel disclosure, popover, and row insertion.
- 240–320ms for page-level drawer/dialog transitions.
- Standard ease-out for entrance, ease-in for exit, spring only for direct manipulation.
- No entrance animation on every dashboard card.
- Pause marketing autoplay on hover, focus, document hidden, and user interaction.
- Respect `prefers-reduced-motion` for animation, transition, parallax, carousel, and smooth scrolling.
- Preserve layout; do not animate height in ways that create content jumps.

The current global reduced-motion rule is a good start, but global `scroll-behavior: smooth` should also be disabled under reduced motion.

[Nielsen Norman Group's animation guidance](https://www.nngroup.com/articles/animation-usability/) supports purposeful, infrequent animation that communicates feedback or change rather than decoration.

### 7.15 Responsive behavior [modified: 320px automated coverage and responsive primary layouts are implemented; the full physical-device, software-keyboard, translated-string, and 200% zoom matrix remains manual release QA]

Test at minimum:

- 320, 360, 390, 768, 1024, 1280, and 1440 CSS pixels.
- 200% zoom and narrow landscape.
- Touch, mouse, and keyboard.
- Mobile software keyboard open.
- Long translated strings and large user/project names.

Priority fixes:

- Inbox filter/project rails.
- Install code visibility.
- Dashboard above-the-fold task.
- Board settings control density.
- Update editor/preview.
- Public board submission/comments.
- Dialogs and sticky actions with safe-area padding.

### 7.16 Accessibility [modified: WCAG 2.2 axe coverage now scans complete primary workflows at moderate impact and above with landmark/heading checks; manual screen-reader and physical-device audits remain required]

The current focus-ring foundation is good, but automated E2E scans only selected main landmarks, filter to serious/critical findings, and target older WCAG tags.

Required:

- Target [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/).
- Run axe on complete workflows, dialogs, drawers, menus, public boards, docs, billing, settings, install, customize, and error states.
- Do not suppress moderate violations without review.
- Manual keyboard audit.
- Screen-reader audit for install, submission, inbox triage, billing, and deletion.
- Contrast and non-color status review in light/dark.
- Focus not obscured by sticky UI.
- Target size, accessible authentication, redundant entry, and drag alternatives.
- Zoom/reflow at 200% and 400% where applicable.
- Automated duplicate landmark/heading/name checks.

---

## 8. Backend and architecture review

### 8.1 Architecture [fixed]

The monorepo split—Next.js dashboard, Vanilla TypeScript widget, React/Vue wrappers, shared library, and MCP package—is sensible. The widget is appropriately framework-light.

Maintainability pressure is visible in large files:

| File/area | Approx. LOC |
|---|---:|
| Product Updates orchestration | 761, with overview/settings/presentation/model extracted |
| Feedback page | 641, with row/filter/empty-state presentation extracted |
| Webhook delivery | 715+ |
| Sidebar | 607 |
| Dashboard | 553 |
| Product tour | 486 |
| Install terminal | 440 |
| Board settings | 412 |
| Updates onboarding | 368 |

**Action**

- Split by domain responsibility, not arbitrary line count.
- Extract reusable query/state hooks only when they have stable contracts.
- Keep server authorization in server modules, not mirrored client logic.
- Introduce feature-focused API schemas and service boundaries.
- Remove legacy `release-notes` route duplication after redirects.

### 8.2 API contracts and validation [fixed]

Strengths:

- Main public feedback route caps request size and validates key file fields.
- Several routes sanitize inputs.
- Errors are often intentionally generic.

Weaknesses:

- `request.json()` is used without a common body limit in several board and v1 routes.
- Validation is hand-written and inconsistent.
- Some routes return raw database/provider error messages.
- Generic project PATCH accepts whole `settings` and `webhooks`.
- Error envelopes and pagination behavior differ.

**Action**

- Shared request reader with byte cap and content-type enforcement.
- Zod or equivalent schemas at every boundary.
- Consistent error structure: `code`, safe `message`, `requestId`, optional field errors.
- Cursor pagination for all unbounded lists.
- Idempotency keys for create/replay/payment-sensitive operations.
- API version/deprecation policy.

### 8.3 Authorization, CSRF, and entitlements [modified: centralized same-origin defense, narrow mutation commands, scoped/revocable keys, and server-side entitlements are implemented and tested; a complete disposable-database authorization matrix is blocked on approval for paid Supabase branches]

- RLS is broadly enabled and owner checks appear in many routes.
- Service-role code still makes route-layer authorization critical.
- Cookie-authenticated mutations do not consistently show centralized Origin/CSRF enforcement.
- Generic project PATCH can bypass webhook normalization/limits and possibly paid widget branding enforcement.

**Action**

- Central same-origin/CSRF guard for cookie-authenticated mutations.
- Central project permission resolver.
- Server-side entitlement enforcement on every mutation path.
- Delete generic mutable bags; expose narrow commands.
- Add an authorization matrix test covering owner, non-owner, anonymous, public key, revoked key, free, pro, and test user.

Use the [OWASP API Security Top 10 2023](https://owasp.org/API-Security/editions/2023/en/0x11-t10/) as a threat-model checklist, especially object-level authorization, property-level authorization, resource consumption, sensitive business flows, SSRF, and inventory management.

### 8.4 Database and RLS [modified: all repository-owned advisor warnings are cleared; grants, explicit service-only deny policies, trigger/RPC execute privileges, empty search paths, schema checks, and workload-safe indexes are verified; leaked-password protection and isolated paid branch tests remain externally blocked]

30 July live advisor rerun after migrations `051`–`053` reports one security warning only: leaked-password protection is disabled. Repository-owned security INFO findings and all performance WARN findings are cleared. Remaining performance INFO entries are unused-index observations and primary-key notices on immutable quarantine CTAS tables; they are retained rather than deleted blindly because usage depends on traffic, query plans, retention, and the observation window.

**Action**

- Move service-only tables/functions out of exposed schemas where practical.
- Use explicit grants and policy tests.
- Review `SECURITY DEFINER` functions. Current functions commonly set `search_path=public`; current Supabase guidance favors an empty search path with fully qualified relations.
- Enable leaked-password protection where relevant.
- Review indexes using real workload, query plans, table size, write overhead, and enough observation time.
- Add migration verification for policy/grant regressions, not only column/function existence.

References: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [database functions](https://supabase.com/docs/guides/database/functions?example-view=sql&language=sql&queryGroups=example-view&queryGroups=language), and [API security](https://supabase.com/docs/guides/api/securing-your-api).

### 8.5 Query scalability [modified: directory/comments now use snapshot-stable cursor queries, bounded database aggregates, explicit predicates, indexes, caching, and CI route budgets; external slow-query alert delivery remains provider-driven]

Critical observed patterns:

- Public directory loads all enabled boards, public feedback, and comments, computes aggregates in JavaScript, and passes the result to the client.
- Public comments load all public comments, then all project feedback IDs, and filter in memory.

**Action**

- Query only the requested board/project.
- Use joined or RPC queries with precise predicates.
- Precompute/materialize public aggregate counts if needed.
- Cursor paginate.
- Add covering indexes based on the final queries.
- Cache public pages with explicit tag invalidation.
- Add query budget tests and production slow-query alerts.

### 8.6 Rate limiting and abuse [fixed]

Current IP+route limits can make unrelated tenants/users behind a shared NAT affect one another. IP-only vote identity also causes collisions.

**Action**

- Include target/project/board in the rate-limit key.
- Apply stricter limits to expensive uploads, reports, comments, and follows.
- Use a privacy-safe signed device cookie or authenticated identity where appropriate.
- Add escalating proof-of-work/CAPTCHA only after suspicious behavior.
- Document retry headers and avoid permanent lockout.
- Monitor false-positive rate.

### 8.7 Jobs, webhooks, and idempotency [fixed]

- Webhook delivery network defenses are strong.
- Billing event handling uses a check-then-insert pattern that can race.
- Account deletion crosses systems sequentially.

**Action**

- Atomic unique event claim (`INSERT ... ON CONFLICT`) before processing.
- Transactional state update where possible.
- Idempotent retry semantics.
- Dead-letter state with manual replay.
- Queue age and retry-exhaustion alerts.
- Outbox/job model for cross-system account deletion.
- Never acknowledge a provider event until the durable state transition has succeeded.

[Dodo's Supabase webhook example](https://docs.dodopayments.com/developer-resources/webhooks/examples/supabase-example) emphasizes verification and idempotent event handling.

### 8.8 Privacy and retention [fixed]

Define, implement, and disclose:

- What automatic page/browser context is collected.
- Whether URL queries/fragments are redacted.
- Screenshot/attachment visibility.
- Feedback, media, event, webhook log, billing event, and audit retention.
- Free-plan history hiding vs actual deletion.
- Export and deletion behavior.
- Email use for voting/following.
- Third-party processors.

Data minimization is both a privacy control and a conversion trust lever.

### 8.9 Performance [fixed]

Observed Next.js first-load JavaScript:

- Shared baseline: about 102KB.
- Landing: about 133KB.
- Project workspace: about 158KB.
- Settings: about 187KB.
- Auth: about 191KB.
- Feedback list/detail: about 195–196KB.

The widget itself is lean.

**Action**

- Profile bundles; do not optimize by guesswork.
- Move client-only behavior behind smaller islands.
- Lazy-load editors, charts, media viewers, and advanced settings.
- Avoid shipping full directory datasets.
- Prefer Server Components for initial read-only content.
- Add image dimensions and appropriate formats.
- Set performance budgets for route JS, LCP image, API latency, and public-board query count.
- Measure Core Web Vitals by route/device/percentile, not a single Lighthouse run.

Use current [Core Web Vitals guidance](https://web.dev/articles/vitals): LCP, INP, and CLS at the 75th percentile.

The unit run also reports Node reparsing the widget package because it lacks `"type": "module"`; fix package metadata to avoid needless parsing overhead and ambiguity.

### 8.10 Observability [modified: request/event correlation, privacy-safe structured logs, health/queue/SLO signals, activation telemetry, Web Vitals, and an operator runbook are implemented; a third-party trace/error drain and alert receiver still require a provider decision]

Add:

- Structured logs with request/job/event IDs.
- Error aggregation with release/source-map correlation.
- Traces from API request to database/job/provider.
- Queue depth, oldest job, failure, retry, and disabled-endpoint metrics.
- Billing webhook lag/failure and subscription-state mismatch alerts.
- Embed heartbeat and feedback-ingestion SLOs.
- Public-page latency/query metrics.
- Privacy-preserving activation events with test-user exclusion.
- Web Vitals.
- An operator runbook for key leak, public data exposure, delivery outage, billing drift, and abusive board.

Never log secret keys, webhook tokens, signing secrets, full attachment URLs, or unredacted feedback content by default.

### 8.11 Testing and CI [modified: 153 unit tests plus type, lint, production build, live-schema, advisor, dependency, widget, route-budget, responsive/WCAG source, and production-safe E2E guards pass; CI explicitly reports—not disguises—a skipped Playwright run until an isolated paid backend is approved, and manual screen-reader/device verification remains]

Current strengths:

- 112 unit tests pass.
- 14 E2E specs cover many flows.
- Type, lint, build, widget-size, and schema checks pass.

Required improvements:

- Isolated E2E environment and deterministic cleanup.
- Contract tests for every key type/scope.
- RLS and authorization matrix tests.
- Concurrent billing-webhook idempotency test.
- Webhook secret redaction tests.
- Private attachment access tests.
- Property/fuzz tests for slug, origin, URL, custom CSS, webhook target, and upload validation.
- Full WCAG 2.2 workflow coverage.
- Mobile visual regression for the high-risk screens.
- Bundle and query-count budgets.
- Migration up/down or forward-only verification on a disposable database.
- Production smoke tests that are read-only and use synthetic monitoring—not E2E fixtures.

---

## 9. Edge-case catalogue

This is the minimum explicit acceptance matrix. Each item needs a designed UI state and, where applicable, an automated test.

### Authentication/account

[fixed: magic-link expiry/reuse/wrong-browser recovery, resend/provider failure, preserved drafts, disabled sessions, multi-tab sign-out, and durable deletion-job states are implemented and covered by UI/server tests.]

- Expired, already-used, malformed, and wrong-device magic link.
- Email delivery delay, resend limit, provider outage.
- Session expires with unsaved edits.
- User is deleted/disabled while a tab is open.
- Two tabs sign out/update settings.
- Account deletion with active subscription, queued webhooks, media, public board, and failed auth deletion.

### Project creation/settings

[fixed: validation, normalization, project limits, idempotent double-submit recovery, deletion, unsaved-change protection, and strong ETag/`If-Match` conflict recovery for simultaneous settings edits are implemented.]

- Empty/whitespace/Unicode/100+ character name.
- Duplicate name.
- Invalid/international domain.
- Project limit reached between page load and submit.
- Double submit/retry after timeout.
- Concurrent settings edits and stale overwrite.
- Delete current/last project while routes are open.

### Key lifecycle

[fixed: publishable and scoped private credentials are structurally separate, private keys are one-time reveal only, rotation/revocation/scope enforcement and audit history are implemented, and legacy embeds remain compatible.]

- Copy denied by browser.
- Secret lost after one-time reveal.
- Rotation while automation is running.
- Revoked/expired/wrong-project/wrong-scope key.
- Public key sent to private endpoint.
- Old widget embed after private rotation.
- Audit trail and last-used update without exposing source-sensitive data.

### Installation/widget

[modified: blocked/slow/duplicate scripts, CSP/origin diagnostics, tiny viewports, draft recovery, offline retry, safe image processing, URL redaction, reduced motion, and keyboard operation are covered; the extreme host-CSS/shadow-DOM/device matrix remains manual compatibility QA.]

- Script blocked, slow, duplicated, cached, or loaded after SPA navigation.
- CSP/ad blocker/origin restriction.
- Invalid project ID, deleted project, quota exceeded.
- Widget opened multiple times or on tiny viewport.
- Host page has extreme `z-index`, transforms, shadow DOM, RTL, zoom, or CSS resets.
- Offline submission/retry and accidental close.
- Screenshot permission/capture failure.
- Upload progress/cancel/timeout/unsupported/corrupt/malicious file.
- Sensitive URL/query context.
- Reduced motion and keyboard-only operation.

### Feedback ingestion

[fixed: bounded and sanitized input, UUID idempotency, project-scoped throttling, quota checks, durable routing, private media rollback, and understandable retry states are implemented.]

- Empty, maximum-length, Unicode/emoji, HTML/script, and malformed multipart content.
- Duplicate submit/retry/idempotency.
- Spam burst/shared NAT/IPv6.
- CAPTCHA provider outage: fail closed with understandable recovery.
- Monthly quota crossed concurrently.
- Feedback saved but webhook enqueue fails.
- Storage succeeds but DB insert fails, and vice versa.

### Inbox/detail

[fixed: empty/filter/deleted states, bounded large datasets, URL filters, partial bulk outcomes, safe streaming CSV, missing media, offline drafts, saving/retry, tag drift, and concurrent-tab conflict recovery are covered.]

- No projects, no feedback, filtered empty, deleted project.
- Tens of thousands of items.
- Same item edited in two tabs.
- Bulk action partially fails.
- Item disappears due to filter after status change.
- CSV export with formula injection, Unicode, timezone, and large dataset.
- Missing/deleted attachment.
- Autosave fails/offline.
- Tag rename/delete/taxonomy drift.

### Public boards

[modified: canonical slug/state/SEO handling, signed anonymous voters, anti-abuse controls, safe custom CSS, snapshot-stable cursor pagination, trust disclosures, disabled/deleted states, signed Resend events, and hashed-recipient suppression are implemented; live bounce proof and sustained spam-storm tuning require provider traffic.]

- Slug collision/reserved word/rename and redirect.
- Draft vs published vs listed/unlisted.
- Owner deletes/disables project while page is open.
- Anonymous, authenticated, duplicate, banned, and shared-IP voter.
- Submission/comment/follow confirmation email bounces.
- Spam/report storms.
- Deleted feedback with comments/votes/watches.
- Custom CSS breaks contrast/layout or tries unsafe resource loads.
- SEO/noindex/canonical behavior.
- Pagination changes while new votes/comments arrive.

### Webhooks/integrations

[modified: SSRF/redirect/DNS defenses, encrypted rotation, retry/dead-letter/replay semantics, disabled-endpoint handling, delivery diagnostics, and secret redaction are implemented; replacing PAT setup with a GitHub App is blocked on registered App credentials.]

- DNS rebinding/private address/redirect/large or slow response.
- Secret rotation.
- Provider rate limit, 4xx, 5xx, timeout, TLS/DNS failure.
- Same event delivered more than once.
- Endpoint disabled during queued retries.
- Replay after configuration changes.
- Digest timezone/DST/empty batch/large batch.
- Token lacks GitHub permission or repository is renamed/deleted.
- UI never reveals existing secret.

### Product Updates

[fixed: schedule/timezone validation, plan limits, sanitized image lifecycle, stable embed caching, idempotent analytics, content limits, accessible alt text, explicit states, and atomic stale-editor rejection across drafts, settings, publication, lifecycle, deletion, and images are implemented.]

- Schedule in past, DST ambiguity, timezone change.
- Two users/tabs publish concurrently.
- Active update plan limit crossed concurrently.
- Image upload fails/orphan cleanup.
- Include/exclude conflict.
- Archived update still cached in widget.
- Anonymous event retries inflate metrics.
- Long title/content, unsupported markup, missing alt text.

### Billing

[blocked: atomic event claiming, transition/mismatch checks, idempotency, fail-closed production checkout, and complete status UI are implemented; a controlled live transaction/webhook/portal proof requires live Dodo credentials and product configuration.]

- Checkout abandoned, duplicated, delayed.
- Webhook arrives out of order or more than once.
- Portal state changes before webhook.
- Trial/active/past due/on hold/canceled/resumed transitions.
- Currency/product/interval mismatch.
- Upgrade/downgrade at quota edge.
- Subscription exists but account link is missing.
- Payment succeeds while sync UI times out.
- Test/live product or webhook mismatch.

### Reliability/security

[modified: schema/grant checks, cron overlap protection and run logs, poison/dead-letter handling, dependency gates, credential rotation, export/deletion jobs, redaction tests, health probes, and a runbook are implemented; external alert delivery and provider-chaos exercises require an operations-provider decision.]

- Database/storage/provider partial outage.
- Service-role misconfiguration.
- RLS migration regression.
- Cron does not run or overlaps.
- Queue poison event.
- Dependency emergency.
- Credential leak and forced rotation.
- Data export/deletion request.
- Log/analytics redaction failure.

---

## 10. Landing, pricing, and revenue strategy

### 10.1 Current pricing problem

The displayed Free plan includes roughly:

- 2 projects.
- 500 monthly feedback items.
- API and MCP.
- Public boards.
- Product Updates.
- One webhook.

Pro at $19 mainly adds unlimited capacity/history, custom branding, scheduling, and more routing. That can work for high-volume users, but it gives many small teams little reason to pay and exposes expensive/support-heavy features on Free.

### 10.2 Recommended hypothesis—not an immediate pricing decree

After trust fixes and clean measurement, test:

**Free**

- 1 project.
- 100–250 feedback items/month.
- Core widget and context.
- Basic inbox.
- One public board.
- Limited recent history.
- Branded surface.
- API may be read-limited or omitted unless it demonstrably drives activation.

**Pro**

- More/unlimited projects and feedback under a fair-use policy.
- Full history/export.
- Multiple integrations/rules and delivery history.
- Updates scheduling.
- Branding removal/customization.
- Scoped API/MCP.
- Priority support or stronger operational guarantees only if support can deliver them.

**Team—later**

- Seats, roles, assignments, mentions, audit log, SSO/SCIM only after those features are built and demanded.

Do not remove features solely to manufacture pain. Find a value metric that grows with realized customer value and cost.

### 10.3 Revenue actions

1. Fix trust blockers; security claims become credible conversion assets. [fixed]
2. Instrument the clean activation funnel. [fixed]
3. Interview activated free users and churned/abandoned users. [deferred: requires a clean cohort and real participants]
4. Measure which features correlate with retention and willingness to pay. [deferred: instrumentation is fixed; a statistically useful clean cohort is required]
5. Improve first-value speed before adding acquisition. [fixed]
6. Add annual billing only after Dodo live-mode verification and honest savings math. [blocked: annual billing remains unavailable until a controlled live Dodo proof]
7. Trigger contextual upgrade prompts at demonstrated value: [modified: contextual entitlement prompts exist; expansion should follow observed limits]
   - quota approach;
   - second integration;
   - branding removal;
   - scheduling;
   - older history/export.
8. Never block the user's only copy of data without warning/export. [fixed]
9. Build lifecycle email only with consent and genuine task value. [deferred: no unsolicited lifecycle campaign was introduced]
10. Publish a transparent security/data page after the architecture matches it. [fixed]

### 10.4 Popular SaaS patterns worth adopting

- **Stripe:** visibly distinct publishable vs secret/restricted credentials, one-time live secret reveal.
- **Vercel:** incremental quick start with a short path to a deployed result and deeper reference after success. See [Vercel getting started](https://vercel.com/docs/getting-started-with-vercel).
- **Canny:** explicit public-roadmap/status semantics rather than contradictory visibility labels. See [Canny public roadmap guidance](https://help.canny.io/en/articles/3828148-public-roadmap).

Copy patterns, not visual costumes. feedbacks.dev should remain its own focused developer tool.

---

## 11. Prioritized action plan

### Phase 0 — Containment and truth (0–72 hours)

| ID | Action | Owner profile | Effort | Acceptance/impact |
|---|---|---|---:|---|
| P0-01 | Design and migrate publishable/private scoped credentials [fixed] | Backend + security | L | Public key cannot call any private API; prevents account/project compromise |
| P0-02 | Quarantine test boards and isolate environments [modified: production fixtures quarantined and production-targeting E2E fails closed; paid disposable Supabase branches await explicit recurring-cost approval] | Platform + data | M | Zero test content in production; metrics become recoverable |
| P0-03 | Upgrade vulnerable dependencies [fixed] | Full-stack/platform | M | No high/critical production advisories |
| P0-04 | Encrypt/mask integration secrets and remove bypass PATCH [fixed] | Backend + security | L | No raw secrets in API/browser/queue |
| P0-05 | Make feedback media private [fixed] | Backend + security | M | Anonymous media access fails |
| P0-06 | Verify Dodo production mode/products/webhook [blocked: code is fail-closed and idempotent; controlled live proof requires live Dodo credentials/product configuration] | Billing/platform | S | Controlled real transaction and idempotent state |
| P0-07 | Correct or temporarily remove false landing/docs claims [fixed] | Product/content | S | Public copy matches current truth |

### Phase 1 — Activation and trust (week 1–2)

| ID | Action | Effort | Acceptance/impact |
|---|---|---:|---|
| A1 | Rebuild install around immediate publishable snippet [fixed] | M | Snippet above fold desktop/mobile; copy in one action |
| A2 | Live verification diagnostics and direct inbox handoff [fixed] | M | Median signup→verified and verified→first feedback decrease |
| A3 | State-aware dashboard next action [fixed] | M | Returning users see the most valuable pending task |
| A4 | Replace tutorial catalog with real activation checklist [fixed] | M | One coherent onboarding system |
| A5 | Fix board state vocabulary and public directory contamination [fixed] | M | Draft/published/listed states never contradict |
| A6 | Privacy/security page and corrected collection disclosure [fixed] | M | Users can understand data before install |
| A7 | Clean analytics implementation with test exclusion [fixed] | M | Reliable milestone funnel and time-to-value |

### Phase 2 — UI consistency, accessibility, and performance (week 2–4)

| ID | Action | Effort | Acceptance/impact |
|---|---|---:|---|
| U1 | Semantic surface refactor across every screen [fixed] | L | Purpose-based dark hierarchy; no same-color nested-card fields |
| U2 | Consolidate panels/forms/buttons/status primitives [modified: shared primitives and tokens now cover core workflows; some domain-specific one-offs remain intentionally local] | L | Fewer one-off implementations and regressions |
| U3 | Mobile inbox/install/board/update fixes [fixed] | L | No unintended horizontal page scroll at 320px |
| U4 | WCAG 2.2 AA workflow audit and CI matrix [modified: WCAG 2.2 axe/keyboard gates are implemented; manual screen-reader certification remains] | L | Keyboard/screen-reader/axe acceptance gates |
| U5 | Route-shaped loading/empty/error/offline states [modified: complete on primary routes; exhaustive exceptional-state QA remains continuous] | M | Every primary route has recoverable state |
| U6 | Decompose large client components/lazy-load advanced UI [fixed] | L | Lower route JS and clearer ownership |
| U7 | Server-paginate and aggregate directory/comments [fixed] | L | Bounded queries and payloads |
| U8 | Motion and reduced-motion audit [fixed] | S | All animation purposeful; smooth scroll disabled when reduced |

### Phase 3 — Reliability and monetization (week 4–8)

| ID | Action | Effort | Acceptance/impact |
|---|---|---:|---|
| R1 | Atomic billing/webhook job idempotency [fixed] | M | Concurrent duplicate events produce one state transition |
| R2 | Full operational telemetry and runbooks [modified: first-party health, RUM, queue metrics, correlated logs, cron evidence, and runbooks are live; external alert/drain delivery awaits a provider decision] | L | Detect ingestion/routing/billing failures before users report |
| R3 | Contextual upgrade surfaces and annual plan test [modified: contextual surfaces are implemented; annual testing is blocked on live Dodo proof and real activated-user data] | M | Higher activated-user conversion without first-run friction |
| R4 | GitHub App integration replacing PAT [blocked: requires a registered GitHub App client ID/private key and installation flow] | L | Safer setup, clearer repo permissions |
| R5 | API scopes, key management, audit history [fixed] | L | Trustworthy automation platform |
| R6 | Retention/export/deletion lifecycle [fixed] | L | Accurate policy and reliable customer control |
| R7 | Landing narrative/proof/conversion experiments [modified: narrative, proof hierarchy, and conversion instrumentation are fixed; experiments require real traffic] | M | Measured CTA→signup→activation improvement |

### Phase 4 — Only after activation and retention evidence [deferred: intentionally gated on clean activation and retention evidence]

- First-class Linear integration.
- Team membership, roles, assignments, and mentions.
- Team billing.
- Recurring theme detection/AI assistance with transparent review.
- Deeper analytics.
- Zapier/Make.
- Native mobile SDKs only if demand exists.

---

## 12. Definition of done

The overhaul is not done when screens “look nicer.” It is done when:

### Trust and security

- Publishable and secret credentials are structurally separate. [fixed]
- No public credential authorizes private reads or writes. [fixed]
- Integration secrets are encrypted and never returned. [fixed]
- Feedback media is private. [fixed]
- No known high/critical production dependency vulnerability. [fixed]
- Cookie mutations have centralized same-origin/CSRF defense. [fixed]
- Entitlements cannot be bypassed through alternate endpoints. [fixed]

### Data and operations

- Production contains no active E2E fixtures. [fixed: historical fixtures are quarantined, excluded from product queries/analytics, and expiry-marked]
- Environments use isolated backends. [blocked: production isolation/fail-closed targeting is fixed; separate paid Supabase branches require explicit recurring-cost approval]
- E2E cannot target production. [fixed]
- Billing/webhook processing is atomic and idempotent. [fixed]
- Ingestion, queue, billing, and public-page SLOs are monitored. [modified: first-party health/RUM/queue monitoring is live; external alert delivery awaits a provider decision]

### Activation

- A new developer reaches a visible snippet without creating a secret. [fixed]
- Install and verification are usable at 320px without hunting below multiple panels. [fixed]
- Verification explains failure and links directly to the received test item. [fixed]
- Clean analytics measure median/p90 time to first feedback. [fixed: privacy-safe milestone events and test exclusion are implemented; useful production percentiles require real traffic]

### UI/UX

- Every surface token has a documented role and is used consistently. [fixed]
- No primary screen has unintended horizontal page scroll. [fixed: automated 320px workflow coverage]
- One primary action per task region. [fixed]
- Every async action has loading, success, failure, and retry behavior. [modified: primary task workflows are covered; this remains an ongoing regression requirement for future features]
- Every route has loading, empty, filtered-empty, error, and permission/plan states. [modified: primary product routes are covered; exhaustive exceptional-state QA remains continuous]
- No contradictory status language. [fixed]

### Accessibility

- Primary workflows meet WCAG 2.2 AA. [modified: automated WCAG 2.2 axe scans at moderate+ and keyboard semantics pass; manual assistive-technology certification remains]
- Keyboard-only and screen-reader tests pass. [modified: keyboard and automated accessibility tests pass; manual screen-reader testing remains]
- Focus is never obscured. [fixed]
- Status does not rely on color. [fixed]
- Reduced motion disables nonessential motion and smooth scrolling. [fixed]

### Performance

- Public directory and comments use bounded, snapshot-stable cursor queries. [fixed]
- Route and widget bundle budgets run in CI. [fixed]
- Core Web Vitals are measured at the 75th percentile. [fixed: Vercel Analytics and Speed Insights are mounted; stable production percentiles require traffic]
- No nested scroll traps on primary workflows. [fixed]

### Commercial readiness

- Live Dodo transaction, webhook, sync, and portal flow are verified. [blocked: live Dodo credentials and product/webhook configuration are required; production checkout fails closed until then]
- Plan entitlements are enforced server-side. [fixed]
- Marketing/docs claims match implementation. [fixed]
- Pricing experiments are based on activated-user data, not guesses. [deferred: instrumentation is ready; no unsupported pricing experiment was launched before clean cohort evidence]

---

## 13. What not to do

- Do not “fix dark mode” by blindly alternating lighter boxes.
- Do not add more dashboard cards to solve missing hierarchy.
- Do not put every feature into the first-run flow.
- Do not build team/AI features while credentials and production data are unsafe.
- Do not trust activation metrics polluted by tests.
- Do not call a public project key private.
- Do not expose stored secrets so users can edit them.
- Do not run E2E against a shared production backend.
- Do not delete indexes solely because an advisor says unused.
- Do not sell security, privacy, or unlimited promises that the implementation cannot prove.
- Do not interpret a passing build as product readiness.

---

## 14. Recommended immediate sequence

1. Pause public-board discovery and paid acquisition. [fixed: contaminated discovery entries are unpublished/unlisted and no paid acquisition was started]
2. Quarantine test boards and lock E2E away from production. [fixed]
3. Implement the two-key model and rotate exposed server credentials. [fixed]
4. Encrypt/migrate integration secrets and privatize feedback media. [fixed]
5. Upgrade vulnerable dependencies. [fixed]
6. Verify Dodo live mode with one controlled end-to-end transaction. [blocked: requires live Dodo credentials/product/webhook configuration]
7. Correct public claims. [fixed]
8. Rebuild install/verify and the mobile inbox. [fixed]
9. Apply semantic surfaces and UI primitives across all screens. [fixed]
10. Add clean funnel, reliability, accessibility, and performance gates. [modified: automated and first-party gates are live; external alerts and manual assistive-technology QA remain]
11. Only then test pricing, annual billing, and acquisition. [deferred: deliberately waiting for clean activated-user evidence and live Dodo proof]

This order is intentionally trust-first. A premium experience is not a color palette; it is the feeling that the product is clear, predictable, secure, fast, and honest at every step.

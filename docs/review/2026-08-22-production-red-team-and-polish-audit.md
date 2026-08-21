# Production red-team and polish audit, 22 August 2026

## Scope

This pass treated product completeness, acquisition, security, and launch operations as separate release gates. It reviewed the current source, live Supabase schema and advisors, local and production HTTP behavior, and the public landing and Founding Beta flows.

The testing was authorized, bounded, non-destructive, and deliberately avoided credential guessing, load generation, customer data access, and destructive production actions.

## Product completeness result

The core product is substantially complete. Project creation, the stable widget install, remote form configuration, contextual feedback, inbox triage, public boards, product updates, outbound integrations, billing state, REST, MCP, referrals, and lifecycle controls all have implementation and test coverage.

The material incomplete surface was acquisition:

1. The interactive homepage hero demonstrated the widget but did not state the complete product promise in plain language.
2. `/early-access` was a newsletter signup, not an application for limited beta access.
3. The beta path was hidden in the footer, which made campaign intent unclear.

These are fixed. The homepage now explains the product in the first viewport and presents two honest paths:

- Start Free: open account creation, no application, no waiting, no card.
- Founding Beta: a short application for a small hands-on cohort.

The beta is an added service level, not artificial scarcity around the usable product.

## Threat model and probes

The pass focused on practical threats for a hosted developer tool:

- cross-site requests against cookie-authenticated mutations;
- unauthenticated access to internal and cron operations;
- leaked or directly readable beta and marketing records;
- unbounded request bodies and public log-flooding surfaces;
- secret comparison and credential handling;
- SSRF through webhook destinations;
- client exposure of service-role credentials;
- stored or reflected HTML/script content;
- dependency and supply-chain vulnerabilities;
- CSP, clickjacking, MIME sniffing, and browser-permission boundaries;
- RLS and Data API exposure after the new schema change.

Representative live and local probes confirmed:

- protected mutation without an allowed Origin returns `403 invalid_origin`;
- a hostile Origin against the marketing lead route returns `403 invalid_origin`;
- internal job processing without its bearer credential returns `401`;
- an invalid cron bearer credential returns `401`;
- a 70 KB beta payload returns `413 request_too_large` before application processing;
- invalid beta enumerations return field-scoped `400` errors and are not written;
- invalid CSP report JSON returns `204` without reflecting the payload;
- production emits nonce-based CSP, `frame-ancestors 'none'`, `object-src 'none'`, HSTS, `nosniff`, `DENY`, and a restrictive Permissions Policy;
- no production dependency vulnerability is currently reported by `pnpm audit --prod`.

## Findings and remediation

### P1: Founding Beta data needed a real access boundary

Status: fixed and live.

The new `beta_applications` table is server-written only. Live verification shows:

- RLS enabled;
- `anon` SELECT and INSERT: false;
- `authenticated` SELECT and INSERT: false;
- `service_role` SELECT and INSERT: true;
- a restrictive deny policy for browser roles;
- bounded use-case, stage, timeline, current-tool, and status values.

### P2: Public CSP reporting could be used for log flooding

Status: fixed.

The endpoint already had a 32 KB body cap and origin redaction, but an attacker could still generate unlimited warning entries. It now applies an IP-derived server rate limit before parsing or logging and silently returns `204` when the budget is exhausted.

### P2: Internal bearer checks used ordinary string equality

Status: fixed.

Cron, health, billing lifecycle, account deletion, and internal webhook-job routes now share a constant-time bearer verifier. Missing, malformed, wrong-length, and incorrect credentials fail closed.

### P3: Framework identification header was unnecessary

Status: fixed.

`X-Powered-By` is disabled. This is defense in depth rather than a primary security boundary.

### P2: Supabase leaked-password protection remains disabled

Status: external setting remains.

The live Supabase security advisor reports one warning: leaked password protection is disabled. Enable it in Supabase Auth when supported by the account plan. This cannot be corrected through repository SQL. See [Supabase password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

### Accepted performance notices

The performance advisor reports information-only notices for read-only quarantine snapshots without primary keys and indexes that have not yet accumulated usage. Removing those indexes before sustained production traffic would be speculative and may harm infrequent operational paths, so they remain unchanged.

## Verification evidence

- Unit tests: 217 passing.
- TypeScript: passing across all packages.
- ESLint: passing.
- Full `pnpm ci:verify`: passing, including the optimized production build, 17,626-byte gzip widget budget, and all 36 dashboard route budgets.
- Production dependency audit: no known vulnerabilities.
- Live schema contract: passing, including the new beta table.
- Live security advisor after migration: one external Auth warning, no table or RLS error.
- Local browser: homepage and beta application render without console errors or horizontal overflow at desktop and 390 px mobile widths.
- Production browser smoke: public acquisition, auth, documentation, and widget-fallback checks pass. The optional-ad-provider test is skipped when those providers are not configured in the test process.
- Local hostile request probes: expected 400, 401, 403, 413, and 204 outcomes.
- Production hostile request probes: expected 401 and 403 outcomes, with no mutation.
- Production deployment `dpl_4QaQWDFBm6Vnu5KwFbRCjW8eafQa` for commit `1ed713d` reached Ready and serves the canonical marketing and app aliases. Canonical homepage, Founding Beta, privacy, auth, and widget assets return 200; the post-deploy scan found no error-level or 5xx runtime logs.

## Residual release risks

1. Dodo Payments is intentionally still in test mode. Production credentials and the live webhook are the final billing gate.
2. Leaked-password protection should be enabled in Supabase Auth when the plan permits.
3. The data-mutating Playwright acceptance suite requires a dedicated non-production E2E Supabase project and therefore remains skipped in this local environment; the required environment guard correctly forbids using production Supabase for it.
4. Real campaign volume should be increased only after the first-feedback activation funnel is measured reliably.

## Security operating rule

Repeat this bounded pass before major releases and after any schema, authentication, billing, public-submission, or webhook change. Run dependency checks on every release and Supabase advisors after every DDL change.

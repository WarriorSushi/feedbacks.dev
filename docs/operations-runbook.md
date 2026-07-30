# feedbacks.dev operations runbook

Last verified: 2026-07-30

This runbook is for production incidents. Protect customer data first, preserve evidence, communicate
plainly, and prefer reversible containment. Record the incident start, request/deployment IDs, affected
projects, decisions, and recovery checks. Never paste credentials or customer feedback into tickets or
chat.

## Baseline signals

- Vercel Runtime Logs receive structured JSON events with `event`, `requestId`, and bounded metadata.
- `/api/internal/health` is authenticated with `CRON_SECRET` and returns cron freshness, webhook
  backlog/failures, billing failures/stale claims, deletion failures, production activation counts, and
  published-board count.
- Vercel Web Analytics measures page-level acquisition without application customer payloads.
- Vercel Speed Insights measures route/device Core Web Vitals. Review p75 LCP, INP, and CLS.
- `cron_runs`, `webhook_jobs`, `webhook_deliveries`, `billing_events`,
  `account_deletion_jobs`, `project_api_key_events`, `integration_secret_events`, and
  `feedback_activity` provide durable operational evidence.

Healthy launch thresholds:

- no stale or failed required cron;
- webhook backlog under 100 and fewer than 20 failures in 24 hours;
- zero failed billing events and zero billing claims processing for more than five minutes;
- zero failed or blocked deletion jobs;
- no high/critical production dependency advisory;
- no unexpected increase in widget submission failures or p75 public-page latency.

## Credential or key leak

1. Identify the credential class without logging the value: publishable `fb_pub_…`, private
   `fb_live_…`, integration secret, Supabase/Vercel/Dodo/email credential, or encryption key.
2. Contain:
   - publishable keys are not private; verify they cannot call private APIs;
   - revoke/rotate a private API key from API & MCP;
   - replace/revoke the affected integration endpoint secret;
   - rotate infrastructure credentials in the provider and every scoped Vercel environment.
3. If the integration-encryption key leaked, run the documented re-encryption script and invalidate the
   old key only after every row verifies under the new key.
4. Search structured logs, audit tables, and provider logs by suffix/reference and time window. Never
   search by printing a whole secret.
5. Verify negative authorization, widget continuity after private rotation, and one trusted private API
   request.
6. Notify affected customers if access or disclosure is plausible; state facts, timeframe, containment,
   and required customer action.

## Public data or media exposure

1. Disable the affected board or route discovery while preserving the project record.
2. Confirm screenshot and attachment buckets are private. Test anonymous and cross-project download
   rejection through the authenticated media route.
3. Invalidate any affected signed URL, remove unsafe cached output, and inspect access logs.
4. Confirm the record’s project owner, storage registry, hash, scan status, and deletion state.
5. Restore only after a production smoke proves owner access succeeds and anonymous access fails.
6. Document the exposed fields and retention/removal outcome; initiate customer/legal notification when
   required.

## Feedback ingestion outage

1. Check `/api/internal/health`, Vercel errors, Supabase health, current deployment, and rate-limit spikes.
2. Test widget bootstrap with a known publishable key, then a minimal text-only submission. Do not use
   E2E bypass or production fixtures.
3. Separate bootstrap, upload, database insert, quota, CAPTCHA, and notification failures.
4. If the current deployment caused the outage, roll back to the last verified version.
5. Keep feedback persistence ahead of notifications/routing; a downstream outage must not discard an
   accepted feedback record.
6. Verify one submission, inbox visibility, usage increment, and delivery enqueue before closing.

## Webhook delivery outage

1. Inspect queue depth, oldest `next_attempt_at`, recent failure classes, endpoint health, and cron
   freshness.
2. Distinguish provider throttling, DNS/TLS, timeout, private-address/redirect rejection, bad credentials,
   and payload rejection.
3. Disable only the failing endpoint when repeated failures risk amplification. Preserve other routes.
4. Fix or replace the endpoint, send a test, then replay a bounded failed delivery.
5. Confirm retry count, redacted destination, final response class, and queue drain. Never place endpoint
   secrets in a replay job.

## Billing drift or webhook failure

1. Confirm Dodo environment, product ID, webhook endpoint, signature verification, event ID, occurrence
   time, and customer/subscription linkage.
2. Inspect `billing_events` status, claim token age, attempt count, and processing error. Do not edit a
   processed event into a second transition.
3. Re-fetch provider state using a trusted server credential. Treat provider state as authoritative, then
   reconcile through the same idempotent application path.
4. Verify plan, billing status, amount/currency/interval, period dates, cancel-at-period-end, and portal
   access.
5. A real production launch requires one controlled live checkout, signed webhook, durable sync, and
   portal round trip. Test-mode success is not production verification.

## Abusive public board

1. Review open reports, rate-limit signals, new submissions/comments/votes, and the affected project.
2. Disable submissions or unpublish the board if harm is ongoing; keep evidence and owner access.
3. Moderate the target, ban/restrict only through a documented identifier, and avoid blocking a shared
   network without corroborating signals.
4. For recurring abuse, tighten board-scoped limits before adding CAPTCHA. Provide a recoverable,
   accessible user message.
5. Restore publication only after owner review and a signed-out/signed-in submission, vote, comment,
   report, and pagination smoke.

## Account deletion failure

1. Inspect `account_deletion_jobs` status, attempt count, lock age, next attempt, and safe error.
2. Active billing blocks deletion; cancel/resolve billing first and record the customer-visible reason.
3. Retry the idempotent worker. It must clean private media, product-update images, project data, billing
   artifacts, and Auth without relying on a still-valid browser session.
4. Verify no owned project, storage registry/object, or auth user remains. Keep only legally required,
   minimized operational evidence.

## Dependency emergency

1. Confirm the advisory against the locked production dependency tree and official upstream guidance.
2. Assess reachable code, runtime, public input, and compensating controls.
3. Patch and run production audit, unit/type/lint/build, widget size, schema checks, and targeted browser
   smoke.
4. If no patch exists, document owner, exploitability, control, and expiry; disable the reachable feature
   when risk is unacceptable.

## Incident closure

- Restore every temporarily disabled surface intentionally.
- Run the smallest complete customer journey that covers the incident.
- Check early production runtime errors and Speed Insights after deployment.
- Record root cause, detection gap, customer impact, remediation, owner, and follow-up date.
- Update this runbook and an automated guard whenever the incident exposed a missing check.

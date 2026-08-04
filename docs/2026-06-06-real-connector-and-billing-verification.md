# Real Connector And Billing Verification - 6th June 2026

## Purpose

This is the execution checklist for Step 3 of `docs/2026-06-05-launch-hardening-plan.md`.

The local automated Playwright suite proves the connector code paths with local test targets. This runbook proves the same surfaces against real external services:

- Slack incoming webhooks
- Discord webhooks
- generic HTTPS webhooks
- GitHub Issues
- Dodo Payments checkout and webhooks
- Free/Pro entitlement behavior

## Current Status

Connector credentials were provided locally on 14 June 2026 and used for a real external smoke pass.

Verified on 14 June 2026:

- Slack dummy feedback event delivered with HTTP `200`; user manually confirmed the Slack test message.
- Discord dummy feedback event delivered with HTTP `204`; user manually confirmed the Discord test message.
- Generic HTTPS dummy feedback event delivered with HTTP `200`.
- Generic webhook HMAC verified locally using the exact raw JSON request body and `X-Feedbacks-Signature: v1=<hmac-sha256-hex>`.
- GitHub Issues dummy feedback event created an issue with HTTP `201`; user manually confirmed the GitHub issue.
- No connector secret values were printed, committed, or hard-coded.
- Test credentials were read from local `.env.local` only and are not intended for production use.

Verified on 23 June 2026 during authenticated production smoke:

- Dashboard delivery-history verification and replay for Slack, Discord, generic webhooks, and GitHub against hosted production routes.
- Generic webhook digest delivery through the scheduled webhook jobs cron route.
- Server-side Pro entitlement behavior for connector caps using the disposable smoke account.

Verified after this original runbook was written:

- Dodo test checkout returns to the hosted billing page.
- Dodo Standard Webhooks signature verification accepts valid current events and rejects invalid, stale, and too-far-future events.
- Free/Pro entitlement behavior is driven by verified webhook state rather than the browser return.

The only remaining billing step is the intentional production go-live decision with production Dodo credentials.

Production connector model:

- Production connector credentials are stored per project in `projects.webhooks`.
- Generic webhook signing secrets are endpoint-level configuration.
- The product is not designed around one shared global Slack, Discord, generic webhook, or GitHub credential for all customers.

Previous blocked status before the 14 June connector smoke pass:

Local `.env.local` had Supabase, captcha, app origin, and local salts/secrets. It did not include real connector or Dodo credentials.

Because of that, true Step 3 verification is blocked until these credentials are provided:

- `DODO_PAYMENTS_API_KEY`
- `DODO_PAYMENTS_PRO_MONTHLY_PRODUCT_ID`
- `DODO_PAYMENTS_WEBHOOK_SECRET`
- real Slack incoming webhook URL
- real Discord webhook URL
- real HTTPS generic webhook inspection URL
- GitHub test repo and GitHub token with issue creation permission

The app itself does not read the `REAL_*` variables. They are optional local placeholders for the human/operator running this checklist.

## Historical Deferred Status On 6th June 2026

This section records the state on 6 June 2026. The connector and Dodo test-mode checks listed here were completed later in June and are summarized above.

What is skipped:

- real Slack incoming webhook delivery and replay
- real Discord webhook delivery and replay
- real generic HTTPS webhook delivery and replay
- real GitHub Issues creation and replay
- Dodo sandbox or staging checkout
- real Dodo webhook signature verification
- Free/Pro entitlement verification driven by real Dodo webhook state

Reminder trigger:

- before calling connectors production-ready
- before calling billing production-ready
- before public launch
- before doing final Step 5 MCP and UI polish signoff

Do not mark Step 3 complete until evidence is added to this runbook using the evidence template below.

## Preflight

1. Start from a clean git state or only intentional docs changes.
2. Fill `packages/dashboard/.env.local` with the required Supabase variables.
3. Add optional verification secrets locally:

```env
DODO_PAYMENTS_ENVIRONMENT=test
DODO_PAYMENTS_API_KEY=...
DODO_PAYMENTS_PRO_MONTHLY_PRODUCT_ID=...
DODO_PAYMENTS_PRO_YEARLY_PRODUCT_ID=...
DODO_PAYMENTS_WEBHOOK_SECRET=...

REAL_SLACK_WEBHOOK_URL=...
REAL_DISCORD_WEBHOOK_URL=...
REAL_GENERIC_WEBHOOK_URL=...
REAL_GITHUB_ISSUES_REPO=owner/repo
REAL_GITHUB_TOKEN=...
```

4. Run the baseline before real external calls:

```powershell
pnpm test:unit
pnpm type-check
pnpm lint
pnpm test:e2e:required
```

5. Start the local app:

```powershell
pnpm dev
```

6. Sign in with the normal local account or the E2E test session if this is an internal verification run.

## Slack Verification

Goal: prove Slack delivery, log writing, and replay.

Steps:

1. Create or open a test project.
2. Open `Projects -> Integrations`.
3. Add a Slack endpoint.
4. Paste `REAL_SLACK_WEBHOOK_URL`.
5. Save integrations.
6. Click `Send test`.
7. Confirm the Slack channel receives a message.
8. Confirm Recent delivery history shows:
   - status: `Delivered`
   - kind: `slack`
   - event: `feedback.test`
   - HTTP status: `200`
9. Click `Resend`.
10. Confirm Slack receives the replayed message and the log shows another successful delivery.

Pass condition:

- Slack receives both initial test and replay.
- Dashboard delivery history records both as successful.

Failure evidence to capture:

- endpoint URL domain only, never the secret path
- delivery status code
- response body snippet
- browser console error, if any
- server log error, if any

## Discord Verification

Goal: prove Discord delivery, log writing, and replay.

Steps:

1. Add a Discord endpoint.
2. Paste `REAL_DISCORD_WEBHOOK_URL`.
3. Save integrations.
4. Click `Send test`.
5. Confirm the Discord channel receives a message.
6. Confirm delivery history shows a successful `discord` delivery.
7. Click `Resend`.
8. Confirm a second Discord message and successful replay log.

Pass condition:

- Discord receives both initial test and replay.
- Dashboard delivery history records both as successful.

## Generic HTTPS Webhook Verification

Goal: prove raw generic payload delivery and replay.

Recommended target:

- a private webhook.site URL
- a small HTTPS test endpoint you control
- any equivalent HTTPS request inspection endpoint

Steps:

1. Add a Generic Webhook endpoint.
2. Paste `REAL_GENERIC_WEBHOOK_URL`.
3. Optionally set a signing secret for this endpoint.
4. Save integrations.
5. Click `Send test`.
6. Confirm the inspection endpoint receives JSON with:
   - `event`
   - `feedback`
   - `project`
   - `timestamp`
7. If a signing secret was set, confirm the request includes:
   - `X-Feedbacks-Timestamp`
   - `X-Feedbacks-Signature`
8. Confirm the signature verifies against `<timestamp>.<raw request body>` using HMAC-SHA256.
9. Confirm delivery history shows a successful `generic` delivery.
10. Click `Resend`.
11. Confirm a second received request and successful replay log.

Pass condition:

- The received payload matches `WebhookPayload` from `packages/dashboard/src/lib/webhook-delivery.ts`.
- Optional signing headers verify when a signing secret is configured.
- Delivery log and replay are both successful.

Security check:

- Verify non-HTTPS/private URLs are rejected or logged as blocked. Do not loosen the SSRF protection for real connector tests.

## GitHub Issues Verification

Goal: prove GitHub issue creation and replay.

Preparation:

1. Create a private or throwaway repo.
2. Create a fine-grained GitHub token that can create issues in that repo.
3. Store the repo as `REAL_GITHUB_ISSUES_REPO`.
4. Store the token as `REAL_GITHUB_TOKEN`.

Steps:

1. Add a GitHub Issues endpoint.
2. Set Repository to `REAL_GITHUB_ISSUES_REPO`.
3. Set Token to `REAL_GITHUB_TOKEN`.
4. Save integrations.
5. Click `Send test`.
6. Confirm a GitHub issue is created.
7. Confirm:
   - title includes feedback type
   - body includes project name and feedback text
   - labels include feedback type when available
8. Confirm delivery history shows a successful `github` delivery.
9. Click `Resend`.
10. Confirm a second issue or replay behavior expected by the implementation.

Pass condition:

- GitHub receives a created issue from both initial send and replay.
- Delivery history records both.

Security check:

- Token must never appear in page text, delivery logs, screenshots, or committed files.

## Dodo Payments Verification

Goal: prove checkout, verified webhook handling, replay rejection, and entitlement truth.

Useful source:

- Dodo webhooks docs: `https://docs.dodopayments.com/developer-resources/webhooks`
- Dodo CLI docs: `https://docs.dodopayments.com/developer-resources/sdks/cli`

Important implementation note:

- Dodo documents Standard Webhooks headers:
  - `webhook-id`
  - `webhook-signature`
  - `webhook-timestamp`
- Their manual verification flow builds the signed message from `webhook-id`, `webhook-timestamp`, and the exact raw payload, separated by periods.
- `webhook-timestamp` is documented as a Unix timestamp in seconds.
- Our implementation accepts the Standard Webhooks `v1,<base64-signature>` format and the earlier internal hex-HMAC test format.
- Our implementation also accepts milliseconds for timestamp compatibility, but real Dodo events should be verified against seconds.

Steps:

1. Add Dodo env vars:

```env
DODO_PAYMENTS_ENVIRONMENT=test
DODO_PAYMENTS_API_KEY=...
DODO_PAYMENTS_PRO_MONTHLY_PRODUCT_ID=...
DODO_PAYMENTS_PRO_YEARLY_PRODUCT_ID=...
DODO_PAYMENTS_WEBHOOK_SECRET=...
```

2. Start the local app.
3. Use Dodo dashboard webhook testing or Dodo CLI forwarding to send a test event to:

```text
{NEXT_PUBLIC_APP_ORIGIN}/api/billing/webhook
```

4. Confirm the route returns a `2xx` for a valid current webhook.
5. Confirm an invalid signature returns a rejection.
6. Confirm a stale timestamp older than 5 minutes is rejected.
7. Confirm a too-far-future timestamp is rejected.
8. Run checkout from `/billing`.
9. Confirm checkout returns to `/billing`.
10. Confirm plan changes only after webhook-backed billing state updates.

Pass condition:

- Real or dashboard-forwarded Dodo event passes signature verification.
- Stale/future replay attempts fail.
- Entitlements are updated only from verified webhook state.

Risk to watch:

- Real Dodo events still need to be verified against the dashboard or CLI sender before production billing is enabled.

## Entitlement Verification

Goal: prove paid gates are server-side.

Free plan checks:

1. Force or create a Free account state.
2. Open integrations.
3. Confirm Slack, Discord, GitHub Issues, and generic webhooks are visible.
4. Confirm one active endpoint can be configured and any additional active endpoint is rejected server-side.
5. Confirm delivery logs are fetched with the Free history cap.
6. Call `/api/v1/feedback` with an API key.
7. Confirm MCP/API access works within Free project, feedback, and history limits.

Pro plan checks:

1. Force or create a Pro account state through verified Dodo webhook state.
2. Confirm integrations work without the Free endpoint cap.
3. Confirm webhook test sends work.
4. Confirm MCP/API access works without the Free history cap.

Pass condition:

- Browser UI and server routes agree.
- Browser redirect alone does not grant paid features.

## Evidence Template

Use this template for each connector.

```md
### Connector

- Date:
- Environment:
- Project:
- Endpoint kind:
- Secret source:
- Initial test result:
- Replay result:
- Delivery log IDs:
- External proof:
- Notes:
```

Do not paste full secret URLs, GitHub tokens, Dodo API keys, or webhook secrets into notes.

## What To Do After Verification

If all connector and billing checks pass:

1. Update `docs/2026-06-05-launch-hardening-plan.md` Step 3 status.
2. Move to Step 4: domain/docs/security hardening.
3. Keep optional generic webhook signing covered in docs and tests.

If any connector fails:

1. Capture exact error and response code.
2. Add or update a focused regression test if the failure is product-side.
3. Fix the smallest product path.
4. Re-run only that connector, then the full E2E suite.

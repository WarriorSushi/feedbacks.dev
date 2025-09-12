# Webhooks & Digests

This doc complements the README and focuses on configuration details for Slack, Discord, and Generic webhooks.

## Events

Per endpoint you can choose which events to receive:

- created: fires immediately on new feedbacks
- updated: fires on feedbacks update (mark read/unread, tag changes, archive)
- digest: hourly summary (requires the GitHub Actions cron to be enabled)

## Rules (filters)

Optional filters to control which feedback triggers an endpoint:

- ratingMax: only send if rating ≤ N
- types: only send for these types (bug, idea, praise)
- tagsInclude: only send if feedback contains any of these tags

## Rate limiting

Per endpoint rate limit (per minute). Use 0 or blank for unlimited. Rate limiting applies only to immediate events.

## Redaction (Generic only)

Choose to remove `email` and/or `url` from the Generic JSON payloads before sending. Useful when forwarding to systems that must not store PII or URLs.

## Signing (Generic only)

If a secret is configured on the endpoint, requests include:

- `X-Feedbacks-Timestamp`: unix seconds
- `X-Feedbacks-Signature`: hex HMAC‑SHA256 of `<timestamp>.<body>` using the secret

Receivers should verify timestamp freshness and HMAC.

## Slack formatting

Two modes per endpoint:

- rich (default): Block Kit attachments with colored accents and fields (type/rating/tags) and “View” links
- compact: single‑line text with a link to the feedback

Colors by type: bug (red), idea (blue), praise (green), otherwise neutral.

## Discord formatting

Two modes per endpoint:

- rich (default): embed with color, fields, and link
- compact: single content line with a direct link

Colors by type follow Slack semantics.

## Digests

Hourly digests summarize counts for the last hour and add type icons. You can enable compact mode to send shorter messages.

## Where to find things

- UI: `packages/dashboard/src/components/project-integrations.tsx`
- Immediate delivery: `packages/dashboard/src/app/api/feedback/route.ts`
- Digest runner: `packages/dashboard/src/app/api/webhooks/digest/route.ts`
- Logs API: `packages/dashboard/src/app/api/projects/[id]/webhooks/logs/route.ts`

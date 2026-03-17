# feedbacks.dev v2 — Feature Review

**Reviewer:** Claude Code agent
**Date:** 2026-03-17
**Branch:** full-ass
**Scope:** Full product audit — landing claims vs actual implementation

---

## Executive Summary

The v2 rebuild is substantially complete for its core flows. Widget submission, feedback inbox, status management, public board with voting, and the AI agent API all work end-to-end. The biggest gaps are: account deletion is fake (signs out rather than deletes), email notifications are wired to a checkbox that saves nothing, the webhook delivery log has a schema mismatch that will silently fail, project deletion does not protect against orphaned data client-side, and the `widget_configs` table is maintained in migrations but never used by the dashboard UI. Nothing is outright broken for a first-time user, but several advertised features are hollow stubs.

---

## 1. Feature Gaps — Advertised vs Implemented

### Landing page claims

| Claim | Status |
|-------|--------|
| "Under 10KB" widget | PARTIAL — widget claims <20KB in CLAUDE.md; landing says "Under 10KB". No bundle size measurement visible. |
| "Public voting boards" | WORKS |
| "MCP / AI agents" | WORKS — all 5 tools present and wired to real API endpoints |
| "One script tag. 30 seconds." | WORKS — install tab generates correct snippet |
| "Real-time inbox" | FALSE — inbox uses polling (Supabase client query on mount), not Realtime subscriptions. No live push. |
| Free tier: "30-day history" | NOT ENFORCED — no code anywhere enforces a 30-day history cutoff. All feedback is returned. |
| Free tier: "1 project" | NOT ENFORCED — no tier checks anywhere in project creation or API. |
| Free tier: "500 feedback / month" | NOT ENFORCED — same, no limit checks. |
| Pro: "Custom widget branding" | PARTIAL — color, button text, position are saved to `projects.settings.widget_config`. The widget reads config from `data-project` key but does NOT fetch per-project config from the API at runtime. The widget uses whatever config was passed at initialization. No API endpoint serves widget config by project key. |
| Pro: "Webhook integrations" | PARTIAL — see §8. |
| "No usage-based traps" / pricing | No billing integration exists. Pricing page is static text with no Stripe or subscription management. |

---

## 2. Onboarding Flow

**Mental walkthrough: sign-up → install → see feedback → respond**

1. **Sign up** (`/auth`): Magic link and GitHub OAuth both wired correctly. Auth callback route at `app/auth/callback/route.ts` exists. PASS.

2. **Create project** (`/projects/new`): Works. API key is generated client-side using `crypto.randomUUID()` rather than the `generate_api_key()` DB function, producing a `fb_` + 24-char UUID fragment instead of `fb_` + 40-char hex. The formats differ but are functionally fine.

3. **Install widget** (project → Install tab): Code snippet is correct. React/Vue tabs show `@feedbacks/widget` npm import which does not exist as a published package — only a CDN script tag actually works.

4. **Submit feedback**: Widget POSTs to `/api/feedback` which validates, stores, and fires webhooks. PASS.

5. **See feedback** (`/feedback`): Client-side Supabase query, paginated, filterable. PASS.

6. **Respond**: Status change via dropdown on detail page (`feedback-actions.tsx`). Internal notes via text area. Both write to Supabase. PASS.

**Gap:** No email notification is actually sent when new feedback arrives. The `emailNotifs` checkbox in settings never persists its value (see §9). The `user_settings` table and `NotificationSettings` type exist but nothing writes to `user_settings` and no email sending code exists anywhere in the codebase.

---

## 3. Widget Feature Completeness

The widget (`packages/widget/src/widget.ts`) is well-implemented.

| Feature | Status |
|---------|--------|
| Modal mode | WORKS |
| Inline mode | WORKS |
| Trigger mode | WORKS — attaches to `[data-feedbacks-trigger]` or custom selector |
| Type picker (bug/idea/praise) | WORKS — note: widget has 3 types; API supports 4 (includes "question"). Question is not offered in widget UI. |
| Rating (1–5 stars) | WORKS |
| Screenshot capture | WORKS — dynamically loads html2canvas, hides overlay, captures, uploads as base64 |
| Attachment upload | WORKS — file validation, size check, Supabase Storage upload |
| Captcha (Turnstile / hcaptcha) | IMPLEMENTED — code present; keys must be configured via env vars |
| Keyboard shortcut (`openOnKey`) | WORKS |
| Auto-open (`openAfterMs`) | WORKS |
| Retry on failure (3 attempts) | WORKS |
| Focus trap / accessibility | WORKS |
| Honeypot spam filter | WORKS — both widget-side and server-side |
| Custom colors, position, text | WORKS at initialization time |

**Gap (HIGH):** The widget hard-codes its API URL to `https://app.feedbacks.dev/api/feedback`. For self-hosted deployments, `apiUrl` in config can override this, but the Install tab snippet does not show `data-api-url`. A self-hoster following the docs will submit feedback to the wrong endpoint.

**Gap (MEDIUM):** The widget does not fetch per-project config from the server. Customizations saved in the dashboard Customize tab (color, title, etc.) only apply if the integrating developer manually re-reads them and passes them as init options. The "Live preview" mockup on the landing page suggests live config sync but it does not exist.

---

## 4. Dashboard Completeness

| Capability | Status |
|-----------|--------|
| View feedback list | WORKS — pagination, search, status/type filter |
| Bulk status update | WORKS — floating action bar |
| View feedback detail | WORKS — screenshot, attachments, metadata, timeline |
| Change status | WORKS |
| Add internal note | WORKS |
| Archive feedback | NOT PRESENT — `is_archived` field exists in DB and is filtered out of queries, but no UI to archive individual items exists |
| Delete feedback | NOT PRESENT — no delete action in dashboard |
| Export CSV | WORKS — `GET /api/projects/[id]/feedback.csv` is implemented and correct. But there is no button in the UI to trigger it. Users must construct the URL manually. |
| Filtering by agent | PARTIAL — dashboard Quick Actions links to `/feedback?agent=1` but the inbox page does not handle the `agent` query param; it only handles `status`, `type`, and `q`. The filter silently does nothing. |
| Project management | WORKS |
| Project settings (name, domain) | WORKS |

---

## 5. Public Board

The public board (`/p/[slug]`) is functionally complete.

| Feature | Status |
|---------|--------|
| Display feedback sorted by votes | WORKS |
| Sort by newest / status | WORKS |
| Filter by type | WORKS |
| Upvote / toggle vote | WORKS — IP-hashed anonymous voting, stored in `votes` table, triggers update `vote_count` |
| Submit new feedback | WORKS — rate limited at 5 per 5 minutes |
| Success toast | WORKS |
| Board enable/disable toggle | WORKS |
| Custom slug, title, description | WORKS |
| Branding / custom CSS | DB columns exist (`branding`, `custom_css`); board settings UI exposes title/description/slug/types but not `custom_css` or `branding.accent_color`. The public board does read `branding.accent_color` for the submit button. Config gap only. |

**Critical gap:** Board submissions go into `feedback` with `is_public = true`, but widget submissions from `/api/feedback` do NOT set `is_public = true` (it is `null` or absent in the insert). Only board-submitted feedback appears on the public board. Users have no way to promote widget feedback to the board through the dashboard UI.

---

## 6. AI Agent API

All documented routes are implemented:

- `GET /api/v1/feedback` — paginated, filterable. WORKS.
- `POST /api/v1/feedback` — full agent submission with `structured_data`, `agent_name`, `agent_session_id`. WORKS.
- `GET /api/v1/projects` — returns project(s) scoped to API key. WORKS.
- `GET /api/v1/projects/[id]` — stats with fallback on missing `count_by_column` RPC. WORKS, but `feedbackByType` / `feedbackByStatus` will always be empty arrays unless the `count_by_column` RPC is manually created in Supabase (it is not in any migration file).
- `GET/PATCH /api/v1/projects/[id]/feedback` — list and update project feedback. WORKS.

**Gap (MEDIUM):** The `count_by_column` RPC referenced in `GET /api/v1/projects/[id]/route.ts` is called inside try/catch that silently swallows errors. Stats will always return empty arrays for `feedbackByType` and `feedbackByStatus` until the RPC is created. No migration defines this function.

**Gap (LOW):** API key auth looks up `X-API-Key` header against `projects.api_key`, giving each project its own key. There is no concept of a master user-level key that can access all projects.

---

## 7. MCP Server

The MCP server (`packages/mcp-server/src/index.ts`) implements all 5 claimed tools:

- `submit_feedback` — WORKS
- `list_feedback` — WORKS
- `update_feedback_status` — WORKS, but does an extra `/projects` fetch to discover the project ID on every call. This is unnecessary overhead since the API key already scopes the request.
- `get_project_stats` — WORKS, subject to the `count_by_column` RPC gap above
- `search_feedback` — WORKS (delegates to `list_feedback` with `search` param)

**Gap (LOW):** `update_feedback_status` assumes the API key maps to exactly one project (`projectRes.data?.[0]?.id`). If a user somehow has multiple projects, only the first is targeted. This is by design given API key scoping but is undocumented.

**Gap (LOW):** The landing page snippet shows `npx -y @feedbacks/mcp-server` but the package has no `package.json` `name` field visible in scope. Package needs to be published as `@feedbacks/mcp-server` on npm for the npx invocation to work.

---

## 8. Webhook System

**Schema mismatch — HIGH severity:**

The `webhook-delivery.ts` code inserts into `webhook_deliveries` with these columns:
```
id, project_id, endpoint_type, endpoint_url, status, response_code, response_body, attempts, payload, created_at
```

But `sql/001_initial_schema.sql` defines `webhook_deliveries` with:
```
id, project_id, endpoint_id, event, kind, url, status, status_code, error, payload, response_time_ms, response_body, attempt, created_at
```

Column name mismatches: `endpoint_type` vs `kind`, `endpoint_url` vs `url`, `response_code` vs `status_code`, `attempts` vs `attempt`. The delivery logging insert will fail silently (no error is thrown if the insert fails per the comment `// ignore insert errors`). Webhook delivery still happens — only the log record fails.

**UI gaps:**
- No webhook delivery log viewer in the dashboard. The `webhook_deliveries` table is populated (when schema matches) but never queried by any dashboard page.
- Integrations tab saves Slack/Discord/generic URLs in the old flat format (`project.webhooks.slack.url`) but `webhook-delivery.ts` expects the new endpoint array format (`webhooks.slack.endpoints[]`). Webhooks saved through the UI Integrations tab will never fire because `deliverWebhooks` iterates `group.endpoints` which will be `undefined` for the flat format.
- The `sendTestWebhook` function is called from `POST /api/projects/[id]/webhooks` but there is no "Test Webhook" button in the UI that calls this endpoint.
- GitHub Issues integration is fully implemented in `webhook-delivery.ts` but not exposed in the Integrations UI.

---

## 9. Settings

| Setting | Persists? |
|---------|-----------|
| Display name | YES — calls `supabase.auth.updateUser` with `full_name` metadata |
| Email | READ ONLY — correctly disabled |
| Theme (light/dark/system) | YES — `next-themes` handles this via localStorage |
| Email notifications toggle | NO — `emailNotifs` state is local only. No save button for it. No call to `user_settings` table. No email sending code exists. |
| Account deletion | BROKEN — `handleDeleteAccount` calls `supabase.auth.signOut()` and redirects to `/auth`. It does NOT delete the account. The user's projects, feedback, and auth record remain. The UI says "irreversible" and "all data will be deleted" but none of that happens. |

---

## 10. Export

CSV export endpoint (`GET /api/projects/[id]/feedback.csv`) is correctly implemented:
- Ownership verified
- Proper CSV escaping (quoted fields with embedded commas/newlines)
- Correct `Content-Disposition` header
- Exports: `created_at, message, email, type, rating, priority, status, url, tags`

**Gap (MEDIUM):** No button in the project UI triggers this export. Users must know to navigate to `/api/projects/[id]/feedback.csv` directly. The project settings tab or feedback list header is the natural place for this.

---

## 11. Delete Flows

### Project deletion
`SettingsTab.handleDelete` calls:
```js
await supabase.from('projects').delete().eq('id', project.id)
```
DB schema has `ON DELETE CASCADE` on `feedback(project_id)`, `feedback_notes(feedback_id)` via feedback cascade, `widget_configs(project_id)`, `webhook_deliveries(project_id)`. **DB cascade is correct.**

**Gap (MEDIUM):** The confirmation UI says "Type the project name to confirm" but does NOT actually validate the typed name against the real project name before allowing deletion. Any click of Confirm Delete proceeds immediately.

### Account deletion
As noted in §9: BROKEN. Signs out only. No actual deletion.

---

## 12. Missing Table Functionality

| Table | Used in migrations | Used in code |
|-------|-------------------|--------------|
| `projects` | YES | YES |
| `feedback` | YES | YES |
| `widget_configs` | YES (schema, trigger, RLS) | NEVER READ OR WRITTEN by any dashboard code. The Customize tab writes directly to `projects.settings.widget_config` JSONB, bypassing this table entirely. |
| `webhook_deliveries` | YES | Written (with schema mismatch); never read in dashboard |
| `rate_limits` | YES | YES — but schema uses `ip` column while code queries `key` column. `checkRateLimit` deletes by `.eq('ip', ip)` and inserts without an `ip` field, and queries by `.eq('ip', ip)`. The DB schema defines `key` and `route` columns, not `ip`. This means rate limiting silently fails — all requests are allowed. |
| `user_settings` | YES | NEVER READ OR WRITTEN by any application code |
| `feedback_notes` | YES | YES — correctly used |
| `public_board_settings` | YES | YES |
| `votes` | YES | YES |
| `widget_presets` | YES (seed data) | NEVER READ — no preset picker in the UI |

---

## Severity Summary

| # | Issue | Severity |
|---|-------|----------|
| 1 | Rate limiting is completely broken — `rate_limits` table uses `key`/`route` columns but code queries `ip` column. All rate limit checks silently pass. | CRITICAL |
| 2 | Account deletion only signs the user out; does not delete account or data. UI lies to user. | CRITICAL |
| 3 | Webhook delivery logs fail silently due to column name mismatch between code and schema. | HIGH |
| 4 | Webhooks saved via the Integrations UI never fire because the UI stores flat format but delivery code expects endpoint array format. | HIGH |
| 5 | Email notifications toggle does not save or send anything. | HIGH |
| 6 | Widget config customizations saved in dashboard are never fetched by the widget at runtime. | HIGH |
| 7 | Board promotion: widget feedback cannot be made public/visible on the feature board from the dashboard. | HIGH |
| 8 | CSV export has no UI button — accessible only by constructing the URL manually. | MEDIUM |
| 9 | Project deletion confirm dialog does not validate the typed name. | MEDIUM |
| 10 | `count_by_column` RPC missing from migrations; agent API stats always return empty arrays. | MEDIUM |
| 11 | Install tab shows React/Vue npm package that does not exist as a published package. | MEDIUM |
| 12 | `widget_configs` table fully implemented in DB but bypassed entirely by the dashboard. Dead schema. | MEDIUM |
| 13 | `user_settings` table fully implemented in DB but never read or written. Dead schema. | MEDIUM |
| 14 | `widget_presets` table seeded with 6 presets but never exposed in UI. | MEDIUM |
| 15 | Inbox "agent filter" link (`/feedback?agent=1`) does not work — param not handled. | MEDIUM |
| 16 | Inbox has no archive or delete action despite `is_archived` column being in DB. | MEDIUM |
| 17 | Free tier limits (1 project, 500 feedback/month, 30-day history) not enforced anywhere. | LOW |
| 18 | Pricing page has no Stripe integration — Pro tier buttons go to `/auth`. | LOW |
| 19 | "Real-time inbox" claim on landing is false — no Supabase Realtime subscription. | LOW |
| 20 | MCP `update_feedback_status` makes a redundant extra API call per invocation. | LOW |
| 21 | `sendTestWebhook` API exists but no UI button triggers it. | LOW |
| 22 | GitHub Issues webhook integration implemented but not exposed in UI. | LOW |
| 23 | Widget API URL hard-coded; self-hosted install requires manual `data-api-url` config that is not shown in docs. | LOW |

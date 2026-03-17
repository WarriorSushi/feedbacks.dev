# feedbacks.dev v2 — Production Readiness Action Plan

**Generated:** 2026-03-17
**Source:** 5 independent review agents (Feature, Security, Backend, Frontend UX, Architecture)
**Total findings:** 80+ issues across all categories

---

## How to Read This Plan

Issues are **deduplicated** across all 5 reviews and grouped into **phases** by priority. Each phase should be completed before moving to the next. Effort estimates: S = <30min, M = 1-3hr, L = 3-8hr.

---

## Phase 1: CRITICAL — Must Fix Before Launch

These are bugs that will cause data loss, security breaches, or core features to silently fail.

### 1.1 Rate Limiting is Completely Broken
**Effort: M** | Backend, Security
- `rate_limits` table has `key`/`route` columns; code queries non-existent `ip` column
- All rate limit checks silently fail — every request is allowed through
- `x-forwarded-for` is client-spoofable; fallback `"unknown"` shares one bucket for all
- **Fix:** Rewrite `rate-limit.ts` to use `key`/`route` columns, use Vercel's `x-vercel-forwarded-for`, reject requests with no IP, consider atomic Postgres RPC

### 1.2 Captcha Failure-Open
**Effort: S** | Security
- `verifyCaptcha` catches errors and returns `true` — any outage bypasses captcha entirely
- Missing env vars send empty secret, which errors, which allows through
- **Fix:** Return `false` in catch block. Check for secret key existence before calling.

### 1.3 Account Deletion is Fake
**Effort: M** | Feature, Frontend
- `handleDeleteAccount` only calls `signOut()` — no data or account deleted
- UI says "irreversible" and "all data will be deleted" — this is misleading
- **Fix:** Either implement real deletion (Supabase admin API `deleteUser` + cascade) or remove the button and show "Contact support to delete account"

### 1.4 Middleware Breaks API Routes
**Effort: S** | Architecture
- Matcher excludes only `/api/feedback` but not other `/api/*` routes
- `/api/projects/*` matches the `/projects` protected-path check → API clients get HTML redirects instead of 401 JSON
- **Fix:** Change matcher to exclude all API routes: `'/((?!_next/static|_next/image|favicon.ico|api/|cdn/).*)'`

### 1.5 URL Constraint Blocks Board + Widget Submissions
**Effort: S** | Backend
- `feedback.url` has `CHECK (url ~ '^https?://')` but board inserts `board:{slug}` and widget inserts empty string `''`
- All public board submissions fail with 500; widget submissions without URL fail
- **Fix:** Make `url` nullable, remove the CHECK constraint, or default to `NULL`

### 1.6 Vote RLS Policy Allows Anyone to Delete Any Vote
**Effort: S** | Security
- `USING (true)` on DELETE policy means any Supabase client call can delete any vote
- **Fix:** Either restrict policy to `voter_identifier` match or remove the policy (use service-role only)

### 1.7 API Keys Stored in Plaintext
**Effort: L** | Security
- Keys stored as raw UUIDs in `projects.api_key`, compared via `eq('api_key', key)`
- DB compromise = instant access to all projects
- **Fix:** Hash keys with SHA-256 on storage, compare hashed values on lookup. Show raw key only once at creation.

### 1.8 Webhook SSRF — No URL Validation
**Effort: M** | Security
- Users can set webhook URLs to internal IPs (169.254.x, 10.x, localhost)
- Server makes POST and stores response body — cloud metadata exfiltration possible
- **Fix:** Validate URLs are `https://` only, blocklist private IP ranges, don't store response bodies

### 1.9 Silent Error Swallowing on All Mutations
**Effort: L** | Frontend
- Every Supabase mutation in the dashboard ignores the `error` return value
- Users get no feedback when saves fail (network error, RLS, quota)
- **Fix:** Check `error` on every mutation, show toast on failure. Add a shared `handleMutationError` helper.

---

## Phase 2: HIGH — Required for Production Quality

### 2.1 Webhook System is Broken End-to-End
**Effort: L** | Backend, Feature
- Schema mismatch: code inserts `endpoint_type`/`endpoint_url`/`response_code`/`attempts` but table has `kind`/`url`/`status_code`/`attempt`
- UI saves flat format (`webhooks.slack.url`) but delivery code expects array format (`webhooks.slack.endpoints[]`)
- No webhook delivery log viewer in dashboard
- No "Test Webhook" button in UI despite API existing
- GitHub Issues integration implemented but not exposed
- **Fix:** Align schema/code columns, fix data format, add UI for delivery logs + test button

### 2.2 Widget Config Not Fetched at Runtime
**Effort: M** | Feature
- Dashboard "Customize" tab saves config but widget never fetches it
- Widget uses only initialization-time options
- `widget_configs` table exists in DB but is never read/written by dashboard
- **Fix:** Add API endpoint to serve widget config by project key; widget fetches on init

### 2.3 Email Notifications Toggle Does Nothing
**Effort: S** | Feature
- `emailNotifs` checkbox is local state only, never saved, no email code exists
- `user_settings` table exists but is never used
- **Fix:** Either wire it up (save to `user_settings`, implement email via Supabase Edge Function or Resend) or remove the toggle

### 2.4 `is_public` Default Conflict Between Migrations
**Effort: S** | Backend
- Migration 002 sets `DEFAULT false`, migration 004 tries `DEFAULT true` via `IF NOT EXISTS` (no-op)
- Widget feedback never appears on public board; no way to promote it from dashboard
- **Fix:** Run `ALTER TABLE feedback ALTER COLUMN is_public SET DEFAULT true` or add a toggle in dashboard to make items public

### 2.5 Duplicate Vote Triggers — Double-Counting
**Effort: S** | Backend
- Migrations 002 and 004 each create a vote count trigger; both fire on every vote
- `vote_count` gets updated twice per vote operation
- **Fix:** Drop the migration 002 trigger, keep migration 004's version

### 2.6 Project Delete Confirmation Doesn't Validate Name
**Effort: S** | Frontend
- UI says "Type the project name to confirm" but no input field exists
- **Fix:** Add a text input that must match `project.name` before enabling delete button

### 2.7 No Success Feedback After Saving
**Effort: M** | Frontend
- Settings, integrations, board settings show no toast/confirmation after save
- **Fix:** Add toast notifications (shadcn Sonner) on successful save across all settings pages

### 2.8 Landing Page is Entirely `'use client'`
**Effort: M** | Architecture, Performance
- Entire marketing page ships as JS bundle including all static copy
- **Fix:** Extract `WidgetDemo` and scroll listener into client islands; make rest a Server Component

### 2.9 Parallelize Feedback Detail Queries
**Effort: S** | Architecture
- `/feedback/[id]/page.tsx` runs 2 sequential Supabase queries that are independent
- **Fix:** Wrap in `Promise.all`

### 2.10 Dashboard Fetches All Ratings in Memory
**Effort: S** | Architecture
- Fetches every rated feedback row to compute average in JS
- **Fix:** Use Postgres aggregate `select('rating.avg()')` or an RPC

### 2.11 Public Board Has No Pagination
**Effort: S** | Backend
- Unbounded query returns all public feedback items
- **Fix:** Add `.limit(100)` and implement cursor pagination

### 2.12 `count_by_column` RPC Missing From Migrations
**Effort: S** | Backend
- Agent API stats always return empty arrays
- **Fix:** Create the RPC function in a new migration

### 2.13 Unsanitized `custom_css` Returned to Client
**Effort: M** | Security
- CSS injection possible via stored `custom_css` field
- **Fix:** Sanitize CSS before storing (strip `url()`, `@import`, `expression()`)

### 2.14 Arbitrary JSON in `metadata`/`structured_data`
**Effort: S** | Security
- No size or schema validation on these fields
- **Fix:** Cap at 10KB, validate against documented schema with zod

### 2.15 Project Tabs Overflow on Mobile
**Effort: S** | Frontend
- 6 tabs don't fit on 375px screen, no scroll
- **Fix:** Add `overflow-x-auto` to tab container

### 2.16 Public Board Submit Modal Has No Focus Trap
**Effort: S** | Frontend
- No `role="dialog"`, no `aria-modal`, no focus management
- **Fix:** Use Radix Dialog or add manual focus trap

### 2.17 No CI/CD Pipeline
**Effort: M** | Architecture
- `.github/workflows/` deleted, no ESLint config, no automated checks
- **Fix:** Create basic CI workflow (type-check + lint + build), add `.eslintrc.json`

### 2.18 No Environment Variable Validation
**Effort: S** | Architecture
- Missing env vars cause cryptic runtime errors
- **Fix:** Add startup validation module that throws on missing required vars

### 2.19 Public Board Uses Hardcoded Colors (No Dark Mode)
**Effort: M** | Frontend
- Raw Tailwind `bg-white`, `text-gray-*` instead of design system tokens
- **Fix:** Convert to CSS variable-based theming consistent with dashboard

### 2.20 Install Snippet Shows `YOUR_DOMAIN` Placeholder
**Effort: S** | Architecture
- Landing page widget snippet has unresolved placeholder
- **Fix:** Replace with `feedbacks.dev`

---

## Phase 3: MEDIUM — Polish for Production

### 3.1 CSV Export Has No UI Button
- Add export button to project feedback list or settings tab

### 3.2 Inbox Agent Filter Doesn't Work
- `/feedback?agent=1` param is not handled; add agent filtering

### 3.3 No Archive/Delete Action for Feedback
- `is_archived` column exists but no UI to archive/delete individual items

### 3.4 Tab State Not URL-Persisted in Project Detail
- Use URL search params for active tab so links can deep-link to specific tabs

### 3.5 "Back to Inbox" Loses Filter State
- Pass filter params in back link or use `router.back()`

### 3.6 `currentProjectId` Never Passed to Sidebar
- Layout doesn't pass `currentProjectId` — sidebar always highlights first project

### 3.7 Webhook URL Inputs Have No Format Validation
- Add client-side URL format validation on webhook inputs

### 3.8 Status Colors Defined in 3 Places
- Consolidate into single `statusConfig` in `lib/utils.ts`

### 3.9 Type Drift — Shared Package Not Wired Up
- Wire `@feedbacks/shared` as dependency in dashboard and widget packages

### 3.10 `Math.random()` in Loading Skeleton Causes Hydration Mismatch
- Replace with deterministic heights

### 3.11 MCP Server Not in Root Build Script
- Add `pnpm --filter @feedbacks/mcp-server build` to root build

### 3.12 Missing `loading.tsx` for `projects/[id]`
- Add loading skeleton

### 3.13 CSRF Protection on Cookie-Auth Routes
- Verify Origin header on all mutating cookie-authenticated endpoints

### 3.14 Missing `aria-label` on Icon-Only Buttons
- Add labels across landing page, project tabs, sidebar

### 3.15 Search Query Length Not Capped
- Cap `search` param to 200 chars in API routes

### 3.16 Base64 Screenshot Size Not Bounded
- Check `fields.screenshot.length` before decoding

### 3.17 Attachment Filename Stored Verbatim
- Sanitize filenames before storing in JSONB

### 3.18 `createAdminSupabase` Uses Dynamic Import
- Switch to static `import` for `@supabase/supabase-js`

### 3.19 Fire-and-Forget Webhooks May Be Killed by Serverless
- Use Vercel `waitUntil` to extend function lifetime

### 3.20 Vote Salt Hardcoded in Source
- Move to environment variable, use HMAC-SHA256

---

## Phase 4: LOW — Nice to Have

- Free tier limits not enforced (1 project, 500/month, 30-day history)
- No Stripe integration for Pro tier
- Real-time inbox claim on landing is false (uses polling)
- `html2canvas` loaded without SRI hash
- Widget `destroy()` doesn't clean up event listeners
- Multiple widget initializations on duplicate script tags
- Widget CSS vars applied to `:root` instead of scoped container
- CSV export vulnerable to formula injection
- Widget URL field accepts non-HTTP schemes
- No Prettier config
- No widget bundle size assertion
- React/Vue npm install tab shows unpublished package
- Empty `/api/mcp` and `/widget-demo` directories (delete them)
- Supabase error messages leaked to client (use generic messages)
- Sign-out clears wrong cookie names
- Privacy page GitHub link points to root

---

## Phase Summary

| Phase | Issues | Effort | Timeline |
|-------|--------|--------|----------|
| **1: Critical** | 9 | ~2-3 days | Before any user sees this |
| **2: High** | 20 | ~4-5 days | Before public launch |
| **3: Medium** | 20 | ~3-4 days | First week post-launch |
| **4: Low** | 16 | Ongoing | Backlog |

---

## Quick Wins (< 30 min each)

These can be knocked out immediately:

1. Middleware matcher: change `api/feedback` to `api/` (1 line)
2. Captcha: return `false` in catch block (1 line)
3. Vote RLS: fix policy or remove it (1 SQL statement)
4. URL constraint: make nullable or remove CHECK (1 SQL statement)
5. `Promise.all` on feedback detail queries (3 lines)
6. Dashboard rating aggregate (1 line change)
7. Public board `.limit(100)` (1 line)
8. Install snippet: replace `YOUR_DOMAIN` with `feedbacks.dev` (1 line)
9. Mobile tabs: add `overflow-x-auto` (1 CSS class)
10. `Math.random()` in loading skeleton → deterministic values (2 lines)
11. Delete empty directories `/api/mcp` and `/widget-demo`

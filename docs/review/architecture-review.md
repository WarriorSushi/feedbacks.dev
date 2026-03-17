# Architecture Review — feedbacks.dev v2
**Reviewed:** 2026-03-17
**Reviewer:** Claude (automated architecture pass)
**Branch:** full-ass
**Scope:** packages/dashboard, packages/widget, packages/mcp-server, packages/shared

---

## Summary

Overall the v2 rebuild is structurally clean and well-thought-out. The App Router conventions are followed correctly, security practices are solid, and the widget build is tight. The biggest gaps are operational (no CI/CD, no linting config, no environment validation) and a handful of correctness issues in middleware and data-fetching. Nothing is catastrophically broken, but several HIGH items need attention before a public launch.

---

## Issue Catalogue

### 1. Routing Structure
**Rating: MEDIUM**

The route tree is logical. The `(dashboard)` group correctly isolates authenticated routes, `auth/` is public, `p/[slug]` is the public board, and `api/` hosts all backend endpoints.

**Issues found:**

- `/api/mcp` is an empty directory — it exists on the filesystem but contains no `route.ts`. Any request to `/api/mcp` will 404. Either delete the directory or implement the route.
- `/app/widget-demo` is an empty directory — same problem, no `page.tsx`. Dead directory.
- The landing page (`/app/page.tsx`) is a full `'use client'` component. It uses `useEffect` for a scroll listener and interval animation. This prevents any static pre-rendering and adds unnecessary JS to the initial page load. The scroll logic and WidgetDemo animation could be isolated into a small client island while the rest of the page renders as a Server Component (or at minimum a static export).
- `/feedback?agent=1` is linked from the dashboard Quick Actions, but the feedback page has no handler for the `agent` query param — that link does nothing.

---

### 2. Server vs Client Components
**Rating: HIGH**

The boundary choices are mostly correct (auth layout is server, detail pages are server, dashboard page is server), but two notable problems:

- **`/app/page.tsx` (landing page) is `'use client'`** — the entire page, including all static marketing copy, becomes a client bundle. The WidgetDemo and scroll listener should be extracted into a small `<WidgetDemoClient>` component. The rest can be a Server Component, which improves TTFB and Core Web Vitals.
- **`/feedback/page.tsx` is `'use client'`** — this is intentional (uses `useSearchParams`, real-time Supabase queries from the browser), but it means the page can never be cached by Next.js or CDN. This is acceptable for an authenticated inbox, but note the trade-off.
- **`/auth/page.tsx` is `'use client'`** — same, acceptable for a form page.
- **`/app/(dashboard)/feedback/[id]/page.tsx` is a correct Server Component** and does two separate sequential awaits (feedback then notes). These two queries are waterfall — they could be parallelized.

---

### 3. Data Fetching Patterns
**Rating: HIGH**

**Waterfall in `/feedback/[id]/page.tsx`:**
```ts
// Current — sequential
const { data: feedback } = await supabase.from('feedback')...
const { data: notes } = await supabase.from('feedback_notes')...
```
These are independent queries. Use `Promise.all` to run them in parallel. This is the only waterfall in server-rendered routes — the dashboard page correctly uses `Promise.all` for 8 queries.

**Missing project scope filter in `/feedback/page.tsx`:**
The feedback inbox runs a query against the `feedback` table with no `project_id` filter — it relies on Supabase RLS to scope results to the authenticated user's projects. If RLS is correctly configured on the `feedback` table (scoped via `projects.owner_user_id`), this is safe. But the query assumes RLS is set up correctly and gives no explicit owner scoping. If RLS is misconfigured, all users would see all feedback. Verify the RLS policy on the `feedback` table covers this join.

**Rate limiting implementation is high-latency (MEDIUM):**
`checkRateLimit` in `src/lib/rate-limit.ts` does 3 sequential Supabase calls per request (DELETE old entries, SELECT count, INSERT new entry). On a busy API, this is 3 round trips on the hot path. Consider using Redis or a single Postgres function via `rpc()` that does all three atomically.

**Dashboard page fetches all rating rows in memory:**
```ts
const { data: ratingData } = await supabase.from('feedback').select('rating').not('rating', 'is', null)
```
This fetches every rated feedback row to compute a mean in JavaScript. Use a Postgres aggregate instead: `select('rating.avg()')` or an RPC. At scale this becomes a large payload.

---

### 4. Bundle Size
**Rating: MEDIUM**

**Dashboard:**
Dependencies are appropriate. `lucide-react` is tree-shakeable. `@radix-ui/*` packages are split per-component — good. `date-fns` v4 is fully tree-shakeable. `next-themes` is small. No heavy charting library is imported (the sparklines are pure CSS/div), which is excellent. No `moment.js`, no `lodash`, no `@fullcalendar` — clean.

One concern: the landing page (`page.tsx`) is `'use client'`, so the entire page ships as a JS bundle including `lucide-react` icons, CodeSnippet, and the WidgetDemo. Converting to Server Components would reduce JS sent on the first visit.

**Widget:**
esbuild config targets IIFE format, minifies in production, and inlines CSS. No external dependencies in the widget package. The build produces a metafile with size analysis. The widget `src/types.ts` is NOT using the `@feedbacks/shared` package (see issue #9).

---

### 5. Build Configuration
**Rating: HIGH**

**`next.config.js` is a `.js` file using `module.exports`** — this is valid, but Next.js 15 recommends `next.config.ts` or at least `next.config.mjs` for consistency with ESM. Minor but worth noting for the future.

**`serverActions.bodySizeLimit: '10mb'`** — this is set for all server actions. The feedback submission uses API routes (not server actions), so this setting only applies to actual `use server` functions. It appears no server actions are defined in the codebase currently, so this config is inert (not harmful, just unnecessary).

**No `output: 'standalone'`** in `next.config.js`. For Vercel deployment this is fine — Vercel handles its own output format. But for Docker/self-hosting, `standalone` output is needed.

**Widget build has no CSS output file** — the widget inlines all CSS into the JS bundle via the custom `cssPlugin`. This is intentional and correct for a self-contained widget, but the build does not validate the final gzip size against the <20KB target. Consider adding a `maxSize` assertion or a `check-bundle-size` script (one was mentioned but is now deleted based on git status).

**Missing `postcss.config.js` reference in tailwind** — the Tailwind config is `.js` format (not `.ts`), which is fine for this version of Tailwind (v3). It correctly references `tailwindcss-animate`.

---

### 6. Monorepo Structure
**Rating: MEDIUM**

`pnpm-workspace.yaml` includes `packages/*` which picks up all 4 packages correctly: `dashboard`, `widget`, `mcp-server`, `shared`.

**`packages/shared` exists but is not consumed by `packages/dashboard`:**
`packages/dashboard/package.json` has no dependency on `@feedbacks/shared`. The dashboard defines its own `types.ts` with overlapping types. The `shared` package has `WidgetConfig`, `FeedbackType`, `FeedbackStatus`, `FeedbackPriority` — all of which are also defined independently in `dashboard/src/lib/types.ts`. This is type drift waiting to happen (and has already started — see issue #9).

**`packages/widget/src/types.ts` is not using `@feedbacks/shared` either** — it defines its own `WidgetConfig` interface which has diverged from the shared one (e.g., `question` is missing from the widget's `CategoryType`, widget lacks `enablePriority`/`enableTags`, etc.).

**`packages/mcp-server` has no build output** — the `dist/` directory is absent. The MCP server cannot run in production without `tsc` being run first. There is no MCP server build step in the root `build` script.

**No circular dependencies detected** — packages are unidirectional.

---

### 7. Middleware
**Rating: CRITICAL**

**The middleware `matcher` does not exclude all API routes:**
```ts
matcher: ['/((?!_next/static|_next/image|favicon.ico|api/feedback|cdn/).*)', ]
```
This excludes `/api/feedback` and `cdn/`, but does NOT exclude:
- `/api/v1/*` — the AI agent API, which uses its own `X-API-Key` auth
- `/api/boards/*` — the public board API
- `/api/auth-status`
- `/api/sign-out`
- `/api/projects/*`

The middleware runs `supabase.auth.getUser()` on every request that hits these routes, which is a wasted auth check since API routes do their own authentication. More importantly, the middleware's `isProtected` check uses path startsWith matching:

```ts
const isProtected = request.nextUrl.pathname.startsWith('/dashboard') ||
  request.nextUrl.pathname.startsWith('/projects') ||
  request.nextUrl.pathname.startsWith('/feedback') ||
  request.nextUrl.pathname.startsWith('/settings')
```

This means `/api/projects/*` routes will match the `/projects` check and a logged-out API call to `GET /api/projects/abc` will be redirected to `/auth?redirect=/api/projects/abc` instead of returning a proper 401. This is a **correctness bug** — API clients will get an HTML redirect instead of a JSON error.

**Fix:** Exclude all API routes from the matcher:
```ts
matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|cdn/).*)',]
```

---

### 8. Widget Hosting
**Rating: HIGH**

**The widget is not built** — `packages/widget/dist/` is empty (no files found). The build must be run before the dashboard can serve the widget.

**Widget copy path is hardcoded to `public/widget/`** — the `widget:copy` script in the root `package.json` copies `widget.js` to `packages/dashboard/public/widget/latest.js` and `v2.js`. The landing page installation snippet shows `https://YOUR_DOMAIN/widget/latest.js` — this aligns. However, the `next.config.js` has no explicit headers for `public/widget/` to add caching, CORS, or Content-Type headers.

**The landing page snippet shows `YOUR_DOMAIN`** — this placeholder was never replaced with the actual domain (`feedbacks.dev`). Users copy-pasting from the docs/landing page get an invalid install snippet.

**No version pinning in the widget URL** — the URL `widget/latest.js` means any rebuild automatically pushes to all existing users. There is no way for a user to pin to `widget/v2.0.0.js`. The old versioned CDN files (1.0.0, 1.1.0 etc.) are deleted in the current branch. The v2 build only outputs `latest.js` and `v2.js`.

**Widget source map is disabled in production** (`sourceMap: false` in esbuild config) — correct.

---

### 9. Type Sharing
**Rating: MEDIUM**

There are now **three separate definitions** of core types:

| Type | `packages/shared/src/index.ts` | `packages/dashboard/src/lib/types.ts` | `packages/widget/src/types.ts` |
|---|---|---|---|
| `FeedbackType` | `bug\|idea\|praise\|question` | `bug\|idea\|praise\|question` | `bug\|idea\|praise` (missing `question`) |
| `WidgetConfig` | Defined | Defined (different shape) | Defined (different shape) |
| `FeedbackPriority` | `low\|medium\|high\|critical` | `low\|medium\|high\|critical` | `low\|medium\|high` (missing `critical`) |

The `shared` package exists specifically to solve this but is not wired up. The dashboard and widget have already diverged:
- Widget `types.ts` is missing `question` as a feedback type and `critical` as a priority level.
- `WidgetConfig` in shared has `backgroundColor`, `scale`, `modalWidth`, `openOnKey`, `openAfterMs` — none of which are in the dashboard's `WidgetConfig`.

**Recommendation:** Wire `@feedbacks/dashboard` and `@feedbacks/widget` to depend on `@feedbacks/shared` for the core enums and shared interfaces. The `shared` package points directly to `src/index.ts` (no build step needed for TypeScript-only types).

---

### 10. Deployment Readiness
**Rating: HIGH**

**Missing for Vercel:**
- No `vercel.json` — not strictly required, but useful for setting headers, redirects, and region configuration.
- The `SUPABASE_SERVICE_ROLE_KEY` must be set in Vercel environment variables. This is documented in `.env.example` but not enforced at runtime.
- No environment variable validation at startup — if `NEXT_PUBLIC_SUPABASE_URL` is unset, the app will crash at request time with a confusing error rather than a clear startup message.
- The `mcp-server` package is not included in the root `build` script. If the MCP server needs to be deployed (e.g., as a Vercel function), it will not be built automatically.
- `public/widget/` will be empty unless `pnpm build` is run (which triggers `widget:copy`). On Vercel, the build command must be `pnpm build` not `next build`.

**What is production-ready:**
- The `widget:copy` step in the build script correctly copies the built widget into `public/`.
- API routes have proper error handling and consistent JSON error shapes.
- The Supabase admin client is only instantiated in server-side code (API routes and server components).
- CORS headers on `/api/feedback` are correctly set.

---

### 11. Environment Variable Handling
**Rating: HIGH**

**No runtime validation** — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are accessed with `!` non-null assertions throughout. If any is missing, the app will fail at request time with TypeScript-silenced undefined behaviour rather than a clear startup error.

**Recommendation:** Add a validation module that runs at startup:
```ts
// src/lib/env.ts
const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']
required.forEach(key => { if (!process.env[key]) throw new Error(`Missing env var: ${key}`) })
```

**`.env.local.example` exists alongside `.env.example`** — two example files for the same purpose is confusing. Pick one (`.env.local.example` is the Next.js convention since `.env.local` is gitignored by default).

**Optional captcha vars (`TURNSTILE_SECRET_KEY`, `HCAPTCHA_SECRET_KEY`) are silently ignored if missing** — `verifyCaptcha` catches fetch errors and returns `true` (allow through). This means a misconfigured captcha secretly becomes a no-op, giving false security. Log a warning at minimum.

---

### 12. Missing Infrastructure
**Rating: HIGH**

**No CI/CD pipeline** — the `.github/workflows/` directory has been deleted. There is no automated type-check, lint, or build on pull requests. The `pnpm type-check` and `pnpm lint` scripts exist but are never run automatically.

**No ESLint config** — `packages/dashboard/.eslintrc.json` has been deleted. `eslint-config-next` is still in `devDependencies`, but there is no config file. Running `pnpm lint` will fail. `next lint` needs a config to operate.

**No tests** — the `tests/e2e/` directory and `playwright.config.ts` have been deleted. There are no unit tests, integration tests, or E2E tests anywhere in the codebase. The core feedback submission logic (`/api/feedback/route.ts`) and rate limiting have no test coverage.

**No Prettier config** — code formatting is inconsistent between files (some use 2-space indent, some use different quote styles). Not blocking, but matters for team collaboration.

**No database migration runner** — `sql/` contains migration files but there is no tooling to run them in order (no `supabase db push`, no migration script). Documented as "run in order" but not automated.

---

## Priority Matrix

| # | Issue | Severity | Effort |
|---|---|---|---|
| 7 | Middleware matches `/api/projects/*` as a protected route — API clients get HTML redirects | **CRITICAL** | Low (1 line fix) |
| 2 | Landing page is entirely `'use client'` — no SSR/static rendering | HIGH | Medium |
| 3a | `/feedback/[id]` waterfall: 2 sequential queries that can be `Promise.all`'d | HIGH | Low |
| 3b | Dashboard fetches all rating rows in memory for avg calculation | HIGH | Low |
| 5b | Widget `dist/` is empty — widget is not built | HIGH | Low (run build) |
| 8c | Landing page install snippet contains `YOUR_DOMAIN` placeholder | HIGH | Low |
| 10 | No environment variable validation at startup | HIGH | Low |
| 10b | MCP server not included in root build script | HIGH | Low |
| 12a | No ESLint config — `pnpm lint` fails | HIGH | Low |
| 12b | No CI/CD pipeline | HIGH | Medium |
| 1 | `/api/mcp` and `/widget-demo` are empty dead directories | MEDIUM | Low (delete them) |
| 3c | Rate limiting does 3 sequential DB round trips per request | MEDIUM | Medium |
| 4 | Landing page client bundle includes all marketing copy | MEDIUM | Medium |
| 6 | `@feedbacks/shared` exists but is wired to neither dashboard nor widget | MEDIUM | Medium |
| 9 | Type drift: `FeedbackType`/`WidgetConfig` defined in 3 places and diverged | MEDIUM | Medium |
| 11 | Two `.env.example` files; captcha silently no-ops if misconfigured | MEDIUM | Low |
| 12c | No database migration runner | MEDIUM | Medium |
| 5c | No version pinning for widget URL | LOW | Medium |
| 5d | No gzip size assertion in widget build | LOW | Low |
| 12d | No Prettier config | LOW | Low |

---

## Quick Wins (Fix Today)

These are all one-liners or near-trivial:

1. **Middleware bug** — change `api/feedback` to `api/` in the matcher exclusion:
   ```ts
   // packages/dashboard/src/middleware.ts
   matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|cdn/).*)',]
   ```

2. **Parallelize feedback detail queries** — wrap in `Promise.all` in `feedback/[id]/page.tsx`.

3. **Delete dead directories** — remove `/app/api/mcp/` (empty) and `/app/widget-demo/` (empty).

4. **Fix install snippet** — replace `YOUR_DOMAIN` with `feedbacks.dev` on the landing page.

5. **Add ESLint config** — create `packages/dashboard/.eslintrc.json`:
   ```json
   { "extends": "next/core-web-vitals", "root": true }
   ```

6. **Add MCP server to build script** — add `pnpm --filter @feedbacks/mcp-server build` to the root `build` script.

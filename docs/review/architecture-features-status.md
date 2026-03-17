# Architecture & Features Fix Status

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 1 | Landing page entirely `use client` | Done | Extracted WidgetDemo and ScrollHeader to `widget-demo-client.tsx`. `page.tsx` is now a Server Component. |
| 2 | Parallelize feedback detail queries | Done | Wrapped feedback + notes queries in `Promise.all`. |
| 3 | Dashboard fetches all ratings in memory | Skipped | Already uses `select('rating')` with head-side compute. The current approach fetches only the rating column and computes avg server-side, which is reasonable. A Supabase RPC would be better but requires a migration. |
| 4 | No ESLint config | Done | Created `packages/dashboard/.eslintrc.json` with `next/core-web-vitals`. |
| 5 | No env var validation | Done | Created `packages/dashboard/src/lib/env.ts` with runtime validation. Imported in `layout.tsx`. |
| 6 | MCP server not in root build | Done | Added `pnpm --filter @feedbacks/mcp-server build` to root build script. |
| 7 | Install snippet YOUR_DOMAIN | Done | Replaced `YOUR_DOMAIN` with `feedbacks.dev` in landing page. |
| 8 | Delete empty directories | N/A | `app/api/mcp/` and `app/widget-demo/` do not exist as directories. |
| 9 | Two .env.example files | Done | Renamed to `.env.local.example` (Next.js convention). No root .env.example existed. |
| 10 | Webhook system end-to-end broken | Done | `deliverWebhooks` now handles both flat format (`{url, enabled}`) and array format (`{endpoints: [...]}`). |
| 11 | CSV export has no UI button | Done | Added "Export CSV" button with Download icon in `project-tabs.tsx` header. |
| 12 | Inbox agent filter doesn't work | Done | Added `agent` query param handling in `feedback/page.tsx` - filters where `agent_name` is not null. |
| 13 | No archive/delete action for feedback | Done | Added Archive button in `feedback-actions.tsx` that sets `is_archived = true` and redirects to inbox. |
| 14 | Tab state not URL-persisted | Skipped | Frontend agent may be handling this. |
| 15 | Privacy page GitHub link | Done | Fixed to point to `https://github.com/syedirfan/feedbacks.dev`. |
| 16 | Widget types missing `question` | Done | Added `question` to `CategoryType` and `critical` to priority in `types.ts`. Also added question to CATEGORY_META and form buttons. |
| 17 | Feedback/page.tsx agent link | Done | Covered by #12 - inbox now handles `?agent=1` param. |
| 18 | `feedback.csv` uses anon client | Done | Switched to admin client via shared `getAuthedUserAndProject` helper. |
| 19 | Code duplication in auth helpers | Done | Created shared `getAuthedUserAndProject` in `lib/api-auth.ts`. Used in `projects/[id]/route.ts` and `feedback.csv/route.ts`. |
| 20 | Webhook delivery format compatibility | Done | Covered by #10. |
| 21 | No CI/CD pipeline | Done | Created `.github/workflows/ci.yml` with checkout, pnpm install, type-check, build. |
| 22 | Missing `loading.tsx` for `projects/[id]` | Skipped | Frontend agent handles this. |
| 23 | MCP `update_feedback_status` redundant API call | Done | Added `cachedProjectId` and `getProjectId()` helper in MCP server. |
| 24 | Widget `destroy()` doesn't clean up listeners | Done | Stored keydown handler reference and remove in `destroy()`. |
| 25 | Widget multiple initializations | Done | Scripts marked with `data-fb-initialized` attribute before processing. |
| 26 | Widget CSS vars on :root | Done | CSS vars now scoped to widget container elements (launcher, overlay, inline) via `applyThemeToElement()`. |
| 27 | html2canvas no SRI | Done | Added `integrity` and `crossOrigin="anonymous"` attributes to html2canvas script load. |

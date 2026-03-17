# feedbacks.dev v2 — Full-Ass Rebuild

## Project Overview
Developer-first feedback collection product: embeddable widget + dashboard + API, powered by Supabase.

## Tech Stack
- **Monorepo**: pnpm workspaces
- **Dashboard**: Next.js 15, React 19, shadcn/ui, Tailwind CSS, TypeScript strict
- **Widget**: Vanilla TypeScript, esbuild, <20KB gzipped
- **Backend**: Supabase (Postgres + Auth + Storage + RLS)
- **Package manager**: pnpm (NEVER npm)

## Commands
```bash
pnpm dev                    # Start dashboard dev server
pnpm widget:dev             # Start widget dev server
pnpm build                  # Build everything
pnpm type-check             # TypeScript validation
```

## Architecture
```
packages/
  dashboard/   # Next.js 15 app — auth, inbox, project management, integrations
  widget/      # Embeddable feedback widget — modal, inline, trigger modes
  shared/      # Shared types (optional)
sql/           # Supabase migration files
docs/          # Product docs + full-ass transformation docs
archived_project/  # Previous v1 implementation (reference only)
```

## Key Rules
1. **Security**: Service role key ONLY in API routes. Never in client code.
2. **Mobile-first**: Every interface works on mobile. Min touch target 44px.
3. **Performance**: Widget <20KB gzipped, dashboard <1s initial load.
4. **TypeScript strict**: No `any` types in new code.
5. **Functional React**: Hooks only, server components where possible.
6. **Git**: Never push to remote unless explicitly told.

## Supabase Tables
- `projects` — User projects with API keys
- `feedback` — Submitted feedback with full context
- `widget_configs` — Widget configuration versions
- `webhook_deliveries` — Webhook delivery logs
- `rate_limits` — Rate limiting records
- `user_settings` — User preferences
- `feedback_notes` — Internal team notes on feedback

## API Routes
- `POST /api/feedback` — Public widget submission endpoint (CORS enabled)
- `GET/POST /api/projects` — Project CRUD
- `GET/PATCH/DELETE /api/projects/[id]` — Single project
- `GET/PUT/POST /api/projects/[id]/webhooks` — Webhook config
- `GET /api/auth-status` — Current user
- `POST /api/sign-out` — Sign out

## Widget Modes
- **Modal** (default): Floating button → overlay modal
- **Inline**: Renders in a target element
- **Trigger**: Attaches to existing elements

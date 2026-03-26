# feedbacks.dev v2 — Implementation Checklist
# This file is the source of truth. If context is cleared, read this first.

## Status: IN PROGRESS

---

## Phase 1: Quick Wins
- [ ] Copy favicon files from `archived_project/packages/dashboard/public/` to `packages/dashboard/public/`
  - favicon.ico, favicon.png, favicon.svg, logo.png, logo.svg
- [ ] Update `packages/dashboard/src/app/layout.tsx` — add favicon metadata
- [ ] Fix POST /api/v1/feedback — default `metadata` to `{}` when missing
  - File: `packages/dashboard/src/app/api/v1/feedback/route.ts`
- [ ] Remove temporary password login from auth page
  - File: `packages/dashboard/src/app/auth/page.tsx`

## Phase 2: Sidebar & Navigation
- [ ] Add "Public Board" nav item to sidebar with Globe icon
  - When projects exist, link to `/p/{slug}` for current project's board
  - File: `packages/dashboard/src/components/sidebar.tsx`
- [ ] Add Public Board to mobile bottom nav or make accessible from project context

## Phase 3: User Journey & Onboarding
- [ ] Replace empty dashboard with step-by-step onboarding when no projects exist
  - Steps: Create project → Install widget → Enable public board → Set up integrations
  - File: `packages/dashboard/src/app/(dashboard)/dashboard/page.tsx`
- [ ] Make stat cards clickable → link to filtered feedback views
- [ ] Add "Getting Started" progress checklist that persists until all steps done
- [ ] After creating project, show contextual banner on Install tab

## Phase 4: Public Board Enhancements
- [ ] DB Migration: Add `is_public` boolean to `feedback_notes` (default false)
  - Run via Supabase SQL: `ALTER TABLE feedback_notes ADD COLUMN is_public boolean NOT NULL DEFAULT false;`
- [ ] New API route: `POST /api/boards/[slug]/comment` — owner posts public comments
- [ ] Public board UI: Show admin comments with "Dev" badge on each feedback card
- [ ] Add "Updates" section at top: in_progress and recently closed items
- [ ] Add feedback detail expand/modal with activity feed
- [ ] Add search to public board

## Phase 5: Landing Page Redesign
- [ ] Use Impeccable Design / frontend-design skill
- [ ] Apply MyGang design system: glass/glow, dark-first, OKLCH, Geist/Outfit fonts
- [ ] Premium hero with animated gradients
- [ ] Glass morphism feature cards
- [ ] Better pricing cards
- [ ] Smooth scroll animations
- [ ] File: `packages/dashboard/src/app/page.tsx`

## Phase 6: Dashboard Power Features
- [ ] Clickable stat cards linking to filtered views
- [ ] Feedback type pie/donut chart (CSS-only or lightweight)
- [ ] Multi-project health overview cards
- [ ] File: `packages/dashboard/src/app/(dashboard)/dashboard/page.tsx`

---

## Key Files Reference
- Sidebar: `packages/dashboard/src/components/sidebar.tsx`
- Dashboard: `packages/dashboard/src/app/(dashboard)/dashboard/page.tsx`
- Landing: `packages/dashboard/src/app/page.tsx`
- Auth: `packages/dashboard/src/app/auth/page.tsx`
- Public Board: `packages/dashboard/src/app/p/[slug]/public-board.tsx`
- Public Board Page: `packages/dashboard/src/app/p/[slug]/page.tsx`
- Dashboard Layout: `packages/dashboard/src/app/(dashboard)/layout.tsx`
- API Feedback: `packages/dashboard/src/app/api/v1/feedback/route.ts`
- DB Schema: `sql/000_full_reset_v2-ran this one for v2. nothing else needed.sql`
- Canny Research: `docs/research/canny-analysis.md`

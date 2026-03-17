# Feedbacks.dev — Impeccable Design Overhaul + Critical Fixes

**Date**: 2026-03-17
**Status**: Approved

## Workstream 1: Critical Fixes (must be first)

### Schema Fixes
- Table name: dashboard uses `feedbacks`, API uses `feedback` — standardize to `feedback`
- Add `is_public` boolean column to feedback table (default true)
- Add `vote_count` integer column to feedback table (default 0, updated by trigger)
- Create trigger: on vote insert/delete, update feedback.vote_count

### Code Fixes
- Fix all dashboard pages querying `feedbacks` → `feedback`
- Add Suspense boundary to feedback inbox page (useSearchParams)
- Add rate limiting to vote endpoint
- Fix delete account to actually call admin delete, not just sign out
- Make notification settings persist to user_settings table
- Add `is_public` and `vote_count` to TypeScript types

## Workstream 2: Impeccable Design Overhaul

### Landing Page
- Remove fake social proof and fake stats
- Real interactive widget demo (live preview)
- Bold typography, animated hero with gradient mesh
- Actual differentiators: AI agent API, public boards, <5KB widget
- Code preview with syntax highlighting and copy button

### Public Feature Board
- Roadmap columns view (kanban: Under Review → Planned → In Progress → Done)
- Animated vote interactions (bounce, confetti on first vote)
- Search bar for filtering feedback
- Better empty states with illustrations
- Submission success animation
- Board header with project branding

### Dashboard
- Sparkline mini-charts in stat cards
- Activity feed with avatar-like indicators
- Better empty states
- Skeleton loading states

### Feedback Inbox
- Suspense boundary fix
- Preview pane on hover/click
- Better visual hierarchy for unread items
- Keyboard hint badges

### Auth Page
- Remove fake testimonial
- Cleaner single-column option for mobile
- Animated background

### Global
- Proper toggle switches instead of native checkboxes
- Consistent loading skeletons
- Better micro-interactions on all buttons/cards
- Refined color palette with more personality

## Workstream 3: Feature Enhancements

### Public Board
- Board branding (accent color applied throughout)
- Status roadmap/kanban view toggle
- Feedback detail expansion (click to see full message)

### AI Agent Features
- Agent badge on feedback items submitted by agents
- Structured data display in feedback detail
- Agent activity in dashboard stats

## Files to Modify

### Schema
- sql/004_fix_public_board.sql (new migration)

### Dashboard Pages (all in packages/dashboard/src/)
- app/page.tsx (landing)
- app/auth/page.tsx
- app/(dashboard)/dashboard/page.tsx
- app/(dashboard)/feedback/page.tsx
- app/(dashboard)/feedback/[id]/page.tsx
- app/(dashboard)/settings/page.tsx
- app/p/[slug]/public-board.tsx
- app/p/[slug]/page.tsx
- components/sidebar.tsx
- app/globals.css
- lib/types.ts

### API Routes
- app/api/boards/[slug]/vote/route.ts (add rate limiting)

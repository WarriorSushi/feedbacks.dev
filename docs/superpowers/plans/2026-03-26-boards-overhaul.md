# Boards System Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the entire boards system — public board page, dashboard settings, navigation, custom naming, and a new public board directory — with a warm, friendly aesthetic.

**Architecture:** Break the 970-line public-board.tsx monolith into focused components under `components/boards/`. Restructure board-settings.tsx into tabbed sections under `components/board-settings/`. Add `display_name` column to the DB. Create a new `/boards` directory page. All existing API routes stay intact; only the GET `/api/boards/[slug]` and GET/PUT `/api/projects/[id]/board` routes need minor updates to include `display_name`.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS, shadcn/ui components, Supabase (Postgres + RLS)

**Spec:** `docs/superpowers/specs/2026-03-26-boards-overhaul-design.md`

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `sql/008_board_display_name.sql` | Migration: add `display_name` column |
| `packages/dashboard/src/components/boards/board-types.ts` | Shared types/constants for public board components |
| `packages/dashboard/src/components/boards/BoardHero.tsx` | Branded hero section with stats, owner link, follow |
| `packages/dashboard/src/components/boards/BoardFilters.tsx` | Search + sort + type filter pills |
| `packages/dashboard/src/components/boards/BoardFeedbackCard.tsx` | Individual feedback card with voting, expand, moderation |
| `packages/dashboard/src/components/boards/BoardFeedbackList.tsx` | List container with empty state |
| `packages/dashboard/src/components/boards/BoardSubmitForm.tsx` | Feedback submission modal |
| `packages/dashboard/src/components/boards/BoardAnnouncements.tsx` | Collapsible updates section |
| `packages/dashboard/src/components/boards/BoardFooter.tsx` | Powered-by + owner nav |
| `packages/dashboard/src/components/boards/BoardReportModal.tsx` | Report modal (extracted) |
| `packages/dashboard/src/components/board-settings/BoardSettingsTabs.tsx` | Tabbed container for all settings |
| `packages/dashboard/src/components/board-settings/BoardIdentitySection.tsx` | Display name, slug, emoji, color, website |
| `packages/dashboard/src/components/board-settings/BoardContentSection.tsx` | Hero text, types, submissions, announcements |
| `packages/dashboard/src/components/board-settings/BoardVisibilitySection.tsx` | Enable, visibility, directory, categories |
| `packages/dashboard/src/components/board-settings/BoardAdvancedSection.tsx` | Custom CSS, reports queue |
| `packages/dashboard/src/app/boards/page.tsx` | Board directory page (SSR) |
| `packages/dashboard/src/app/api/boards/route.ts` | Board directory API endpoint |

### Modified Files
| File | Changes |
|------|---------|
| `packages/dashboard/src/lib/types.ts` | Add `display_name` to `PublicBoardSettings` |
| `packages/dashboard/src/lib/public-board.ts` | Add `displayName` to `BoardBranding`, update parse/sanitize/serialize |
| `packages/dashboard/src/app/p/[slug]/page.tsx` | Pass `displayName` and `canModerate`/`projectId` to PublicBoard |
| `packages/dashboard/src/app/p/[slug]/public-board.tsx` | Replace 970-line monolith with component composition |
| `packages/dashboard/src/app/(dashboard)/projects/[id]/board-settings.tsx` | Replace with thin wrapper that renders BoardSettingsTabs |
| `packages/dashboard/src/app/api/boards/[slug]/route.ts` | Include `display_name` in response |
| `packages/dashboard/src/app/api/projects/[id]/board/route.ts` | Handle `display_name` in GET/PUT |
| `packages/dashboard/src/lib/board-discovery.ts` | Add `displayName` to `BoardDirectoryEntry` |

---

## Task 1: Database Migration — Add `display_name`

**Files:**
- Create: `sql/008_board_display_name.sql`
- Modify: `packages/dashboard/src/lib/types.ts`
- Modify: `packages/dashboard/src/lib/public-board.ts`

- [ ] **Step 1: Create the migration file**

Create `sql/008_board_display_name.sql`:
```sql
-- Add display_name column to public_board_settings
ALTER TABLE public_board_settings
  ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Allow max 60 chars (enforced at app level, but add a check for safety)
ALTER TABLE public_board_settings
  ADD CONSTRAINT public_board_settings_display_name_length
  CHECK (display_name IS NULL OR length(display_name) <= 60);
```

- [ ] **Step 2: Run the migration on Supabase**

Run the SQL via the Supabase MCP tool `execute_sql` against the project.

- [ ] **Step 3: Add `display_name` to TypeScript types**

In `packages/dashboard/src/lib/types.ts`, add `display_name: string | null` to the `PublicBoardSettings` interface (after `empty_state_description`):

```typescript
// In PublicBoardSettings interface, add:
display_name: string | null
```

- [ ] **Step 4: Add `displayName` to BoardBranding**

In `packages/dashboard/src/lib/public-board.ts`:

Add `displayName?: string` to the `BoardBranding` interface.

Add `display_name?: unknown` and `displayName?: unknown` to `BoardBrandingSource`.

Update `parseLegacyBranding` to include: `displayName: sanitizeString(input.displayName ?? input.display_name, 60),`

Update `sanitizeBoardBranding` to include: `displayName: sanitizeString(input.displayName, 60),`

Update `parseBoardBranding` to include in the merge: `displayName: record.display_name ?? record.displayName ?? legacy.displayName,`

Add `display_name: string | null` to `BoardBrandingColumns` and update `boardBrandingToColumns` to include: `display_name: sanitized.displayName || null,`

Update `serializeBoardBranding` to include: `if (sanitized.displayName) next.displayName = sanitized.displayName`

- [ ] **Step 5: Commit**

```bash
git add sql/008_board_display_name.sql packages/dashboard/src/lib/types.ts packages/dashboard/src/lib/public-board.ts
git commit -m "feat: add display_name column to public_board_settings"
```

---

## Task 2: Update API Routes for `display_name`

**Files:**
- Modify: `packages/dashboard/src/app/api/boards/[slug]/route.ts`
- Modify: `packages/dashboard/src/app/api/projects/[id]/board/route.ts`
- Modify: `packages/dashboard/src/lib/board-discovery.ts`

- [ ] **Step 1: Update public board GET API**

In `packages/dashboard/src/app/api/boards/[slug]/route.ts`, add `display_name` to the board response object:

```typescript
// In the return NextResponse.json, add display_name to the board object:
board: {
  title: board.title,
  description: board.description,
  slug: board.slug,
  display_name: board.display_name || null,  // ADD THIS
  allow_submissions: board.allow_submissions,
  show_types: board.show_types,
  branding,
  custom_css: board.custom_css ? sanitizeCss(board.custom_css) : null,
},
```

- [ ] **Step 2: Update dashboard board GET/PUT API**

In `packages/dashboard/src/app/api/projects/[id]/board/route.ts`:

In `buildBoardSettingsPayload`, add:
```typescript
display_name: sanitizeText(body.display_name, 60),
```

The `loadBoardSettings` function already does `select('*')` so `display_name` will be included automatically in the board response.

- [ ] **Step 3: Update board-discovery.ts**

In `packages/dashboard/src/lib/board-discovery.ts`, add `displayName: string | null` to `BoardDirectoryEntry` interface.

In the return of `loadBoardDirectoryEntries`, add:
```typescript
displayName: board.display_name || null,
```

- [ ] **Step 4: Commit**

```bash
git add packages/dashboard/src/app/api/boards/[slug]/route.ts packages/dashboard/src/app/api/projects/[id]/board/route.ts packages/dashboard/src/lib/board-discovery.ts
git commit -m "feat: include display_name in board API responses"
```

---

## Task 3: Extract Shared Types and Constants

**Files:**
- Create: `packages/dashboard/src/components/boards/board-types.ts`

- [ ] **Step 1: Create shared types file**

Create `packages/dashboard/src/components/boards/board-types.ts` with the types and constants extracted from the existing monolith:

```typescript
import type { BoardAnnouncement, BoardBranding } from '@/lib/public-board'

export interface BoardInfo {
  projectId: string
  title: string | null
  description: string | null
  slug: string
  displayName: string | null
  allow_submissions: boolean
  show_types: string[]
  branding: BoardBranding
  customCss?: string | null
}

export interface FeedbackItem {
  id: string
  message: string
  type: string | null
  status: string
  vote_count: number
  created_at: string
}

export interface AdminComment {
  id: string
  feedback_id: string
  content: string
  created_at: string
}

export interface BoardRecommendation {
  slug: string
  title: string
  description: string
  displayName: string | null
  branding: BoardBranding
  feedbackCount: number
  trustScore: number
}

export interface BoardSuggestion {
  id: string
  title: string
  description: string
  status: string
  vote_count: number
}

export interface ReportTarget {
  type: 'board' | 'feedback'
  feedbackId?: string
}

export type SortMode = 'votes' | 'newest' | 'status'
export type FilterType = 'all' | 'idea' | 'bug' | 'praise' | 'question'

export const typeConfig: Record<string, { label: string; tone: string }> = {
  idea: { label: 'Feature request', tone: 'border-sky-200 bg-sky-50 text-sky-700' },
  bug: { label: 'Bug', tone: 'border-rose-200 bg-rose-50 text-rose-700' },
  praise: { label: 'Praise', tone: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  question: { label: 'Question', tone: 'border-amber-200 bg-amber-50 text-amber-800' },
}

export const statusConfig: Record<string, { label: string; tone: string }> = {
  new: { label: 'New', tone: 'bg-slate-100 text-slate-700' },
  reviewed: { label: 'Under review', tone: 'bg-amber-100 text-amber-800' },
  planned: { label: 'Planned', tone: 'bg-violet-100 text-violet-700' },
  in_progress: { label: 'In progress', tone: 'bg-orange-100 text-orange-800' },
  closed: { label: 'Shipped', tone: 'bg-emerald-100 text-emerald-700' },
}

export function getTitle(message: string): string {
  const firstLine = message.split('\n')[0]
  return firstLine.length > 88 ? `${firstLine.slice(0, 88)}…` : firstLine
}

export function getDescription(message: string): string {
  const lines = message.split('\n')
  if (lines.length <= 1) return ''
  const rest = lines.slice(1).join(' ').trim()
  return rest.length > 180 ? `${rest.slice(0, 180)}…` : rest
}

export function getFullDescription(message: string): string {
  const lines = message.split('\n')
  if (lines.length <= 1) return ''
  return lines.slice(1).join('\n').trim()
}

export function relativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function readSetStorage(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw))
  } catch {
    return new Set()
  }
}

export function writeSetStorage(key: string, value: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...value]))
  } catch {
    // ignore
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/dashboard/src/components/boards/board-types.ts
git commit -m "refactor: extract shared board types and utils"
```

---

## Task 4: Build Public Board Components

**Files:**
- Create: `packages/dashboard/src/components/boards/BoardHero.tsx`
- Create: `packages/dashboard/src/components/boards/BoardFilters.tsx`
- Create: `packages/dashboard/src/components/boards/BoardFeedbackCard.tsx`
- Create: `packages/dashboard/src/components/boards/BoardFeedbackList.tsx`
- Create: `packages/dashboard/src/components/boards/BoardSubmitForm.tsx`
- Create: `packages/dashboard/src/components/boards/BoardAnnouncements.tsx`
- Create: `packages/dashboard/src/components/boards/BoardFooter.tsx`
- Create: `packages/dashboard/src/components/boards/BoardReportModal.tsx`

This is the largest task. Each component is extracted from the existing monolith with the redesigned warm/friendly aesthetic. Components are client components (`'use client'`).

- [ ] **Step 1: Create BoardHero.tsx**

Immersive branded hero with accent gradient background, stats pills, follow button, owner dashboard link. Receives: `board: BoardInfo`, `feedbackCount`, `voteCount`, `followed`, `viewerSignedIn`, `canModerate`, `onFollowToggle`, `onSubmitClick`. The hero uses the board's `displayName || board.branding.heroTitle || board.title` as the main heading.

Key design: accent-color gradient bg, large logo emoji, display name as h1, tagline, translucent stat pills ("X ideas", "Y votes"), "Share Feedback" CTA, "Follow" button, owner "Dashboard" link in top-right.

- [ ] **Step 2: Create BoardFilters.tsx**

Search input + sort dropdown + type filter pills. Receives: `showTypes`, `filter`, `sort`, `search`, `onFilterChange`, `onSortChange`, `onSearchChange`. Remove "watched" sort option (simplification). Keep: votes, newest, status.

- [ ] **Step 3: Create BoardFeedbackCard.tsx**

Individual feedback card. Extract from existing `FeedbackCard` function. Horizontal card: vote button left, title+snippet+pills center, click to expand with full description + admin comments. Moderation panel only if `canModerate`. Report moved to "..." context menu (three-dot button).

Keep the exact same props/behavior as existing `FeedbackCard` but remove the "Watch" button from the card header (simplification — watches stay as backend feature). Keep the report as a simple text button in the expanded view.

- [ ] **Step 4: Create BoardFeedbackList.tsx**

List container. Receives: `items: FeedbackItem[]`, `emptyStateTitle`, `emptyStateDescription`, `searchQuery`, plus render prop or children for individual cards. Handles the empty state display.

- [ ] **Step 5: Create BoardSubmitForm.tsx**

Extract from existing `SubmitModal`. Same behavior: type pills, textarea, email, honeypot, duplicate suggestions. No changes to logic, just extracted as its own component file.

- [ ] **Step 6: Create BoardAnnouncements.tsx**

Collapsible "Updates" section. Shows announcements with title, body, date, optional link. Collapsed by default if > 2 items. Uses a `details/summary` pattern or state toggle.

- [ ] **Step 7: Create BoardFooter.tsx**

"Powered by feedbacks.dev" link + conditional "Manage Board" link for owner. Receives: `canModerate`, `projectId`.

- [ ] **Step 8: Create BoardReportModal.tsx**

Extract the existing `ReportModal` as-is into its own file. No logic changes.

- [ ] **Step 9: Commit**

```bash
git add packages/dashboard/src/components/boards/
git commit -m "feat: create public board components with warm friendly design"
```

---

## Task 5: Rewrite Public Board Page

**Files:**
- Modify: `packages/dashboard/src/app/p/[slug]/page.tsx`
- Modify: `packages/dashboard/src/app/p/[slug]/public-board.tsx`

- [ ] **Step 1: Update page.tsx to pass `displayName` and `projectId`**

In the `page.tsx` server component, add `display_name` to the board data passed to `PublicBoard`. Also pass `projectId` for the owner dashboard link:

```typescript
// In the board prop object:
displayName: board.display_name || null,
```

Also pass `projectId={board.project_id}` as a separate prop for the footer's dashboard link.

- [ ] **Step 2: Rewrite public-board.tsx**

Replace the 970-line file with a composition of the new components. The new file should:
1. Import all components from `@/components/boards/`
2. Keep the same state management (feedback, comments, votedIds, etc.) in the main `PublicBoard` export
3. Keep the same API call handlers (handleVote, refreshBoard, handleModeration, etc.)
4. Compose the UI from: `BoardHero` → `BoardAnnouncements` → `BoardFilters` → `BoardFeedbackList` (with `BoardFeedbackCard` for each item) → recommended boards section → `BoardFooter`
5. Remove the sidebar (trust signals + moderation text) — the stats are now in the hero pills
6. Remove the "Browse boards" and "Report board" buttons from the hero (report moved to footer "..." or separate link; browse boards is the directory link in footer)
7. Apply the warm, immersive design: accent-color gradient page background, rounded cards with subtle shadows

The main layout changes from `grid xl:grid-cols-[1fr_320px]` (sidebar) to a single centered column `max-w-3xl mx-auto`.

- [ ] **Step 3: Verify the page compiles**

Run: `pnpm type-check`

- [ ] **Step 4: Commit**

```bash
git add packages/dashboard/src/app/p/[slug]/
git commit -m "feat: rewrite public board with component composition and warm design"
```

---

## Task 6: Rebuild Dashboard Board Settings

**Files:**
- Create: `packages/dashboard/src/components/board-settings/BoardSettingsTabs.tsx`
- Create: `packages/dashboard/src/components/board-settings/BoardIdentitySection.tsx`
- Create: `packages/dashboard/src/components/board-settings/BoardContentSection.tsx`
- Create: `packages/dashboard/src/components/board-settings/BoardVisibilitySection.tsx`
- Create: `packages/dashboard/src/components/board-settings/BoardAdvancedSection.tsx`
- Modify: `packages/dashboard/src/app/(dashboard)/projects/[id]/board-settings.tsx`

- [ ] **Step 1: Create BoardSettingsTabs.tsx**

The main tabbed container. Uses native tab pattern (button group + conditional rendering). State: `activeTab: 'identity' | 'content' | 'visibility' | 'advanced'`.

Header shows: board title + live link (copy + external link buttons), stats cards (followers, watches, reports).

Manages all board settings state (same `BoardSettingsState` + `BoardStats` + `BoardReport[]`), the `handleSave` function, and passes down relevant slices to each section.

Add `display_name: string` to `BoardSettingsState`. In `createDefaultSettings`, set `display_name: project.name`. In the `load` effect, read `data.board.display_name || ''`. In `handleSave`, include `display_name` in the PUT body.

- [ ] **Step 2: Create BoardIdentitySection.tsx**

Fields: Display Name (text, 60 char), Slug (auto-generated from display name, editable), Logo Emoji, Accent Color (picker + hex input), Website URL. Receives settings slice + update callback.

Slug auto-generation: when display name changes, slugify and update slug (but only if user hasn't manually edited the slug). Track this with a `slugManuallyEdited` ref.

- [ ] **Step 3: Create BoardContentSection.tsx**

Fields: Hero Eyebrow, Hero Title (defaults to display name), Hero Description, Tagline, Empty State Title, Empty State Description, feedback type checkboxes, allow submissions toggle, announcements editor. Same announcements UI as existing (add/edit/remove).

- [ ] **Step 4: Create BoardVisibilitySection.tsx**

Fields: Enable board toggle, Visibility dropdown (public/unlisted/private), Directory opt-in checkbox, Categories input. Same logic as existing.

- [ ] **Step 5: Create BoardAdvancedSection.tsx**

Fields: Custom CSS textarea + reports queue. Same report management UI as existing (mark reviewed, resolve, dismiss, re-open).

- [ ] **Step 6: Update board-settings.tsx**

Replace the entire file with a thin wrapper:

```typescript
'use client'

import type { Project } from '@/lib/types'
import { BoardSettingsTabs } from '@/components/board-settings/BoardSettingsTabs'

export function BoardSettingsTab({ project }: { project: Project }) {
  return <BoardSettingsTabs project={project} />
}
```

- [ ] **Step 7: Verify compilation**

Run: `pnpm type-check`

- [ ] **Step 8: Commit**

```bash
git add packages/dashboard/src/components/board-settings/ packages/dashboard/src/app/(dashboard)/projects/[id]/board-settings.tsx
git commit -m "feat: rebuild board settings with tabbed UI and display name"
```

---

## Task 7: Create Board Directory Page

**Files:**
- Create: `packages/dashboard/src/app/boards/page.tsx`
- Create: `packages/dashboard/src/app/api/boards/route.ts`

- [ ] **Step 1: Create directory API route**

`packages/dashboard/src/app/api/boards/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { loadBoardDirectoryEntries, sortBoardDirectoryEntries, type BoardSortMode } from '@/lib/board-discovery'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const sort = (searchParams.get('sort') || 'trending') as BoardSortMode
    const category = searchParams.get('category') || ''
    const search = searchParams.get('q') || ''

    let entries = await loadBoardDirectoryEntries()

    if (category) {
      entries = entries.filter((entry) =>
        entry.branding.categories?.includes(category.toLowerCase())
      )
    }

    if (search.trim()) {
      const query = search.toLowerCase()
      entries = entries.filter((entry) =>
        (entry.displayName || entry.title).toLowerCase().includes(query) ||
        entry.description.toLowerCase().includes(query) ||
        entry.branding.tagline?.toLowerCase().includes(query)
      )
    }

    entries = sortBoardDirectoryEntries(entries, sort)

    return NextResponse.json({ boards: entries })
  } catch {
    return NextResponse.json({ error: 'Failed to load boards' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create directory page**

`packages/dashboard/src/app/boards/page.tsx` — SSR page that loads all directory boards and renders them. Contains:
- Hero: "Discover Feedback Boards" with subtitle and search bar
- Filter bar: category pills (aggregated from all boards), sort dropdown
- Grid of board cards: logo emoji, display name, tagline, category tags, feedback count
- Cards link to `/p/[slug]`
- Responsive: 3-col → 2-col → 1-col
- Empty state: "No boards found" with CTA

Uses `loadBoardDirectoryEntries()` for SSR data, with client-side filtering/sorting via query params.

- [ ] **Step 3: Verify the page loads**

Run: `pnpm dev` and navigate to `/boards`

- [ ] **Step 4: Commit**

```bash
git add packages/dashboard/src/app/boards/ packages/dashboard/src/app/api/boards/route.ts
git commit -m "feat: add public board directory page with search and filtering"
```

---

## Task 8: Final Integration & Polish

**Files:**
- Various — connecting everything together

- [ ] **Step 1: Add `.superpowers/` to .gitignore**

Check if `.superpowers/` is already in `.gitignore`. If not, add it.

- [ ] **Step 2: Update the public board recommendations**

In the recommendations section at the bottom of the public board, use `displayName` for card titles instead of just `title`.

- [ ] **Step 3: Type-check the entire project**

Run: `pnpm type-check`

Fix any TypeScript errors.

- [ ] **Step 4: Test the full flow manually**

1. Navigate to dashboard → project → Public Board tab → verify tabbed settings work
2. Set a display name → verify it shows on the public board hero
3. Enable board + set to public + directory opt-in
4. Navigate to `/boards` → verify directory shows the board
5. On the public board: vote on an item, submit feedback, expand a card
6. Verify "Powered by feedbacks.dev" footer appears
7. As board owner: verify "Dashboard" link appears and navigates correctly
8. As non-owner: verify "Dashboard" link is hidden

- [ ] **Step 5: Build check**

Run: `pnpm build`

Fix any build errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: complete boards system overhaul — directory, naming, redesign"
```

---

## Verification Checklist

After all tasks are complete:

1. **`pnpm type-check`** — must pass with no errors
2. **`pnpm build`** — must build successfully
3. **Public board** (`/p/[slug]`) — renders with new warm design, hero with stats, voting works, submit works, footer shows powered-by
4. **Board settings** (`/projects/[id]?tab=board`) — shows 4 tabs (Identity, Content, Visibility, Advanced), save works, display name persists
5. **Board directory** (`/boards`) — shows public boards with search/filter, cards link to individual boards
6. **Owner navigation** — logged-in owner sees "Dashboard" link on public board footer
7. **Display name** — shows in hero, directory cards, browser tab title
8. **No regressions** — voting, submissions, moderation, reports, announcements all still work

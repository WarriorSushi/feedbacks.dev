# Boards System Overhaul — Design Spec

**Date:** 2026-03-26
**Status:** Approved
**Approach:** Full Redesign + Board Discovery (Approach C)

## Overview

Redesign the entire boards system: public board page, dashboard settings, navigation, custom naming, and a new public board directory. The current public board is a 970-line monolith with a cluttered UI. The redesign breaks it into focused components, simplifies the UX, adds warmth and personality, and introduces discoverability.

## Design Decisions

- **1 project = 1 board**, with a custom display name
- **Immersive List layout** for the public board — branded hero with stats, search bar, vote sidebar, CTA button
- **Warm & friendly aesthetic** — like ProductHunt meets Nolt
- **Powered-by footer** + owner-only dashboard link for navigation
- **Board directory** at `/boards` for discovery

---

## 1. Data Model Changes

### New column on `public_board_settings`

```sql
ALTER TABLE public_board_settings
  ADD COLUMN IF NOT EXISTS display_name TEXT;
```

- `display_name`: Human-friendly product/project name shown on the board hero, browser tab, and directory card
- Falls back to `projects.name` if null
- Max 60 characters, validated in API route and form
- Set during board setup or in Identity settings tab

### No other schema changes needed

Existing columns cover everything:
- `slug` — URL identifier
- `title` — hero headline (can differ from display_name)
- `visibility` — public/unlisted/private
- `directory_opt_in` — controls directory listing
- `accent_color`, `logo_emoji`, `tagline`, etc. — branding

---

## 2. Public Board Page (`/p/[slug]`) — Redesign

### Layout (top to bottom)

1. **Branded Hero Section**
   - Accent-colored gradient background (from `accent_color`)
   - Logo emoji (large)
   - Display name (h1, bold)
   - Tagline (subtitle)
   - Stats row: "X ideas" + "Y votes" in translucent pills
   - If owner is logged in: small "Dashboard" link in top-right corner
   - Optional: "Follow" button for authenticated users

2. **Search + Filters Bar**
   - Search input with icon
   - Sort dropdown: Top Voted (default), Newest, By Status
   - Type filter pills: All, Ideas, Bugs, Questions, Praise (based on `show_types`)

3. **Feedback List**
   - Each item is a horizontal card:
     - Left: Vote button (upvote arrow + count), visually prominent
     - Center: Title (first line of message), preview snippet (truncated), type pill + status pill + relative time
     - Click to expand: full description + admin comments thread
   - Empty state: Custom message from `empty_state_title` / `empty_state_description`

4. **Announcements** (if any exist)
   - Collapsible "Updates" section above or below the feedback list
   - Each announcement: title, body, date, optional link
   - Collapsed by default if more than 2

5. **Submit Feedback**
   - Prominent CTA button: "Share Your Feedback"
   - Expands to inline form: type selector (pills), title input, description textarea, optional email
   - Duplicate detection: shows suggestions before submitting
   - Honey pot spam protection (existing)

6. **Footer**
   - "Powered by feedbacks.dev" — links to feedbacks.dev landing page
   - If owner is logged in: "Manage Board" link to dashboard

### Simplifications from Current

- **Removed from main UI:** Follow/watch toggle complexity (simplified to single Follow button on hero)
- **Moved to "..." menu:** Report functionality (per-item and board-level)
- **Removed from public board:** Inline moderation controls (stay in dashboard only)
- **Announcements:** Moved from prominent panel to collapsible section

### Component Architecture

```
packages/dashboard/src/components/boards/
  BoardLayout.tsx          — page wrapper, accent color theming
  BoardHero.tsx            — branded hero with stats, owner link
  BoardFilters.tsx         — search + sort + type pills
  BoardFeedbackList.tsx    — list container with loading/empty states
  BoardFeedbackCard.tsx    — individual item with vote, expand, tags
  BoardSubmitForm.tsx      — feedback submission form
  BoardAnnouncements.tsx   — collapsible updates section
  BoardFooter.tsx          — powered-by + owner nav
```

The current 970-line `public-board.tsx` will be replaced by `BoardLayout.tsx` composing these components.

---

## 3. Dashboard Board Settings — Redesign

### Structure: 4 Tabbed Sections

Replace the current single-scroll form with tabs.

**Header (always visible):**
- Board title + live link (clickable, with copy button)
- Stats cards: Followers, Watched Posts, Open Reports

**Tab 1: Identity**
- Display Name (text, 60 char max) — the public product name
- Slug (auto-generated from display name, editable) — the URL path
- Logo Emoji (emoji picker)
- Accent Color (color picker + hex input)
- Website URL (optional)

**Tab 2: Content**
- Hero Eyebrow text
- Hero Title (defaults to display name)
- Hero Description
- Tagline
- Empty State Title + Description
- Feedback Types to show (checkboxes: Idea, Bug, Praise, Question)
- Allow Public Submissions (toggle)
- Announcements editor (add/edit/remove/reorder)

**Tab 3: Visibility**
- Enable Board (master toggle)
- Visibility: Public / Unlisted / Private
- Include in Public Directory (checkbox, only when Public)
- Categories (comma-separated tags for directory)

**Tab 4: Advanced**
- Custom CSS editor (6000 char limit, sanitized)
- Reports & Trust Queue (list of open reports with actions)

### Component Architecture

```
packages/dashboard/src/components/board-settings/
  BoardSettingsTabs.tsx        — tab container
  BoardIdentitySection.tsx     — display name, slug, logo, color, URL
  BoardContentSection.tsx      — hero text, types, submissions, announcements
  BoardVisibilitySection.tsx   — enable, visibility, directory, categories
  BoardAdvancedSection.tsx     — CSS, reports queue
```

The current `board-settings.tsx` monolith will be replaced.

---

## 4. Board Directory (`/boards`)

### New public route

**URL:** `/boards`
**Access:** Public (no auth required)

### Layout

1. **Hero Section**
   - "Discover Feedback Boards"
   - "See what products are building based on user feedback"
   - Search bar (searches by name, tagline, categories)

2. **Filter/Sort Bar**
   - Category filter pills (aggregated from all boards)
   - Sort: Most Active, Newest, Alphabetical

3. **Board Grid**
   - Responsive: 3-col desktop, 2-col tablet, 1-col mobile
   - Each card shows:
     - Logo emoji (large)
     - Display name (bold)
     - Tagline (truncated)
     - Category tags (pills)
     - Feedback count
     - Accent color as subtle card border or background tint
   - Click → navigates to `/p/[slug]`

4. **Empty State**
   - "No boards yet. Create your own!" with CTA to sign up

### Data Source

```sql
SELECT pbs.*, p.name as project_name,
  (SELECT count(*) FROM feedback f WHERE f.project_id = pbs.project_id AND f.is_public = true) as feedback_count
FROM public_board_settings pbs
JOIN projects p ON p.id = pbs.project_id
WHERE pbs.enabled = true
  AND pbs.visibility = 'public'
  AND pbs.directory_opt_in = true
ORDER BY feedback_count DESC;
```

### API Route

`GET /api/boards` — returns paginated list of public directory boards with feedback counts.

---

## 5. Custom Board Naming Flow

### During Project Creation

Current flow: "Project Name" → create
New flow: "Project Name" + optional "Public Board Name" → create

- If "Public Board Name" is provided, it's saved as `display_name` on `public_board_settings`
- If left blank, `display_name` stays null and falls back to project name

### In Board Settings (Identity Tab)

- "Display Name" field with helper text: "The name users see on your public board"
- Slug auto-generates from display name (debounced, with uniqueness check)
- Display name appears in: board hero, browser tab title, directory card, social sharing meta

### Display Priority

1. `public_board_settings.display_name` (if set)
2. `public_board_settings.title` (if set, for backwards compat)
3. `projects.name` (final fallback)

---

## 6. Navigation Flow

### Public Board → Dashboard (Owner Only)

- **Top-right corner of hero:** Small "Dashboard" text link (only rendered when current user = project owner)
- **Footer:** "Manage Board" link (only rendered when current user = project owner)
- Links to `/projects/[id]?tab=board`

### Public Board → feedbacks.dev (Everyone)

- **Footer:** "Powered by feedbacks.dev" — links to `https://feedbacks.dev`

### Dashboard → Public Board

- **Board settings header:** Live board URL with external link icon
- Existing behavior, just make it more prominent

### Board Directory → Individual Board

- Card click → `/p/[slug]`

---

## 7. Error Handling

- **Board not found:** 404 page with "Board doesn't exist" message
- **Board disabled/private:** 403 with "This board is not available" message
- **Rate limits:** Toast notifications for vote/submission limits
- **Duplicate detection:** Show suggestions inline before submitting
- **Empty states:** Custom messages per board, with sensible defaults

---

## 8. Testing Strategy

- **Component tests:** Each new component gets basic render tests
- **API route tests:** Board directory endpoint, display_name in existing endpoints
- **E2E:** Create board → set display name → view public board → verify name shows → check directory listing
- **Migration test:** Verify `display_name` column addition doesn't break existing boards (null fallback)

---

## 9. Files to Create/Modify

### New Files
- `packages/dashboard/src/components/boards/BoardLayout.tsx`
- `packages/dashboard/src/components/boards/BoardHero.tsx`
- `packages/dashboard/src/components/boards/BoardFilters.tsx`
- `packages/dashboard/src/components/boards/BoardFeedbackList.tsx`
- `packages/dashboard/src/components/boards/BoardFeedbackCard.tsx`
- `packages/dashboard/src/components/boards/BoardSubmitForm.tsx`
- `packages/dashboard/src/components/boards/BoardAnnouncements.tsx`
- `packages/dashboard/src/components/boards/BoardFooter.tsx`
- `packages/dashboard/src/components/board-settings/BoardSettingsTabs.tsx`
- `packages/dashboard/src/components/board-settings/BoardIdentitySection.tsx`
- `packages/dashboard/src/components/board-settings/BoardContentSection.tsx`
- `packages/dashboard/src/components/board-settings/BoardVisibilitySection.tsx`
- `packages/dashboard/src/components/board-settings/BoardAdvancedSection.tsx`
- `packages/dashboard/src/app/boards/page.tsx` — board directory page
- `packages/dashboard/src/app/api/boards/route.ts` — directory API endpoint
- `sql/008_board_display_name.sql` — migration

### Modified Files
- `packages/dashboard/src/app/p/[slug]/public-board.tsx` — replace with component composition
- `packages/dashboard/src/app/p/[slug]/page.tsx` — update to pass display_name
- `packages/dashboard/src/app/(dashboard)/projects/[id]/board-settings.tsx` — replace with tabbed settings
- `packages/dashboard/src/app/api/boards/[slug]/route.ts` — include display_name in response
- `packages/dashboard/src/app/api/projects/[id]/board/route.ts` — handle display_name in GET/PUT
- `packages/dashboard/src/lib/types.ts` — add display_name to board types
- `packages/dashboard/src/lib/public-board.ts` — add display_name to branding parsing

### Deleted Files
- None (old files get replaced in-place)

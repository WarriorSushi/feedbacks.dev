# Frontend UX/UI Review — feedbacks.dev
**Reviewer:** Claude Sonnet 4.6 (automated)
**Date:** 2026-03-17
**Scope:** All pages and components under `packages/dashboard/src/`

---

## Summary

feedbacks.dev has a solid design foundation — consistent use of shadcn/ui, a cohesive indigo brand palette, well-thought-out loading skeletons, and a genuinely premium-feeling auth page. The dashboard page and public board are the strongest areas. The biggest gaps are in error handling (API failures are silently swallowed across almost every mutation), accessibility (several interactive elements lack labels), and a handful of UX flow issues that will confuse new users.

---

## 1. Accessibility (a11y)

### CRITICAL — Silent error swallowing hides failures from screen reader users and everyone else
Multiple `await supabase.from(...).update(...)` calls in `feedback-actions.tsx`, `project-tabs.tsx` (CustomizeTab, IntegrationsTab, SettingsTab), and `board-settings.tsx` never check the returned `error` object. If the mutation fails, no feedback is given. This is both an a11y problem (screen readers get nothing) and a functional bug.

**Files affected:**
- `app/(dashboard)/feedback/[id]/feedback-actions.tsx` — `handleStatusChange` and `handleAddNote` do not handle errors
- `app/(dashboard)/projects/[id]/project-tabs.tsx` — `CustomizeTab.handleSave`, `IntegrationsTab.handleSave`, `SettingsTab.handleSave` and `handleDelete`
- `app/(dashboard)/projects/[id]/board-settings.tsx` — `handleSave`
- `app/(dashboard)/settings/page.tsx` — `handleSaveProfile` and `handleDeleteAccount`

### HIGH — Missing `aria-label` on icon-only and ambiguous buttons
- `app/page.tsx` (landing): The close button in `WidgetDemo` (`<button className="...">✕</button>`) has no `aria-label`.
- `app/(dashboard)/projects/[id]/project-tabs.tsx` `ApiKeyBadge`: The copy button wrapping a Badge has no `aria-label` — screen readers will read the truncated key text as the button name.
- `app/(dashboard)/projects/[id]/api-docs.tsx` `CopyButton`: Returns "Copied!" / "Copy" text which is fine, but the individual code block buttons are positioned absolutely on top of `<pre>` content without being announced as "Copy [section name]".
- `app/(dashboard)/feedback/page.tsx`: The "Clear" filter button uses only an `<X>` icon + text "Clear", which is fine, but the individual `FilterPill` buttons have no `role` or `aria-pressed` attribute to communicate toggle state to screen readers.

### HIGH — No `role="dialog"` or focus trap on the public board submit modal
`app/p/[slug]/public-board.tsx` `SubmitModal`: The modal is a fixed-position `<div>` with no `role="dialog"`, no `aria-modal="true"`, no `aria-labelledby`, and no focus trap. When opened, focus is not moved into the modal, and Tab will cycle through the entire page behind the backdrop. This breaks keyboard navigation completely for modal workflows.

### HIGH — `select` elements in multiple places lack `id`/`aria-labelledby` pairing
- `feedback-actions.tsx`: The status-change `<select>` has an associated `<label>` but no `id` attribute on the select, so the label association is visual only.
- `project-tabs.tsx` `CustomizeTab`: The position `<select>` has a `<Label>` component above it but no `htmlFor`/`id` pairing.
- `public-board.tsx`: The sort `<select>` has no visible label and no `aria-label`.

### MEDIUM — Sidebar collapse state not communicated to assistive technology
`components/sidebar.tsx`: When collapsed, nav items use `title` attribute for tooltips (fine for mouse users) but there is no `aria-label` on the link elements themselves in collapsed state. The icon-only links in the collapsed sidebar will be announced as unlabeled interactive elements by screen readers.

### MEDIUM — Mobile bottom nav items have no `aria-current`
`components/sidebar.tsx`: The bottom nav `<Link>` elements use visual styling to indicate active state but have no `aria-current="page"` attribute.

### MEDIUM — Missing `aria-live` region for bulk action feedback
`app/(dashboard)/feedback/page.tsx`: Bulk status updates succeed silently. There is no `aria-live` region that announces completion to screen readers.

### MEDIUM — `<form>` label association gaps in settings
`app/(dashboard)/settings/page.tsx`: The email `<Input>` and display name `<Input>` have `<Label>` components above them but no `htmlFor`/`id` pairing in the JSX (Label components from shadcn use `htmlFor` prop, but no `id` is passed to the Input). The connection relies on DOM proximity, which is unreliable.

### LOW — `<h1>` on auth page is in the decorative left panel, not the form panel
`app/auth/page.tsx`: The `<h1>` ("Feedback that fits your workflow.") lives in the decorative left panel which is `hidden` on mobile. On mobile, the form's heading `<h2>` becomes the de facto first heading — document outline is broken on small screens.

### LOW — Focus management after bulk action not restored
After bulk actions complete and the floating bar disappears, focus is left on whatever was last focused — not moved to a logical place (e.g., the list or a status announcement).

---

## 2. Mobile Responsiveness

### HIGH — Project tabs overflow horizontally on small screens
`app/(dashboard)/projects/[id]/project-tabs.tsx`: The tab bar is `flex gap-1 border-b` with 6 tabs ("Install", "Customize", "Integrations", "Public Board", "API", "Settings"). On a 375px screen, these will overflow without scrolling since there is no `overflow-x-auto` and no wrapping. The user cannot access all tabs.

### HIGH — API docs code blocks overflow on mobile
`app/(dashboard)/projects/[id]/api-docs.tsx` `CodeBlock`: The `<pre>` block has `overflow-x-auto` but the copy button is absolutely positioned `right-2 top-2` — on small screens the copy button can overlap code content making it unreadable.

### MEDIUM — `pb-24` bottom padding on feedback page may be insufficient on iOS
`app/(dashboard)/feedback/page.tsx`: The page has `pb-24` to clear the floating bulk action bar. On iOS with home indicator, `env(safe-area-inset-bottom)` is not accounted for in this padding, so content may be obscured.

### MEDIUM — Dashboard stat cards break into 2-col on mobile, 5 total
`app/(dashboard)/dashboard/page.tsx`: `grid-cols-2` for 5 cards means the 5th card is a lone card on a row, which can look unbalanced on narrow screens. Not critical but visually awkward.

### MEDIUM — Landing page hero on very small screens
`app/page.tsx`: The hero section stacks to `flex-col`, but the `WidgetDemo` component is `w-72 sm:w-80`. On screens narrower than 288px the card may overflow. Negligible in practice but worth noting.

### LOW — Board settings slug preview uses `window.location.origin`
`app/(dashboard)/projects/[id]/board-settings.tsx`: The board URL preview is only shown when `settings.enabled && settings.slug` — the URL cannot be previewed before saving. New users cannot verify the URL will be correct before going live.

---

## 3. Loading States

### MEDIUM — No loading state for project detail page (project-tabs.tsx)
`app/(dashboard)/projects/[id]/page.tsx`: There is a loading skeleton for `/feedback` (`loading.tsx`) and `/dashboard` (`loading.tsx`) but no `loading.tsx` in `projects/[id]/`. The project detail page — which is relatively heavy — will show nothing until the server component resolves.

### MEDIUM — `BoardSettingsTab` loading spinner is minimal
`app/(dashboard)/projects/[id]/board-settings.tsx`: While loading existing board settings, only a bare Loader2 spinner is shown with no skeleton that matches the form shape. This causes layout shift when the form appears.

### MEDIUM — Settings page uses full-page spinner, no skeleton
`app/(dashboard)/settings/page.tsx`: The entire page shows a loading spinner while fetching the user profile. A form skeleton matching the actual layout would reduce perceived load time.

### LOW — Dashboard sparkline bars use `Math.random()` in loading skeleton
`app/(dashboard)/loading.tsx` line 21: `style={{ height: `${20 + Math.random() * 60}%` }}` — this causes different bar heights on every render/hydration, which causes a hydration mismatch warning in development and unpredictable visual on production.

---

## 4. Error Handling

### CRITICAL — Mutations swallow errors silently (see Accessibility section above)
This is the single most impactful issue. When Supabase writes fail (network error, RLS policy, quota exceeded), the UI either shows nothing or the `saving` spinner disappears without any confirmation or error. Users cannot tell if their changes were saved.

**Affected mutations (not exhaustive):**
- Status change on feedback detail
- Add internal note
- Save widget customization
- Save integrations (webhooks)
- Save project settings
- Delete project
- Save board settings
- Save user profile

### HIGH — Bulk status update in feedback inbox has no error handling
`app/(dashboard)/feedback/page.tsx` `bulkUpdateStatus`: The `await supabase.from('feedback').update(...)` result is not checked. If any items fail to update, the list simply refreshes — the user may see no change and not know why.

### HIGH — New project creation error is shown but generic
`app/(dashboard)/projects/new/page.tsx`: `setError(err.message)` shows Supabase's raw error message, which may include internal detail like "duplicate key value violates unique constraint 'projects_api_key_key'". This should be translated into a user-friendly message.

### HIGH — handleDeleteAccount in settings does not actually delete the account
`app/(dashboard)/settings/page.tsx` `handleDeleteAccount`: The function only calls `supabase.auth.signOut()` and redirects. It does not delete the user's account or data. The UI says "Permanently delete your account and all associated data" — this is misleading and a potential trust issue.

### MEDIUM — Vote failure on public board is silently ignored
`app/p/[slug]/public-board.tsx` `handleVote`: If `!res.ok`, the function simply returns without showing any error to the user. The vote count does not update and the user gets no feedback.

### MEDIUM — Public board submit modal shows error but has no retry/dismiss UX
`app/p/[slug]/public-board.tsx` `SubmitModal`: Error state is shown correctly but there is no "Dismiss" or "Try again" action — the user must manually re-submit, which may re-trigger the same error.

### LOW — `handleSignOut` in sidebar has no error handling
`components/sidebar.tsx`: If sign-out fails, the `router.push('/auth')` still fires, leaving the user in a broken auth state.

---

## 5. Empty States

### MEDIUM — Projects list empty state is bare
`app/(dashboard)/projects/page.tsx`: Empty state is just `<p className="mb-4 text-muted-foreground">No projects yet.</p>` with a CTA button. There is no icon, no explanation of what a project is, and no guidance on what to do first. Compare to the dashboard's empty state which has an emoji, explanation, and a clear CTA — the projects page falls short of this standard.

### MEDIUM — Feedback detail sidebar shows nothing when metadata is absent
`app/(dashboard)/feedback/[id]/page.tsx`: If a feedback item has no email, no rating, no URL, no user_agent, and no tags, the Details card shows only the project link (or nothing if project is also missing). An empty card with just a "Details" heading and a lone divider looks broken.

### LOW — Notes empty state is just text
`app/(dashboard)/feedback/[id]/page.tsx`: "No notes yet." is plain text with no visual cue or prompt to add a note. Given the `FeedbackActions` note form is directly below, this is a minor issue.

---

## 6. Navigation Flow

### HIGH — Project switcher in sidebar has no connection to current page context
`components/sidebar.tsx`: `currentProjectId` is passed as a prop from the layout, but `layout.tsx` never actually passes `currentProjectId`. The layout only passes `user` and `projects` — `currentProjectId` will always be `undefined`, so the sidebar always shows the first project as "active" regardless of what the user is viewing.

```tsx
// layout.tsx — currentProjectId is never passed
<Sidebar
  user={{ ... }}
  projects={(projects as Project[]) || []}
/>
// Missing: currentProjectId={someId}
```

### HIGH — No success feedback after saving settings
Throughout `project-tabs.tsx`, `board-settings.tsx`, and `settings/page.tsx`, saving calls `router.refresh()` on success but shows no toast, banner, or visual confirmation. Users cannot tell their changes were persisted.

### MEDIUM — "Back to inbox" loses filter state
`app/(dashboard)/feedback/[id]/page.tsx`: The back link is a hardcoded `/feedback` href. If the user navigated from `/feedback?status=new&type=bug`, pressing Back returns them to the unfiltered inbox. This is disorienting when triaging filtered sets.

### MEDIUM — Tab state in project detail is not URL-persisted
`app/(dashboard)/projects/[id]/project-tabs.tsx`: The active tab is component state — refreshing or sharing the URL always lands on the "Install" tab regardless of what was last viewed. Users cannot deep-link to, e.g., the Integrations tab.

### MEDIUM — No breadcrumb on feedback detail page
`app/(dashboard)/feedback/[id]/page.tsx`: The only navigation element is "Back to inbox". If the user arrived from the dashboard's "Recent Activity" section, there is no indication of where they are or how to get back to the dashboard. The feedback page has no H1 title — the feedback content itself is not headed.

### LOW — Landing page footer GitHub link has no accessible label
`app/page.tsx`: The footer GitHub icon link has no text content and no `aria-label`, so screen readers announce it as an unlabeled link.

### LOW — Privacy policy GitHub contact link is broken
`app/privacy/page.tsx`: The contact link points to `https://github.com` (root), not the actual repository.

---

## 7. Form Validation

### HIGH — Delete project confirmation does not match stated requirement
`app/(dashboard)/projects/[id]/project-tabs.tsx` `SettingsTab`: The UI says "Type the project name to confirm" but there is no input field to type the project name — it proceeds directly to a "Confirm Delete" button. This is a security gap for an irreversible destructive action.

### HIGH — Same issue in settings/page.tsx for account deletion
`app/(dashboard)/settings/page.tsx`: Same pattern — states the action is "irreversible" but provides no confirmation input, only a second button click. The `handleDeleteAccount` function does not even delete the account (see Error Handling section).

### MEDIUM — Webhook URL inputs have no format validation
`app/(dashboard)/projects/[id]/project-tabs.tsx` `IntegrationsTab`: Slack, Discord, and generic webhook URLs are saved without any client-side format validation. An invalid URL will be stored and only fail at delivery time, with no immediate feedback.

### MEDIUM — Board slug field silently transforms input
`app/(dashboard)/projects/[id]/board-settings.tsx`: The slug field uses `slugify()` on every keystroke via `onChange`. Typing "My App" immediately becomes "my-app" mid-input. While correct, this silent transformation can be confusing — a hint below the field explaining the transformation would help.

### LOW — Search form in feedback inbox requires Enter key submit
`app/(dashboard)/feedback/page.tsx`: There is a search form, but there is no submit button visible. The user must press Enter, which is not obvious. The clear button (X) appears only after typing, which helps — but the initial affordance is weak.

---

## 8. Performance

### MEDIUM — Dashboard page fetches 8 parallel Supabase queries, one un-paginated
`app/(dashboard)/dashboard/page.tsx`: The `typeDist` query (`supabase.from('feedback').select('type').eq('is_archived', false)`) fetches all feedback types with no limit. On accounts with thousands of feedback items, this returns potentially large amounts of data just to count types. A `select('type', { count: 'exact', head: true })` per type, or a server-side aggregate, would be more efficient.

### MEDIUM — `Math.random()` in loading skeleton causes hydration mismatch
`app/(dashboard)/loading.tsx`: As noted above, random heights in the loading skeleton cause React hydration mismatches on every load.

### MEDIUM — `WidgetDemo` autoplay timer is not paused on tab visibility change
`app/page.tsx` `WidgetDemo`: The `setInterval` runs regardless of whether the tab is visible. On a low-end device, this wastes CPU. `document.addEventListener('visibilitychange')` could pause it.

### LOW — `CodeSnippet` re-renders fully on tab switch
`components/code-snippet.tsx`: No `React.memo` or `useMemo` on the code content. For the API docs page with multiple large code blocks this is fine at current scale, but worth noting.

### LOW — `createClient()` in `React.useMemo` is correct, but spread across every component
Multiple components call `React.useMemo(() => createClient(), [])` independently. If `createClient()` is heavyweight, a React context would be more efficient. At current scale this is acceptable.

---

## 9. Consistency

### HIGH — Two different design languages: dashboard vs. public board
The dashboard uses the project's indigo/HSL CSS variable system with shadcn/ui components. The public board (`public-board.tsx`) uses raw Tailwind with hardcoded `gray-*` colors, `border-gray-200`, `bg-white`, etc. This means dark mode support and the brand palette are inconsistent between the two surfaces.

### HIGH — Two different select element patterns
Some select elements use the native `<select>` with manual styling (`feedback-actions.tsx`, `project-tabs.tsx`, `public-board.tsx`) while the project has a shadcn `Select` component available. The native selects don't match the input field style or respect the design system theme tokens.

### MEDIUM — Status colors defined in three places with slight differences
`getStatusColor()` in `lib/utils.ts`, `statusMeta` in `feedback/page.tsx`, and `statusDotColor` in `feedback/[id]/page.tsx` all define status-to-color mappings independently. `feedback/[id]/page.tsx` uses `'planned': 'bg-purple-500'` while `feedback/page.tsx` uses `'planned': { dot: 'bg-violet-500' }` — subtle but inconsistent.

### MEDIUM — Heading hierarchy inconsistent across pages
- Dashboard page: `<h1>` text-xl
- Projects page: `<h1>` text-2xl
- Feedback inbox: `<h1>` text-xl
- Settings page: `<h1>` text-2xl
- Project detail: `<h1>` text-2xl (from project-tabs)

The font size and weight are inconsistent. Dashboard uses `font-semibold` while projects/settings use `font-bold`.

### MEDIUM — Empty state design quality varies significantly
Dashboard and feedback inbox have polished empty states with emojis, explanations, and CTAs. The projects list empty state, feedback detail metadata sidebar, and notes section are substantially thinner.

### LOW — `getTypeIcon()` returns emoji strings, used both as React children and in template strings
In some places the emoji is wrapped in `<span role="img">` (dashboard), in others it's bare text (feedback inbox FeedbackRow), and in others it's a JSX expression concatenated with text. The inconsistency in how emojis are used for icons affects screen reader pronunciation.

---

## 10. User Flow Gaps

### CRITICAL — New user onboarding has no guided flow
After sign-up, the user lands on `/dashboard` which shows an empty state with "Install the widget to start collecting feedback." The CTA button says "Create a project". After creating a project, the user lands on the Install tab. There is no:
- Step indicator or onboarding checklist
- Tooltip or callout pointing to the API key
- Explanation of what "data-project" means in the code snippet
- Link from the Install tab to the widget demo or documentation

A new developer can complete sign-up and create a project but may not understand how to go from the code snippet to seeing feedback in their inbox.

### HIGH — No way to navigate from feedback item back to project
`app/(dashboard)/feedback/[id]/page.tsx`: The metadata sidebar shows the project name as a link to `/projects/[id]`, but the primary nav only shows "Back to inbox". There is no breadcrumb like Inbox > [Project Name] > Feedback Item. If the user clicked through from the dashboard and wants to get to the project settings, they must navigate via the sidebar, not the page.

### HIGH — Widget demo page does not exist
`app/widget-demo/page.tsx` was listed in the review scope but does not exist. The landing page's `WidgetDemo` component is an inline fake widget. If there was ever a `/widget-demo` route it is gone. No impact on users unless it is linked somewhere.

### MEDIUM — No confirmation or success state after new project creation
`app/(dashboard)/projects/new/page.tsx`: On success, the user is immediately redirected to the project detail page. There is no "Project created!" message or toast. The Install tab appears without context — users may wonder if creation succeeded.

### MEDIUM — "Email notifications for new feedback" setting is not wired up
`app/(dashboard)/settings/page.tsx`: `emailNotifs` state is toggled but never saved (no `supabase` call on checkbox change or in `handleSaveProfile`). This is a dead UI element.

### MEDIUM — Public board: no "sign in to vote with persistent identity" option
`app/p/[slug]/public-board.tsx`: Votes are tracked in `localStorage`. Clearing localStorage loses all vote history. There is no CTA to sign in for persistent tracking, even though the system supports it.

### LOW — The "Notifications" section in Settings hints at email notifications but no actual notification system exists in the visible codebase
The settings checkbox says "Email notifications for new feedback" but there is no visible email sending code. This may frustrate users who enable it and never receive emails.

---

## 11. Dark Mode

### HIGH — Public board uses hardcoded `bg-white` and `text-gray-*` in some spots
`app/p/[slug]/public-board.tsx` `FeedbackCard`: `bg-white` is hardcoded alongside `dark:bg-gray-900` — this is correct on the card itself, but the SubmitModal's textarea and email input use `bg-white dark:bg-gray-800` which are hardcoded Tailwind colors, not design system tokens. These will not respect the project's custom CSS variable palette.

### MEDIUM — Board settings toggle uses hardcoded colors
`app/(dashboard)/projects/[id]/board-settings.tsx`: The custom toggle switch uses `bg-gray-200 peer-checked:bg-indigo-600 dark:bg-gray-700` — hardcoded colors rather than CSS variable tokens. It will look inconsistent on screens where the project palette has been customized.

### MEDIUM — Landing page install strip is hardcoded dark
`app/page.tsx`: The install section uses `bg-zinc-950 dark:bg-zinc-900`. In light mode this renders correctly as a dark section, but in dark mode the background barely changes. The contrast between the section and the page becomes very low.

### LOW — Auth page left panel uses hardcoded HSL values
`app/auth/page.tsx`: `bg-[hsl(238_40%_10%)]` is a hardcoded value that bypasses the CSS variable system entirely. This is fine as a design choice (the panel is always dark) but means it cannot respond to any future theming.

---

## 12. Typography

### MEDIUM — Extremely small text in multiple places
Several UI elements use `text-[9px]` and `text-[10px]` which fall well below WCAG's recommended minimum of 12px for supplementary text:
- Dashboard stat card labels: `text-[10px] font-semibold uppercase` — borderline but acceptable with the font weight
- Feedback row meta: `text-[10px]` separators and type badges
- Bar chart day labels: `text-[9px]` — this is almost certainly below readable threshold on standard displays
- Dashboard unread count badge in header: `text-[9px]`

### MEDIUM — Line height not set on feedback message in detail view
`app/(dashboard)/feedback/[id]/page.tsx`: `whitespace-pre-wrap text-sm leading-relaxed` — `leading-relaxed` is 1.625, which is fine. But for multi-paragraph feedback with code blocks or long lines, there is no max-width constraint on the message text in the main column. Very long lines on wide screens will have poor readability.

### LOW — Inconsistent font weights for page headings
Dashboard uses `font-semibold` for its h1; Projects, Settings, and Project Detail use `font-bold`. The difference is subtle but creates a slight visual inconsistency across the app.

### LOW — Auth footer text is `text-[11px] text-muted-foreground/70`
`app/auth/page.tsx`: The terms and privacy links at the bottom use 11px text at 70% opacity. This likely fails WCAG AA contrast ratio for body text.

---

## Prioritized Fix List

| # | Finding | Severity | File |
|---|---------|----------|------|
| 1 | Silent error swallowing on all mutations | CRITICAL | Multiple |
| 2 | Delete project confirmation has no name-match input | HIGH | project-tabs.tsx |
| 3 | Delete account doesn't actually delete | HIGH | settings/page.tsx |
| 4 | No focus trap on public board submit modal | HIGH | public-board.tsx |
| 5 | Project tabs overflow on mobile | HIGH | project-tabs.tsx |
| 6 | `currentProjectId` never passed to Sidebar | HIGH | layout.tsx |
| 7 | No success toast/confirmation after saving settings | HIGH | Multiple |
| 8 | New user onboarding has no guided flow | CRITICAL | New work needed |
| 9 | Email notifications checkbox is non-functional | MEDIUM | settings/page.tsx |
| 10 | Tab state not URL-persisted in project detail | MEDIUM | project-tabs.tsx |
| 11 | Two design languages (dashboard vs. public board) | HIGH | public-board.tsx |
| 12 | Native `<select>` inconsistency with design system | HIGH | Multiple |
| 13 | `Math.random()` in loading skeleton | MEDIUM | loading.tsx |
| 14 | Missing `loading.tsx` for projects/[id] | MEDIUM | New file needed |
| 15 | Status colors defined 3x with inconsistencies | MEDIUM | utils.ts + pages |
| 16 | `text-[9px]` bar chart labels below readable threshold | MEDIUM | dashboard/page.tsx |
| 17 | "Back to inbox" loses filter state | MEDIUM | feedback/[id]/page.tsx |
| 18 | Board slug transform is silent with no hint text | MEDIUM | board-settings.tsx |
| 19 | Missing `aria-label` on icon-only buttons | HIGH | Multiple |
| 20 | Missing `aria-current="page"` on mobile bottom nav | MEDIUM | sidebar.tsx |

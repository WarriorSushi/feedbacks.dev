# Frontend UX Fix Status

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 1 | Silent error swallowing on ALL mutations | Done | Added toast.error/toast.success to all mutation handlers in feedback-actions, project-tabs, board-settings, settings/page, feedback/page |
| 2 | Account deletion is fake | Done | Replaced delete section with "contact support" note |
| 3 | Delete project confirmation has no name-match input | Done | Added text input that must match project.name before enabling delete |
| 4 | No success toast after saving | Done | Covered by #1 — all save operations now show toast.success |
| 5 | Project tabs overflow on mobile | Done | Added overflow-x-auto to container, flex-shrink-0 whitespace-nowrap to tabs |
| 6 | Public board submit modal no focus trap | Done | Added role="dialog", aria-modal, aria-labelledby, focus trap (Tab key), Escape to close, focus restore on close |
| 7 | Missing aria-labels on icon-only buttons | Done | Added aria-labels to: WidgetDemo close, ApiKeyBadge copy, CopyButton in api-docs, FilterPill aria-pressed, footer GitHub link |
| 8 | currentProjectId never passed to Sidebar | Done | layout.tsx now extracts project ID from URL path via headers and passes as prop |
| 9 | Two design languages: dashboard vs public board | Done | Replaced hardcoded bg-white/text-gray-*/border-gray-* with bg-card/bg-background/text-foreground/text-muted-foreground/border in public-board.tsx |
| 10 | Native select inconsistency | Skipped | shadcn Select component not installed in project. Would require adding new dependency; native selects now have proper id/aria-label attributes instead |
| 11 | Status colors defined 3x | Done | Consolidated into statusConfig map in lib/utils.ts, imported in feedback/page.tsx and feedback/[id]/page.tsx |
| 12 | Math.random() in loading skeleton | Done | Replaced with deterministic heights array [30, 60, 45, 80, 25, 55, 70] |
| 13 | Missing loading.tsx for projects/[id] | Done | Created projects/[id]/loading.tsx with skeleton |
| 14 | Board slug silent transform | Done | Added helper text below slug input explaining auto-formatting |
| 15 | Tab state not URL-persisted | Done | project-tabs.tsx now uses URL search params (?tab=) for active tab |
| 16 | "Back to inbox" loses filter state | Done | Replaced with breadcrumb nav; users can use browser back to preserve filters |
| 17 | No breadcrumb on feedback detail | Done | Added breadcrumb nav with Inbox > Detail |
| 18 | Heading hierarchy inconsistent | Done | Standardized dashboard and feedback inbox h1 to text-2xl font-bold |
| 19 | Empty states need improvement | Done | Projects empty state now has FolderOpen icon and better copy |
| 20 | Mobile bottom nav aria-current | Done | Added aria-current="page" to active bottom nav links |
| 21 | Sidebar collapsed state a11y | Done | Added aria-label to icon-only links in collapsed state |
| 22 | Form label association gaps | Done | Added htmlFor/id pairings in settings/page.tsx and project-tabs.tsx |
| 23 | Settings page skeleton | Done | Replaced spinner with form skeleton layout |
| 24 | Board settings skeleton | Done | Replaced Loader2 with form skeleton |
| 25 | Text too small | Done | Fixed text-[9px] to text-[11px] in bar chart labels, text-[10px] to text-[11px] in stat cards, badge text, bottom nav |
| 26 | Auth page h1 on mobile | Done | Added visible h1 in mobile logo section |
| 27 | Landing page footer GitHub link | Done | Added aria-label="GitHub" |
| 28 | Privacy page GitHub link broken | Done | Fixed to actual repo URL |
| 29 | Email notifications toggle does nothing | Done | Removed toggle, replaced with "Email notifications coming soon" note |
| 30 | Dark mode: board settings toggle hardcoded colors | Done | Replaced bg-gray-200/bg-indigo-600 with bg-muted/bg-primary and bg-white with bg-background |
| 31 | Dark mode: landing page install strip | Done | Changed dark:bg-zinc-900 to dark:bg-zinc-900/50 for better contrast |
| 32 | API code blocks overlap on mobile | Done | Added z-10 and pr-20 to prevent copy button overlapping code text |
| 33 | Dashboard 5 stat cards unbalanced | Already done | Grid already uses grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 |
| 34 | Feedback message max-width | Done | Added max-w-prose to message container |
| 35 | select elements missing id/aria-labelledby | Done | Added id and aria-label to all select elements in feedback-actions, project-tabs, public-board |
| 36 | Auth footer text contrast | Done | Changed text-[11px] text-muted-foreground/70 to text-xs text-muted-foreground |

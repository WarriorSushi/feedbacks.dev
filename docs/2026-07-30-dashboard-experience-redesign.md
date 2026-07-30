# Dashboard Experience Redesign

Date: 2026-07-30

Status: Implemented and verified

## Outcome

Make the first ten minutes feel obvious and make the ongoing dashboard feel calm, fast, and trustworthy.

The intended first-run sequence is:

1. Name the project.
2. Copy one recommended snippet.
3. Verify one test.
4. See the test in the inbox.
5. Customize or connect other tools only after the loop works.

## Audit summary

### What the screenshot reveals

- The install code is below the first viewport even though copying it is the only important task.
- The same three-step story appears in the setup banner and again inside the installation introduction.
- The setup banner, installation explanation, connection details, platform chooser, and code surface all have similar weight.
- Dark surfaces differ too little in practical use, so panels blend into a long black page.
- The bright green accent appears across navigation, labels, steps, and the primary action. It stops identifying the primary action.
- Seven platform choices appear before the user has copied anything.
- Technical details and future capabilities are presented before first success.
- The sidebar shows a broad product map during a moment that needs a narrow path.
- The new-project route does not force the app shell to refresh after creation, which can leave the sidebar showing the wrong empty-project state.

### Systemic findings

The dashboard currently contains:

- 170 card component usages
- 95 `rounded-xl` usages
- 75 `rounded-full` usages
- 83 explicit `bg-card` usages
- 349 `text-muted-foreground` usages

The problem is cumulative. Cards, pills, muted paragraphs, badges, and bordered sub-containers are individually reasonable, but they are repeated until everything looks secondary and everything requires reading.

### Product and implementation drift

- `PRODUCT.md` calls for light-first presentation, while `DESIGN.md` and the root theme currently default to dark.
- The PRD requires the recommended snippet above the fold, but the rendered install screen places it below two explanatory regions.
- The product brief says advanced settings come later, but agent setup, connection details, deployment hardening, and seven target choices all compete on the install page.
- The dashboard contains a second no-project onboarding branch after an earlier return, so that branch is unreachable.
- Home repeats shortcuts in the header, setup prompt, metric strip, mobile shortcuts, desktop shortcuts, and recent-activity actions.

## Reference patterns

This redesign borrows operating principles, not visual imitation:

- Vercel: prioritize the most common developer workflows, use the project as a filter, and keep navigation consistent between account and project contexts.
- Stripe: keep guidance in situ, put common actions near the object being worked on, and preserve developer flow instead of sending users between explanatory pages.
- Carbon Design System: progressively disclose non-critical content, use concise progress indicators only for real linear tasks, and make empty states lead directly to the next productive action.
- Linear-style product discipline: dense where the data is useful, quiet where the user needs to decide, and one clear action per state.

## Design direction

### Scene

A developer is installing feedback collection during a normal build session on a laptop, switching between an editor, a browser, and the dashboard. They need confidence, a copy button, and a clear verification result. They do not need a product tour embedded in every page.

### Theme

- Make light mode the default for new accounts.
- Keep dark mode fully supported.
- Increase the tonal difference between canvas, sidebar, raised panel, selected row, popover, and code surfaces.
- Use green for the primary action, active navigation, focus, success, and small status signals only.
- Use warm tinted neutrals instead of pure black, pure white, or undifferentiated gray.

### Structure

- Replace the default "card stack" with page headers, section panels, rows, tables, and disclosures.
- Reduce the default corner radius and shadow strength.
- Use borders and tonal layers to separate related regions.
- Keep explanatory prose to one short sentence when possible.
- Keep advanced material closed until requested.
- Preserve 44px touch targets and visible focus states.

## Implementation checklist

### 1. Foundation and application shell

- [x] Reconcile `DESIGN.md` with a light-first default and the new hierarchy rules.
- [x] Replace the global light and dark tokens with clearly separated canvas, sidebar, panel, raised, selected, popover, code, and border roles.
- [x] Make light mode the default for a new account while preserving the saved user choice.
- [x] Simplify the theme control so its label and current state are unambiguous.
- [x] Reduce the default card radius, shadow, and decorative header treatment.
- [x] Add reusable page-header, section-panel, status-dot, and compact-step components.
- [x] Make the dashboard content width and spacing consistent at desktop, tablet, and mobile sizes.
- [x] Keep the project selector visually dominant in the sidebar and make account utilities quieter.
- [x] Fix the stale sidebar after project creation by refreshing the app shell on success.

### 2. First-run project creation

- [x] Keep project name as the only visible required field.
- [x] Keep product goal, icon, and domain behind optional disclosures.
- [x] Rewrite the primary action and next-step copy so the destination is predictable.
- [x] Remove decorative entrance motion from the task surface.
- [x] Preserve inline plan-limit and failure recovery states.

### 3. Install and verify

- [x] Replace the large setup banner with a compact three-step progress row.
- [x] Put the recommended Website snippet in the first viewport.
- [x] Reduce platform selection to Website, React, Next.js, and Vue, with WordPress, HTML block, and native mobile under "Other".
- [x] Give the active platform a clearly selected surface that is distinct from the page background.
- [x] Put the copy action directly in the code surface header.
- [x] Show only two immediate guidance rows: where to paste and what should appear.
- [x] Keep one concise trust note explaining that future form changes do not require new code.
- [x] Move the project key, agent setup, CSP, SRI, captcha, and native-mobile caveats into secondary disclosures.
- [x] Make "Verify installation" the single next action after the snippet.
- [x] Remove the duplicated installation overview and repeated three-step explanation.
- [x] Keep missing-key recovery, setup-packet creation, revocation, and security guidance functional.

### 4. Dashboard home

- [x] Remove the unreachable duplicate no-project onboarding branch.
- [x] Replace the six-cell metric strip with three decision-oriented metrics.
- [x] Keep setup as the dominant home state until the first feedback arrives.
- [x] After activation, prioritize unread feedback and recent activity.
- [x] Remove duplicate shortcut groups and repeated calls to create a project.
- [x] Keep project scope selection compact and obvious.
- [x] Keep plan usage available but visually secondary.
- [x] Show trends only when data exists.

### 5. Feedback inbox and detail

- [x] Replace pill-heavy filters with compact segmented controls and a single "More filters" disclosure.
- [x] Strengthen unread, selected, status, priority, and source differences without adding more containers.
- [x] Keep search, project scope, saved views, and bulk actions in one predictable toolbar.
- [x] Make empty states point to install, clear filters, or create project as appropriate.
- [x] Apply the new page header and panel hierarchy to feedback detail.
- [x] Keep message content dominant and move metadata into a quieter secondary column or region.

### 6. Feedback form customization

- [x] Keep the live preview and edit controls as the two primary regions.
- [x] Keep placement and appearance open.
- [x] Move optional fields, trigger details, captcha, and advanced behavior into disclosures.
- [x] Remove duplicate save and discard action groups.
- [x] Keep one persistent save state when there are unsaved changes.
- [x] Preserve preview-only versus saved-state language.

### 7. Integrations, API, boards, updates, settings, billing, and projects

- [x] Turn integration types into a compact catalog. Expand configured or selected destinations instead of showing every endpoint form.
- [x] Keep endpoint health, test, save, failure, and replay states easy to scan.
- [x] Keep API quick start visible and move trust-boundary reference, full endpoints, MCP tools, and prompts into disclosures.
- [x] Apply the shared page header and section hierarchy to public-board settings and product updates.
- [x] Replace repetitive settings and billing card stacks with section rows and clear destructive regions.
- [x] Apply the same hierarchy to project list, project home, project settings, loading, and empty states.
- [x] Keep all existing functional routes and entitlement rules intact.

### 8. Copy, accessibility, responsive behavior, and quality

- [x] Remove repeated headings, throat-clearing introductions, and future-feature explanations from critical paths.
- [x] Use direct verbs: copy snippet, verify installation, open inbox, save changes, send test.
- [x] Keep body copy within a readable line length.
- [x] Verify keyboard focus, disclosure semantics, touch targets, contrast, and reduced motion.
- [x] Verify the install, project creation, inbox, customization, navigation, settings, and billing tests.
- [x] Run type checking, linting, unit tests, production build, and browser smoke checks.
- [x] Reconcile every checklist item against the finished implementation.

## Acceptance criteria

- A new project lands on a screen where the recommended snippet and copy action are visible without scrolling at a 1440 by 900 viewport.
- The first viewport contains one primary action.
- The platform choice is visually distinct from both the page canvas and the code surface.
- Dark mode exposes at least four visibly distinct neutral layers before accent color is used.
- No critical first-run action depends on reading advanced setup material.
- Project creation refreshes the sidebar state.
- Home has one setup prompt before activation and one recent-activity focus after activation.
- Secondary dashboard pages share the same header, section, control, loading, empty, and destructive-state vocabulary.
- Existing product behavior, API paths, and plan enforcement remain intact.

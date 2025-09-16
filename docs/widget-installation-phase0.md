# Widget Installation Experience � Phase 0 Discovery

_Last reviewed commit: d867e62c99f4e56249016b80ed9f79dfa86c25dd (main)_

## Snapshot of the Current Experience
- **Entry point**: `packages/dashboard/src/app/(dashboard)/projects/[id]/page.tsx` renders the install tab as a single `Card` that hosts the entire `WidgetInstallationExperience`, followed by a `Project Info` card. Helper text, actions (Open Demo / Export CSV), and metadata all compete in one column.
- **Generator component**: `packages/dashboard/src/components/widget-code-generator.tsx` is a 1,100+ line client component with ~40 `useState` hooks. "Simple" vs "Ultra" (line 577) only toggles visibility on a subset of controls�resulting in one long form even for basic users.
- **Preview + snippets**: live preview is an `iframe` (`previewSrcDoc` around line 353) that reflows to the bottom of the grid on mobile; snippets are computed via string builders per platform (lines 200-340). Preview minimum height recently bumped to 850px, which dominates small screens.
- **Related modules**: `CodeSnippet` gives the macOS-styled code block; anti-spam defaults continue in `ProjectAntiSpam` but installation tab now duplicates many toggles (captcha, rate limits) in Ultra mode.

## UX & Visual Issues Identified
- **Cognitive overload**: all controls are rendered simultaneously in a dense grid (`grid-cols-1 md:grid-cols-2`). There is no progressive disclosure, sections, or inline grouping beyond basic headings. Mobile collapses into a single column but retains the entire control list.
- **Non-premium aesthetic**: heavy reliance on default shadcn buttons and inputs without spacing rhythm, iconography, or hierarchy betrays "premium" positioning; success/copywriting strings are purely functional.
- **Copy + encoding glitches**: accessibility hints contain mojibake (e.g. "Button text on primary" annotations show `??"`). There is duplicated logic for `toLine`, stray comments, and uneven tooltip tone.
- **Preview discoverability**: preview sits after the full control stack on mobile and is not sticky on desktop. Users tweak settings blindly until they scroll; there is no side-by-side comparison or quick toggle between presets.
- **Simple vs Ultra confusion**: Simple mode still shows advanced toggles like Screenshot, Require Email, etc. Ultra brings in platform select, presets, spacing controls, captcha keys, but the boundary is unclear.
- **Action noise**: "Reset", "Open Demo", "Export CSV", "Save as Project Default", import/export JSON, etc. appear at equal visual weight. No guidance on installation steps beyond a tiny text banner.
- **Responsiveness**: scale slider (0.6�1) is hidden behind Ultra; iframe width is fixed 390px for mobile preview, but there is no representation of floating button positions or inline container context.

## Technical Observations
- **State management**: manual `useState` for each field complicates validation. There is no schema or storage of default values�just booleans and strings which emit `currentConfig`. This is fragile for change requests and hard to test.
- **Config serialization**: `currentConfig` gating is done inside `useMemo`, but `configJs` generation duplicates cases (string detection repeated). Import/export simply `JSON.parse` without validation.
- **Preview sandbox**: `previewSrcDoc` bootstraps `FeedbacksWidget` with inline script and global `new FeedbacksWidget`. Cleanup removes DOM nodes but not event listeners beyond `postMessage` timers.
- **Code duplication**: Rate-limit / captcha toggles exist both in Ultra controls and `ProjectAntiSpam` component, risking divergent saved defaults.
- **Accessory components**: `CopyButton` (not shown) likely duplicates copy-to-clipboard logic from `CodeSnippet`, another cleanup opportunity.

## Backend & Data Model Review
- **Storage**: `projects.widget_config` (added in `sql/007_widget_config.sql`) holds a JSON blob. There is no server-side schema validation beyond trusting the client.
- **API surface**: `/api/projects/[id]/widget-config` GET/PUT returns or stores the blob with only ownership checks; invalid JSON returns 400 but there is no field validation or versioning.
- **Runtime usage**: `/api/feedback/route.ts` reads `widget_config` to enforce captcha/rate limits when accepting submissions. Attachments, tags, priority all depend on truthy flags from this config.
- **User defaults**: `user_settings.anti_spam` retains default captcha provider/keys. Installation UI pulls from `/api/settings/anti-spam` when enabling captcha.
- **Tooling**: current SQL migrations (`sql/001-009`) provide base tables, RLS, webhooks, rate limits, and user settings. There is no dedicated table for widget presets, config history, or audit log.

### Identified Risks / Debt
1. **Lack of schema**: arbitrary JSON can break widget embed or API expectations. No validation ensures numbers stay in safe ranges.
2. **No versioning**: cannot evolve config format without breaking existing saved data.
3. **One-config-per-project**: no ability to manage variations (e.g. per environment/site) or share templates across projects.
4. **Migration complexity**: resetting Supabase today requires manually truncating tables; there is no bootstrap script to reseed essential reference data (e.g. default presets, CTA copy).

## Design & Product Principles for Redesign
- **Progressive disclosure**: split flow into guided steps (e.g. Stepper or segmented `Tabs` � Setup, Appearance, Advanced, Publish), keeping Simple users focused while allowing Ultra features behind clear boundaries.
- **Persistent preview**: adopt shadcn `ResizablePanelGroup` or `ScrollArea` + `Sticky` pattern so preview stays visible on desktop; on mobile, provide a collapsible floating preview or full-screen modal triggered via "Preview" button.
- **Premium theming**: introduce gradient header, subtle glassmorphism, contextual illustrations, or screenshot carousels using `HoverCard`, `Accordion`, `Alert`, and `Badge` components to elevate feel.
- **Guided copy**: replace terse labels with instructive microcopy, inline validation, and success confirmations (e.g. `Callout` explaining where to paste code).
- **Installation recipes**: highlight the 3-step process and support multiple destinations (website, React, etc.) with syntax-highlighted tabs, copy hints, and quick toggles.
- **Preset gallery**: provide visual cards for presets (using `Card`, `AspectRatio`, `Carousel`) rather than dropdown. Allow saving custom presets per project.

## Proposed Technical Directions
- **Component architecture**: break `WidgetInstallationExperience` into subcomponents: `ModeSelector`, `AppearanceControls`, `FieldsControls`, `ProtectionControls`, `PreviewPane`, etc. Each receives props/state from a central `useWidgetConfigForm` hook built on `react-hook-form` + `zod` schema for validation.
- **Schema-driven config**: define a shared TS/Zod schema that maps to a Supabase stored JSON (with explicit defaults). Use it on both client and API route to enforce typing.
- **Improved preview**: switch to embedding an actual widget via `<script src="https://app.feedbacks.dev/...">` but wrap in a dedicated `WidgetPreview` component with loading states, error handling, and ability to simulate inline/modal/trigger contexts visually.
- **Telemetry**: emit events when users copy code, switch modes, or save defaults to inform future tweaks.
- **Testing**: add storybook stories or Playwright visual tests for various configs.

## Database Reset & New Schema Outline
When we wipe Supabase we should replace the old migrations with a cleaner, opinionated set. Recommended structure:

1. **Projects table** � keep existing columns (`id`, `name`, `api_key`, `owner_user_id`, `created_at`, `updated_at`). Remove `widget_config` column from this table.
2. **Widget configurations**
   - `widget_configs` table: `id uuid`, `project_id uuid`, `version int`, `channel text` (e.g. `production`, `staging`), `label text`, `config jsonb`, `is_default boolean`, timestamps.
   - Unique constraint on (`project_id`, `channel`, `is_default` true) to enforce one default per channel.
   - Version history auto-increments; add RLS to restrict to project owners.
3. **Widget config audit**
   - `widget_config_events`: `id`, `widget_config_id`, `user_id`, `event_type` (`created`, `updated`, `published`, `reverted`), `payload jsonb`, timestamp.
   - Useful for rollbacks and analytics.
4. **Widget presets (global)**
   - `widget_presets`: `id`, `slug`, `name`, `category`, `thumbnail_url`, `config jsonb`, `created_at`.
   - Seed with curated presets to power a visual gallery.
5. **User defaults**
   - Extend `user_settings` to include `widget_defaults jsonb` for per-user baseline (mode, colors, etc.).
6. **Supporting functions**
   - SQL functions to promote a config to default, clone configs, and soft-delete.

Each table gets migrations with RLS policies mirroring existing patterns. Provide a reset script that:
- Drops dependent tables (`feedback`, `projects`, etc.) with `cascade`.
- Recreates schema from scratch (extensions, functions, tables, policies).
- Seeds required data (default presets, sample project, etc.).

## Next Phase Deliverables (Phase 1)
- High-fidelity wireframes (desktop + mobile) showing step-based UI, preview layout, and premium look.
- Component inventory + updated design tokens (spacing, color, typography).
- Copy deck for key flows (installation steps, tooltips, success states).
- Validation matrix aligning UX states with schema rules (e.g. attachment limit ranges, captcha prerequisites).

## Questions / Items for Confirmation
1. Should we support multiple widgets per project (e.g. targeting different domains) in this redesign? That impacts schema and UI scope.
-ans- no one widget per project
2. Are there brand guidelines (colors, typography) we must adhere to when crafting the premium theme?
-ans- there are exisiting 4 themes already i think, i would prefer if everything works for all themes, as in they seamlessly switch font and color and everything according to the theme. also the set theme could be remembered so when the user logs in again it can be used. if they sign out, if not by local memory it can be kept. i am not usre what is the ideal way to go about this. if you wnat to remove all themes and create one premium theme (if that is the best move for us) you may do so. 
3. Should the new database bootstrap create demo data for onboarding screenshots / preview? Helpful for first-run experience.
-ans- no not yet, maybe later on. but no demo data for now. 
4. Is analytics instrumentation (Mixpanel/Segment) already available, or do we need to plan for it during development?
-ans- no i havent set it up, i would like to have analytics

With this discovery complete, we can proceed into Phase 1 UX/visual exploration once the above questions are resolved (or we make assumptions).

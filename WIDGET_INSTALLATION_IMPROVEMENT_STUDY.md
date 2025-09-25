# Widget Installation Improvement Study

## Phase 1 - Layout and Preview Fixes
- **Streamline desktop project overview - Status: YES (feasible)**
  - Observation: packages/dashboard/src/app/(dashboard)/projects/[id]/page.tsx:165 renders desktopOverviewCard as a wide hero after the configurator, duplicating the badge stack already shown in the header.
  - How: relocate the desktop summary into the two-column grid (for example, pass a projectSummary slot into WidgetInstallationExperience or move the markup beside the preview column) and swap badge styling for compact chips so the layout mirrors the mobile overview.
  - Considerations: keep the card hidden when other sections are active and reuse the same typography tokens as the mobile card to avoid a divergent desktop look.

- **Clamp live preview height - Status: YES (feasible)**
  - Observation: packages/dashboard/src/components/widget-installation/widget-installation.tsx:607-684 always compares iframe height to the modal overlay footprint, so launcher view previews inherit modal dimensions.
  - How: guard the overlay math behind view === 'form', confirm .feedbacks-overlay is visible before applying its height, and otherwise fall back to the #preview-root bounding box. Keep the final clamp inside WidgetPreview (widget-installation.tsx:742-778) so the iframe stays within min and max bounds.
  - Considerations: send a lightweight widget-preview:state message whenever the launcher/form toggle flips so delayed postHeight() timers do not fire until the modal actually opens; add a regression test that switches between inline and modal modes.

- **Give advanced toggles an affordance - Status: YES (feasible)**
  - Observation: the current DisclosureToggle button (widget-installation.tsx:1588 and 2053) looks like a static label with a faint chevron, so the "Advanced" affordance is easy to miss.
  - How: rename the control to an action phrase (for example, "Show advanced settings"), add aria-expanded and aria-controls, swap in a plus/minus icon, and animate the panel height with Tailwind data state helpers so the interaction is obvious.
  - Considerations: unify the component across the Experience tab sections and update any end-to-end tests that rely on the button label.

## Phase 2 - Visual Polish and Guidance
- **Keep pill-shaped modal content within bounds - Status: YES (feasible)**
  - Observation: pill mode relies on --feedbacks-radius set in packages/widget/src/widget.ts:136-165 and applied in packages/widget/src/styles.css:162-187, but the close button offsets at styles.css:244-246 still let the icon drift into the curve on narrow viewports.
  - How: tighten the pill layout by clamping width (for example, max-width: min(520px, calc(100vw - 32px))) and bumping the header padding offsets when data-feedbacks-modal-shape="pill" is present; mirror the same adjustments inside buildPreviewHtml so the iframe preview matches runtime spacing.
  - Considerations: cover both desktop and mobile cases in visual regression, keeping overflow hidden so focus outlines stay inside the pill.

- **Embed CAPTCHA provider setup guidance - Status: DONE (verify copy)**
  - Observation: the Protection tab already renders ProviderGuide panels with step lists (widget-installation.tsx:1688-1748 and 2026-2040).
  - How: no code work is required unless you want to auto-expand the selected provider when requireCaptcha is toggled on; persisting the expanded state would keep the guidance visible.
  - Considerations: localize the copy and add analytics for guide usage if you need insight.

- **Refresh Inline Highlight preset colors - Status: DONE (ensure data is deployed)**
  - Observation: sql/201_schema_reset.sql:429-450 seeds the inline-highlight preset with primaryColor '#242424' and backgroundColor '#dbdde1'.
  - How: run the Supabase seed or migration so production data uses the new palette, then verify via /api/widget-presets. No code change is needed unless environments skipped the seed.
  - Considerations: clear the client preset cache after reseeding (see Phase 3) so the UI reflects the updated colors immediately.

## Phase 3 - Data and Performance
- **Cache widget preset fetches across installations - Status: PARTIAL (can improve)**
  - Observation: fetchWidgetPresets in widget-installation.tsx:164-195 memoises presets in module scope, which prevents duplicate reads during a session but resets on hard reloads and across tabs.
  - How: either prefetch presets in the server component and hydrate them into the client, or persist to sessionStorage or IndexedDB with a short TTL. Wire invalidateWidgetPresetCache into any preset mutation flow that may arrive later.
  - Considerations: add cache headers to /api/widget-presets when authentication allows (for example, s-maxage) to reduce Supabase workload.

- **Limit widget config history payload - Status: YES (feasible)**
  - Observation: the GET handler at packages/dashboard/src/app/(dashboard)/projects/[id]/widget-config/route.ts:148-173 selects the full config for every history row, but the UI only uses label, version, and timestamps (widget-installation.tsx:1930-1942).
  - How: shrink the query to select('id,version,label,updated_at,is_default'), keep the default config fetch, and expose an optional flag (for example, ?withConfig=1) if you later ship history diffing. Update the client mapper to match the lighter payload.
  - Considerations: this change reduces JSON size and Supabase bandwidth for every page load.

## Phase 4 - Future Styling Controls
- **Advanced styling knobs - Status: YES (ready when prioritised)**
  - Observation: WidgetConfig and DEFAULT_CONFIG already transport styling props (widget-installation.tsx:210-277), and the runtime maps them to CSS variables in widget.ts:136-171.
  - How: add optional fields for typography, button variants, and success screen accents under the existing Advanced sections, extending buildRuntimeConfig so the preview and runtime stay in sync.
  - Considerations: guard new options behind a feature flag until presets cover them, and provide migration defaults so existing configs keep working.

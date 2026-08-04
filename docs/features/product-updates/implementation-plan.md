# Implementation Plan: Product Updates / What's New

## 1. How to use this plan

Follow the phases in order. Do not start the dashboard or widget UI before the shared contracts and database schema are stable.

For every phase:

1. Read the referenced existing files before editing them.
2. Make only the changes listed for that phase.
3. Add or update tests in the same commit as the behavior.
4. Run the phase checks.
5. Review `git diff` and commit with the suggested commit boundary.
6. Stop and fix failures before moving to the next phase.

Repository-level `AGENTS.md` instructions and the documents listed there remain authoritative. If this plan conflicts with the product specification or technical design in this folder, follow those documents and update this plan in the same change.

## 2. Rules for the implementation agent

- Do not reuse `board_announcements`.
- Do not create a second widget bundle or customer script.
- Do not add HTML, Markdown, custom CSS, AI generation, segmentation, or a toast layout.
- Do not expose a Supabase service-role or secret key to browser code.
- Do not add anonymous database policies. Public reads and metrics go through Next.js Route Handlers.
- Do not use middleware or proxy as the only authorization boundary. Every owner Route Handler must call `getAuthedUserAndProject(projectId)`.
- Do not initialize a Supabase admin client at module import time if the existing project uses lazy initialization. Follow the existing client pattern.
- Keep the repository's canonical ordered `sql/` migration chain. Do not initialize a parallel `supabase/migrations/` tree for this feature.
- Do not apply a migration to production until the feature code is complete, reviewed, and the rollout checklist permits it.
- Do not hand-edit generated Supabase types.
- Do not increase the widget's 20 KB gzip limit without explicit approval.
- Do not silently relax a requirement to make a test pass. Record any necessary product decision in these planning documents.

## 3. Phase 0 - establish a clean baseline

### Read

- `package.json`
- `pnpm-workspace.yaml`
- `packages/shared/package.json`
- `packages/widget/package.json`
- `packages/dashboard/package.json`
- `scripts/check-widget-gzip.mjs`
- `scripts/check-supabase-schema.mjs`
- the newest three files under `sql/`

### Tasks

1. Confirm the working tree contains no unrelated changes that would be overwritten.
2. Confirm the active branch is a feature branch.
3. Record the currently installed versions of Node, pnpm, Next.js, React, Supabase JS, and the Supabase CLI.
4. Run the repository's existing lint, typecheck, test, build, widget-size, and schema-check commands.
5. Record the current widget gzip size in the implementation pull request or handoff note.
6. Inspect Supabase migration history before creating or applying a migration.

### Migration-history warning

The checked-in `sql/` files and the linked Supabase project's recorded migration history may not have identical numbering. Do not assume the next local-looking number is safe remotely.

Before schema work:

1. Read `docs/2026-06-09-migration-history-reconciliation.md` and `docs/DEPLOYMENT.md`.
2. Compare the canonical ordered `sql/` files with the target project's recorded migration history using the available Supabase tooling.
3. Follow the repository's migration-reconciliation procedure if the histories differ.
4. If `027` is still the newest file, create `sql/028_product_updates.sql`. If another migration landed first, use the next ordered number and update this feature packet.
5. Record the final filename and how it maps to the target migration ledger in the implementation handoff.

Never rename or replay already-applied migrations merely to make numbering look tidy, and do not create a second migration system alongside `sql/`.

### Exit criteria

- Baseline checks pass, or pre-existing failures are documented with evidence.
- Migration history is understood.
- Current widget gzip size is recorded.

### Suggested commit

No code commit unless a baseline-only test fixture or documentation correction is required.

## 4. Phase 1 - shared contracts, validation, and entitlements

### Primary files

- `packages/shared/src/product-updates.ts` - new
- `packages/shared/src/product-updates.test.ts` - new, following repository test naming
- `packages/shared/src/index.ts`
- `packages/shared/src/plans.ts`
- existing plan/entitlement tests

### Tasks

1. Add the types defined in `technical-design.md`:
   - `ProductUpdateStatus`
   - `ProductUpdateTheme`
   - `ProductUpdateMetricType`
   - owner/editor request and response types
   - `ProductUpdateContent`
   - `ProductUpdatePublicSettings`
   - `ProductUpdatesPublicResponse`
2. Add constants for every field limit. Server, dashboard, and widget code must import the same values.
3. Implement pure validation and normalization helpers:
   - trim strings;
   - convert empty optional strings to `undefined` or `null` consistently;
   - reject overlong strings;
   - reject more than eight highlights;
   - reject empty or overlong highlights;
   - validate ISO timestamps and expiry ordering;
   - validate theme, delay, color, and path arrays;
   - validate CTA label/URL pairing and URL schemes.
4. Implement `deriveProductUpdateState`, `isProductUpdateLive`, and `isProductUpdatePathEligible`.
5. Implement URL builders for the public updates and events endpoints.
6. Export the module through `packages/shared/src/index.ts`.
7. Add the Product Updates entitlements to `EntitlementSet` and both plan definitions.
8. Update entitlement fixtures so adding required keys cannot silently break tests.

### Required validation cases

- `/dashboard` is a valid relative CTA.
- `//evil.example` is invalid.
- `https://example.com/path` and `http://localhost:3000/path` are valid absolute CTAs.
- `javascript:`, `data:`, `file:`, credentials in URLs, blank titles, and mismatched CTA label/URL are invalid.
- Exclude paths win over include paths.
- Empty include paths mean all paths.
- `/app` matches `/app`, `/app/`, and `/app/settings`, but not `/application`.
- Future `published_at` derives Scheduled; past eligible time derives Live; expired derives Expired.
- Free and Pro entitlement values exactly match `product-spec.md`.

### Exit criteria

- Shared package typecheck and tests pass.
- All field constraints have one shared constant or helper.
- No UI or Route Handler has been added yet.

### Suggested commit

`feat(shared): add product update contracts and entitlements`

## 5. Phase 2 - database schema, RLS, RPC, and storage contract

### Primary files

- `sql/028_product_updates.sql`, or the next ordered number if `028` is already taken
- `scripts/check-supabase-schema.mjs`
- database migration tests, if the repository has them
- storage/deployment documentation only where bucket creation is tracked

### Tasks

1. Create the next canonical ordered SQL file under `sql/` after reconciling the current chain and live ledger.
2. Add `product_update_settings`, `product_updates`, and `product_update_metrics` exactly as specified in `technical-design.md`.
3. Add all foreign keys, checks, partial indexes, and `updated_at` triggers.
4. Enable RLS on all three tables.
5. Add separate owner policies for SELECT, INSERT, UPDATE, and DELETE where required.
6. Every owner predicate must bind through `projects.owner_user_id = (select auth.uid())` or the repository's proven equivalent.
7. UPDATE policies need both `USING` and `WITH CHECK`, and the corresponding SELECT policy.
8. Add owner SELECT-only access to aggregate metrics.
9. Add no anonymous policies and no browser write policy for metrics.
10. Create both atomic functions from `technical-design.md`: metric increment and the project-locked publish transition.
11. Create both functions as `SECURITY INVOKER`, pin `search_path` to `pg_catalog`, and fully qualify application tables. Validate inputs and project/update relationships inside them. Revoke EXECUTE from `PUBLIC`, `anon`, and `authenticated`; grant it only to `service_role`; verify the grants after applying the migration. Do not change either function to `SECURITY DEFINER`.
12. Add the `product_update_images` bucket definition to the repository's expected setup/check path:
    - public reads;
    - 2 MB maximum;
    - JPEG, PNG, and WebP only.
13. Use server-side upload/delete only. Do not add `storage.objects` policies for direct browser upload.
14. Update `scripts/check-supabase-schema.mjs` to verify tables, columns, constraints/bucket, and safe RPC availability.
15. Account for Supabase's current Data API behavior: newly created tables may not be exposed automatically. Explicitly verify the intended grants. Grant only what owner server flows need; the public website must still use the server API and must not receive direct anonymous table access.

### Local verification

Against an isolated local or development database:

1. Apply the migration once.
2. Confirm all three tables have RLS enabled.
3. Confirm an owner can CRUD their own updates.
4. Confirm another authenticated user cannot read or modify them.
5. Confirm `anon` cannot select from any Product Updates table.
6. Confirm an owner can read metrics but cannot write them directly.
7. Confirm `anon` and `authenticated` cannot execute either function.
8. Confirm service role can increment a valid metric atomically.
9. Confirm two concurrent publish attempts cannot exceed the Free live limit.
10. Run Supabase database and security advisors and resolve new warnings attributable to this migration.
11. Run the schema check.

### Exit criteria

- Migration applies cleanly to an empty/test database and the intended development database.
- RLS isolation tests pass.
- RPC privileges are verified, not assumed.
- No production schema has been modified.

### Suggested commit

`feat(db): add product update schema and policies`

## 6. Phase 3 - authenticated owner APIs

### Primary files

- `packages/dashboard/src/app/api/projects/[id]/updates/route.ts`
- `packages/dashboard/src/app/api/projects/[id]/updates/[updateId]/route.ts`
- action Route Handlers under the same tree
- settings and image Route Handlers under the same tree
- `packages/dashboard/src/lib/product-update-entitlements.ts` - new
- `packages/dashboard/src/lib/product-update-service.ts` - new if it prevents Route Handler duplication
- relevant API tests

### Tasks

1. Implement a small service layer for owner-scoped queries and lifecycle transitions.
2. Keep the existing `[id]` dynamic segment and `params: Promise<{ id: string }>` convention. Do not create a sibling `[projectId]` directory, which would conflict with the existing Next.js route.
3. In every Route Handler:
   - parse and bound route/body input;
   - call `getAuthedUserAndProject(projectId)`;
   - constrain all update queries by both `project_id` and `id`;
   - map database rows to shared response types;
   - return safe field errors without leaking another project's record existence.
4. Implement collection GET and draft-only POST.
5. Implement single-record GET, content-only PATCH, and DELETE.
6. Implement explicit publish, archive, and restore-to-draft actions.
7. Enforce live-record limits and scheduling on the server inside the lifecycle transaction/path.
8. Prevent a race in the Free active limit with the service-role-only `publish_product_update` RPC specified in `technical-design.md`. It must use a project-scoped transaction advisory lock. Do not use an unlocked read-then-write pair.
9. Implement settings GET/PATCH and force branding to remain enabled for Free.
10. Implement image POST/DELETE with:
   - bounded multipart size;
   - MIME and extension allowlist;
   - file-signature check where practical;
   - server-generated object paths;
   - cleanup on partial failure;
   - old-object cleanup after successful replacement.
11. Return `Cache-Control: no-store` from authenticated owner routes.
12. Add metrics aggregation to the owner list response, limited to the plan's history window.

### API test matrix

- unauthenticated request returns 401;
- owner succeeds;
- non-owner receives 404 or the repository's standard non-disclosing response;
- POST cannot create a published record;
- generic PATCH cannot change status or project ID;
- invalid fields return a bounded 400 response;
- Free can publish through the third live update and cannot publish the fourth;
- expired and archived updates do not count against the active limit;
- Free cannot schedule;
- Pro can schedule;
- Free cannot remove branding through a forged request;
- deleting or replacing an image leaves no known orphan on successful paths;
- update ID from another project never passes because of ID alone.

### Exit criteria

- Owner API tests pass.
- Entitlements are enforced server-side.
- No dashboard UI is required to exercise the lifecycle via tests.

### Suggested commit

`feat(api): add owner product update workflows`

## 7. Phase 4 - dashboard Product Updates experience

### Primary files

- `packages/dashboard/src/app/(dashboard)/projects/[id]/project-tabs.tsx`
- `packages/dashboard/src/app/(dashboard)/projects/[id]/project-flow-nav.tsx`
- `packages/dashboard/src/components/product-updates/*`
- navigation, component, and integration tests

### Tasks

1. Add the `updates` tab and menu entry between Public Board and API.
2. Build `product-update-client.ts` as the only client-side API wrapper for this feature.
3. Build the empty state and runtime-not-enabled warning from `product-spec.md`.
4. Build the update list with derived states and metrics.
5. Build the editor with shared field limits and inline validation.
6. Build exact actions: Save draft, Publish now, Schedule, Update live post, Archive, Restore to draft, and Delete. Do not add Duplicate or Publish as new in the MVP.
7. Build a faithful desktop/mobile, light/dark preview. Use the same content order and tokens as the widget.
8. Build settings UI with path validation and plan-aware branding/scheduling controls.
9. Design explicit loading, empty, success, field-error, network-error, and plan-limit states.
10. Push `'use client'` down to the interactive editor/list components. Keep the project page/server boundary consistent with the existing App Router structure.
11. Do not put owner authorization only in navigation or middleware; Route Handlers remain the authority.
12. Do not add the feature to onboarding tours until dogfood shows the workflow is stable.

### Required interaction tests

- create and save a draft;
- field validation blocks bad input before request;
- API errors remain visible and preserve entered content;
- immediate publish updates the row state;
- Pro scheduling labels the row Scheduled;
- Free scheduling explains the plan restriction;
- archive removes Live state after success;
- editing a live update explains that existing viewers will not see it again automatically;
- **New update** creates a fresh record ID and does not copy media or metrics from an existing update;
- preview switches viewport and theme without losing form data;
- keyboard users can operate editor dialogs and menus.

### Exit criteria

- A project owner can complete the full authoring lifecycle through the dashboard.
- Dashboard tests and typecheck pass.
- UI uses shared validation and types rather than duplicate magic numbers.

### Suggested commit

`feat(dashboard): add product update authoring`

## 8. Phase 5 - public widget APIs

### Primary files

- `packages/dashboard/src/app/api/widget/updates/route.ts`
- `packages/dashboard/src/app/api/widget/updates/events/route.ts`
- shared public-response mapping helper
- public API tests

### Tasks

1. Implement GET/OPTIONS for public updates.
2. Reuse the existing browser project-key hash lookup, origin restriction, CORS helper, and rate-limit patterns used by feedback submission.
3. Return only live records and allowlisted public fields.
4. Return no updates when project settings are disabled.
5. Limit records to 20 and target a response smaller than 50 KB.
6. Add 60-second public caching, five-minute stale-while-revalidate, ETag, and `304` handling.
7. Implement POST/OPTIONS for metric batches.
8. Bound body size to 8 KB and events to ten.
9. Validate every update ID belongs to the resolved project before calling the service-only RPC.
10. Use the server's UTC date and accept no viewer ID or client-supplied metric date.
11. Return `202` after accepted best-effort increments.
12. Ensure logging does not include a full project key, CTA URL, page URL, update body, or viewer data.

### Required API tests

- draft, future, archived, and expired records never appear;
- newest records are sorted correctly and limited to 20;
- disabled settings return an empty result;
- a rejected origin cannot fetch or record events;
- valid preflight has expected CORS headers;
- invalid/oversized project keys, bodies, event arrays, UUIDs, and event names are rejected;
- update from another project cannot receive a metric;
- ETag returns `304` for unchanged content;
- public response has no internal project ID, owner ID, storage path, status, metrics, or plan fields;
- public database access is never attempted directly from the browser.

### Exit criteria

- Public API tests pass.
- Security and cache headers are verified.
- Feedback submission API behavior is unchanged.

### Suggested commit

`feat(api): serve safe public product updates`

## 9. Phase 6 - widget runtime, installation, and wrappers

### Primary files

- `packages/widget/src/product-updates.ts`
- `packages/widget/src/product-update-storage.ts`
- `packages/widget/src/widget.ts`
- `packages/widget/src/styles.css`
- `packages/shared/src/widget-install.ts`
- `packages/widget-react/src/index.tsx`
- `packages/widget-vue/src/index.ts`
- widget unit/integration tests
- install snippet tests

### Tasks

1. Add `enableUpdates`, `updatesApiUrl`, and `updatesEventsApiUrl` to saved/runtime config and sanitization.
2. Add `data-enable-updates="true"` to website snippets only when enabled.
3. Add equivalent typed props to React and Vue wrappers.
4. Build a safe localStorage module with in-memory fallback and 100-ID pruning.
5. Build a Product Updates controller that owns fetch, eligibility, modal DOM, focus behavior, CTA handling, metrics, and trigger binding.
6. Assign customer strings only with `textContent` or text nodes.
7. Add namespaced `.fb-update-*` styles for one centered responsive modal.
8. Add an internal overlay coordinator so feedback and What's New cannot overlap.
9. Add public methods:
   - `openUpdates()`
   - `closeUpdates()`
   - `getUnreadUpdateCount()`
   - `refreshUpdates()`
10. Bind `[data-feedbacks-updates-trigger]`, `popstate`, and `feedbacks:updates:refresh`.
11. Do not patch `history.pushState` or `history.replaceState`.
12. Dispatch the non-sensitive integration events from `technical-design.md`.
13. Use `AbortController` and cleanup timers, event listeners, overlay state, and pending requests in `destroy()`.
14. Do not make an updates request when `enableUpdates` is false.
15. Lazy-load the image, tolerate image errors, and make metrics best-effort.

### Widget behavior tests

- disabled config makes zero update requests;
- enabled config fetches once per project initialization;
- newest unseen update auto-opens after the configured delay;
- seen update does not auto-open after reload;
- only one update auto-opens during a full page load;
- manual trigger can open the newest live update even when seen;
- manual open returns false while feedback is open;
- feedback launcher closes an open update before opening feedback;
- visibility and path rules work;
- localStorage denial uses memory fallback without throwing;
- localStorage data is bounded to 100 IDs;
- Escape, focus trap, focus restore, and exact body-scroll restoration work;
- reduced-motion styles remove nonessential animation;
- same-origin CTA uses the current tab and external CTA uses a safe new tab;
- invalid API content is ignored or safely bounded;
- destroy removes all behavior and permits clean reinitialization.

### Size gate

1. Build the production widget.
2. Run `pnpm widget:size` or the repository's equivalent.
3. Record before/after gzip sizes.
4. Target 16 KB or less and fail at the existing 20 KB hard limit.
5. If above target, simplify markup, CSS, and runtime helpers before considering dependencies. Add no modal library to the widget bundle.

### Exit criteria

- Website, React, and Vue integration tests pass.
- Accessibility interactions pass.
- Widget remains below 20 KB gzipped.
- Feedback collection regression tests pass.

### Suggested commit

`feat(widget): show product updates in installed apps`

## 10. Phase 7 - metrics dashboard and cleanup paths

### Primary files

- `packages/dashboard/src/components/product-updates/ProductUpdateMetrics.tsx`
- owner metrics query/service tests
- `packages/dashboard/src/lib/feedback-storage-cleanup.ts` or its generalized replacement
- account/project deletion tests

### Tasks

1. Show totals, CTR, and dismissal rate with clear “approximate” copy.
2. Respect the Free 7-day and Pro 90-day query windows on the server.
3. Handle zero impressions without division errors.
4. Verify project deletion cascades settings, updates, and metrics.
5. Generalize storage cleanup to remove `product_update_images/<project-id>/...` on project/account deletion.
6. Make cleanup retryable or observable if a storage delete fails.
7. Verify deleting one update removes its image and metrics without affecting another project.

### Exit criteria

- Metrics display matches aggregate database values.
- Deletion tests leave no known Product Update database rows or media.

### Suggested commit

`feat(updates): add metrics and deletion cleanup`

## 11. Phase 8 - generated types, documentation, and full verification

### Tasks

1. Apply the reviewed migration to the intended non-production Supabase environment.
2. Generate database types using the repository command.
3. Inspect the generated diff; do not edit it manually.
4. Update implementation-facing docs and install examples listed in `technical-design.md`.
5. Do not mark `docs/product-status.md` complete until all end-to-end tests pass.
6. Run every check in `test-and-rollout-plan.md`.
7. Run the full repository lint, typecheck, tests, build, widget-size, and Supabase schema checks.
8. Perform a Vercel preview smoke test with a development Supabase project.
9. Complete the security and privacy review.
10. Record known limitations exactly as deferred in the product specification.

### Exit criteria

- All automated and manual MVP checks pass.
- Preview deployment works end to end.
- Production rollout remains feature-off until the rollout checklist starts.

### Suggested commit

`docs(updates): document and verify product updates`

## 12. Final pull request checklist

- [ ] The pull request links all five planning files in this folder.
- [ ] The migration is the next file in the canonical ordered `sql/` chain and its live-ledger mapping is recorded.
- [ ] Migration history was reconciled before applying schema changes.
- [ ] RLS is enabled and tested on every new table.
- [ ] Both RPCs are `SECURITY INVOKER` and execution is service-role only.
- [ ] No secret/service-role key appears in browser code or public responses.
- [ ] Every owner Route Handler checks auth and project ownership.
- [ ] Public endpoints enforce rate limits, origin rules, size bounds, and CORS.
- [ ] Widget disabled state makes no updates request.
- [ ] Widget remains below 20 KB gzipped.
- [ ] No customer content reaches `innerHTML`.
- [ ] Feedback and update overlays cannot overlap.
- [ ] Local seen state contains no viewer identity or page URL.
- [ ] Metrics contain daily counts only.
- [ ] Free/Pro rules are enforced server-side.
- [ ] Project/account deletion cleans rows and media.
- [ ] Website, React, and Vue install paths are documented and tested.
- [ ] Accessibility and reduced-motion checks pass.
- [ ] Vercel preview end-to-end verification passes.
- [ ] Rollout and rollback owners are identified.

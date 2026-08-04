# Reliability and idiot-proofing audit - 2026-08-02

## Scope and method

This audit followed the authenticated owner journey from first-run setup through feedback collection, triage, widget customization, project settings, and Updates for users. It combined:

- a production-browser reproduction using the dedicated `test@test.com` account and an isolated temporary release note;
- production request-log correlation;
- a static review of every optimistic-concurrency mutation and its recovery UI;
- unit, dependency, schema, and Supabase advisor checks;
- review against the current product brief, PRD, user stories, MVP scope, and technical direction.

The primary acceptance rule is simple: a successful action performed in the same editor must never make the editor stale for the user's next action. Real cross-tab conflicts must preserve local input and provide a clear, reachable recovery path.

## Baseline scorecard

| Dimension | Score | Evidence |
| --- | ---: | --- |
| Accessibility | 8/10 | Semantic labels, live regions, focus-on-error behavior, keyboard-operable controls, and reduced-motion support are broadly present. Native blocking confirmations remain in a few authenticated destructive flows. |
| Performance | 8/10 | Route budgets, widget gzip budget, bounded API bodies, pagination, and targeted Supabase indexes are enforced. Advisor INFO notices are limited to quarantined snapshot tables and currently unused indexes. |
| Responsive behavior | 8/10 | Dashboard grids, mobile previews, sticky recovery actions, and compact controls cover the primary breakpoints. Dense authenticated forms still require continued small-viewport regression coverage. |
| Theming | 9/10 | Semantic OKLCH tokens and complete light, dark, system, and Windows 98 themes are tested. No hardcoded-theme blocker was found in the audited mutation flows. |
| Anti-patterns | 6/10 | Mutation concurrency is correctly enforced in the database, but clients use the standard `If-Match` transport header as an application version channel and some successive actions rely on React render timing. This is the main systemic reliability risk. |

## Findings and remediation status

### P1-01 - Standard `If-Match` is intercepted before app recovery [fixed]

**Evidence:** In production, image upload returned 200 and the immediately following draft PATCH returned 412. The app's route code emits 409 for edit conflicts and contains no 412 response. The 412 therefore bypasses the JSON `EDIT_CONFLICT` envelope, current-version value, recovery banner, and safe retry code. The same header is used across release notes, feedback triage, customization, project settings, and update display settings.

**Required fix:** Move the application version token to a namespaced header, retain server-side legacy `If-Match` parsing for compatibility, and keep ETag response headers for cache/version observability.

**Remediation:** All authenticated browser clients now send `X-Feedbacks-Version`. All eight protected handlers parse the shared application header and retain legacy ETag parsing only for backward compatibility. Standard ETag response headers remain intact.

### P1-02 - Media mutations leave the release-note editor on a render-stale version [fixed]

**Evidence:** `applyMediaMutation` updates React state after upload/remove, while the next action reads `selected.updated_at` from the render that initiated the media request. A fast or immediate Save draft therefore sends the pre-upload version even though the same editor just received the new version.

**Required fix:** Maintain a synchronous version ref, advance it on every successful mutation, merge media responses against the current state item, and use the ref for all subsequent release-note actions.

**Remediation:** The composer now maintains `selectedVersionRef`, advances it synchronously after save, publish, upload, and remove, and merges media responses against the latest state item. Every following mutation reads that ref.

### P1-03 - The exact successful-action → next-action sequence lacked regression coverage [fixed]

**Evidence:** Existing concurrency tests verify stale-request rejection and media tests verify upload/delete independently, but no test asserts Save draft → Upload image → Save draft, Upload → Remove, or one mutation immediately following another with the returned version.

**Required fix:** Add unit/static contract coverage for the namespaced header and Playwright/API coverage for chained mutations.

**Remediation:** Added shared-header round-trip coverage, a source boundary test that rejects browser `If-Match` writes, and an end-to-end assertion for image upload followed immediately by a successful draft save.

### P2-01 - Transport-level 412 responses degrade to a vague generic error [fixed]

**Evidence:** The composer request helper recognizes only a JSON `EDIT_CONFLICT` code. A bodyless/non-JSON 412 becomes “The server rejected this request,” even though the user's recovery banner is available elsewhere.

**Required fix:** Normalize 409/412 conflict statuses in the client error layer, recover the latest version when supplied, preserve local input, and keep the bottom recovery action reachable.

**Remediation:** The release-note request layer normalizes both 409 and 412 to `EDIT_CONFLICT`, reads a current version from JSON or ETag when available, preserves the form, and activates the existing top and bottom recovery actions.

### P2-02 - Version transport logic is duplicated across four clients and eight API handlers [fixed]

**Evidence:** Header formatting/parsing and conflict branching are repeated in release-note, feedback, customize, project-settings, settings, publish, archive, restore, image, and delete paths. Duplication allowed server/client semantics to drift.

**Required fix:** Centralize request header generation and request-header parsing in the optimistic-concurrency module, then add a source boundary test so future mutations cannot silently reintroduce standard `If-Match` writes.

**Remediation:** `mutationVersionHeaders` and `parseMutationVersion` now own the client/server contract. The test suite enforces their use at every owner-editable mutation boundary.

### P2-03 - Supabase leaked-password protection is disabled [blocked; platform setting]

**Evidence:** The live Supabase security advisor reports `auth_leaked_password_protection` as WARN. Schema/RLS checks pass, and no application dependency vulnerability was found.

**Required fix:** Enable leaked-password protection in Supabase Auth when the current plan supports it. This is an account-platform setting, not a repository migration.

**Status:** No repository or schema change can enable this account-level Auth option through the connected database tooling. It remains the only security-advisor warning and is documented rather than falsely marked fixed.

### P3-01 - Advisor noise from quarantine snapshots and unused indexes [accepted]

The performance advisor reports INFO-only missing-primary-key notices for read-only `quarantine.e2e_*_20260730` snapshot tables and unused-index notices. Snapshot tables are deliberately non-production reference data. Unused-index removal is not justified from a short activity window and could harm less-frequent jobs, so no destructive database change is warranted in this audit.

## Verification baseline

- Unit tests: 176/176 passing.
- Production dependency audit: no known vulnerabilities.
- Live Supabase schema check: passing.
- Production reproduction: confirmed 200 image upload followed by 412 draft PATCH.
- Supabase security advisor: one WARN (leaked-password protection disabled).
- Supabase performance advisor: INFO-only quarantine/unused-index notices.

## Remediation log

| Check | Result |
| --- | --- |
| Unit regression suite | 178/178 passing after remediation |
| Lint | Passing |
| TypeScript | Passing across all packages |
| Production build | Passing; 66 pages generated |
| Widget size budget | Passing at 17,266 bytes gzip |
| Dashboard route budgets | All 33 routes passing |
| Dependency audit | No known vulnerabilities |
| Live Supabase schema contract | Passing |
| Production browser verification | Passed on deployment `dpl_WorJLsV37GNqyBGEm9iPHRNyC7wD`: Save draft → replace/crop/upload → edit → Save draft succeeded; saved image appeared in the right preview; no conflict UI or 412 occurred |

The isolated audit release note and its image were deleted after verification. The post-deploy Vercel scan found no error-level, HTTP 412, or HTTP 5xx logs in the verification window.

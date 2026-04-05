# feedbacks.dev — Recovery Checklist

This file is advisory planning context, not the product source of truth.

Authoritative product direction still lives in:

1. `README.md`
2. `docs/product-brief.md`
3. `docs/prd.md`
4. `docs/user-stories.md`
5. `docs/mvp-scope.md`
6. `docs/technical-direction.md`
7. `docs/DEPLOYMENT.md`

## Current repo state

- core workspace builds on Linux with `pnpm`
- widget size budget currently passes
- dashboard, widget, public boards, billing scaffolding, and MCP surface all exist
- biggest remaining problem is drift between docs, setup, and implementation polish

## Immediate recovery priorities

### 1. Setup trust
- [ ] keep self-host instructions aligned with actual files in the repo
- [ ] keep deployment docs aligned with the full ordered migration chain
- [ ] keep local Playwright setup aligned with `packages/dashboard/.env.local`
- [ ] remove or neutralize references that assume `archived_project/` exists

### 2. Acceptance confidence
- [ ] run the existing Playwright install flow
- [ ] run the hosted verify flow
- [ ] run board submit, moderation, and directory flows
- [ ] capture any real failures as implementation bugs, not vague planning notes

### 3. Product-story alignment
- [ ] tighten homepage messaging around install speed and triage clarity
- [ ] keep auth and onboarding focused on “create project, paste snippet, verify”
- [ ] keep public boards positioned as a deliberate extension, not the first-run story
- [ ] use the repo design context in `.impeccable.md` for future UI changes

### 4. Architecture cleanup
- [ ] move remaining direct client-side table writes behind API routes
- [ ] keep widget config, snippet generation, and saved config on one canonical path
- [ ] keep public board queries and moderation paths scalable enough for higher board volume

## Notes

- The older “MyGang / dark-first / glass” direction is not current repo guidance.
- Use `.impeccable.md` plus the product docs as the active design direction.
- Treat this file as a short operational checklist, not as a replacement for the product docs.

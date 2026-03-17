# feedbacks.dev Senior Audit

Date: 2026-03-10

## Verdict

The product can work, but not in its current onboarding shape.

The technical core is viable:
- widget build passes
- dashboard build passes
- bundle budget is currently healthy (`7.5 KB` gzipped JS, `2.7 KB` gzipped CSS)
- the project has enough infrastructure for an MVP

The current risk is product friction, not raw implementation feasibility.

## What is good

- The widget is lightweight and fast enough for the stated MVP.
- The backend/API surface is already broad enough for a paid product path.
- The project detail area has useful primitives: preview, snippets, history, config persistence.
- There is evidence of mobile work and security thinking.

## What is hurting the product

### 1. The first-run experience is too complex

The project/widget setup experience is trying to do too much at once:
- setup mode choice
- step navigation
- preview
- snippet generation
- publish flow
- advanced settings
- history/versioning

That is too much for the “add feedbacks.dev in under 60 seconds” promise.

### 2. Public integration trust is weak

A developer tool lives or dies on whether copy-paste works the first time.

Before this pass, the public integration examples were using outdated config names. That is the kind of mistake that makes users assume the product is unreliable.

### 3. Product positioning and product behavior are misaligned

The PRD promise is:
- one-line install
- floating button
- fast time-to-value

The current install/customizer experience leans toward:
- multi-step configuration
- inline embed as default mental model
- advanced controls before confidence is established

That is not the right order for an early-stage dev tool.

### 4. UI style is inconsistent and over-designed in the wrong places

The problem is not just “ugly”.
The bigger issue is that the UI spends visual energy on decorative surfaces while core actions remain unclear.

Symptoms:
- too many badges, panels, mini-controls, and section labels
- weak hierarchy around the primary action
- important decisions hidden in tabs/steps instead of being guided explicitly
- mobile nav density is high for a setup flow

## Concrete issues found

### Product / UX

- The widget installation component contains dead/unreachable flow after an earlier return, which strongly suggests drift between intended onboarding and actual onboarding.
- The widget setup area mixes beginner and expert paths in one surface.
- The dashboard stats card showed page-sized feedback totals instead of full project totals.
- Documentation and marketing examples were inconsistent across versions and CDN domains.

### Package manager / repo health

- The repository was only partially migrated to pnpm.
- Root scripts still invoked npm internally.
- npm lockfiles were still committed in widget subprojects.
- Contributor docs still instructed npm, which would keep reintroducing drift.

### Delivery / maintenance

- `packages/widget/deploy.js` was broken at runtime and generated obsolete examples.
- The install/customizer component is too large and responsibility-heavy, which makes future UX work harder and riskier.

## Will users struggle?

Yes, especially new developers.

Most likely failure points:
- “I copied the code and it did not work.”
- “I do not know whether to choose inline, modal, or trigger.”
- “I do not know when I am done.”
- “I cannot tell if this saves locally, publishes remotely, or just changes the preview.”
- “The UI feels busy, so I do not trust the product.”

## What I changed immediately

- completed the repo-level pnpm migration wiring
- removed leftover npm lockfiles
- fixed public integration examples to use the actual widget API
- fixed the widget deploy helper so it runs again
- corrected the misleading feedback total on the project page

## What should happen next

Priority order:
1. Redesign first-run widget install around a 60-second path.
2. Separate “quick install” from “advanced customization”.
3. Reduce the widget setup surface area by at least half.
4. Align all docs, public examples, and generated snippets around one canonical install path.
5. Break the widget installation component into smaller units before doing a major UI overhaul.

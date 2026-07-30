# feedbacks.dev Design Guidance

This file records the current product UI direction so future changes do not depend on memory or screenshots.

## Register

Product UI. The design serves developer tasks: install the widget, verify first feedback, triage submissions, route important items, and manage public boards.

## Users

Developer-led teams, indie founders, and small SaaS builders. They should feel that the product is calm, precise, and trustworthy before they paste anything into their own app.

## Scene

A developer is adding feedback collection during a normal build session, switching between code, docs, and the dashboard on a laptop or desktop monitor. The interface should default to a calm light canvas that keeps code and actions easy to distinguish. Dark mode remains fully supported for users who choose it.

## Principles

- Setup clarity beats visual novelty.
- The install path comes before customization, integrations, boards, and API access.
- Use familiar product patterns: top navigation, tabs, compact panels, clear buttons, direct empty states.
- Keep public boards credible and editorial, not playful or social-toy-like.
- Strong hierarchy should come from spacing, weight, contrast, and labels, not decoration.

## Visual System

- Theme: light-first by default. Both themes use visibly distinct canvas, sidebar, panel, raised, selected, popover, and code roles.
- Dark hierarchy: keep the canvas, sidebar, inset rails, and code areas deep. Use lighter cards for primary work, a soft neutral for supporting rows and footers, and the brightest neutral only for headers, menus, and overlays. Do not alternate shades decoratively; assign them by function.
- Typography: system sans or the existing app font stack. Fixed sizes, no viewport-scaled product text.
- Accent: controlled green/primary accent for primary actions, active state, success, and focus. Do not use accent as decoration.
- Structure: crisp 1px borders, neutral panels, compact spacing, and clear section separation. Prefer page headers, rows, tables, and disclosures over card stacks.
- Radius: keep panels and controls modest. Avoid oversized rounded containers and repeated pill shapes.
- Icons: use the existing icon system for actions and status. Prefer icon plus label for unfamiliar actions.

## Component Rules

- Primary actions should be obvious and singular on first-run screens.
- Secondary actions should stay visible but quieter, especially verification, docs, billing, and integration settings.
- Code and its copy action should appear before explanatory setup material.
- Keep common controls open. Put advanced, security, agent, and reference content in disclosures.
- Empty states must teach the next action: create project, copy snippet, verify install, add endpoint, publish board.
- Loading states should preserve the layout with skeletons or in-place states.
- Error states must say what failed and what to try next.
- Do not nest cards inside cards. Use panels, rows, sections, and tables where they fit better.

## First-Run Flow

The order is:

1. Create project.
2. Copy the Website snippet.
3. Run hosted verification.
4. Confirm feedback lands in the inbox.
5. Customize, connect integrations, publish boards, or add API/MCP after first success.

The UI should keep this order visible anywhere installation is discussed.

## Integrations

- Endpoint rows should make configured, tested, failed, replayed, disabled, and idle states easy to scan.
- Secret URLs and tokens must never be displayed in full.
- Test-send failures should include an actionable cause when possible.
- Replay should feel operational, not decorative.

## Public Boards

- Vote count, status, replies, and official team responses should be visually distinct.
- Reduce pill overload. Use compact labels only where they improve scanning.
- Directory filters should be compact and obvious.
- Board directory should feel curated, not like an endless generic card grid.

## Copy

- Use direct product language: copy snippet, verify install, send test, replay delivery, publish board.
- Avoid vague claims like "powerful workflows" unless the surrounding UI proves the claim.
- Do not repeat headings in the body copy.
- Keep security and setup copy plain enough for a first-time user.

## Anti-Patterns

- Flashy decoration that competes with install or triage tasks.
- Multi-step setup screens for the simple install path.
- Burying snippets behind advanced configuration.
- Toy-like public board interactions.
- Decorative gradients, glass effects, oversized pills, or repeated identical card grids.

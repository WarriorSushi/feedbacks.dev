# Technical Direction

This is not a locked architecture document. It is a set of implementation constraints for the rebuild.

## Product architecture

Recommended high-level shape:

- `widget`
  - lightweight embeddable client
  - optimized for performance and low integration friction
- `dashboard`
  - authenticated web app
  - handles project management, inbox, and configuration
- `api`
  - receives feedback
  - validates and stores submissions
  - powers integrations

## Technical priorities

- keep widget API small and stable
- make install examples canonical and generated from one source
- separate quick install from advanced config in the dashboard UI
- reduce oversized components and mixed responsibilities

## UX-driven technical constraints

- widget configuration should be represented as a strict browser-safe remote contract; current snippets stay stable after installation
- save state should be explicit
- preview state and persisted state should not be conflated

## Suggested implementation rules

- one canonical config model for widget generation
- one canonical, minimal snippet generator shared across marketing and dashboard
- install once, then resolve feedback form configuration and product modules from the public bootstrap
- treat feedback-form placement as remote configuration; inline and custom-trigger guidance describes page markup without generating replacement install snippets
- preserve the last validated remote configuration during a temporary bootstrap outage, with legacy attributes as a compatibility fallback
- one clear saved-config representation per project
- one canonical plan / entitlement matrix shared across billing, marketing, dashboard UI, and server enforcement
- avoid giant all-in-one setup components

## Suggested component boundaries

- install snippet surface
- widget preview
- basic styling controls
- advanced field controls
- anti-spam controls
- saved configuration/history

## Non-functional constraints

- performance matters on both widget and dashboard
- security matters on all public submission paths
- docs and implementation must stay synchronized
- paid-plan truth must be server-driven and webhook-authoritative
- optional email-alert fanout must be enforced from server-side plan truth; disabling controls in the browser is not sufficient
- all application-generated Resend email must pass through one email-client-safe branded shell
- delivery-history APIs may read service-only email audits only after project ownership checks, must scope them by the authenticated recipient hash, and must never return recipient hashes or plaintext addresses
- billing provider integration must remain isolated from browser code except for hosted redirects
- advertising scripts must remain isolated from customer widgets and load only after explicit consent
- server conversion payloads must use allowlisted events, hashed normalized match data, bounded attribution fields, and browser/server deduplication identifiers
- referral qualification and reward application must be a single locked database operation callable only by the service role
- complimentary access must augment, not overwrite, webhook-authoritative billing state
- account-risk controls must layer verified identity, activation, maturation, velocity, and short-lived hashed device/network signals; IP addresses must never be the sole rejection rule
- cancellation warnings run inside the final paid period; entitlements downgrade at the paid-through boundary with no synthetic Pro grace period
- project downgrades are reversible state changes, not destructive retention jobs; only downgrade-frozen projects may be auto-restored
- the internal feedback channel reuses the private project, feedback, and product-update models and is excluded from customer plan accounting
- product-update visibility is independent from publication status; toggling visibility preserves the stable update ID, publication timestamp, metrics, and visitor seen state
- publication is the announcement boundary: edits and re-enabling never reset seen state, and a new announcement requires a new product-update record

## Archived project note

The archived implementation can be mined for:
- database ideas
- API validation patterns
- assets
- lessons from failed UX decisions

It should not dictate the rebuild architecture by default.

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

- widget configuration should be represented cleanly enough to generate accurate snippets
- save state should be explicit
- preview state and persisted state should not be conflated

## Suggested implementation rules

- one canonical config model for widget generation
- one canonical snippet generator shared across marketing and dashboard
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
- billing provider integration must remain isolated from browser code except for hosted redirects

## Archived project note

The archived implementation can be mined for:
- database ideas
- API validation patterns
- assets
- lessons from failed UX decisions

It should not dictate the rebuild architecture by default.

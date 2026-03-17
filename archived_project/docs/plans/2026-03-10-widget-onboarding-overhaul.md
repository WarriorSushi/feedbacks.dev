# Widget Onboarding Overhaul Plan

Date: 2026-03-10

## Goal

Make widget installation feel obvious for a first-time developer.

Success condition:
- a user creates a project
- copies one snippet
- sees the widget working
- only then customizes it

## Current problems

- Too many decisions too early.
- “Setup”, “appearance”, “fields”, “protection”, and “publish” are internal-system steps, not user goals.
- Preview is useful, but it competes with install instructions instead of supporting them.
- The UI lacks a clear “recommended path”.

## Proposed new flow

### Stage 1: Install

Single card, above the fold:
- headline: `Install your widget`
- subtext: `Copy this into your site to get feedback live in under a minute.`
- platform selector: Website, React, Vue
- one canonical snippet
- one clear CTA: `Copy install code`

Secondary actions:
- `Test demo`
- `Need a custom button?`

### Stage 2: Confirm

After copy:
- show short checklist
- `Added to your site`
- `Reloaded your page`
- `Need help finding where to paste it`

This is where trust is built.

### Stage 3: Customize

Only after install:
- launcher style
- colors
- form fields
- spam protection

Advanced controls should be collapsed by default.

### Stage 4: Publish

Publishing should not feel like a hidden side effect.

Use explicit language:
- `Preview changes`
- `Save draft`
- `Publish widget`

If there is no draft model, then remove “publish” language and use:
- `Save widget settings`

## IA changes

Replace step names:
- `Setup` -> `Install`
- `Appearance` -> `Style`
- `Fields` -> `Form`
- `Protection` -> `Spam protection`
- `Publish` -> `Save`

Better:
- remove stepper for most users
- use sections with a sticky summary on desktop

## Design direction

- less glassmorphism, less decorative chrome
- stronger hierarchy
- one main action per screen
- fewer badges and micro-labels
- more whitespace around code and preview
- use neutral surfaces with one accent color, not multiple competing treatments

## Recommended information hierarchy

1. Widget install snippet
2. Preview
3. Install help
4. Basic styling
5. Advanced settings
6. Version history

Version history should not be in the main first-run path.

## Refactor plan before redesign

Split `widget-installation.tsx` into:
- `widget-install-shell.tsx`
- `widget-install-snippets.tsx`
- `widget-preview.tsx`
- `widget-style-settings.tsx`
- `widget-field-settings.tsx`
- `widget-security-settings.tsx`
- `widget-version-history.tsx`

Without this split, the redesign will stay fragile.

## Acceptance criteria

- new user can install without touching advanced settings
- quick install path fits on one screen on desktop
- quick install path fits in one scroll on mobile
- copy-paste snippets are consistent across landing page, dashboard, and generated docs
- user always knows whether a change is preview-only or saved

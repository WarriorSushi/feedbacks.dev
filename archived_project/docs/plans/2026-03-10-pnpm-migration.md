# pnpm Migration Notes

Date: 2026-03-10

## Why this was needed

The repo had pnpm artifacts, but it was still behaving like a mixed npm/pnpm project.

That causes:
- warning noise
- inconsistent installs
- stale lockfiles
- scripts that behave differently depending on the shell

## Changes made

- added `packageManager` to the root `package.json`
- moved root scripts to pnpm-native workspace commands
- added root `lint` and `test` passthrough scripts
- updated Playwright web server startup to use pnpm
- updated widget build automation to use pnpm
- updated widget deploy script to use current widget API examples
- removed committed npm lockfiles from widget subprojects
- updated primary contributor docs to use pnpm

## Remaining cleanup worth doing later

- check whether `packages/widget/direct-feedback-loop` should be a real workspace package or an archived experiment
- normalize any remaining npm references in long-form docs not touched in this pass
- decide whether `deploy.js` should remain manual or be replaced with a small release script plus CI

## Validation

- `pnpm type-check` passes
- `pnpm build` passes
- widget gzip budget check passes

## Recommendation

From here, treat pnpm as the only supported package manager for this repository.

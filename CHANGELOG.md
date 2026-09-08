# Changelog

This file records changes from 5.0.0 onward. See [GitHub releases](https://github.com/Adoratorio/medusa/releases) for published release notes. Dates are shown where a matching GitHub release exists.

## Unreleased

### Documentation

- Refine contributor guidance and release notes; consolidate maintainer contacts in the README.

## [5.0.0](https://github.com/Adoratorio/medusa/releases/tag/v5.0.0) — 2026-09-08

### Behavior changes

- ONCE waits for the lowest configured threshold instead of any intersection.

### Changes

- Retain ESM-only packaging; update the TypeScript toolchain, native private members and error handling.
- `bubbles` option for emitted `medusa-<id>` events.
- Normalize empty thresholds to zero in ONCE mode.
- Ignore notifications for removed targets and obsolete observers, including duplicate ONCE entries.

### Maintenance

- Include source files and inline source maps for consumer debugging.
- Typecheck tests and verify packed exports.

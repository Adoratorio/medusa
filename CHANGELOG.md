# Changelog

## 5.0.0

- ESM-only, TypeScript 7 toolchain, native private members, aligned error handling.
- ONCE waits for the lowest configured threshold instead of any intersection.
- `bubbles` option for emitted `medusa-<id>` events.
- Normalize empty thresholds to zero in ONCE mode.
- Ignore notifications for removed targets and obsolete observers, including duplicate ONCE entries.
- Include source files and inline source maps for consumer debugging.
- Typecheck tests, verify packed exports, and document active maintainers separately from contributors.

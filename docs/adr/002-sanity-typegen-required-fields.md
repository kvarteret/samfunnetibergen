# ADR 002: Enforce required fields with draft-safe frontend projections

**Status:** Accepted  
**Date:** 2026-05-29  
**Updated:** 2026-06-12

## Context

The frontend renders published content publicly and draft content inside
authenticated Sanity Presentation sessions. Draft documents may temporarily
omit schema-required values, while published documents must pass Studio
validation.

Sanity TypeGen describes raw Content Lake fields. We still want required
published fields to remain useful in generated types without making draft
rendering unsafe.

## Decision

Keep `sanity schema extract --enforce-required-fields`.

Frontend GROQ projections establish the rendering contract:

- required display values use `coalesce()` with an editor-facing fallback;
- booleans and state values use `coalesce(field, schemaDefault)`;
- collections use `coalesce(field, [])`;
- optional images, URLs, references, and dereferenced documents remain nullable;
- missing `[0]` document queries remain nullable and are handled at the route
  boundary.

Raw generated types remain internal to `src/lib/sanity/`. Fetch helpers export
domain aliases and perform any TypeGen-only normalization that GROQ cannot
express cleanly.

TypeGen is configured under `typegen` in `sanity.cli.ts`. The
`SANITY_TYPEGEN_TARGET` environment variable selects the frontend or Studio
output while `npm run sanity:typegen` regenerates both:

- `src/lib/sanity/sanity.types.ts`
- `src/studio/sanity.types.ts`

## Consequences

- Draft preview is enabled without forcing defensive checks throughout the
  component tree.
- Required/defaulted fields are defined in frontend result contracts.
- Meaningful absence remains a straightforward `null` check.
- Query fallbacks must be reviewed whenever schema-required or defaulted fields
  are added.
- Generated files are never edited manually.

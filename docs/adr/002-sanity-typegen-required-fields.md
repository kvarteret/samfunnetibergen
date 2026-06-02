# ADR 002: Enforce required fields in Sanity TypeGen for published frontend data

**Status:** Accepted  
**Date:** 2026-05-29  
**Updated:** 2026-06-01

## Context

We generate TypeScript types from the Sanity schema and GROQ queries with
`npm run sanity:typegen`.

The app no longer renders draft content in the frontend. The removed draft path
included:

- `/api/draft-mode/enable`
- `/api/draft-mode/disable`
- `<VisualEditing />`
- `<SanityLive />`
- `defineLive` server/browser draft tokens

The frontend now fetches the published perspective only. That changes the type
tradeoff: `validation: rule => rule.required()` can be trusted for published
documents, because invalid drafts are no longer rendered by the public app.

## Decision

Use `sanity schema extract --enforce-required-fields` in
`npm run sanity:typegen`.

Generated types are split by ownership:

- `src/lib/sanity/sanity.types.ts` contains frontend schema and query result types.
- `src/studio/sanity.types.ts` contains Studio schema types.

The root `sanity.types.ts` file is no longer used.

## Fetch Boundary

The fetch helpers in `src/lib/sanity/fetch/` remain the boundary between Sanity
and the rest of the app. Keep these concerns there:

- route params;
- cache tags and revalidation;
- stega behavior;
- frontend-friendly return shapes and concise exported aliases.

Components should import domain aliases from `src/lib/sanity/fetch` or
`src/lib/sanity/types`, not generated `*QueryResult` names directly.

Some nulls still remain in generated query result types. Those are real query
or schema shapes, for example unmatched `[0]` queries, optional references,
optional fields, and projected asset URLs. Required-field typegen removes the
draft-only nullability, not every possible nullable value.

## Consequences

- Required published fields are typed more narrowly.
- Draft live editing is intentionally unavailable in the frontend.
- Studio route/document mapping remains explicit through
  `src/studio/presentation/resolve.ts`.
- Regenerate types with `npm run sanity:typegen` after schema or GROQ changes.
  Do not hand-edit generated type files.

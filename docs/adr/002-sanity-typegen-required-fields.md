# ADR 002: Do not enforce required fields in Sanity TypeGen; parse at the fetch boundary

**Status:** Accepted  
**Date:** 2026-05-29

## Context

We generate TypeScript types from the Sanity schema and GROQ queries with
`npm run sanity:typegen`, which writes `sanity.types.ts`. The generated query
result types are consumed by the server fetch helpers in `lib/sanity/fetch/`.

By default `sanity schema extract` ignores `validation: rule => rule.required()`.
Every projected field is therefore emitted as `T | null`, including fields the
schema requires for published documents (`name`, `slug`, `category` on
`studentGroup`, etc.).

The CLI supports an opt-in flag `--enforce-required-fields` that makes plain
`rule.required()` fields non-nullable. We evaluated this option and decided
against it for this project.

## Decision

### Do not use `--enforce-required-fields`

The flag was initially added (and later reverted) during a type-cleanup pass.
The reason we do not use it:

**This app renders draft content.** Visual Editing is active (`VisualEditing`
from `next-sanity/visual-editing` is mounted in `app/[locale]/layout.tsx`), and
`sanityFetch` automatically switches to the Sanity drafts API when Next.js draft
mode is enabled. Sanity validates `rule.required()` on *publish*, not on save.
Draft documents are explicitly allowed to be in an invalid state — a required
field can be `null` in a draft.

If we used `--enforce-required-fields`, our types would claim `slug: string`
while draft mode can produce `slug: null`. The types would lie, masking real
null-pointer paths in the Visual Editing flow.

The default `T | null` types are the honest representation of what `sanityFetch`
can return.

### Parse at the fetch boundary, don't validate downstream

The fetch helpers in `lib/sanity/fetch/` are the boundary between Sanity and the
rest of the app. Invariants are established once here:

- Slug-array helpers (`fetchStudentGroupSlugs`, `fetchPageSlugs`,
  `fetchRoomSlugs`) filter out null slugs with `.flatMap`:
  `groups.flatMap(g => g.slug ? [g.slug] : [])`. This is correct: a group
  without a slug has no URL and should not appear in `generateStaticParams`.
- `stegaClean` is applied to slug values used for routing, even when they are
  non-null, to strip stega encoding.
- A `[0]` single-document query and an unmatched reference can still be `null`;
  those guards are kept (e.g. `data ?? []`). That null is real.

### Use `typegen: { enabled: true }` in `sanity.cli.ts`

The project already uses automatic type generation via the `typegen` block in
`sanity.cli.ts`. Types regenerate automatically during `sanity dev` and
`sanity build`. The manual `npm run sanity:typegen` script remains for explicit
on-demand regeneration but does not pass `--enforce-required-fields`.

## Consequences

- All `rule.required()` fields remain `T | null` in generated types. This is
  accurate for an app that renders draft content via Visual Editing.
- The fetch boundary applies null guards where needed (slug arrays, optional
  references). Components downstream receive clean types.
- If this app ever stops using draft previews / Visual Editing entirely,
  re-evaluating `--enforce-required-fields` is reasonable — but the auto-typegen
  config does not yet expose the flag, so a manual script would still be needed.
- `sanity.types.ts` is a generated artifact. Regenerate it with
  `npm run sanity:typegen` after any schema or query change. Do not hand-edit it.

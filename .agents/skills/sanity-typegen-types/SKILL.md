---
name: sanity-typegen-types
description: Generate and consume Sanity TypeScript types correctly. Use when touching sanity.types.ts, GROQ queries, fetch helpers, or fixing "string | null" vs "string | undefined" / redundant null handling on Sanity data.
---

# Sanity TypeGen Types

Use this skill when a Sanity schema or GROQ query changes, when `sanity.types.ts`
is involved, or when a field that the schema requires shows up as `T | null` and
forces redundant null handling.

See `docs/adr/002-sanity-typegen-required-fields.md` for the decision behind this.

## Regenerate, never hand-edit

`sanity.types.ts` is generated. Types regenerate automatically during
`sanity dev` and `sanity build` via `typegen: { enabled: true }` in
`sanity.cli.ts`. For explicit on-demand regeneration:

```bash
npm run sanity:typegen
```

That script runs three steps that must stay together:

1. `sanity schema extract --path .sanity/schema.json`
2. `sanity typegen generate`
3. `biome format --write sanity.types.ts`

Step 3 is mandatory: typegen emits Prettier formatting; without the Biome pass
the file churns ~1600 formatting-only lines on every run.

`.sanity/schema.json` is a gitignored build artifact. Only `sanity.types.ts`
is committed.

After regenerating, run `npx tsc --noEmit`. New errors surfaced are real, not noise.

## Why we do NOT use `--enforce-required-fields`

The CLI supports a flag that makes `rule.required()` fields non-nullable. We do
not use it because **this app renders draft content via Visual Editing**.

`sanityFetch` switches to the Sanity drafts API when Next.js draft mode is
enabled. Sanity only validates `rule.required()` on *publish* — draft documents
are explicitly allowed to have required fields as `null`. Using
`--enforce-required-fields` would make our types claim `slug: string` while
draft mode can produce `slug: null`, masking real null-pointer paths.

The default `T | null` types are the honest representation of what `sanityFetch`
can return. If this app ever stops using draft previews entirely, re-evaluate —
but the official auto-typegen config does not expose the flag today regardless.

## Parse at the fetch boundary, don't validate downstream

Fetch helpers in `lib/sanity/fetch/` are the boundary. Establish invariants once
here so view components receive clean types.

- Slug-array helpers use `.flatMap` to filter out null slugs:
  `groups.flatMap(g => g.slug ? [g.slug] : [])`. A group without a slug has no
  URL and should not appear in `generateStaticParams`.
- Type fetch results from the generated query result types, not hand-written
  widening like `(x: { slug?: string | null })`.
- A `[0]` single-document query and an unmatched reference can still be `null`;
  keep those guards (e.g. `groups ?? []`). That null is real.
- `stegaClean` from `@sanity/client/stega` is still needed on values used for
  routing/keys even when they appear non-null.

## Verify

- `npm run sanity:typegen` after schema or query shape changes, then
  `npx tsc --noEmit`.
- Review the `sanity.types.ts` diff for type drift, not formatting.
- Keep the queries (`lib/sanity/queries/`) and their consumers in sync; an unused
  query is dead code that should be removed rather than kept generating types.

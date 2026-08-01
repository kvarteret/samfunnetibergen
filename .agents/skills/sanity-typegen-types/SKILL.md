---
name: sanity-typegen-types
description: Generate and consume Sanity TypeScript types correctly. Use when touching sanity.types.ts, GROQ queries, fetch helpers, or Sanity nullability.
---

# Sanity TypeGen Types

See `docs/adr/002-sanity-typegen-required-fields.md` for the current decision.

## Regenerate, never hand-edit

Run:

```bash
npm run sanity:typegen
npx tsc --noEmit
```

The script extracts `.sanity/schema.json` with
`--enforce-required-fields`, generates frontend and Studio outputs using
`sanity.cli.ts`, and formats both generated files:

- `apps/web/src/lib/sanity/sanity.types.ts`
- `apps/studio/src/studio/sanity.types.ts`

## Draft-safe required types

The app renders drafts through `defineLive`, but still enforces required fields
in TypeGen. Queries must make incomplete drafts safe:

- required strings: `coalesce(field, "[Mangler ...]")`;
- booleans/state: `coalesce(field, schemaDefault)`;
- collections: `coalesce(field, [])`;
- optional media, URLs, references, and dereferenced documents: keep `null`;
- missing single-document queries: keep `null` and handle once at the route.

Do not make projected keys optional when GROQ always emits them. Do not invent
fallback prose, references, URLs, images, or nested objects.

## Fetch boundary

Components import domain aliases from `apps/web/src/lib/sanity/fetch`, not generated
query names. Keep raw generated types internal. Use the fetch boundary for
small TypeGen normalization where an empty-array fallback produces
`Array<T> | Array<never>`.

Values used as route params or React keys may still need `stegaClean`.

## Verification

After schema, query, or fetch changes run:

```bash
npm run sanity:typegen
npm test
npm run typecheck
```

Review generated diffs for contract changes rather than editing them.

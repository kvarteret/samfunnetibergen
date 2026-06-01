# ADR 003: Learnings from `sanity-template-nextjs-clean`

**Status:** Accepted  
**Date:** 2026-06-01

## Context

We compared this repo's Sanity setup with
[`sanity-io/sanity-template-nextjs-clean`](https://github.com/sanity-io/sanity-template-nextjs-clean/)
at commit `c6074cb07b27002dcf09fd43f94f79c4ad5d927a`.

The comparison focused on GROQ query shape, Visual Editing, generated types, and
Studio structure. We decided to remove frontend draft live editing so generated
types can enforce schema-required fields for published content.

## Current repo baseline

This repo embeds Studio in the Next.js app at `/studio`, but keeps Studio-owned
source in the top-level `studio/` directory.

- `sanity.config.ts` enables `presentationTool`, `structureTool`, Vision, and
  project-specific plugins.
- `studio/presentation/resolve.ts` already uses `defineDocuments` and
  `defineLocations` for localized routes, singletons, detail pages, and shared
  documents such as navigation and footer.
- `lib/sanity/fetcher.ts` exports a published-content `sanityFetch` wrapper; it no
  longer uses `defineLive`.
- `app/[locale]/layout.tsx` no longer renders `<SanityLive />` or
  `<VisualEditing />`.
- `npm run sanity:typegen` extracts the schema with
  `--enforce-required-fields`.
- Generated types are split between `lib/sanity/sanity.types.ts` for frontend
  query/data access and `studio/sanity.types.ts` for Studio schema work.

The frontend no longer renders drafts, so required-field typegen is now an
honest representation of published content.

## Template improvements worth adopting

### 1. Required-field typegen is the main source of cleaner types

The template's frontend and Studio `sanity:typegen` scripts run:

```sh
sanity schema extract --enforce-required-fields
sanity typegen generate
```

That is why many generated query results have `string` instead of
`string | null` when the schema marks a field as required. This is the main
reason the template feels better typed than this repo.

For this repo, `--enforce-required-fields` is safe because the frontend no
longer renders draft content.

### 2. The template separates Studio and frontend typegen concerns

The template has a `studio/` package and a `frontend/` package. Both consume the
same extracted `sanity.schema.json`, but each workspace generates the types it
needs from its own GROQ query surface.

This repo's embedded Studio is still reasonable, but the template's split makes
the ownership model easier to understand:

- Studio owns schema extraction.
- Frontend owns frontend query result types.
- Generated schema JSON is the contract between them.

We keep the single-package app and use that clearer ownership model:
`studio/` owns editor configuration and schema, while `lib/sanity/` owns
frontend queries, fetch wrappers, generated frontend types, and result
normalization.

### 3. Presentation resolver coverage is a real Studio UX improvement

The template puts `mainDocuments` and `locations` directly in the Presentation
Tool config. This repo already has the same core pattern in
`studio/presentation/resolve.ts`, and our resolver is more domain-specific
because it covers localized routes, singletons, event detail pages, rooms,
groups, navigation, footer, and link-in-bio.

The template still highlights two useful conventions:

- Keep route-to-document mapping explicit with `defineDocuments`.
- Keep document-to-route mapping explicit with `defineLocations`, including
  global documents that appear across many pages.

Our current resolver is directionally good. The main improvement is maintenance:
new routed document types should be added to both resolver sections when they
are introduced.

### 4. Draft token handling should be removed when preview is removed

The template centralizes `SANITY_API_READ_TOKEN` in `frontend/sanity/lib/token.ts`
and throws when it is missing. This makes draft preview failures obvious during
boot instead of becoming harder-to-debug runtime behavior.

This repo removed the browser/server draft token path entirely with the draft
preview routes.

### 5. Query organization is less important than query boundaries

The template keeps its frontend GROQ in one `frontend/sanity/lib/queries.ts`
file with `defineQuery`, small string fragments, and unique exported query
names. This repo already uses `defineQuery` and has a more scalable split across
`lib/sanity/queries/`, `lib/sanity/fragments/`, and `lib/sanity/fetch/`.

The template reinforces two practices we should preserve:

- All frontend GROQ queries should be named exports wrapped in `defineQuery`.
- Fetch helpers should be the boundary where route params, tags, stega behavior,
  and frontend-friendly return shapes are decided.

## Draft preview and null types

The template is not actually an example of "no draft live preview." It still:

- enables `presentationTool` draft mode;
- defines `/api/draft-mode/enable`;
- passes read tokens into `defineLive`;
- renders `<VisualEditing />` in draft mode;
- renders `<SanityLive />` globally.

So the template's cleaner generated types come from
`--enforce-required-fields`, not from disabling draft preview.

For this repo, the implemented path was:

1. Stop rendering draft content in the frontend.
2. Remove the draft-mode preview routes and draft token flow.
3. Remove `<VisualEditing />` and `<SanityLive />`.
4. Change `npm run sanity:typegen` to extract with
   `--enforce-required-fields`.
5. Split generated types into frontend and Studio outputs.
6. Re-export concise domain aliases from `lib/sanity/fetch` and
   `lib/sanity/types`.
7. Simplify fetch-boundary null guards only where the regenerated types prove
   they are no longer needed.

This should be treated as a product/editorial workflow decision, not only a
TypeScript cleanup. The tradeoff is that editors lose draft live preview in
exchange for simpler published-content types and less stega/draft-mode
complexity in the public app.

## Follow-up

Keep generated `*QueryResult` types as implementation detail. New components
should prefer domain aliases exported from `lib/sanity/fetch` or
`lib/sanity/types`.

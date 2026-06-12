±# ADR 003: Sanity live editing architecture

**Status:** Accepted  
**Date:** 2026-06-01
**Updated:** 2026-06-12

## Context

We compared this repository with
[`sanity-io/sanity-template-nextjs-clean`](https://github.com/sanity-io/sanity-template-nextjs-clean/)
at commit `4d14b797a3425834d9abd635dc764b31b8088e61`.

The repository embeds Studio at `/studio`, keeps editor-owned source under
`src/studio/`, and keeps frontend queries and fetch helpers under
`src/lib/sanity/`.

## Decision

Use `defineLive` from `next-sanity/live` as the single frontend synchronization
boundary.

- `src/lib/sanity/fetcher.ts` exports `sanityFetch` and `SanityLive`.
- `SANITY_API_READ_TOKEN` is supplied as the server and browser Viewer token.
- `<SanityLive />` renders globally.
- `<VisualEditing />` renders only when authenticated Draft Mode is enabled.
- Presentation enables and disables Draft Mode through
  `/api/draft-mode/enable` and `/api/draft-mode/disable`.
- Public requests use the published perspective and explicit `stega: false`
  where values are used for metadata or routing.
- Manual cache tags and Sanity webhook invalidation are not maintained in
  parallel.
- Cache Components remain disabled; route-level cache migration is separate
  work.

Presentation keeps explicit `defineDocuments` and `defineLocations` mappings,
uses `http://localhost:3187` locally, lists trusted preview and production
origins, and avoids generating detail URLs for documents without slugs.

## Content contract

Required-field TypeGen remains enabled. Draft-safe query projections supply
fallbacks for required strings, schema defaults for state, and empty arrays for
collections. Meaningfully optional media, URLs, and references remain nullable.

The `sourceLink` storage model is preserved, but Studio exposes one searchable
destination input. Frontend projections normalize it to:

```ts
type LinkDestination =
  | { kind: "internalDocument"; href: string }
  | { kind: "internalPath"; href: string }
  | { kind: "external"; href: string }
```

## Consequences

- Editors receive click-to-edit and automatic draft updates in Presentation.
- Public content synchronization uses Sanity Live rather than a project-owned
  webhook endpoint.
- Existing references remain stable when target slugs change.
- New routes must be added to both Presentation document and location
  resolution.

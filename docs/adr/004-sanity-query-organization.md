# ADR 004: Organize Sanity GROQ queries into queries and fragments

**Status:** Accepted (structure landed; filenames adjusted during implementation)
**Date:** 2026-06-01

## Context

The project has a `lib/sanity` area for frontend/app integration with Sanity. It
included large query-related files (`queries` and `query_definitions`, each
around 350–550 lines). The boundary between the two was not immediately clear,
and as the files grew it became harder to find, reuse, and safely modify GROQ
queries and projections.

The project also keeps a separate Studio directory for CMS/editor configuration.
That separation remains:

- Studio defines the CMS/editor experience.
- The frontend read layer defines how the website/app reads from Sanity.

Within the frontend read layer, query organization should make it clear which
GROQ strings are executable queries and which are reusable
projections/fragments.

## Decision

Replace the broad `queries` / `query_definitions` split with a clearer
structure. Executable queries live in `queries/`; reusable projections live in
`fragments/`:

    apps/web/src/lib/sanity/
    ├── queries/
    │   ├── events.ts
    │   ├── groups.ts
    │   ├── navigation.ts
    │   ├── pages.ts
    │   ├── rooms.ts
    │   └── index.ts
    └── fragments/
        ├── images.ts
        ├── links.ts
        ├── portableText.ts
        ├── rooms.ts
        └── sections.ts

The original proposal named `queries/arrangements.ts` and `fragments/menus.ts`;
those landed as `queries/events.ts` and `queries/navigation.ts`, with
`fragments/sections.ts` added.

The rule is: queries are executable, fragments are composable.

A file in `queries/` exports complete GROQ queries that can be passed to the
Sanity fetch layer:

    export const pageBySlugQuery = groq`
      *[_type == "page" && slug.current == $slug][0] {
        ...
      }
    `

A file in `fragments/` exports reusable GROQ projections used inside executable
queries:

    export const imageFragment = groq`
      image {
        asset-> {
          _id,
          url,
          metadata {
            dimensions,
            lqip
          }
        },
        alt,
        caption
      }
    `

Fragments may be imported into queries:

    import {imageFragment} from '../fragments/images'
    export const pageBySlugQuery = groq`
      *[_type == "page" && slug.current == $slug][0] {
        title,
        ${imageFragment}
      }
    `

## Consequences

- Clearer separation between executable queries and reusable query parts.
- Smaller files that are easier to scan and maintain.
- Domain-based organization makes it easier to find relevant queries and reuse
  shared projections across domains.
- The split is convention, not enforcement. A contributor can still inline a
  projection in an executable query, so the structure is the documented default
  rather than a compile-time boundary.

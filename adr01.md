ADR: Organize Sanity GROQ queries into domain-based queries and reusable fragments

Status

Proposed

Context

The project currently has a lib/sanity area for frontend/app integration with Sanity. It includes large query-related files, including queries and query_definitions, each around 350–550 lines.

The current structure works, but the boundary between queries and query_definitions is not immediately clear. As these files grow, it becomes harder to find, reuse, and safely modify GROQ queries and projections.

The project also has a separate studio/ directory for Studio configuration, including schemas, structure, actions, presentation, and i18n. This separation should remain:

* studio/ defines the CMS/editor experience.
* lib/sanity/ defines how the website/app reads from Sanity.

Within lib/sanity, query organization should make it clear which GROQ strings are executable queries and which are reusable projections/fragments.

Decision

We will replace the broad queries / query_definitions split with a clearer structure:

lib/sanity/
├── client.ts
├── fetch.ts
├── image.ts
├── queries/
│   ├── arrangements.ts
│   ├── pages.ts
│   ├── navigation.ts
│   ├── rooms.ts
│   ├── groups.ts
│   └── index.ts
└── fragments/
    ├── arrangements.ts
    ├── images.ts
    ├── links.ts
    ├── menus.ts
    ├── portableText.ts
    └── index.ts

The rule is:

Queries are executable. Fragments are composable.

A file in queries/ should export complete GROQ queries that can be passed to the Sanity fetch layer.

Example:

export const pageBySlugQuery = groq`
  *[_type == "page" && slug.current == $slug][0] {
    ...
  }
`

A file in fragments/ should export reusable GROQ projections used inside executable queries.

Example:

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

Consequences

Positive

* Clearer separation between executable queries and reusable query parts.
* Smaller files that are easier to scan and maintain.
* Domain-based organization makes it easier to find relevant queries
p

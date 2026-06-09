# RFC: app/ vs features/ — where does a component live?

## Status

Proposed (bars portion already applied)

## Context

The codebase has a healthy layered shape: `app/` routes fetch data and compose
pages, `features/<slice>/` hold domain slices, `components/ui/` holds generic
primitives, and `components/` holds global chrome. Dependency direction is
acyclic (`app → features → lib/components`; `lib`/`components` never import
`features`).

The unclear part is the line between **a route-local component** and **a
feature component**. Today that line is applied inconsistently:

- `booking`, `karaoke`, `events` are full slices (`components` + `domain` +
  `actions` + `types`).
- `rooms` (only `ImageCarousel`), `grupper` (only `GroupsFilter`), and `bars`
  (two small components) are "features" with no `domain`/`actions`/`types`.
- `HomeBarPreviews` lived under `features/bars` but is only ever rendered by the
  landing route.

So "feature" currently means two different things, and a reader cannot predict
where a given component lives.

## Decision: a single placement rule

Place a component by answering two questions in order.

1. **Is it a generic, domain-agnostic primitive** (could be dropped into an
   unrelated app unchanged)? → `src/components/ui/`.
2. **Is it global chrome** instantiated once by the root layout? →
   `src/components/<area>/` (e.g. `navbar`, `footer`).

Otherwise it is product UI, and the test is **ownership of behavior**, not how
many routes use it:

- **`features/<slice>/`** — the component participates in a cohesive domain
  slice that owns logic and/or mutations: it ships alongside `domain/`
  (pure rules), `actions/` (`"use server"`), and `types/` (view-models), or it
  is reused by more than one route. Booking, karaoke, events qualify.
- **`app/<route>/_components/`** (route-private) — the component is rendered by
  exactly one route and carries no reusable domain logic; it is page
  composition. Next.js ignores `_`-prefixed folders for routing, so this is the
  idiomatic home for single-route UI.

Rule of thumb: **a feature is a slice of the product's behavior; a
route-private component is a slice of one page's markup.** "Used once" pushes
toward route-private; "owns rules or mutations, or is shared" pushes toward a
feature.

## Classification of current borderline components

| Component | Routes | Owns domain/actions? | Verdict |
|---|---|---|---|
| `HomeBarPreviews` | landing only | no (presentational + now-playing fetch) | **route-private** — applied: `app/[locale]/_components/` |
| `BarOpenStatus` / `HomeOpenStatus` | footer + landing | tiny, over `lib/opening-hours` | **feature `bars`** — applied: consolidated into `features/bars` |
| `ImageCarousel` | `rom/[slug]` only | no — a generic carousel, zero room domain | **proposed → `components/ui/`** (it is a primitive, not rooms-specific) |
| `rooms` feature | holds only `ImageCarousel` | — | **proposed → delete** once `ImageCarousel` moves to `ui` |
| `GroupsFilter` | `grupper` only | client filter state, no `domain`/`actions`/`types` | **proposed → route-private** `app/[locale]/grupper/_components/`, unless groups grows a domain slice (then keep as a feature) |

## Applied in this change

- `bars` keeps only the opening-hours concern (`BarOpenStatus`,
  `HomeOpenStatus`); `HomeBarPreviews` moved to `app/[locale]/_components/`.

## Proposed follow-ups (not yet applied)

1. Move `ImageCarousel` to `src/components/ui/image-carousel.tsx` and delete the
   `rooms` feature (it would be empty).
2. Move `GroupsFilter` to `app/[locale]/grupper/_components/` unless a groups
   domain slice is anticipated.

These are deferred so the boundary rule can be agreed before more files move.

## Consequences

- Every feature directory is then a real slice (`domain`/`actions`/`types` +
  components), and every single-route component sits next to its route.
- New components have a deterministic home: primitive → `ui`; one-route markup →
  `_components`; behavior-owning or shared → a feature.

# RFC: Next.js + Sanity app structure and feature organization

## Status

Proposed

## Context

The project is a Next.js App Router application with Sanity Studio embedded under `app/studio`. It also includes Storybook, generated API clients, i18n, route handlers, server actions, PostHog, Supabase, and a Sanity-powered frontend data layer.

The current structure is generally healthy, but some areas are beginning to grow across multiple directories:

- Event/arrangement code is split between route folders, `lib/events*`, Sanity schemas, and Sanity queries.
- Volunteer-related code is split between `components/volunteer-prospect*`, `lib/volunteer*`, and API routes.
- `lib/sanity/queries.ts` and `lib/sanity/query-definitions.ts` are both large.
- Some route-local interactive components use names such as `events-page-client.tsx`.

The app would benefit from clearer boundaries between routing, reusable UI primitives, domain features, frontend data access, and Sanity Studio configuration.

## Goals

- Keep `app/` focused on routing, layouts, route handlers, server actions, and composition.
- Keep `sanity/` focused on Studio/editor configuration.
- Keep `lib/sanity/` focused on frontend Sanity data access.
- Introduce `features/` for larger product/domain areas.
- Use React component casing for component files.
- Use domain names that match the product language of the app.
- Avoid overengineering small or stable areas.

## Non-goals

- Rewrite the whole app structure at once.
- Move every component into `features/`.
- Remove route-local components where they are genuinely only used by one route.
- Change the Sanity content model as part of this RFC.
- Change the public route structure.

## Decision

We will introduce a `features/` directory for larger domain areas and gradually move related code there.

The initial feature directories should be:

```txt
features/
├── events/
└── blifrivillig/
```

We will use these names instead of more generic/internal names:

```txt
features/events/          # not features/arrangements/
features/blifrivillig/    # not features/volunteerProspect/
```

This keeps the codebase aligned with the app’s route and product language:

- `events` covers arrangement/event listing, detail views, filtering, cards, recurrence helpers, and event submission UI.
- `blifrivillig` covers volunteer signup/prospect flows, volunteer group content, stats, and related UI.

## Proposed target structure

```txt
app/
├── [locale]/
├── actions/
├── api/
├── studio/
├── layout.tsx
├── providers.tsx
├── robots.ts
└── sitemap.ts

components/
├── ui/
├── navbar/
└── footer/

features/
├── events/
│   ├── components/
│   ├── server/
│   ├── utils/
│   ├── types.ts
│   └── index.ts
└── blifrivillig/
    ├── components/
    ├── hooks/
    ├── server/
    ├── content.ts
    ├── stats.ts
    ├── types.ts
    └── index.ts

lib/
├── sanity/
├── supabase/
├── posthog/
├── kvarteret-personal-api/
├── locale.ts
├── site-url.ts
└── utils.ts

sanity/
├── actions/
├── i18n/
├── presentation/
├── schemaTypes/
└── structure.ts
```

This is a target direction, not a required one-shot migration.

## App Router conventions

Route files stay in `app/`:

```txt
app/[locale]/arrangementer/page.tsx
app/[locale]/arrangementer/[event]/page.tsx
app/[locale]/arrangementer/ny/page.tsx
app/[locale]/blifrivillig/page.tsx
```

These files should mostly compose feature modules:

```tsx
import {EventsPage} from '@/features/events'

export default async function Page() {
  return <EventsPage />
}
```

or:

```tsx
import {BliFrivilligPage} from '@/features/blifrivillig'

export default function Page() {
  return <BliFrivilligPage />
}
```

## Component file naming

We will use React component casing for component files.

Preferred:

```txt
EventsPageClient.tsx
EventsFilters.tsx
EventsSections.tsx
FilterButton.tsx
SubmitArrangementForm.tsx
RecurrenceBuilder.tsx
```

Avoid for component files:

```txt
events-page-client.tsx
form-fields.tsx
form-sections.tsx
```

Non-component helper modules can continue to use kebab-case or camelCase, depending on existing project convention:

```txt
form-state.ts
events-utils.ts
submit-arrangement.ts
```

The rule of thumb is:

> If the file primarily exports a React component, use component casing.

## Client component naming

Client components should use explicit component names rather than route-style filenames.

Preferred:

```txt
EventsPageClient.tsx
```

With:

```tsx
'use client'

export function EventsPageClient(props: EventsPageClientProps) {
  // interactive state, filtering, handlers, browser APIs
}
```

The paired server route can stay simple:

```tsx
import {EventsPageClient} from '@/features/events/components/EventsPageClient'

export default async function Page() {
  const events = await getEvents()
  return <EventsPageClient events={events} />
}
```

## Events feature

Move event/arrangement-specific UI and domain logic toward:

```txt
features/events/
├── components/
│   ├── ArrangementCard.tsx
│   ├── EventCard.tsx
│   ├── EventsFilters.tsx
│   ├── EventsPageClient.tsx
│   ├── EventsSections.tsx
│   ├── FilterButton.tsx
│   ├── RecurrenceBuilder.tsx
│   └── SubmitArrangementForm.tsx
├── server/
│   └── submitArrangement.ts
├── utils/
│   ├── events.ts
│   └── eventsUtils.ts
├── formFields.tsx
├── formSections.tsx
├── formState.ts
├── types.ts
└── index.ts
```

Likely migration candidates:

```txt
app/[locale]/arrangementer/ArrangementCard.tsx
app/[locale]/arrangementer/EventCard.tsx
app/[locale]/arrangementer/events-page-client.tsx
app/[locale]/arrangementer/EventsFilters.tsx
app/[locale]/arrangementer/EventsSections.tsx
app/[locale]/arrangementer/FilterButton.tsx
app/[locale]/arrangementer/ny/form-fields.tsx
app/[locale]/arrangementer/ny/form-sections.tsx
app/[locale]/arrangementer/ny/form-state.ts
app/[locale]/arrangementer/ny/RecurrenceBuilder.tsx
app/[locale]/arrangementer/ny/SubmitArrangementForm.tsx
lib/events.ts
lib/events-utils.ts
lib/events-context.tsx
app/actions/submit-arrangement.ts
```

Route files should remain in `app/`.

## Bli frivillig feature

Move volunteer/prospect-specific UI and domain logic toward:

```txt
features/blifrivillig/
├── components/
│   ├── BliFrivilligPage.tsx
│   ├── ChoiceModal.tsx
│   ├── ChoiceSummary.tsx
│   ├── GroupList.tsx
│   ├── Hero.tsx
│   └── VolunteerProspectExperience.tsx
├── hooks/
│   └── useVolunteerProspectController.ts
├── server/
│   └── submitVolunteerProspect.ts
├── content.ts
├── groups.ts
├── shared.tsx
├── stats.ts
├── prospect.ts
├── types.ts
└── index.ts
```

Likely migration candidates:

```txt
components/volunteer-prospect/
components/volunteer-prospect-experience.tsx
components/volunteer-signup-page.tsx
lib/volunteer-group-content.ts
lib/volunteer-groups.ts
lib/volunteer-prospect.ts
lib/volunteer-stats.ts
app/api/volunteer-prospects/route.ts
```

The API route should remain in `app/api`, but implementation details may move to `features/blifrivillig/server/`.

## Shared components

Keep generic UI primitives in:

```txt
components/ui/
```

Examples:

```txt
Button.tsx
Card.tsx
Input.tsx
Textarea.tsx
Accordion.tsx
```

Domain-specific components should move to their feature folder unless they are used broadly across unrelated features.

Navbar and footer may remain global:

```txt
components/navbar/
components/footer/
```

They are layout-level components rather than feature-specific components.

## Sanity frontend data layer

Split large Sanity query files into executable queries and reusable fragments.

Target:

```txt
lib/sanity/
├── client.ts
├── live.ts
├── fetch.ts
├── image.ts
├── types.ts
├── queries/
│   ├── events.ts
│   ├── pages.ts
│   ├── navigation.ts
│   ├── rooms.ts
│   ├── groups.ts
│   └── index.ts
└── fragments/
    ├── events.ts
    ├── images.ts
    ├── links.ts
    ├── menus.ts
    ├── portableText.ts
    └── index.ts
```

Rule:

> Queries are executable. Fragments are composable.

If a GROQ string can be passed directly to `sanityFetch`, it belongs in `queries/`.

If a GROQ string is interpolated into another GROQ string, it belongs in `fragments/`.

## Sanity Studio configuration

Keep Studio-specific code in:

```txt
sanity/
```

This includes:

```txt
sanity/actions/
sanity/i18n/
sanity/presentation/
sanity/schemaTypes/
sanity/structure.ts
```

Do not move schema definitions, Studio structure, or Studio custom actions into `lib/sanity/`.

The distinction is:

```txt
sanity/       # CMS/editor experience
lib/sanity/   # frontend/app data access
```

## Supabase integration

Move Supabase integration from:

```txt
utils/supabase/
```

to:

```txt
lib/supabase/
```

This makes external integrations consistent:

```txt
lib/sanity/
lib/supabase/
lib/posthog/
lib/kvarteret-personal-api/
```

## Migration plan

1. Add `features/events/` and `features/blifrivillig/`.
2. Rename component files to component casing when they are moved.
3. Move event-specific components and helpers from `app/[locale]/arrangementer/` and `lib/events*` into `features/events/`.
4. Move volunteer-specific components and helpers from `components/volunteer-prospect*` and `lib/volunteer*` into `features/blifrivillig/`.
5. Keep public route files in `app/` and update them to import from feature modules.
6. Split `lib/sanity/queries.ts` and `lib/sanity/query-definitions.ts` into `queries/` and `fragments/`.
7. Move `utils/supabase/` to `lib/supabase/`.
8. Update imports incrementally.
9. Avoid broad barrel exports if they create circular dependencies or unclear import paths.

## Consequences

### Positive

- Clearer ownership of event and volunteer-related code.
- Smaller route folders.
- `app/` becomes easier to scan.
- Component filenames become more consistent with React conventions.
- Sanity frontend queries become easier to maintain.
- Integrations under `lib/` become more consistent.
- Product language is reflected in code structure.

### Negative

- Import paths will change.
- Some short-term churn is expected during migration.
- Feature folders can become dumping grounds if boundaries are not maintained.
- Component casing may require renames that are noisy on case-insensitive filesystems.

## Open questions and recommendations

### Should `features/events` own all event-related Sanity query exports, or should queries remain exclusively under `lib/sanity/queries`?

Recommendation: keep Sanity query definitions under `lib/sanity/queries` and `lib/sanity/fragments`.

Both this web app and a separate React Native app/repo may need to use event-related Sanity queries, especially early on. Query definitions should still be owned by a Sanity data-access layer, not by a route layer or a feature UI layer.

Rationale:

- `lib/sanity` is the frontend Sanity data access layer.
- Keeping all GROQ in one place makes it easier to maintain fragments, type generation, preview behavior, and fetch conventions.
- The React Native app may need access to the same event query definitions or equivalent query contracts.
- Feature modules should own product behavior and UI composition, not the underlying Sanity integration.
- This avoids duplicating query patterns across the web app, feature modules, and React Native app as the product grows.

Preferred structure:

```txt
lib/sanity/
├── queries/
│   ├── events.ts
│   ├── pages.ts
│   ├── navigation.ts
│   └── rooms.ts
└── fragments/
    ├── events.ts
    ├── images.ts
    ├── links.ts
    └── portableText.ts

features/events/
├── components/
├── server/
├── utils/
└── types.ts
```

The web app may import queries directly at first:

```ts
// features/events/server/getEventsPageData.ts
import {eventsPageQuery} from '@/lib/sanity/queries/events'
import {sanityFetch} from '@/lib/sanity/fetch'

export async function getEventsPageData() {
  return sanityFetch({query: eventsPageQuery})
}
```

If the React Native app needs the same queries, we should avoid copying query strings by hand. Prefer one of these approaches:

1. Extract shared Sanity queries into a small shared package used by both repos.
2. Keep query definitions duplicated temporarily, but treat the web repo as the source of truth until a shared package exists.
3. Expose event data through an API if the React Native app should not talk directly to Sanity.

Preferred long-term direction:

```txt
packages/
└── sanity-queries/
    ├── queries/
    │   └── events.ts
    ├── fragments/
    │   └── events.ts
    └── index.ts
```

The web repo can consume it from:

```ts
import {eventsPageQuery} from '@kvarteret/sanity-queries/events'
```

The React Native repo can consume the same query package if it talks directly to Sanity.

Feature-level server functions in the web app may wrap Sanity queries when that improves the domain API:

```ts
// features/events/server/getEventsPageData.ts
import {eventsPageQuery} from '@/lib/sanity/queries/events'
import {sanityFetch} from '@/lib/sanity/fetch'

export async function getEventsPageData() {
  return sanityFetch({query: eventsPageQuery})
}
```

The query remains in the Sanity data-access layer; the domain-specific loading function can use it.

Over time, if both the web app and React Native app need the same event query definitions, prefer extracting the query definitions to a shared package while keeping app-specific fetch wrappers separate.

### Should `events-context.tsx` remain a React context module, or should it be replaced by local client state inside `EventsPageClient`?

Recommendation: prefer local state inside `EventsPageClient` unless multiple distant child components need shared event/filter state.

React context should be used only when prop drilling becomes meaningfully awkward or when several sibling/deep components need to read and update the same state.

Rationale:

- Local state is easier to understand, test, and refactor.
- Context adds an implicit dependency between components.
- Event filters, selected categories, search state, and section visibility are likely page-level concerns.
- `EventsPageClient` can act as the state boundary for the interactive page.

Preferred default:

```txt
features/events/components/
├── EventsPageClient.tsx   # owns page-level interactive state
├── EventsFilters.tsx      # receives state and callbacks as props
├── EventsSections.tsx     # receives filtered events as props
└── EventCard.tsx
```

Keep or introduce context only if the component tree becomes difficult to work with using props.

If context is still needed, move it into the feature:

```txt
features/events/context/EventsContext.tsx
```

Avoid keeping it as a generic `lib/events-context.tsx` module.

### Should `app/actions/submit-arrangement.ts` remain as the public server action entrypoint while delegating to `features/events/server/submitArrangement.ts`?

Recommendation: yes.

Keep the server action entrypoint in `app/actions` if it is imported directly by client components or tied to App Router conventions. Move the implementation into `features/events/server`.

Rationale:

- `app/actions` remains a clear public boundary for Next.js server actions.
- Feature-specific implementation belongs with the feature.
- This keeps route/action wiring separate from business logic.
- It makes the action easier to test or reuse outside the route layer.

Preferred structure:

```txt
app/actions/
└── submit-arrangement.ts

features/events/server/
└── submitArrangement.ts
```

Example:

```ts
// app/actions/submit-arrangement.ts
'use server'

export {submitArrangement} from '@/features/events/server/submitArrangement'
```

```ts
// features/events/server/submitArrangement.ts
export async function submitArrangement(formData: FormData) {
  // validation, transformation, persistence, notifications
}
```

If the action is only used by one route and does not need a global public entrypoint, colocating the server action closer to that route is also acceptable. The recommended default is to keep `app/actions` as a thin boundary.

### Should Storybook stories live next to components, under `features/*`, or in a central stories directory?

Recommendation: colocate stories next to the components they document.

Rationale:

- Stories are easier to update when they live beside the component.
- Feature-specific stories remain inside the relevant feature.
- Shared UI primitive stories remain inside `components/ui`.
- A central stories directory tends to drift away from the implementation.

Preferred examples:

```txt
components/ui/Button.tsx
components/ui/Button.stories.tsx

features/events/components/EventCard.tsx
features/events/components/EventCard.stories.tsx

features/blifrivillig/components/ChoiceModal.tsx
features/blifrivillig/components/ChoiceModal.stories.tsx
```

Use a central Storybook configuration only for global setup:

```txt
.storybook/
├── main.ts
├── preview.ts
└── manager.ts
```

Generated Storybook output, such as `storybook-static/`, should not be treated as source architecture and should normally be ignored unless the project intentionally publishes it.

## Architectural reference: DDD-lite, bounded contexts, and CQRS naming

This RFC intentionally uses a lightweight domain-oriented structure rather than a strict enterprise DDD or CQRS architecture.

### Bounded context

A bounded context is an area of the product where a specific set of words, rules, data models, and business logic have one consistent meaning.

In this project, likely bounded contexts include:

```txt
events
blifrivillig
rooms
groups
navigation
pages/editorial
```

For example, inside the `events` context, words such as `arrangement`, `event`, `event type`, `recurrence`, `start date`, `location`, `iCal`, and `filter` have specific meanings and rules.

Inside the `blifrivillig` context, words such as `volunteer prospect`, `group choice`, `interest`, `signup`, `recommendation`, and `stats` have different meanings and rules.

The purpose of a bounded context is to avoid forcing one generic model to serve unrelated areas of the product. For example, `group` may mean different things in different places:

| Context | Meaning |
|---|---|
| `blifrivillig` | A group someone may want to volunteer for |
| `events` | A group organizing or connected to an event |
| `sanity` | A `gruppe` document type |
| `navigation` | A group of menu items |

The folder structure should reflect these product boundaries where the code is large enough to justify it.

### DDD-lite recommendation

Use DDD-inspired feature folders, but avoid heavy DDD terminology unless the domain grows significantly more complex.

Recommended:

```txt
features/events/
features/blifrivillig/
```

Avoid introducing heavy terminology by default:

```txt
aggregates/
entities/
value-objects/
repositories/
use-cases/
application/
infrastructure/
```

Those concepts may become useful later, but they are more structure than the project currently needs.

The practical version for this repo is:

```txt
features/events/
├── components/
├── data/
├── actions/
├── domain/
└── types.ts

features/blifrivillig/
├── components/
├── data/
├── actions/
├── domain/
└── types.ts
```

Where:

| Folder | Meaning |
|---|---|
| `components/` | React UI for the feature |
| `data/` | Read-side loading/fetching functions |
| `actions/` | Mutations, submissions, and server actions |
| `domain/` | Business rules, validation, normalization, filtering, recurrence logic |
| `types.ts` | Feature-specific types |

### CQRS naming discussion

CQRS separates reads from writes:

```txt
queries/   read operations
commands/  write operations
```

That idea maps reasonably well to this app, because the code has clear reads and writes. For example:

```txt
features/events/
├── queries/
│   ├── getEventsPageData.ts
│   └── getEventBySlug.ts
└── commands/
    └── submitArrangement.ts
```

However, this project already uses the word `queries` for raw Sanity GROQ query definitions:

```txt
lib/sanity/queries/
```

Using `features/events/queries/` as well would create two different meanings for `queries`:

| Path | Meaning |
|---|---|
| `lib/sanity/queries/events.ts` | Raw GROQ query definitions |
| `features/events/queries/getEventsPageData.ts` | Application read operation that executes queries |

Both meanings are valid, but the distinction is subtle and can be confusing.

Therefore, this RFC recommends using CQRS as an idea, but not necessarily as the naming convention.

Preferred naming:

```txt
data/       instead of queries/
actions/    instead of commands/
domain/     for business rules
```

This keeps the read/write separation without conflicting with Sanity GROQ terminology.

### Layering rule of thumb

Use the following distinction:

```txt
lib/sanity/queries/       Raw GROQ strings
features/*/data/          Functions that load data for the app
features/*/actions/       Functions that change or submit data
features/*/domain/        Pure feature/domain logic
features/*/components/    React components
```

Example:

```ts
// lib/sanity/queries/events.ts
export const eventsPageQuery = groq`...`
```

```ts
// features/events/data/getEventsPageData.ts
import {eventsPageQuery} from '@/lib/sanity/queries/events'
import {sanityFetch} from '@/lib/sanity/fetch'

export async function getEventsPageData() {
  return sanityFetch({query: eventsPageQuery})
}
```

```ts
// features/events/actions/submitArrangement.ts
export async function submitArrangement(input: SubmitArrangementInput) {
  // validate, transform, write, notify
}
```

```ts
// features/events/domain/eventFilters.ts
export function isUpcomingEvent(event: Event) {
  return new Date(event.startDate) > new Date()
}
```

### Final architectural stance

Use:

```txt
DDD-lite: yes
CQRS as a concept: yes
CQRS folder names: no, prefer data/actions/domain
```

This gives the project clearer boundaries without making the codebase heavier than necessary.

## Recommendation

Adopt the structure incrementally.

Start with the lowest-risk changes:

1. Rename/move route-local event components into `features/events/components/` using component casing.
2. Move volunteer-specific components into `features/blifrivillig/components/` using component casing.
3. Split Sanity queries into `queries/` and `fragments/`.

Avoid moving stable global layout components, UI primitives, or Sanity Studio schema files unless there is a clear reason.

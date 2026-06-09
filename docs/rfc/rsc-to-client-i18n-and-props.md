# RFC: passing translations across the RSC → client boundary

## Status

Proposed (no code changed yet — decision doc)

## Context

`arrangementer/page.tsx` (a Server Component) reads translations with
`getTranslations({ namespace: "EventsPage" })` and then drills ~10 individual
label props into the client component `EventsPage`:

```tsx
<EventsPageContent
  backLabel={t("back")}
  emptyLabel={t("empty")}
  facebookLabel={t("facebook")}
  filterAllLabel={t("filterAll")}
  filterMoreLabel={t("filterMore")}
  filterOrganizerLabel={t("filterOrganizer")}
  filterTypeLabel={t("filterType")}
  ticketsLabel={t("tickets")}
  title={title}
/>
```

`EventsPage` then forwards several of those props another level down into
`EventsPageFilters`.

Two facts make this worth a decision rather than a style nit:

1. `NextIntlClientProvider` is **already mounted** in `app/[locale]/layout.tsx`
   with the full `messages` object — so any client component can already call
   `useTranslations`.
2. `EventsPageFilters` **already calls `useTranslations("EventsPage")`** — while
   *also* receiving `filterAllLabel`/`filterMoreLabel`/… as props. The same
   strings arrive two ways.

So we are currently doing both patterns at once, which is the actual problem.

## The norm (next-intl + App Router)

next-intl supports two complementary patterns:

- **Server Components** read messages synchronously with `getTranslations` and
  can pass strings down as props. Required when the consumer is itself a Server
  Component (no hooks available).
- **Client Components** read messages with the `useTranslations` hook, which
  resolves against the nearest `NextIntlClientProvider`.

The recommended split is: **server reads on the server, client reads on the
client.** You only drill translated strings as props when a Server Component
must hand text to another Server Component, or when you deliberately want to
keep `messages` out of a client bundle.

## Options

### Option A — keep drilling label props (status quo)
- **Pros:** explicit; works even without a client provider; lets you ship only
  the exact strings a client needs.
- **Cons:** every new label is a new prop threaded through 2–3 layers; the prop
  list grows unbounded; it duplicates strings that the same component already
  fetches via the hook; high edit friction. We have already abandoned it inside
  `EventsPageFilters`.

### Option B — client components call `useTranslations` (provider already present)
- **Pros:** deletes ~10 props and their interfaces; one source of truth; matches
  what `EventsPageFilters` already does; new labels need no plumbing.
- **Cons:** couples the component to a namespace key; relies on the provider
  being in the tree (it is, app-wide).
- **Bundle note:** `messages` are *already* sent to the client via
  `NextIntlClientProvider`, so this adds no payload today. If bundle size later
  matters, scope the provider to a subset of namespaces.

### Option C — hybrid (recommended)
- Server Components keep `getTranslations` for server-only text (metadata, fully
  server-rendered markup).
- Client islands read their own strings with `useTranslations`.
- Strings are passed as props **only** when a Server Component renders another
  Server Component that needs them.

## Recommendation

Adopt **Option C**, which for the events listing subtree means **Option B**:

1. Drop `backLabel`, `emptyLabel`, `facebookLabel`, `filter*Label`,
   `ticketsLabel` from `EventsPage` and its children's prop interfaces.
2. Have `EventsPage` (and the already-converted `EventsPageFilters`) call
   `useTranslations("EventsPage")` directly.
3. Keep `getTranslations` in `arrangementer/page.tsx` for `generateMetadata`
   and any truly server-rendered text; stop forwarding label props.

`title` may stay a prop if it can come from CMS content (it falls back to
`t("title")` today) — that is content, not a static label, so prop-passing is
appropriate there.

## Decision needed

Confirm Option C before implementation. Are there client components we
deliberately want to keep label-free (e.g. to trim a future scoped message
bundle)? If not, this is a mechanical cleanup with no behavior change.

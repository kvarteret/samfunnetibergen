# Evolve Sanity content safely

This repository has two deployed Sanity consumers: the public website in
`apps/web` and the editor in `apps/studio`. Sanity owns the Content Lake and
schema registration. The website's queries and fetch helpers are the read
boundary; Studio's schema and custom inputs are the authoring boundary.

## Expand, migrate, contract

Use three compatibility phases whenever a field, value shape, or enum changes.

During expand, add the new field or representation while readers continue to
accept old documents. For an additive field, a website query must tolerate the
field being absent before Studio uses it. For a rename, readers use a fallback
such as `newField ?? oldField ?? fallback`.

During migrate, run an idempotent backfill that can be repeated without
changing an already migrated document. Keep a dry-run mode as the default,
require the existing explicit write flag for changes, and observe the result
through a content audit before changing writers.

During contract, change Studio writers only after every supported reader accepts
the new form. For a new enum value, readers must handle an unknown value before
the value appears in Studio. Remove the old field only after the consumer
support window and an audit prove that no supported reader needs it.

Required-field TypeGen (`npm run sanity:typegen`) validates the current schema
and query source. It cannot protect an old website deployment or an installed
mobile client from a newly written document, so it never replaces the three
phases.

## Consumer registry

| Consumer | Owner | Evidence in this repository | Contract status |
| --- | --- | --- | --- |
| Public website | `apps/web` | `apps/web/src/lib/sanity/client.ts`, `apps/web/src/lib/sanity/queries/`, `apps/web/src/lib/sanity/fetch/`, public pages and feeds | Verified |
| Sanity Studio | `apps/studio` | `apps/studio/sanity.config.ts`, `apps/studio/src/studio/schemaTypes/`, `apps/studio/src/studio/presentation/` | Verified |
| Mobile app | Unknown external owner | No mobile source or verified Sanity call is present in this repository; `apps/web/src/app/appen/page.tsx` only links to stores | Potential; not verified |

Before removing a field, register any future consumer with an owner and a
source-backed query/parser contract. A mobile integration requires a separate
decision between direct Sanity access with an app-owned parser contract and a
new versioned application API. The existing
`apps/web/src/app/api/events/feed/route.ts` is JSON-LD syndication and must not
be called a mobile API without a new ADR and consumer tests.

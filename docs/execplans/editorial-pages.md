# Execplan: Editorial Room and Group Pages

## Goal

Create first-class Sanity-backed editorial content for Norwegian room and group pages:

- `/rom`
- `/rom/[slug]`
- `/grupper`
- `/grupper/[slug]`

The existing `/arrangementer` routes remain out of scope because they already have their first editorial pass.

## Source Material

- Room listing and room detail content: `https://kvarteret.no/booking/` and linked room pages.
- Group content: `/Users/kluvin/Downloads/Hvem er vi_.md`.
- English translations are intentionally out of scope for this run.

## Plan

- [x] Start from `develop` on a new PR branch.
- [x] Inspect current Sanity, query, route, and seed patterns.
- [x] Load Sanity schema guidance and apply typed schema helpers to new content types.
- [x] Add Sanity schema types for room pages, room documents, group pages, and group documents.
- [x] Seed first-pass Norwegian source content.
- [x] Add GROQ queries and TypeGen aliases.
- [x] Implement listing/detail routes for rooms and groups.
- [x] Run TypeGen, typecheck, lint, and build.
- [x] Commit, push, and open a PR without merging.

## Non-Obvious Decisions

- `room` and `studentGroup` are documents because they need independent edit screens and detail pages.
- `roomsPage` and `groupsPage` are singleton documents because their introductory/FAQ copy belongs to the page, not to an individual room or group.
- Room images support both Sanity assets and source URLs. This keeps the source images visible immediately while allowing editors to replace them with Sanity-managed assets later.
- Group copy is Norwegian-only in this pass, matching the requested scope instead of adding placeholder English fields.

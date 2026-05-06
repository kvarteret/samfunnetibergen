# Sanity TypeGen Execplan

## Goal

Add first-class Sanity TypeGen support for this embedded Studio/Next.js frontend setup, including typed Sanity client fetches.

## Plan

1. Configure `sanity.cli.ts` TypeGen to scan the app, library, Studio, and root config query surfaces.
2. Move Sanity GROQ strings into named `defineQuery` constants so TypeGen can discover them.
3. Keep fetch wrappers in `lib/sanity/queries.ts`, but let their return types flow from generated query result types.
4. Generate the schema and TypeScript types through the Sanity CLI, both manually and during Studio dev/build.
5. Validate with TypeScript and the project build path where practical.

## Progress

- [x] Confirmed the current Sanity client uses inline query strings, which TypeGen cannot discover.
- [x] Confirmed this repo is Next.js, so TypeGen should scan TypeScript and JavaScript query surfaces only.
- [x] Configure Sanity CLI TypeGen.
- [x] Refactor queries to named `defineQuery` constants.
- [x] Generate `sanity.types.ts`.
- [x] Add a repeatable `npm run sanity:typegen` workflow.
- [x] Enable Sanity CLI automatic schema extraction and TypeGen for Studio dev/build.
- [x] Let generated nullable field shapes flow from Sanity and handle fallbacks at UI/service boundaries.
- [x] Keep launch group slugs Sanity-owned instead of hardcoding a runtime allow-list.
- [x] Run focused verification.

## Verification

- [x] `npm run sanity:typegen`
- [x] `npx tsc --noEmit`
- [x] `npm run lint` (passes with existing warnings outside this change)
- [x] `npm run build`

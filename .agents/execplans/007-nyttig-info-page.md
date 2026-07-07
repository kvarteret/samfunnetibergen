# Build a structured "Nyttig info" page at /nyttig, backed by Sanity, with the accessibility page folded in as accordions

This ExecPlan is a living document. The sections Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date as work proceeds.

This repository's ExecPlan rules live in `.agents/PLANS.md` (repository root is the `samfunnetibergen` Next.js + Sanity project). This document must be maintained in accordance with `.agents/PLANS.md`: keep it self-contained, prose-first, and novice-guiding; update Progress and the Decision Log at every stopping point; commit frequently.

## Purpose / Big Picture

Today, a visitor to Samfunnet i Bergen's website who wants practical, "how do I actually use this house" information has nowhere coherent to go. Some of it lives on a standalone accessibility page at `/nb/tilgjengelighet`; the rest (how to get here, where to buy tickets, how to book a room, lost-and-found, food service) is scattered or absent. The reference site neuf.no/praktisk (Chateau Neuf, the Oslo student house) solves this with a single "Praktisk info" landing page: a stack of clearly separated, icon-led information blocks — Adkomst (getting here), Billetter, Booking, Hittegods (lost & found), Tilgjengelighet, Servering, and so on.

After this change, a visitor can open `https://neste.samfunnetibergen.no/nb/nyttig` (Norwegian) — the new **Nyttig info** ("Useful info") page — and read every practical topic in one place. Each topic is a visually distinct section rendered by its own React component. The accessibility content that used to live on its own page is embedded here as one section whose sub-topics (lift & floors, drop-off, accessible toilets, questions) are collapsible accordions. Old links to `/nb/tilgjengelighet` keep working via a redirect to the new page.

All of this content is editable in Sanity Studio by non-developers: the page is a Sanity singleton document called **Nyttig info**, whose body is an ordered list of typed "section blocks". Editors can reorder blocks, edit prose, add links, and add or remove accordion sub-sections without touching code.

You will know it works when:

- Running the site locally and visiting `http://localhost:3187/nb/nyttig` shows the Nyttig info page with all sections rendered.
- The Tilgjengelighet section shows four collapsible accordion rows that open and close.
- Visiting `http://localhost:3187/nb/tilgjengelighet` redirects (HTTP 308) to `/nb/nyttig`.
- In Sanity Studio (`npm run studio`), a top-level "Nyttig info" entry exists and edits to it appear on the page after revalidation.
- `npm run test` passes, including the new tests added by this plan.

## Progress

- [x] (2026-07-06) Research complete: identified Sanity singleton pattern, `editorialSection`/`openingHours`/`sourceLink` objects, the generic `[slug]` markdown page currently serving `/tilgjengelighet`, the `page` document (`_id` `445aa6de-3a1a-4c29-b34e-2c98695e8cfb`, slug `tilgjengelighet`) holding the accessibility markdown, the `accordion.tsx` Base UI component, the fetch/query/fragment layering, TypeGen via `npm run sanity:typegen`, and the migration-script convention (`sanity exec scripts/*.ts --with-user-token`, gated by `SANITY_MIGRATION_WRITE=1`).
- [x] (2026-07-06) Milestone 1 — Content model: added `usefulInfoPage` singleton + `infoAddressBlock`, `infoAccordionBlock`/`infoAccordionItem` objects; registered in schema index, `documentTypes.ts`, `structure.ts` (Sider group + SEO audit), `contentPolicies.ts` (`nyttig`, `tilgjengelighet`), `sourceLink` reference list, and presentation (`resolve.ts` route + location + `[slug]` exclusion). `npm run sanity:typegen` clean.
- [x] (2026-07-06) Milestone 2 — Queries, fragments, fetch: added `infoAddressBlockProjection`/`infoAccordionBlockProjection` (+ `_type` on `editorialSectionProjection` for the union discriminant), `usefulInfoPage → /nyttig` in `sourceLinkProjection`, `usefulInfoPageQuery`, and `fetchUsefulInfoPage`/`UsefulInfoPage`. Types regenerate + `tsc` clean.
- [x] (2026-07-06) Milestone 3 — Frontend route + components: `src/features/nyttig/` (`NyttigPage`, `SectionBlock` exhaustive dispatcher, `EditorialInfoBlock`, `AddressBlock`, `AccessibilityAccordionBlock` client, `InfoSection`, `InlineContentLink`); `src/app/[locale]/nyttig/page.tsx` (revalidate 300, `notFound()` when null); redirect `/:locale/tilgjengelighet → /:locale/nyttig` (308) in `next.config.ts`.
- [x] (2026-07-06) Milestone 4 — Data migration: `src/studio/migrations/nyttigInfo.ts` (`splitAccessibilityMarkdown`, `buildUsefulInfoPageDocument`, `buildNavbarNyttigItems`) + `scripts/migrate-nyttig-info.ts` + `sanity:migrate:nyttig`/`:write` scripts. Dry-run then **write run applied** (user-confirmed): `createOrReplace usefulInfoPage` (6 sections), added "Nyttig info" navbar item, unpublished retired page `445aa6de-…`.
- [x] (2026-07-06) Milestone 5 — Tests & validation: `nyttigInfo.test.ts` (splitter → 4 expected titles + intro/heading; document builder shape/determinism; navbar idempotence). `npm run test` green (156 passed), coverage above 80% thresholds. NOTE: skipped the RTL `SectionBlock` render test — repo has no jsdom/@testing-library and runs `environment: "node"`; the dispatcher is instead covered by the exhaustive typed `switch` + builder tests.

## Surprises & Discoveries

- Observation: The `/tilgjengelighet` URL is not a bespoke route — it is served by the generic `src/app/[locale]/[slug]/page.tsx`, which renders a `page` document's markdown with `<ReactMarkdown>`. So "splitting the sections into accordions" is a content-model migration, not just a UI change.
  Evidence: GROQ query returned exactly one `page` doc with slug `tilgjengelighet` and a `content` markdown string; there is no `src/app/[locale]/tilgjengelighet` directory.
- Observation: A ready-made Base UI accordion already exists at `src/components/ui/accordion.tsx` (`Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` — verify exact exports before use). Reuse it rather than building one.
  Evidence: `src/components/ui/accordion.tsx` wraps `@base-ui/react/accordion`.
- Observation: `editorialSection` (object with `title`, `paragraphs: text[]`, `links: sourceLink[]`) already models exactly the shape needed for the Billetter/Booking/Gjenglemt/Servering blocks, and there is a presentational precedent for rendering it in `src/app/[locale]/rom/book/page.tsx` (`QuestionsSection`, `InlineContentLink`).
  Evidence: `src/studio/schemaTypes/objects/editorialSection.ts` and `src/lib/sanity/fragments/sections.ts`.

## Decision Log

- Decision: Model the page as a **singleton document** (`usefulInfoPage`, one instance, fixed id `usefulInfoPage`) whose body is an **ordered array of a small, closed set of typed section objects**, rather than (a) a free-form page-builder with dozens of block types, or (b) fixed named fields per topic.
  Rationale: The set of topics is curated and stable, and each must render as its own component — a closed discriminated array gives editors reorder/add/remove freedom while keeping a one-component-per-type mapping. This mirrors `roomsPage.sections` (array of `editorialSection`). A free-form builder would over-generalise (YAGNI); fixed fields would prevent reordering and adding topics. See `content-modeling-best-practices` skill: keep blocks semantic, not presentation-shaped.
  Date/Author: 2026-07-06 / Claude (Opus)
- Decision: Reuse the existing `editorialSection` object for the simple prose+links topics (Billetter, Booking, Gjenglemt, Servering); add only two new objects — `infoAddressBlock` (Adkomst: address + map link + body) and `infoAccordionBlock` (Tilgjengelighet: intro + array of `infoAccordionItem { title, body: portableTextContent }`).
  Rationale: DRY. `editorialSection` already exists, is TypeGen'd, and has a render precedent. Only Adkomst (structured address/map) and the accordion group need new shapes.
  Date/Author: 2026-07-06 / Claude (Opus)
- Decision: Store accordion bodies as **Portable Text** (`portableTextContent`), not plain strings, and migrate the existing accessibility markdown into blocks with `@portabletext/markdown`'s `markdownToPortableText`, splitting on `##` headings into one accordion item each.
  Rationale: The accessibility copy contains bold text, ordered and unordered lists, and inline emphasis that plain `text[]` would flatten. Portable Text preserves it and renders via the existing `src/lib/portable-text-components.tsx`. The `portable-text-conversion` skill documents `markdownToPortableText`.
  Date/Author: 2026-07-06 / Claude (Opus)
- Decision: Reserve the slug `nyttig`, add a permanent redirect `/tilgjengelighet → /nyttig` in `next.config.ts`, and unpublish (not hard-delete) the old `tilgjengelighet` `page` document during migration.
  Rationale: Preserves inbound links and lets the migration be re-run/rolled back safely. Unpublish keeps a draft copy for recovery.
  Date/Author: 2026-07-06 / Claude (Opus)

## Outcomes & Retrospective

To be written at completion of each milestone and at the end. Compare against the Purpose: can a visitor read all practical topics at `/nb/nyttig`, are the accessibility sub-topics collapsible, does the old URL redirect, and can an editor change everything in Studio.

**Completion (2026-07-06):** All five milestones done and verified against a running dev server on :3187.

- `/nb/nyttig` renders "Nyttig info" with sections in order: Adkomst (address "Olav Kyrres gate 49, 5015 Bergen" + "Vis i Google Maps" → `maps.google.com/?cid=855600626603745653"`), Billetter og arrangementer (→ `/nb/arrangementer`), Booking (→ `/nb/rom/book`), Gjenglemt, Servering (→ `/nb/catering`), Tilgjengelighet ♿️.
- The Tilgjengelighet accordion carries all four items (Heis og etasjer, Av- og påstigning, HC-toaletter, Har du spørsmål om tilgjengelighet?); numbered/bulleted lists (`listItem` ×9) and bold phone numbers survive the markdown→Portable Text conversion.
- `curl -I /nb/tilgjengelighet` → `HTTP/1.1 308` with `location: /nb/nyttig`.
- `npm run test` green (156 passed, coverage > 80%); `tsc --noEmit` + `biome check` clean; `sanity:typegen` regenerated.

Deviations from plan: (1) singleton groups are `content`/`seo` (sharing folded into `seo`) to match the `roomsPage`/`kontaktPage` convention rather than a separate `sharing` group. (2) No RTL `SectionBlock` render test — the repo runs Vitest in `environment: "node"` with no jsdom/@testing-library; the exhaustive typed `switch` plus the builder tests cover the registry instead. (3) Also reserved `tilgjengelighet` slug (in `contentPolicies` + presentation `[slug]` filter) so the retired slug can't be reclaimed.

## Context and Orientation

You are working in the `samfunnetibergen` repository: a Next.js App Router site (Next canary — read `node_modules/next/dist/docs/` before touching framework APIs; do not trust memorised Next conventions) with an embedded Sanity Studio. Package manager is `bun`/`npm` (lockfiles for both exist; use `npm run <script>` for scripts). The dev server runs on port **3187**.

Key terms, in plain language:

- **Sanity**: a headless CMS. Content is stored as JSON "documents"; the shape of each document is defined by a **schema** written in TypeScript with `defineType`/`defineField`. The editing UI is **Studio**.
- **Singleton**: a document type that has exactly one instance, edited in place (e.g. the home page). Its document `_id` equals its type name. Singletons are listed in `src/studio/documentTypes.ts` (`singletonTypeNames`) and pinned in the Studio sidebar via `src/studio/structure.ts`.
- **Object type**: a reusable content shape that lives *inside* a document (not independently addressable), e.g. `editorialSection`, `sourceLink`, `openingHours`.
- **GROQ**: Sanity's query language. Queries live in `src/lib/sanity/queries/`, are written with `defineQuery(...)` from `next-sanity`, and reference reusable **projection fragments** in `src/lib/sanity/fragments/`.
- **TypeGen**: `npm run sanity:typegen` extracts the schema to `.sanity/schema.json`, then generates TypeScript types for every `defineQuery` result into `src/lib/sanity/sanity.types.ts` and `src/studio/sanity.types.ts`. Run it after any schema or query change so `ClientReturn<typeof someQuery>` types are correct.
- **Portable Text**: Sanity's rich-text format (an array of typed blocks). Rendered on the frontend by `src/lib/portable-text-components.tsx` (`PortableTextContent`).
- **`sourceLink`**: the site's polymorphic link object (internal document reference, internal path, or external URL). Its GROQ projection (`src/lib/sanity/fragments/links.ts`, `sourceLinkProjection`) resolves a single `href` and `label`; the frontend renders it with a small `InlineContentLink`-style helper (see `src/app/[locale]/rom/book/page.tsx`).

Files you will read or touch (all paths repository-relative):

- Schema: `src/studio/schemaTypes/index.ts` (registry array `schemaTypes`), `src/studio/schemaTypes/objects/editorialSection.ts` (reused), `src/studio/schemaTypes/objects/portableText.ts` (`portableTextContent`), `src/studio/schemaTypes/objects/sourceLink.ts` (add the new singleton to its `internalPage` reference `to` list), `src/studio/schemaTypes/documents/singletons/roomsPage.ts` (pattern to copy).
- Studio wiring: `src/studio/documentTypes.ts` (`singletonTypeNames`, `studioDocumentTypeNames`), `src/studio/structure.ts` (sidebar), `src/studio/contentPolicies.ts` (`RESERVED_PAGE_SLUGS`), `src/studio/presentation/routing.ts` + `resolve.ts` (preview location).
- Data layer: `src/lib/sanity/queries/pages.ts`, `src/lib/sanity/fragments/sections.ts` + `links.ts` + `portableText.ts`, `src/lib/sanity/fetch/pages.ts`.
- Frontend: new `src/features/nyttig/` folder; new `src/app/[locale]/nyttig/page.tsx`; `next.config.ts` (redirect); `src/components/ui/accordion.tsx` (reused); `src/lib/app-locale.ts`, `src/lib/page-metadata.ts` (used by every route).
- Migration: `scripts/` (copy the shape of `scripts/migrate-retired-volunteer-links.ts`); the existing accessibility content is `page` document `_id` `445aa6de-3a1a-4c29-b34e-2c98695e8cfb`.
- The navbar is the `navbar` singleton (`src/studio/schemaTypes/documents/navbar.ts`); its "Praktisk info"/"Nyttig info" entry is editorial data changed in Studio or by the migration script.

How the parts fit: A request to `/nb/nyttig` hits `src/app/[locale]/nyttig/page.tsx`, which calls `fetchUsefulInfoPage()` (data layer) → runs `usefulInfoPageQuery` (GROQ with section projections) → returns a typed object. The page maps over `sections` and dispatches each to a component in `src/features/nyttig/` by its `_type`. Editors change the singleton in Studio; `revalidate = 300` (5 min) refreshes the cached page.

The exact copy to seed is embedded in **Artifacts and Notes** below so a novice needs no external source.

## Plan of Work

The work proceeds in five milestones; each is independently verifiable.

### Milestone 1 — Content model

Create three new schema files and register them.

1. New object `src/studio/schemaTypes/objects/infoAddressBlock.ts`, `defineType({ name: "infoAddressBlock", title: "Adkomst-blokk", type: "object", icon: PinIcon })` with fields: `heading` (string, required), `body` (`portableTextContent`), `address` (string), `mapUrl` (url, validated `scheme: ["http","https"]`). Give it a `preview` selecting `heading`.

2. New object `src/studio/schemaTypes/objects/infoAccordionBlock.ts` exporting two `defineType`s:
   - `infoAccordionItem` (object): `title` (string, required), `body` (`portableTextContent`, required). Preview from `title`.
   - `infoAccordionBlock` (object, `icon: ChevronDownIcon`): `heading` (string, required), `intro` (text, optional), `items` (array of `infoAccordionItem`, `validation: min(1)`). Preview: title `heading`, subtitle `${items.length} seksjoner`.

3. New singleton `src/studio/schemaTypes/documents/singletons/usefulInfoPage.ts` — copy the structure of `roomsPage.ts`: `defineType({ name: "usefulInfoPage", title: "Nyttig info", type: "document", icon: InfoOutlineIcon, __experimental_actions: ["update","publish"] })`, groups `content`/`seo`/`sharing`. Fields: `eyebrow` (string), `title` (string, required, initialValue "Nyttig info"), `intro` (text, rows 3), `sections` (array `of` `editorialSection`, `infoAddressBlock`, `infoAccordionBlock`), then `...createSeoFields()` and `...createSharingFields({ group: "sharing" })`. (Verify the exact `createSharingFields` group argument against `roomsPage.ts`.)

4. Register everything in `src/studio/schemaTypes/index.ts`: import and add `infoAddressBlock`, `infoAccordionItem`, `infoAccordionBlock` to the "Objects" part of `schemaTypes`, and `usefulInfoPage` to the "Singletons" part.

5. `src/studio/documentTypes.ts`: add `"usefulInfoPage"` to `singletonTypeNames`.

6. `src/studio/contentPolicies.ts`: add `"nyttig"` to `RESERVED_PAGE_SLUGS` (so no `page` doc can claim that slug). Also add `"tilgjengelighet"` if you want to prevent a new page reclaiming the retired slug (optional; note in Decision Log if you do).

7. `src/studio/structure.ts`: add a `singletonListItem(S, "usefulInfoPage", "Nyttig info", InfoOutlineIcon)` — put it under the "Sider" group (near `kontaktPage`), and add `"usefulInfoPage"` to the `pageLikeTypes` array inside `seoAuditItems` so the SEO audit covers it.

8. `src/studio/schemaTypes/objects/sourceLink.ts`: add `{ type: "usefulInfoPage" }` to the `internalPage` reference `to` array (so links can point at the page).

9. `src/studio/presentation/routing.ts`/`resolve.ts`: add a preview location for `usefulInfoPage` mapping to `/${defaultLocale}/nyttig` (follow how `kontaktPage`/`roomsPage` singletons are resolved there).

Then run `npm run sanity:typegen` and `npm run check` (biome). Acceptance: `npm run studio` shows "Nyttig info" in the sidebar with the three field groups and an empty `sections` array editor offering the three block types.

### Milestone 2 — Queries, fragments, fetch

1. `src/lib/sanity/fragments/sections.ts`: add projections. Reuse `editorialSectionProjection`. Add:
   - `infoAddressBlockProjection` = `{ _key, _type, heading, "body": coalesce(body[] ${portableTextProjection}, []), address, mapUrl }`.
   - `infoAccordionBlockProjection` = `{ _key, _type, heading, intro, "items": coalesce(items[]{ _key, title, "body": body[] ${portableTextProjection} }, []) }`.
   Import `portableTextProjection` from `./portableText`.

2. `src/lib/sanity/queries/pages.ts`: add
   `export const usefulInfoPageQuery = defineQuery(\`*[_type == "usefulInfoPage" && _id == "usefulInfoPage"][0] { eyebrow, title, intro, "sections": coalesce(sections[]{ _type == "editorialSection" => ${editorialSectionProjection}, _type == "infoAddressBlock" => ${infoAddressBlockProjection}, _type == "infoAccordionBlock" => ${infoAccordionBlockProjection} }, []), ...seo/sharing fields as kontaktPageQuery does }\`)`. Match the SEO field selection used by `kontaktPageQuery` (so `buildPageMetadata` works).

3. `src/lib/sanity/fetch/pages.ts`: add `export async function fetchUsefulInfoPage() { const { data } = await sanityFetch({ query: usefulInfoPageQuery }); return data }` (import the query). Export a type alias `export type UsefulInfoPage = NonNullable<Awaited<ReturnType<typeof fetchUsefulInfoPage>>>` for the frontend.

Run `npm run sanity:typegen` again (queries changed). Acceptance: `ClientReturn<typeof usefulInfoPageQuery>` compiles; `npx tsc --noEmit` is clean.

### Milestone 3 — Frontend route + components

Create `src/features/nyttig/` (feature-folder organisation per the web coding-style rules):

- `NyttigPage.tsx` — presentational: takes `page: UsefulInfoPage`, renders a `<header>` with `eyebrow`/`title`/`intro`, then `<section>`s by mapping `page.sections` through `SectionBlock`.
- `SectionBlock.tsx` — the registry/dispatcher: `switch (block._type)` → `EditorialInfoBlock` | `AddressBlock` | `AccessibilityAccordionBlock`. Exhaustive switch with a `never` default.
- `EditorialInfoBlock.tsx` — renders `editorialSection` (heading, paragraphs, links). Port the `InlineContentLink` helper from `src/app/[locale]/rom/book/page.tsx` (internal `<Link>` vs external `<a target=_blank rel=noreferrer>`), or extract that helper to a shared spot and import it from both.
- `AddressBlock.tsx` — renders `infoAddressBlock`: heading, `PortableTextContent` body, an address line, and a "Vis i Google Maps" external link to `mapUrl`.
- `AccessibilityAccordionBlock.tsx` — `"use client"`; renders `heading` + `intro`, then the shared `Accordion`/`AccordionItem`/`AccordionTrigger`/`AccordionContent` from `src/components/ui/accordion.tsx`, one item per `items[]` entry, body via `PortableTextContent`. Give the block an `id="tilgjengelighet"` anchor so `/nyttig#tilgjengelighet` scrolls to it.
- Each section wrapper uses semantic `<section aria-labelledby=...>` with an icon (lucide-react, matching the neuf.no icon-led style) and the site's existing utility classes (`panel`, `font-heading`, spacing tokens). Aim for the design-quality bar: clear hierarchy, intentional rhythm, designed hover/focus states — not a uniform card grid.

Route: `src/app/[locale]/nyttig/page.tsx` — copy the shape of `src/app/[locale]/kontakt/page.tsx`: `revalidate = 300`, `generateStaticParams` from `getLocaleStaticParams`, `generateMetadata` via `buildPageMetadata({ content: page, canonicalPath: \`/${locale}/nyttig\`, fallbackTitle: "Nyttig info" })`, default export that resolves locale, activates it, calls `fetchUsefulInfoPage()`, and renders `<NyttigPage page={page} />`. Handle `page == null` gracefully (render header with fallback, or `notFound()` — choose and note it).

Redirect: in `next.config.ts`, add to the `redirects()` array `{ source: "/:locale/tilgjengelighet", destination: "/:locale/nyttig", permanent: true }` (verify how existing redirects are shaped; the site uses a `[locale]` prefix). If `next.config.ts` has no `redirects()` yet, add one.

Acceptance: `npm run dev`, open `http://localhost:3187/nb/nyttig` — all seeded sections render, accordion opens/closes; `http://localhost:3187/nb/tilgjengelighet` 308-redirects to `/nb/nyttig`.

### Milestone 4 — Data migration & navbar

Write `scripts/migrate-nyttig-info.ts` following `scripts/migrate-retired-volunteer-links.ts`: reads `SANITY_MIGRATION_WRITE` env (dry-run unless `=1`), uses the Sanity client with user token. It must be **idempotent** (safe to run repeatedly): use `createOrReplace` for the singleton with fixed `_id: "usefulInfoPage"`, and deterministic `_key`s for array members.

The script:

1. Builds the `usefulInfoPage` document from the copy in **Artifacts and Notes** (Adkomst → `infoAddressBlock`; Billetter, Booking, Gjenglemt, Servering → `editorialSection`; Tilgjengelighet → `infoAccordionBlock`).
2. Converts the accessibility markdown (fetched from `page` `_id` `445aa6de-3a1a-4c29-b34e-2c98695e8cfb`, or use the copy embedded here) into accordion items: split the markdown on `## ` headings; the first `# Tilgjengelighet` heading + lead paragraph becomes the block `heading`/`intro`; each subsequent `## X` becomes an `infoAccordionItem` with `title = X` and `body = markdownToPortableText(sectionBody)` from `@portabletext/markdown`. Install it if absent: `npm i @portabletext/markdown`.
3. Unpublishes the old `tilgjengelighet` page doc (delete the published doc id, keeping the draft) — or leaves it and relies on the reserved-slug + redirect. Note the choice in the Decision Log.
4. Adds a "Nyttig info" item to the `navbar` singleton pointing at `usefulInfoPage` (or internalPath `/nyttig`), if not already present.

Run dry-run first: `npm run <new-script>` (add `sanity:migrate:nyttig` and `sanity:migrate:nyttig:write` scripts mirroring the volunteer-links pair). Inspect the printed plan, then run the `:write` variant.

Acceptance: after the write run, the GROQ `*[_id == "usefulInfoPage"][0]` returns the fully populated document; `/nb/nyttig` renders migrated accordions with preserved bold/list formatting.

### Milestone 5 — Tests & validation

- Unit test `scripts/migrate-nyttig-info.test.ts` (or a colocated util test): extract the markdown-splitting logic into a pure function `splitAccessibilityMarkdown(md): { heading, intro, items }` and test that the sample markdown yields exactly 4 items with the expected titles ("Heis og etasjer", "Av- og påstigning", "HC-toaletter", "Har du spørsmål om tilgjengelighet?"). Arrange-Act-Assert.
- Component/registry test: render `SectionBlock` with a minimal fixture of each `_type` and assert the right heading/text appears (Vitest + Testing Library, matching existing test style; check `vitest.config.ts` and an existing `*.test.ts(x)`).
- Run `npm run test` (vitest + coverage) and `npx tsc --noEmit` and `npm run check`.
- Manual: the acceptance checks in **Validation and Acceptance**.

## Concrete Steps

Work from the repository root `/Users/kluvin/dev/kvarteret/samfunnetibergen` unless noted.

    # 0. Baseline — confirm current state
    cd /Users/kluvin/dev/kvarteret/samfunnetibergen
    npm run test            # expect current suite green before you start
    git checkout -b feat/nyttig-info

    # 1. After schema files exist (Milestone 1) and after each query change (Milestone 2)
    npm run sanity:typegen  # regenerates src/lib/sanity/sanity.types.ts + src/studio/sanity.types.ts
    npm run check           # biome format/lint
    npx tsc --noEmit        # type-check the whole project

    # 3. Run the site
    npm run dev             # serves http://localhost:3187
    #   open http://localhost:3187/nb/nyttig
    #   open http://localhost:3187/nb/tilgjengelighet  -> should 308 to /nb/nyttig

    # 4. Migration (Milestone 4) — dry run then write
    npm run sanity:migrate:nyttig          # prints intended changes, writes nothing
    npm run sanity:migrate:nyttig:write    # SANITY_MIGRATION_WRITE=1, applies changes

    # 5. Tests
    npm run test

Expected transcript shape for the redirect check (via curl):

    $ curl -sI http://localhost:3187/nb/tilgjengelighet | head -n1
    HTTP/1.1 308 Permanent Redirect

## Validation and Acceptance

Behavioural acceptance (a human can verify each):

1. `http://localhost:3187/nb/nyttig` renders a page titled "Nyttig info" with, in order: an Adkomst block showing the address "Olav Kyrres gate 49, 5015 Bergen", a "Vis i Google Maps" link, and intro prose; a "Billetter og arrangementer" block with a link to Arrangementer; a "Booking" block with a link to booking; a "Gjenglemt" block; a "Servering" block with a catering link; and a "Tilgjengelighet ♿️" block.
2. The Tilgjengelighet block shows exactly four collapsible rows — "Heis og etasjer", "Av- og påstigning", "HC-toaletter", "Har du spørsmål om tilgjengelighet?" — each of which expands to reveal formatted content (the "Av- og påstigning" body is a numbered list; bold phone numbers remain bold).
3. `http://localhost:3187/nb/tilgjengelighet` returns HTTP 308 with `Location: /nb/nyttig`.
4. In `npm run studio`, the "Nyttig info" singleton is editable; adding a new `editorialSection` to `sections`, publishing, and waiting for revalidation (or hard-refresh in dev) makes it appear on `/nb/nyttig`.
5. `npm run test` reports all tests passed, including `splitAccessibilityMarkdown` yielding 4 items and the `SectionBlock` registry test. The splitter test fails before the splitter is implemented and passes after.
6. `npx tsc --noEmit` and `npm run check` are clean.

## Idempotence and Recovery

- Schema, query, fetch, and component edits are additive and safe to re-run; TypeGen is deterministic.
- The migration script must be idempotent: `createOrReplace` on `_id: "usefulInfoPage"` and deterministic array `_key`s mean re-running it converges to the same document rather than duplicating. Always run the dry-run (`sanity:migrate:nyttig`) first and read the plan.
- Recovery for the retired accessibility page: it is *unpublished*, not hard-deleted, so the draft remains; to restore, re-publish the draft and remove the `/tilgjengelighet` redirect and the reserved-slug entry. If you hard-delete instead, first export it: `sanity documents get 445aa6de-3a1a-4c29-b34e-2c98695e8cfb > backup-tilgjengelighet.json`.
- If TypeGen or a query is wrong, the frontend types break at `npx tsc --noEmit`; fix the projection and regenerate — no data is at risk.

## Artifacts and Notes

Seed copy (Norwegian, verbatim — source of truth for Milestone 4). Present as indented text, not fenced, to keep this ExecPlan a single document.

Adkomst (→ infoAddressBlock):

    heading: Adkomst
    address: Olav Kyrres gate 49, 5015 Bergen
    body:    Kvarteret ligger midt i Bergen sentrum, kort gangavstand fra Bergen
             stasjon, Bryggen og Universitetet i Bergen. Enkelt å nå med Bybanen eller buss.
    mapUrl:  https://maps.google.com/?cid=855600626603745653

Billetter og arrangementer (→ editorialSection):

    title:      Billetter og arrangementer
    paragraphs: [ "Se hva som skjer på huset og finn oversikt over kommende
                   arrangementer under Arrangementer. Billetter til arrangementene
                   kjøpes direkte der." ]
    links:      [ { label: "Arrangementer", internalPage -> eventsPage } ]

Booking (→ editorialSection):

    title:      Booking
    paragraphs: [ "Skal du arrangere noe på Kvarteret? Enten det er fest, møte,
                   konsert eller noe helt eget, hjelper vi deg gjerne i gang. Gå til
                   Booking for å sjekke ledige rom og sende inn forespørsel – vi
                   gleder oss til å høre fra deg!" ]
    links:      [ { label: "Booking", internalPath "/rom/book" } ]

Gjenglemt (→ editorialSection):

    title:      Gjenglemt
    paragraphs: [ "Har du mistet noe på Kvarteret? Alt vi finner tar vi vare på i
                   resepsjonen i 3 uker. Etter dette donerer vi det videre til Fretex,
                   mens verdifulle gjenstander leveres til politiet. Ta kontakt eller
                   stikk innom, så hjelper vi deg å lete!" ]

Servering (→ editorialSection):

    title:      Servering
    paragraphs: [ "Stjernesalen, Kvarterets kafé i 2. etasje, byr på gode måltider
                   og digg kaffe alle hverdager frem til kl. 19:00.",
                   "Trenger du mat til et arrangement? Kjøkkenet vårt skreddersyr
                   bestillinger til både små og store tilstelninger – se catering." ]
    links:      [ { label: "Catering", internalPath "/catering" } ]

Tilgjengelighet (→ infoAccordionBlock). Heading and intro, then four accordion items. The raw markdown below is the exact `content` of the retired `page` doc; `splitAccessibilityMarkdown` must produce the heading/intro and four items from it.

    # Tilgjengelighet ♿️

    Studentersamfunnet skal være et sted alle kan bruke. Her finner du en oversikt
    over hvordan bygget vårt er tilrettelagt, og hvordan du kommer deg inn i de ulike etasjene.

    ## Heis og etasjer

    Vi har totalt tre etasjer, og bygget er i hovedsak tilgjengelig med heis.

    * Hovedheisen går mellom alle etasjer
    * Øvre del av Tivoli kan kun nås ved å bruke rullestolheis. Heisen finnes ved
      hovedinngangen (én bruker av gangen)
    * Første og andre etasje kan også nås direkte fra utsiden av bygget
    * Etter klokken 20:00 må man bruke heiskort. Dette kan man låne i resepsjonen
      eller ved å ringe driftsleder på tlf. 406 26 601

    ## Av- og påstigning

    Det finnes to steder hvor det er mulig å sette av brukere med redusert mobilitet:

    1. **I bakgården**: Kjør inn i bakgården og bruk inngangen gjennom Stjernesalen.
       Når du kommer inn, finner du heisen til høyre rett etter du har kjørt gjennom lokalet
    2. **Håkonsgaten**: Vi anbefaler å stoppe nederst ved trappen til Johanneskirken.
       Her får du stå i fred og ro uten å måtte stoppe opp trafikken. Bruk inngang
       enten vis a vis Kinsarvik (døren under neonskiltet) eller rundt hjørnet ved
       vår hovedinngang (her er det skråbakke)

    ## HC-toaletter

    Vi har tre HC-toaletter plassert slik:

    * Første etasje: Utenfor døren til Teglverket
    * Andre etasje: Utenfor resepsjonen
    * Tredje etasje: I gangen ved Halvtimen

    Du kan bruke heisen for å nå alle disse.

    ## Har du spørsmål om tilgjengelighet?

    Ikke alle inngangene våre er åpne hele tiden. De fleste innganger som er åpne på
    dagtid ligger på oversiden av bygget, og dit må man opp en bratt skråbakke.

    Hvis du trenger tilgang på gateplan, kan du ringe oss, så kommer vi og låser opp.
    Dette gjelder spesielt for brukere som ikke kan bruke skråbakken eller som trenger
    kortest mulig vei inn.

    **For å få hjelp ved ankomst, ta kontakt på tlf. 406 26 601**

Note on link targets: verify the exact internal destinations against `src/lib/sanity/fragments/links.ts` (`sourceLinkProjection`) — `eventsPage → /arrangementer`, `roomsPage → /rom`. "Booking" and "Catering" have no dedicated Sanity singleton, so use `internalPath` (`/rom/book`, `/catering`) which the projection passes through verbatim. Confirm `/catering` exists as a `page` slug (it is listed in `SERVICE_PAGE_SLUGS` in `structure.ts`).

## Interfaces and Dependencies

Libraries/modules to use and why:

- `sanity` (`defineType`, `defineField`, `defineArrayMember`) — schema. `@sanity/icons` for block icons.
- `next-sanity` (`defineQuery`) — typed GROQ. Regenerate with `npm run sanity:typegen`.
- `@portabletext/markdown` (`markdownToPortableText`) — migration-time markdown→Portable Text (see `portable-text-conversion` skill). Install if missing.
- Existing `src/components/ui/accordion.tsx` (Base UI accordion) — do not reimplement.
- Existing `src/lib/portable-text-components.tsx` (`PortableTextContent`) — render accordion/address bodies.
- Existing `src/lib/app-locale.ts`, `src/lib/page-metadata.ts` — route boilerplate.

Types/signatures that must exist at the end:

In `src/studio/schemaTypes/index.ts`, `schemaTypes` includes `infoAddressBlock`, `infoAccordionItem`, `infoAccordionBlock`, `usefulInfoPage`.

In `src/lib/sanity/queries/pages.ts`:

    export const usefulInfoPageQuery = defineQuery(/* ...sections union projection... */)

In `src/lib/sanity/fetch/pages.ts`:

    export async function fetchUsefulInfoPage(): Promise<UsefulInfoPage | null>
    export type UsefulInfoPage = NonNullable<Awaited<ReturnType<typeof fetchUsefulInfoPage>>>

In `src/features/nyttig/`:

    export function NyttigPage(props: { page: UsefulInfoPage }): JSX.Element
    export function SectionBlock(props: { block: UsefulInfoPage["sections"][number] }): JSX.Element

In `scripts/migrate-nyttig-info.ts` (pure, testable core):

    export function splitAccessibilityMarkdown(markdown: string): {
      heading: string
      intro: string
      items: { title: string; markdown: string }[]
    }

In `src/app/[locale]/nyttig/page.tsx`: a default-exported async React Server Component plus `generateStaticParams` and `generateMetadata`, mirroring `src/app/[locale]/kontakt/page.tsx`.

---

Change note (2026-07-06, initial authoring): Created this ExecPlan from research of the `samfunnetibergen` repo. Chose a curated typed-block singleton over a page-builder, reused `editorialSection`, added `infoAddressBlock` and `infoAccordionBlock`, and planned a Portable-Text migration of the retired `/tilgjengelighet` markdown page into an embedded accordion section, with a permanent redirect preserving the old URL. Rationale for each decision is in the Decision Log above.

# Add useful English visitor support with code-owned UI messages and Sanity-owned content translations

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This repository includes `.agents/PLANS.md`; this document must be maintained in accordance with it.

## Purpose / Big Picture

An English-speaking visitor should be able to choose English and use the most important parts of the site without navigating Norwegian interface text. The first release covers the site-wide navigation and footer, the homepage, the homepage bar cards, the two featured bars, and the practical information page at `/en/nyttig`. Dates, opening status, opening hours, metadata, error states, and accessibility labels on those surfaces must also be English. The Norwegian site at `/nb` must remain unchanged.

The site already uses locale-prefixed routes and `next-intl`, but only `nb` is enabled. After this work, `/nb/...` and `/en/...` are both real, crawlable routes. A visible language switch preserves the current page where possible. Interface text that belongs to the application is translated in `src/messages/*.json`. Visitor content that editors own is translated in Sanity Studio. Operational facts such as times, prices, addresses, URLs, room capacity, media, and opening-hour rules remain single values shared by both languages.

This is deliberately a first-round visitor release, not a promise that every document in Sanity is translated. Event titles and descriptions, volunteer-group profiles, booking and karaoke forms, sponsors, arbitrary `page` documents, and the full room catalog can remain Norwegian until later milestones. The English homepage may therefore show Norwegian event titles while all surrounding controls and labels are English. The user-visible scope must be stated honestly and must not publish an English language alternate for a targeted page until its required English content exists.

## Progress

- [x] (2026-07-23 15:50Z) Read `.agents/README.md` and `.agents/PLANS.md`, inspected the current locale routing, message catalog, layouts, metadata, sitemap, target pages, Sanity schemas, queries, fetch helpers, and Studio structure.
- [x] (2026-07-23 15:50Z) Checked the deployed `production` Sanity schema and a non-sensitive published-content inventory for `homePage`, `usefulInfoPage`, `siteMetadata`, `footer`, `kontaktPage`, and the `grondahls` and `stjernesalen` room documents.
- [x] (2026-07-23 15:50Z) Reviewed current Sanity localization guidance and current Next.js/`next-intl` locale-routing guidance, then selected the first-round ownership and fallback model documented below.
- [x] (2026-07-23 15:50Z) Created this implementation-ready ExecPlan.
- [ ] Add the shared locale definition, English message catalog, locale-aware HTML/metadata behavior, language switcher, and regression tests without enabling public English routes yet.
- [ ] Add the Sanity internationalized-array editing model and locale-aware GROQ projections for the selected homepage, useful-information, link-label, and bar fields.
- [ ] Add and dry-run an idempotent migration that preserves the current Norwegian fields, seeds their `nb` localized values, and reports missing English values.
- [ ] Author and review the initial English content in Sanity for the practical-information page and featured bars, and complete the English application message catalog.
- [ ] Pass the translation-readiness audit, then add `en` to public routing and verify `/nb` and `/en` behavior, language switching, metadata, sitemap alternates, and Studio editing.
- [ ] Record launch outcomes and explicitly move deferred content families into a follow-up plan rather than silently expanding this first release.

## Surprises & Discoveries

- Observation: Internationalized routing is already present; the application is configured as single-locale rather than being structurally non-localized.
  Evidence: `src/i18n/routing.ts` defines only `locales: ["nb"]`, `src/i18n/request.ts` dynamically loads `src/messages/${locale}.json`, and every main public route lives under `src/app/[locale]`.

- Observation: The existing English work is partly scaffolded but not end-to-end.
  Evidence: `next-intl` is installed, `src/messages/nb.json` contains several namespaces, route static params come from `routing.locales`, and the sitemap already builds per-locale alternates. However, `src/app/layout.tsx` fixes `<html lang="nb">`, `src/lib/page-metadata.ts` fixes Open Graph locale to `nb_NO`, date formatters use `nb-NO`, and many shared components still contain Norwegian literals.

- Observation: Sanity's `homePage` content is currently used only for homepage metadata, not for the visible homepage sections.
  Evidence: `src/app/[locale]/page.tsx` calls `fetchHomePageContent(locale)` only in `generateMetadata`; visible event headings, banners, and bar UI are code or message-catalog owned.

- Observation: The Sanity `navbar` schema and fetch path are not the runtime navigation owner.
  Evidence: `src/components/navbar/Navbar.tsx` constructs the navigation from code-owned constants, `fetchNavbar()` has no caller, and `src/app/[locale]/layout.tsx` does not fetch a navbar document. Do not add translation fields to the unused `navbar` document as part of this project.

- Observation: The useful-information page is a strong first-round Sanity target and contains nested structured content rather than a single text blob.
  Evidence: published `usefulInfoPage` has seven sections using `infoAddressBlock`, `editorialSection`, and `infoAccordionBlock`; the schema stores headings, intros, Portable Text bodies, accordion items, address, and map URL inside those structures.

- Observation: The homepage bar cards combine translatable description fields with language-neutral operational data.
  Evidence: published `room-grondahls` and `room-stjernesalen` both have summaries, bodies, bar names, and opening hours; queries also return shared images and status data. The site-wide opening hours come from `siteMetadata`.

- Observation: Current Sanity guidance changed the internationalized-array storage contract in March 2026.
  Evidence: current documentation states that plugin v5 and later store the locale in an item's `language` field and reserve `_key` for a random stable array key. New GROQ must filter with `[language == $locale]`, not `[_key == $locale]`.

- Observation: The local checkout has no `node_modules`, so the repository-specific Next.js 16 documentation required by `AGENTS.md` was not available locally during planning.
  Evidence: `node_modules/next/dist/docs` and `node_modules` were absent. Current official Next.js 16 and `next-intl` documentation was checked for planning; the implementing agent must run `npm ci` and read the relevant installed guides before editing layouts, proxy behavior, metadata, or routing.

## Decision Log

- Decision: Use `nb` and `en` language tags, keep `nb` as the default, and keep locale prefixes mandatory.
  Rationale: the current public contract already uses `/nb`; `/en` is the smallest stable addition. Mandatory prefixes give every language a unique canonical URL and match both the current route tree and current Sanity/Next.js guidance.
  Date/Author: 2026-07-23 / Codex.

- Decision: Keep the supported-locale list code-owned and shared by the frontend and Studio configuration.
  Rationale: adding a locale changes TypeScript unions, message imports, static params, metadata, and the route surface, so it is a deploy-time capability rather than ordinary editorial content. A small typed module in `src/i18n/config.ts` prevents `sanity.config.ts` and `src/i18n/routing.ts` from drifting without making production routing depend on a Sanity query at build time.
  Date/Author: 2026-07-23 / Codex.

- Decision: Use `next-intl` message catalogs for application interface text and Sanity for editor-owned visitor content.
  Rationale: navigation labels, button labels, status phrases, error messages, accessibility labels, and date phrases ship with application behavior. Homepage metadata, practical information, room summaries, room descriptions, menu prose, image alternatives, and link labels are content editors need to revise without a code deployment.
  Date/Author: 2026-07-23 / Codex.

- Decision: Use field-level Sanity localization for the first-round content rather than cloning whole room and singleton documents.
  Rationale: the selected records share structure and operational facts across languages. One room should still have one slug, capacity, price, menu price, media set, and opening-hours rule. One useful-information page should retain one section order, address, and map destination. Field-level arrays localize only human-readable fields and avoid two documents drifting on shared facts. The tradeoff is that both languages publish together; that is acceptable for this controlled first release because English is enabled only after its readiness audit passes.
  Date/Author: 2026-07-23 / Codex.

- Decision: Use `sanity-plugin-internationalized-array` and its current `language`-field representation instead of hand-building locale objects.
  Rationale: the official plugin supplies a usable Studio input for strings, text, and custom Portable Text types, and arrays avoid the dataset attribute growth of objects such as `{nb, en}`. GROQ will resolve values with `field[language == $locale][0].value`.
  Date/Author: 2026-07-23 / Codex.

- Decision: Keep legacy Norwegian fields during the first release and add localized siblings with explicit names.
  Rationale: this is an additive, recoverable migration. Existing production data and consumers remain intact while the new queries are introduced. The localized projection can coalesce requested language, localized Norwegian, then the legacy value. Legacy field removal is a later deprecation-and-migration task after production proves the new contract.
  Date/Author: 2026-07-23 / Codex.

- Decision: Treat Norwegian fallback as resilience, not translation completeness.
  Rationale: a fallback prevents broken production rendering, but an `/en` page full of Norwegian text is not acceptable as English support. The launch gate must report zero missing required English values for the first-round content. Deferred event and other editorial payloads are explicit exceptions.
  Date/Author: 2026-07-23 / Codex.

- Decision: Keep existing Norwegian route segments and CMS slugs in the first round.
  Rationale: `/en/nyttig` and `/en/rom/grondahls` can carry English content without duplicating the route tree or introducing localized-slug resolution. Localized static and dynamic slugs require language-aware alternate links, redirects, switcher mappings, and Sanity slug modeling; that is valuable later but not necessary to make the priority visitor information usable now.
  Date/Author: 2026-07-23 / Codex.

- Decision: Make language alternates and sitemap entries availability-aware instead of advertising every route in every configured locale.
  Rationale: enabling `en` in `next-intl` makes the route segment technically valid across the shared route tree, including deferred Sanity content. Search engines must not be told that an English translation exists when the page still contains Norwegian editorial content. Disable automatic `next-intl` alternate links and let metadata and sitemap helpers emit English alternates only for the first-round route set whose published translation audit passes.
  Date/Author: 2026-07-23 / Codex.

- Decision: Do not translate values that are identifiers or facts.
  Rationale: URLs, email addresses, telephone numbers, map URLs, prices, capacities, floor numbers, dates, opening-hour weekday numbers, status enums, references, and proper brand or venue names remain shared. Their surrounding labels and formatted display strings are localized in code.
  Date/Author: 2026-07-23 / Codex.

- Decision: Preserve visitor choice with the standard `NEXT_LOCALE` session cookie when the language switcher is used.
  Rationale: `localeCookie: false` makes an explicit switch temporary when a visitor later opens an unprefixed URL. The standard session cookie is the least surprising `next-intl` behavior and does not require a persistent tracking cookie. Exact privacy wording must still be checked against repository policy during implementation.
  Date/Author: 2026-07-23 / Codex.

## Outcomes & Retrospective

Planning is complete. No runtime, schema, or Sanity content mutation has been made. The intended outcome is a gated English launch whose visitor-facing UI is complete on the selected surfaces and whose editor-owned English content is maintained beside the Norwegian source in the same Sanity documents.

The plan intentionally avoids cloning whole pages, localizing operational facts, reviving the unused Sanity navbar, translating every event, or localizing pathnames. If implementation evidence shows that editing nested localized Portable Text is materially worse than separate page documents, record that evidence here before changing the useful-information page to document-level localization. Do not change the room model to document-level localization; its shared operational fields make field-level localization the stable boundary.

## Context and Orientation

The repository root for all commands is `/Users/kluvin/.codex/worktrees/96c9/samfunnetibergen`.

`src/i18n/routing.ts` defines supported public locales for `next-intl`. `src/i18n/request.ts` loads the matching JSON catalog from `src/messages/`. `src/i18n/navigation.ts` exports locale-aware navigation wrappers, but several components still import `next/link` directly and build locale paths manually. `src/proxy.ts` runs `next-intl` routing after handling the event-submission and Studio hosts. `src/lib/app-locale.ts` validates route params, creates static params, and activates the locale for static rendering.

`src/app/layout.tsx` is the root server layout and currently emits `lang="nb"`, global metadata, fonts, scripts, organization JSON-LD, Sanity live updates, and Visual Editing. `src/app/[locale]/layout.tsx` supplies messages, navbar, footer, and shared opening-hours data. Because non-localized public surfaces such as Studio, the app landing page, and link-in-bio also live under `src/app`, the implementation should first test `getLocale()` from `next-intl/server` in the existing root layout rather than moving the HTML shell and accidentally changing those surfaces.

`src/lib/page-metadata.ts` owns code-generated canonical, Open Graph, and Twitter metadata. It currently emits `nb_NO` for every page and accepts no locale or language-alternate mapping. `src/app/sitemapEntries.ts` already expands entries for every value in `routing.locales`, so adding `en` automatically expands the sitemap; that is why `en` must not be added until targeted content is ready. `src/lib/structured-data.ts` accepts a locale for Event URLs and language, but root organization/website data and other fixed-language fields need an explicit audit.

The homepage is `src/app/[locale]/page.tsx`. Its visible event section headings include hard-coded Norwegian, while banner strings already come from `src/messages/nb.json`. `src/app/[locale]/_components/HomeBarPreviews.tsx` renders Sanity room summaries and opening hours alongside hard-coded labels and status text. `src/components/navbar/` and `src/components/footer/Footer.tsx` contain the code-owned global navigation, opening status, theme/paper controls, contact headings, footer labels, and opening-hours display. `src/features/bars/` and `src/lib/opening-hours.ts` format status and weekday text and currently assume Norwegian.

The practical-information route is `src/app/[locale]/nyttig/page.tsx`. It fetches `usefulInfoPage` through `src/lib/sanity/fetch/pages.ts` and `src/lib/sanity/queries/pages.ts`, then renders it through `src/features/nyttig/`. Its Sanity schema is `src/studio/schemaTypes/documents/singletons/usefulInfoPage.ts`. Nested content schemas live in `src/studio/schemaTypes/objects/editorialSection.ts`, `infoAddressBlock.ts`, and `infoAccordionBlock.ts`.

The featured bars are the `room` documents with slugs `grondahls` and `stjernesalen`. Their schema is `src/studio/schemaTypes/documents/room.ts`. The homepage projection is `barPreviewsQuery` in `src/lib/sanity/queries/rooms.ts`; the room index and detail projections are in that same module. Runtime wrappers are in `src/lib/sanity/fetch/rooms.ts`. Shared hours are `siteMetadata.openingHours`; room hours are `room.openingHours`. Weekdays are stored as ISO weekday numbers and must stay language-neutral.

Sanity TypeGen scans named `defineQuery` declarations and generates `src/lib/sanity/sanity.types.ts` and `src/studio/sanity.types.ts`. Any schema or query change requires `npm run sanity:typegen`. Required validation does not prove production data is present, so runtime fetch types remain defensive and the readiness audit is mandatory.

For this plan, a “localized value” is an internationalized-array item shaped conceptually as:

    {
      _key: "stable-random-array-key",
      language: "en",
      value: "English text"
    }

The `_key` identifies the array item; it does not identify the language. A “legacy field” is the existing single-language field such as `summary`. A “localized sibling” is the additive field such as `localizedSummary` that stores `nb` and `en` values during the migration period.

## First-Round Content Contract

The English launch includes the following surfaces and owners.

Application-owned messages must cover:

- Global navigation, mobile-menu and dropdown accessibility labels, language-switcher labels, paper/theme controls, opening-status labels, and the logo/home accessible name.
- Footer headings, app links, contact/address headings, opening-hours headings, open/closed/vacation text, weekday names, and the E-tjenesten credit.
- Homepage event section headings and links, date and recurrence phrases, booking and volunteer banners, bar heading, bar card accessible names, now-playing fallback, open/closed labels, empty/error states, and decorative-image alternatives where needed.
- Practical-information navigation accessibility labels and any component-owned accordion or link text.
- Selected route metadata, not-found/error UI, date/time formatting, and structured-data language.

Sanity-owned localized fields must cover:

- `homePage`: `eyebrow`, `title`, `description`, and `primaryCta.label`. The visible homepage currently uses only the metadata values, but the model should be ready if its hero returns.
- `usefulInfoPage`: `eyebrow`, `title`, and `intro`.
- `editorialSection`: `title` and `body`.
- `infoAddressBlock`: `heading` and `body`. Keep `address` and `mapUrl` shared unless the address contains explanatory prose; if it does, split the explanatory prose from the factual address before translating.
- `infoAccordionBlock`: `heading` and `intro`.
- `infoAccordionItem`: `title` and `body`.
- `sourceLink`: `label`; link type, reference, internal path, and external URL remain shared.
- Featured `room` records: `summary`, `body`, `bar` only when the public bar name genuinely differs by language, image `alt` and `caption`, menu section titles/info, menu item titles/descriptions, and menu allergen note. Keep room `title` and `slug` shared for proper venue names and stable paths unless editorial review identifies a genuine translated public name.

The following are explicitly deferred:

- Arrangement title/description/image text and event taxonomy translations.
- Events listing/detail completion beyond already-used application messages.
- Student-group and volunteer-form content.
- Booking and karaoke flows.
- Contact-page body, sponsors, all remaining rooms, generic `page` documents, link-in-bio, and internal app content.
- Localized static route names and localized CMS slugs.
- Translation-management services and automatic ongoing translation. Sanity Assist may help draft initial translations, but a human editor must approve every launched English value.

## Plan of Work

### Milestone 1: Establish the locale foundation behind a launch gate

Install dependencies with `npm ci`, then read the installed Next.js 16 documentation under `node_modules/next/dist/docs/` for layouts, Proxy, metadata, and internationalization before editing. Also inspect the installed `next-intl` package documentation or types for the exact version in `package-lock.json`.

Create `src/i18n/config.ts` as the single typed definition for locale metadata. It should export the base locale `nb`, the planned locales `nb` and `en`, human labels, Open Graph locale values (`nb_NO`, `en_GB` unless editorial/product requirements choose a different English region), and formatter tags (`nb-NO`, `en-GB`). Keep a separate `enabledLocales` value containing only `nb` until the readiness gate passes. `src/i18n/routing.ts`, Studio plugin configuration, metadata helpers, and tests must import this module rather than re-declare tags.

Add `src/messages/en.json` with the same namespace and key shape as `src/messages/nb.json`. Add a test that recursively compares message keys and fails for missing or extra keys. Expand namespaces for all first-round code-owned strings found in the target files. Replace literals with `getTranslations`, `useTranslations`, or explicit labels passed from server components. Shared date/opening-hours helpers should receive a locale or a small formatter/label object; they must not import React or reach into request state. Preserve semantic status values such as `open` and `closed`.

Update `src/app/layout.tsx` to derive the current request locale on the server and emit the correct HTML `lang`, while defaulting non-localized surfaces to `nb`. Confirm this works with static rendering before adopting it. Update `buildPageMetadata` so every localized caller supplies `locale`; derive Open Graph locale, canonical path, and language alternates from typed locale helpers. Add localized default descriptions to message catalogs rather than branching on string literals. Audit JSON-LD builders so `inLanguage` matches the rendered page.

Set `alternateLinks: false` in `next-intl` routing because the framework cannot know which Sanity-backed routes have completed translations. Add a typed first-round availability helper for `/`, `/nyttig`, and the two featured bar detail paths. Metadata and sitemap builders use this helper to emit `nb`/`en` alternates only for completed targets. Other `/en` routes can exist with English application chrome and Norwegian fallback content, but they must be `noindex` and must not appear as English sitemap entries until their content family is added to the translation contract.

Add a compact language switcher to both desktop and mobile navigation. It must use the locale-aware APIs from `src/i18n/navigation.ts`, preserve the current internal pathname and query when supported, expose a clear accessible label, and use `replace` rather than adding a duplicate history step. On dynamic CMS routes whose English content is deferred, it can preserve the shared slug. Re-enable the standard `NEXT_LOCALE` session cookie so an explicit selection survives unprefixed navigation. Add focused routing/switcher tests.

Do not add `en` to `enabledLocales` in this milestone. At the end, all English catalogs and locale-aware helpers can be tested directly, but public routing and sitemap output remain Norwegian-only.

Acceptance for this milestone is that catalog parity tests pass; locale-formatting unit tests produce Norwegian and English weekday, date, status, metadata, and accessibility text; `<html lang>` and Open Graph locale can be demonstrated for both simulated locales; and the public route list still contains only `nb`.

### Milestone 2: Add additive Sanity localization fields and locale-aware projections

Add `sanity-plugin-internationalized-array` at a version compatible with the installed Sanity v5 package. Configure it in `sanity.config.ts` using the planned locales from `src/i18n/config.ts`. Register `string`, `text`, and `portableTextContent` field types. Use the plugin's current value shape with a `language` field; do not use the pre-v5 `_key == locale` query pattern.

Add localized sibling fields for the first-round contract. Use names such as `localizedTitle`, `localizedDescription`, `localizedBody`, and `localizedLabel` so the legacy data remains visible and recoverable. Group translations clearly in Studio, describe which values are shared, and show validation warnings rather than hard errors for missing English while English is gated. The editor should be able to see Norwegian and English together without opening duplicate documents.

For nested arrays such as useful-information sections, keep the section and item `_key` values shared. Localize text inside each section/item rather than wrapping the entire section array in a locale field. This preserves ordering and anchors across languages. For Portable Text, each locale receives its own complete Portable Text array so marks, links, and block structure can be edited naturally.

Create a reusable GROQ localization expression or small fragment helper that projects:

    coalesce(
      localizedField[language == $locale][0].value,
      localizedField[language == $baseLocale][0].value,
      legacyField
    )

Every localized fetch function must accept `locale: AppLocale` and pass both `$locale` and `$baseLocale`. Update `fetchHomePageContent`, `fetchUsefulInfoPage`, `fetchBarPreviews`, and the room fetches used by first-round room pages. Remove underscore-prefixed ignored locale arguments. Keep unlocalized queries unchanged until their surface enters scope.

`sourceLinkProjection` and nested section projections currently interpolate GROQ strings. Make their localized forms explicit and ensure every affected named `defineQuery` remains unique and visible to TypeGen. Do not hide complex locale resolution in untyped string replacement. Add query-shape tests for requested-locale selection, Norwegian fallback, and legacy fallback. Run `npm run sanity:typegen` and update both generated type files.

Acceptance for this milestone is that Studio builds, TypeGen succeeds, Norwegian pages render the same content through the new projections, and focused tests prove English selection and both fallback layers without publishing any English route.

### Milestone 3: Migrate Norwegian values and establish a measurable translation gate

Add `scripts/migrate-localized-visitor-content.ts` plus dry-run and write scripts in `package.json`, following the repository's `SANITY_MIGRATION_WRITE=1` convention. The migration must target only `homePage`, `usefulInfoPage`, its nested section values, shared `sourceLink` values reachable from those documents, and rooms `grondahls` and `stjernesalen`. It must copy a defined legacy value to a `nb` localized item only when no `nb` item already exists. It must preserve existing random `_key` values and never overwrite `en`.

The migration must be idempotent. Its dry-run report must list documents and field paths it would seed, already-migrated values it would skip, and malformed localized arrays it cannot safely repair. The write mode must use transactions or small deterministic patches, report mutations, and finish with a verification query. Do not unset any legacy field.

Add `scripts/audit-english-visitor-content.ts` and an npm script that exits non-zero when a required first-round English value is missing. The audit must report exact document IDs and field paths, distinguish intentionally shared facts from missing translations, and separately list deferred Norwegian payloads such as event titles without failing on them. It must check the published perspective because draft English values are not launch-ready.

Run the migration in dry-run mode, review its exact target set, run write mode with an authenticated user token, and rerun dry-run until it reports no pending Norwegian seeds. Record concise evidence in this ExecPlan. Then use Studio to author English values. Sanity Assist may generate drafts, but a fluent human reviewer must approve wording, venue terminology, accessibility alternatives, ticket/age/accessibility information, and safety-critical visitor information before publishing.

Acceptance for this milestone is that the Norwegian seed migration is idempotent, production documents retain their legacy data, Studio presents both languages cleanly, and the published English audit reports zero required missing values.

### Milestone 4: Enable English and verify the visitor journey

Only after the audit passes, move `en` into `enabledLocales`. Keep `nb` as default and mandatory locale prefixes. Ensure the Proxy matcher exclusions for APIs, Studio, app, link-in-bio, Open Graph image, Next internals, Vercel internals, and files remain intact. Verify an unprefixed request negotiates a locale based on `Accept-Language`, while explicit `/nb` and `/en` paths never change language unexpectedly.

Update every first-round route to pass the locale into Sanity fetchers and formatters. The English homepage must show English navigation, headings, date/status UI, banners, bar summaries, opening hours, footer, metadata, and accessible labels. `/en/nyttig` must show the published English Sanity values for all seven current sections. `/en/rom/grondahls` and `/en/rom/stjernesalen` must show translated summaries, bodies, image text, and menu prose where present. Shared facts must match Norwegian.

The language switcher must map `/nb`, `/nb/nyttig`, and both featured bar detail paths to their `/en` counterparts and back without losing the path. For deferred dynamic routes it may preserve the same slug and display Norwegian editorial payload inside English chrome. If a targeted English page fails the readiness check at runtime despite the pre-launch audit, use the explicit Norwegian fallback and log/observe the gap; do not return a 500 or silently omit the entire page.

Update sitemap and metadata tests for both locales. Each localized canonical must point to itself. Language alternates must connect the equivalent `nb` and `en` URLs for the audited first-round set, with `x-default` pointing to the language-negotiating unprefixed route where appropriate. Open Graph locale and HTML `lang` must match. Deferred `/en` page families must return `noindex`, omit English alternates, and stay out of the sitemap until their content contract is implemented.

Acceptance for this milestone requires browser and HTTP evidence at mobile and desktop widths. A visitor can enter `/en`, switch to Norwegian and back, open a featured bar, understand whether it is open and when it opens, navigate to practical information, and read that page in English. Refreshing and opening unprefixed `/` respects the explicit session choice. `/nb` content and navigation remain unchanged.

### Milestone 5: Stabilize and hand off editorial ownership

After the English surface is deployed, run the published translation audit again and capture screenshots or HTTP evidence for the priority journey. Document the editor workflow in a short how-to under `docs/how-to/`: which fields require translation, which facts are shared, how fallback works, how to run the audit, and why publishing Norwegian changes without English review can affect both languages.

Monitor for missing-translation logs, broken links, and layout overflow. English strings are often shorter, but test long navigation and practical-information headings anyway. Record any discovered gaps here. Do not remove legacy Norwegian fields in this release. A separate cleanup can deprecate them only after every consumer uses localized projections and a production content audit finds no dependency.

Create a follow-up scope for events, event taxonomy, groups/volunteering, booking/karaoke, remaining rooms, contact, sponsors, generic pages, localized slugs, and any translation service. Prioritize it from visitor evidence rather than automatically localizing all schema fields.

## Concrete Steps

Run all repository commands from `/Users/kluvin/.codex/worktrees/96c9/samfunnetibergen`.

Install the exact locked dependencies and read the installed framework guidance before editing:

    npm ci
    rg -n "international|locale|Proxy|metadata|root layout" node_modules/next/dist/docs

Reconfirm the first-round code and content owners:

    rg -n "locales|defaultLocale|localeCookie|lang=|nb_NO|nb-NO" src
    rg -n "Arrangementer|Kommende|Barer|Åpen|Stengt|Åpningstider|Hovednavigasjon" \
      'src/app/[locale]' src/components src/features src/lib/opening-hours.ts
    rg -n "fetchNavbar\\(|fetchHomePageContent\\(|fetchUsefulInfoPage\\(|fetchBarPreviews\\(" src

After adding schema and query changes, generate types and verify Studio:

    npm run sanity:typegen
    npm run studio:build

Run the migration first without writes, then with the repository's explicit write gate after reviewing the output:

    npm run sanity:migrate:visitor-locales
    SANITY_MIGRATION_WRITE=1 npm run sanity:migrate:visitor-locales
    npm run sanity:migrate:visitor-locales

The last dry run should report zero pending Norwegian seeds.

Before enabling `en`, audit published English content:

    npm run sanity:audit:english-visitor-content

The command must exit zero and report no missing required English field paths. Draft-only translations must still fail the published audit.

Run focused and broad verification:

    npm exec -- vitest run --coverage.enabled=false \
      src/i18n \
      src/lib/page-metadata.test.ts \
      src/app/sitemap.test.ts \
      src/lib/sanity/queries
    TZ=UTC npm run test
    npm run lint
    npx tsc --noEmit
    POSTHOG_CLI_API_KEY= POSTHOG_CLI_PROJECT_ID= npm run build
    git diff --check

Start the built application and inspect representative responses:

    npm start
    curl -I http://localhost:3187/
    curl -s http://localhost:3187/nb | rg '<html[^>]+lang="nb"|hreflang|og:locale'
    curl -s http://localhost:3187/en | rg '<html[^>]+lang="en"|hreflang|og:locale'
    curl -s http://localhost:3187/en/nyttig | rg 'Practical|Getting here|Accessibility'
    curl -s http://localhost:3187/en/rom/grondahls | rg 'Opening hours|Open|Closed'
    curl -s http://localhost:3187/sitemap.xml | rg '/nb|/en|hreflang'

The exact English copy in the `rg` examples may change during editorial review; update these commands to stable approved phrases as implementation progresses.

## Validation and Acceptance

The first release is accepted only when all of the following behaviors are observable.

At `/nb`, the homepage, featured bar cards, practical-information page, and featured bar pages retain their approved Norwegian content and existing URLs. No existing Sanity value was deleted, no room or page was duplicated, and shared hours, prices, capacities, addresses, URLs, references, and media match their pre-migration values.

At `/en`, global navigation and footer are English. The homepage section headings, links, banners, dates, recurring labels, bar status, opening hours, and accessibility labels are English. Event titles may remain Norwegian and are the only intentional Norwegian content in the homepage event cards.

At `/en/nyttig`, the page title, intro, section headings, accordion labels, and Portable Text bodies come from published English Sanity values. The page has no required Norwegian fallback according to the audit. The shared address and map URL remain correct.

At `/en/rom/grondahls` and `/en/rom/stjernesalen`, visitor-facing descriptions, menu prose where present, image alternatives, and surrounding interface are English. Opening-hour rules and other operational values equal those on the Norwegian variants.

The language switcher is keyboard accessible, visible on mobile and desktop, preserves the current supported path and query, updates the session locale choice, and does not create loops. Direct `/nb` and `/en` requests are stable. Unknown locales return the repository's intended not-found behavior rather than silently rendering Norwegian under an invalid prefix.

Rendered HTML has `lang="nb"` or `lang="en"` as appropriate. Canonical URLs point to the current localized URL. Open Graph locale is `nb_NO` or the chosen English locale. Sitemap and response alternates connect equivalent audited pages and do not claim unavailable English content. Deferred English route families are `noindex` and absent from English sitemap output. Structured data uses the page language.

The published translation audit exits zero before and after launch. The full test, lint, TypeScript, Studio build, TypeGen, production build, and diff checks pass. Browser checks cover at least 390px mobile and 1440px desktop widths, including the navigation dropdown/mobile menu, language switcher, homepage bar cards, practical-information accordion, and featured bar details.

## Idempotence and Recovery

Schema additions, query changes, tests, and catalog additions are repeatable. The migration sets `nb` only when it is absent and never overwrites `en`, so dry-run and write mode can be rerun safely. Every write run must print exact document IDs and paths.

If the Sanity migration fails partway, rerun dry-run. Already-created `nb` entries are skipped and remaining entries are reported. Do not manually delete array items to “start over.” Correct malformed items with a targeted patch after preserving their current value.

If English content is incomplete, keep `en` out of `enabledLocales`; Studio work and tests can continue without publishing `/en` or adding it to the sitemap. If a regression is found after launch, remove `en` from `enabledLocales` and redeploy. The localized Sanity values and legacy fields remain intact, so no content rollback is required.

If a localized projection is wrong, its final fallback is the untouched legacy field. Revert the query/fetch change without reverting the content migration. Do not remove `sanity-plugin-internationalized-array` while documents still contain its field types.

Legacy field cleanup is not rollback. It is a later destructive migration and must receive its own audit and plan.

## Artifacts and Notes

Verified planning snapshot on 2026-07-23:

    frontend locales: nb only
    message catalogs: src/messages/nb.json only
    root html language: nb
    metadata Open Graph locale: nb_NO
    published usefulInfoPage sections: 7
    usefulInfoPage section types:
      infoAddressBlock, editorialSection, infoAccordionBlock
    published featured bars:
      room-grondahls: summary, body, bar and 3 opening rows present
      room-stjernesalen: summary, body, bar, 2 opening rows and 4 menu sections present
    runtime navbar owner: src/components/navbar/Navbar.tsx constants
    Sanity navbar fetch callers: none

Current Sanity localization guidance used for this plan:

- Field-level localization keeps shared facts and translated fields in one document and publishes languages together.
- Internationalized arrays scale better than locale-keyed objects and have an editor plugin.
- Current plugin data uses `language` for locale selection and a random stable `_key`.
- Document-level localization remains a valid later choice for independently published page families, but is not selected for shared room and first-round practical-information structures.

Current routing guidance used for this plan:

- Locale-prefixed App Router paths provide unique language URLs.
- `next-intl` routing can detect an unprefixed request, persist an explicit locale with its standard session cookie, create locale-aware navigation APIs, and emit alternate link headers.
- Localized pathnames and CMS slugs require coordinated switcher and alternate-link mapping, so they are deferred.

Primary references checked during planning:

- Sanity Localization: https://www.sanity.io/docs/studio/localization
- Next.js App Router internationalization: https://nextjs.org/docs/app/guides/internationalization
- next-intl routing configuration: https://next-intl.dev/docs/routing/configuration
- next-intl navigation APIs: https://next-intl.dev/docs/routing/navigation

## Interfaces and Dependencies

Add `sanity-plugin-internationalized-array` as a runtime Studio dependency compatible with the locked `sanity` version. Do not add `@sanity/document-internationalization` in this first round because the selected model is field-level.

Create or preserve these typed boundaries:

    type AppLocale = "nb" | "en"

    type LocaleDefinition = {
      id: AppLocale
      title: string
      formatterLocale: string
      openGraphLocale: string
    }

    resolveLocalizedValue<T>(
      values: Array<{language?: string | null; value?: T | null}> | null | undefined,
      locale: AppLocale,
      baseLocale: AppLocale,
      legacyValue?: T | null
    ): T | null

The runtime may implement localization primarily in GROQ, but a TypeScript resolver with the same precedence is useful for migration tests, audit output, and any nested value that TypeGen cannot project cleanly.

Change the selected fetch interfaces to require locale:

    fetchHomePageContent(locale: AppLocale, options?: FetchOptions)
    fetchUsefulInfoPage(locale: AppLocale, options?: FetchOptions)
    fetchBarPreviews(locale: AppLocale)
    fetchRooms(locale: AppLocale)
    fetchRoomBySlug(slug: string, locale: AppLocale, options?: FetchOptions)

Change metadata construction to require locale and accept explicit language alternates only for available variants:

    buildPageMetadata({
      locale,
      canonicalPath,
      languageAlternates,
      title,
      description,
      imageUrl,
      openGraphType
    }): Metadata

Opening-hours formatting must accept an explicit locale or explicit labels. Business-logic functions such as `openingRangesForDate`, `isHouseClosed`, and `isOpenAtForCombinedHours` remain locale-neutral.

The migration and audit scripts read Sanity with an authenticated user context but write only when `SANITY_MIGRATION_WRITE=1`. The public application continues to read through the existing Sanity fetch boundary and published/draft behavior.

Revision note (2026-07-23): Initial ExecPlan created after source, deployed-schema, published-content-shape, Sanity localization, Next.js 16, and `next-intl` routing investigation. The plan selects field-level Sanity localization, a gated `/en` rollout, and a first-round visitor scope centered on the homepage, featured bars, and practical information.

Revision note (2026-07-23): Made metadata and sitemap language alternates explicitly translation-availability-aware so deferred Norwegian content is not advertised as an English equivalent merely because the shared `/en` route exists.

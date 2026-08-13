# English groups and volunteering localization pilot

This ExecPlan is living documentation for the implementation of PR 80's English visitor support, narrowed to the Bli frivillig and Grupper journey. It must be maintained in accordance with `.agents/PLANS.md`.

## Purpose / Big Picture

English-speaking visitors will be able to open `/en/grupper`, follow a group to `/en/grupper/<slug>`, use the volunteer form, and switch between English and Norwegian without losing their place. `/en/blifrivillig` will keep its existing redirect to the groups page. Application-owned labels and form messages come from `apps/web/src/messages`, while editor-owned group names, summaries, descriptions, and page FAQ content come from locale-aware Sanity fields. Existing Norwegian routes and legacy Sanity fields remain intact.

"Automatically" in this pilot means that the requested route locale automatically selects the matching localized Sanity values and message catalog. It does not silently publish machine-translated editorial copy; translations must be authored or reviewed in Studio. A dry-run migration and published-content audit make that editorial work repeatable and measurable.

## Progress

- [x] (2026-08-13) Read repository guidance, PR 80, the Next.js and Sanity localization references, and the current groups/volunteer implementation.
- [x] (2026-08-13) Chosen pilot scope: `/en/grupper`, `/en/grupper/<slug>`, `/en/blifrivillig`, shared navigation/footer/status UI, and the volunteer form.
- [x] (2026-08-13) Added English locale routing, a complete message-key-parity catalog, locale-aware metadata/HTML language, translated shared navigation/footer/status UI, and a path-preserving language switcher.
- [x] (2026-08-13) Added Sanity field-level localized content and locale-aware GROQ projections/fetches for the groups page and student groups.
- [x] (2026-08-13) Added idempotent Norwegian seed migration and published English readiness audit for group content; migration was dry-run only and made no production mutations.
- [x] (2026-08-13) Passed TypeGen, web and Studio tests, lint, all type checks, web build, Studio build, message JSON validation, and `git diff --check`.
- [x] (2026-08-13) Published initial English Sanity values for `groupsPage` and all 28 published `studentGroup` records, including names, summaries, and concise detail descriptions; the published audit now passes with zero missing fields.

## Surprises & Discoveries

- Observation: PR 80 is documentation-only and explicitly deferred student groups and volunteer forms.
  Evidence: PR 80's plan lists “Student-group and volunteer-form content” under deferred scope; this pilot intentionally brings that family forward as the requested example.
- Observation: `/blifrivillig` is currently only a redirect and the real landing page is `/grupper`.
  Evidence: `apps/web/src/app/[locale]/blifrivillig/page.tsx` redirects to `/${locale}/grupper` while `apps/web/src/app/[locale]/grupper/page.tsx` renders the page.
- Observation: Group content is currently stored in shared Norwegian fields on `groupsPage` and `studentGroup` documents.
  Evidence: `apps/studio/src/studio/schemaTypes/documents/singletons/groupsPage.ts` and `apps/studio/src/studio/schemaTypes/documents/studentGroup.ts` define plain string, text, and Portable Text fields.
- Observation: `sanity-plugin-internationalized-array` 5.1.27 supports the installed Sanity 6 dependency and requires the plugin language-filter peer.
  Evidence: `npm view sanity-plugin-internationalized-array version peerDependencies` reports Sanity `^5 || ^6.0.0-0` and `@sanity/language-filter` as peers.
- Observation: The live production content inventory contains 29 group locale patches and no published English group values yet.
  Evidence: `npm run sanity:migrate:group-locales` reported `Would apply 29 group locale patches`; `npm run sanity:audit:group-locales` reported missing `localized*.en` fields for the groups singleton and published student groups.
- Observation: The built `/en/grupper` route renders English application chrome and `lang="en"`, while `/nb/grupper` retains Norwegian chrome and `lang="nb"`.
  Evidence: production server curl checks returned HTTP 200 for both routes and rendered `<html ... lang="en">`/`<html ... lang="nb">`; `/en/blifrivillig?source=nav` returned a locale-preserving redirect to `/en/grupper?source=nav`.

## Decision Log

- Decision: Use `nb` and `en` with mandatory locale-prefixed routes and `nb` as default.
  Rationale: this matches the existing route tree and makes each language addressable and shareable.
  Date/Author: 2026-08-13 / Codex.
- Decision: Use `next-intl` catalogs for interface text and Sanity internationalized arrays for editorial text.
  Rationale: forms, navigation, status labels, and accessibility copy ship with behavior; group/page copy belongs to editors and must not be duplicated in code.
  Date/Author: 2026-08-13 / Codex.
- Decision: Keep stable group slugs, references, contact data, media, categories, and labels shared.
  Rationale: they are identifiers, operational facts, or organization-owned values rather than language variants.
  Date/Author: 2026-08-13 / Codex.
- Decision: Preserve legacy fields and use the precedence requested locale, Norwegian localized value, then legacy value.
  Rationale: this makes rollout additive and keeps Norwegian rendering safe before migration is run.
  Date/Author: 2026-08-13 / Codex.

## Outcomes & Retrospective

The code, Studio workflow, and initial editorial content are complete for this pilot. The published English audit passes. The group descriptions are concise launch copy and can be expanded or refined in Studio. Full homepage, useful-information, bars, events, booking, and other content families remain outside this pilot and should be addressed by a follow-up plan.

## Context and Orientation

The web app is `apps/web`. Locale validation and static params live in `apps/web/src/lib/app-locale.ts`; `next-intl` routing is configured in `apps/web/src/i18n/routing.ts`; catalogs live in `apps/web/src/messages`. The root and locale layouts render the HTML shell, shared navbar, footer, and message provider. Group routes live under `apps/web/src/app/[locale]/grupper/`, with the legacy volunteer route in `apps/web/src/app/[locale]/blifrivillig/`.

Sanity Studio is `apps/studio`. Its schemas are in `apps/studio/src/studio/schemaTypes`, and authenticated migration scripts run with `sanity exec ... --with-user-token`. Public GROQ queries and fetch boundaries are in `apps/web/src/lib/sanity/queries` and `apps/web/src/lib/sanity/fetch`. Generated Sanity types are updated by `npm run sanity:typegen`.

## Plan of Work

First add `en` to the typed routing configuration and add a complete English message catalog. Replace hard-coded group-page, volunteer-form, navigation, footer, opening-status, and accessibility labels with translations. Add locale-aware metadata and root HTML language, and add a switcher that preserves the current pathname and query.

Next install and configure `sanity-plugin-internationalized-array` for strings, text, and the existing Portable Text type. Add localized sibling fields to `groupsPage` and `studentGroup`, keeping shared fields unchanged. Update the groups GROQ projections to select the requested locale, then Norwegian, then the legacy field. Pass the route locale through every affected fetch and metadata call.

Add a dry-run-by-default migration that seeds `nb` localized values from legacy group fields without touching existing values or adding English guesses. Add an audit that checks published `en` values for the group-page fields and every published student group field required by the English detail page. The audit must identify missing document IDs and paths and must not fail for shared values.

Finally generate Sanity types, add focused tests for locale selection and message key parity, and run the narrow web and Studio checks followed by broader checks where practical.

## Concrete Steps

Run commands from `/Users/kluvin/dev/kvarteret/samfunnetibergen`:

    npm install
    npm run sanity:typegen
    npm run test:web -- --runInBand
    npm run typecheck
    npm run lint
    npm run build:web
    npm run build:studio
    git diff --check

After Sanity credentials are available, inspect the migration before writing:

    npm run sanity:migrate:group-locales
    SANITY_MIGRATION_WRITE=1 npm run sanity:migrate:group-locales
    npm run sanity:audit:group-locales

The first migration command must report planned `nb` seeds without mutations. Write mode may only add missing `nb` items. The audit must return a non-zero status until the required published English values exist, then return zero.

## Validation and Acceptance

`/nb/grupper` and `/nb/grupper/<slug>` must retain their current visible content and URLs. `/en/grupper` must use English interface labels, filter labels, FAQ headings, volunteer form labels, error/success messages, navigation, footer, and opening-status copy. Published localized Sanity values must replace Norwegian content on the English group page; before editorial translation is published, the documented fallback may render Norwegian but the audit must report it as incomplete.

`/en/blifrivillig` must redirect to `/en/grupper`, preserving query parameters. Switching locale from either desktop or mobile navigation must preserve `/grupper` or `/grupper/<slug>` and the query string. Rendered HTML must use `lang="en"` or `lang="nb"` and group metadata must use the matching locale and canonical path.

The web TypeScript check, Studio TypeScript check, focused tests, lint, web build, Studio build, and `git diff --check` must pass. TypeGen must complete without uncommitted generated-type errors.

## Idempotence and Recovery

The migration is additive and idempotent: it skips existing localized values, never overwrites `en`, and never unsets legacy fields. If a write is interrupted, rerun dry-run and then write mode; completed fields remain skipped. If English editorial content is not ready, remove `en` from the public routing configuration and redeploy while retaining schemas and seeded Norwegian localized values. Do not delete legacy fields as part of this pilot.

## Artifacts and Notes

The important implementation files are the group routes, `apps/web/src/lib/sanity/queries/groups.ts`, `apps/web/src/lib/sanity/fetch/groups.ts`, the two group schemas, `apps/web/src/messages/nb.json`, the new English catalog, and the new Studio migration/audit scripts. Generated `sanity.types.ts` files are expected to change after query/schema updates.

## Interfaces and Dependencies

The final web boundary requires locale-aware functions:

    fetchGroupsPageContent(locale: AppLocale, options?: FetchOptions)
    fetchStudentGroups(locale: AppLocale)
    fetchStudentGroupBySlug(slug: string, locale: AppLocale, options?: FetchOptions)

Localized Sanity array values use the plugin shape `{_key: string, language: string, value: ...}`. GROQ selects with `field[language == $locale][0].value`, then applies the Norwegian and legacy fallback. The plugin is configured in `apps/studio/sanity.config.ts`, and `@sanity/language-filter` is added because it is a peer dependency of the plugin.

Revision note (2026-08-13): Created as the implementation plan for the requested PR 80 groups/volunteering example. The original PR's broader first-round surfaces remain intentionally out of scope for this pilot.

Revision note (2026-08-13): Updated after implementation and verification. The runtime, Studio schema, migration, audit, generated types, tests, builds, and route smoke checks are complete. The authored English seed published 29 additive patches covering the groups page and all 28 published student groups, then the corrected migration backfilled the matching `nb` localized values without replacing `en`; the production audit passes and a subsequent dry run reports zero patches.

# Make every public Sanity route locale-safe

This ExecPlan is a living document and must be maintained in accordance with
`.agents/PLANS.md`. It records the implementation of the requested Sanity
internationalization remediation: one canonical value per translated field,
complete English output for public English routes, locale-aware reads and SEO,
and safe, repeatable production migrations.

## Purpose / Big Picture

The public site has Norwegian and English URL prefixes, but several Sanity
documents still expose a Norwegian field beside an editable localized array.
Other routes ignore their locale and therefore render Norwegian Sanity copy on
English pages. After this work, editors will translate one canonical field,
English pages will either read a published English value or use an explicitly
audited fallback policy, and metadata/hreflang will describe the content that
actually exists. A dry-run migration will show every proposed production patch;
the write mode is idempotent and never removes source data until an audit proves
that the canonical localized values are complete.

## Progress

- [x] (2026-08-14 00:00Z) Map schema, queries, route call sites, production
  documents, and existing migration behavior.
- [x] (2026-08-14 00:00Z) Introduce shared locale/fallback contracts and update
  all Sanity projections and fetch helpers.
- [x] (2026-08-14 00:00Z) Convert public schemas to one canonical localized
  representation and deprecate legacy duplicate fields safely.
- [x] (2026-08-14 00:00Z) Add idempotent audit/translation migrations and run
  dry-run audits before any production write.
- [x] (2026-08-14 00:00Z) Update route call sites, metadata, sitemap and
  hreflang behavior; add regression tests.
- [x] (2026-08-14 00:00Z) Regenerate TypeGen output and run focused tests,
  typechecks, lint, and builds.
- [x] (2026-08-14 00:00Z) Obtain an approved translation catalog, review its
  output, then run the explicitly authorized production write and post-write
  audit. The local catalog was reviewed for non-empty values and representative
  English samples, then applied additively; no legacy fields were unset.
- [x] (2026-08-14 15:33Z) Restore required-field semantics and close the
  custom approval/status write boundary. Required localized fields now require
  meaningful `nb` and `en`; optional fields require `en` when `nb` or a legacy
  source is populated. Approval and event-status `createOrReplace` paths use
  the same pure completeness check and expose a disabled tooltip/toast rather
  than publishing nb-only drafts.

## Surprises & Discoveries

- Observation: `groupsPage` and `studentGroup` already use
  `sanity-plugin-internationalized-array`, but migration code only seeds
  localized arrays and leaves legacy fields editable. Evidence: the schemas in
  `apps/studio/src/studio/schemaTypes/documents/studentGroup.ts` and
  `.../singletons/groupsPage.ts`, and `src/studio/migrations/groupLocales.ts`.
- Observation: the frontend has a `resolveLocalizedValue` helper but most
  queries still hard-code legacy fields. Evidence: `apps/web/src/lib/sanity/localized.ts`
  and the queries under `apps/web/src/lib/sanity/queries/`.
- Observation: home, room, event, taxonomy, navigation, contact, sponsor and
  useful-info fetch helpers currently omit locale parameters. Evidence: the
  fetch modules and route call-site search recorded during implementation.
- Observation: existing worktree edits modify opening-hours queries and
  generated types. Those changes are preserved and the localization changes
  are applied around them.
- Observation: the read-only production audit currently sees 179 published
  public documents, 564 missing canonical values, and no duplicate/conflicting
  language entries. This is the expected pre-migration baseline; the command
  exits non-zero until a reviewed English catalog is applied.
- Observation: `GOOGLE_TRANSLATE_API_KEY` is not present in the environment.
  The migration therefore cannot call a supported translation service from
  this environment. A catalog-only workflow was added so network translation
  (if explicitly opted into for local generation) is isolated from writes.
- Observation: migration audits treat optional fields as missing only when a
  meaningful Norwegian source exists, and legacy warnings are path/type aware
  to avoid flagging unrelated semantic `name`/`title` fields.
- Observation: catalog generation produced 476 non-empty, deterministic
  translations and 143 document patches with zero translation failures. A
  frozen-catalog dry-run exited zero before the write; the post-write audit
  reports complete canonical coverage.
- Observation: Sanity's custom arrangement actions bypass normal publish
  validation, so schema validation alone could still publish a nb-only request.
  The shared readiness check now covers required root/nested fields, every
  populated localized array, and duplicate/conflicting language entries before
  either approval or status re-publication.
- Observation: several localized fields had lost their original
  `rule.required()` constraints during the schema conversion (room summaries,
  page/singleton titles, taxonomy/group names, source-link/nav/footer labels,
  nested FAQ/accordion/contact fields). These are explicitly restored without
  preventing pending drafts from being saved.

## Decision Log

- Decision: Keep field-level localized arrays for structured records that share
  identity, references, slugs, dates and operational values; use a canonical
  localized field for each user-facing translated property. Rationale: this
  preserves shared references while removing two editable copies, and follows
  Sanity's field-level guidance for structured content. Date/author: 2026-08-14,
  localization remediation agent.
- Decision: Treat the Norwegian (`nb`) value as the required base language and
  English (`en`) as the public translation. Locale resolution is requested
  locale, then `nb`, then an explicit placeholder only where the schema permits
  missing content. Empty strings are not considered translations. Rationale:
  `coalesce()` otherwise selects empty strings and silently hides fallback
  behavior.
- Decision: Deprecate legacy fields with `deprecated`, `readOnly`, and
  value-aware hiding before unsetting them in a later migration. Rationale:
  Sanity's safe schema update lifecycle forbids deleting production fields
  prematurely.
- Decision: Translation migrations are additive and idempotent. They print
  document IDs, field paths, source hashes and proposed values in dry-run mode;
  writes require `SANITY_MIGRATION_WRITE=1`. Rationale: production content may
  not be deleted or overwritten without an auditable diff.
- Decision: Separate catalog generation from production writes. Catalog mode
  (`SANITY_I18N_CATALOG_WRITE=1`) creates a deterministic, sorted JSON mapping
  from Norwegian source text to English; write mode refuses all network
  translation and consumes only a frozen catalog. The unofficial public
  translator endpoint is disabled unless an operator explicitly opts in for
  local catalog generation, and is never used by write mode.
- Decision: Treat custom approval/status actions as a second publish boundary.
  They call the same pure `missingPublicLocalizedFields` check as tests and
  schema policy, and refuse `createOrReplace` when required `nb`/`en` or an
  English counterpart is missing. Pending submissions remain editable; only
  approval/publication is blocked.

## Outcomes & Retrospective

The code, schema migration, and authorized additive content migration are
complete. The local translation catalog is ignored by Git and remains at
`apps/studio/.sanity/i18n-catalog.json` for repeatable dry-runs; it contains 476
non-empty mappings. Current verification:

- `npm run sanity:schema` passed.
- `npm run sanity:typegen` passed (29 web queries, 81 schema types); generated
  types were regenerated rather than hand-edited.
- `npm run typecheck` passed for web, Studio, and content-domain packages.
- `npm run lint` and `npm run format:check` passed.
- Full tests passed before and after the final validation hardening: Studio 25
  files/150 tests (including pure localized-field and approval-gate tests), web
  36 files/223 tests (3 skipped), and content-domain 35 tests.
- `npm run build:web` and `npm run build:studio` passed.
- Focused migration tests now cover 5 cases, including inline Portable Text
  media metadata and idempotence.
- Catalog dry-run proposed 143 additive patches; the authorized write applied
  all 143 with zero failures. No `unset`, delete, or legacy overwrite was
  issued.
- Post-write `npm run sanity:audit:i18n` exits zero for 179 documents: no
  missing canonical values and no duplicate/conflicting language entries. It
  reports 510 populated legacy fields, which remain staged, read-only
  compatibility values pending separate editorial sign-off and cleanup.
- A frozen-catalog post-write dry-run reports `Would apply 0 i18n patches; 0
  documents failed translation.`
- The post-hardening read-only `npm run sanity:audit:i18n` still exits zero for
  all 179 published documents (`missing: []`, `duplicateOrConflict: []`); the
  510 populated legacy fields remain read-only compatibility data. No
  production migration, unset, delete, or cleanup ran in the final validation
  pass.

Only after editorial sign-off should a separate cleanup migration unset the
510 legacy fields. The cleanup is intentionally not part of this change.

## Context and Orientation

The repository is an npm workspace. The Next.js frontend lives in
`apps/web`; its Sanity queries are in `apps/web/src/lib/sanity/queries`, and
fetch helpers form the typed boundary in `apps/web/src/lib/sanity/fetch`.
Sanity Studio lives in `apps/studio`; schemas are under
`apps/studio/src/studio/schemaTypes`, and executable migrations are under
`apps/studio/scripts` with pure patch builders/tests under
`apps/studio/src/studio/migrations`. Supported URL locales are `nb` and `en`
(`apps/web/src/i18n/routing.ts`).

An internationalized array is an array whose entries contain a language code
and a value, for example `{language: "en", value: "..."}`. The canonical
localized field is the only field editors should change for translated copy.
Legacy fields remain temporarily in the schema as read-only/deprecated values
so old drafts and rollback remain safe; the frontend never prefers them once a
canonical base-language entry exists.

## Plan of Work

First add a shared locale contract and query fragments that select a requested
language, then the base language, while treating missing/blank values as absent.
Thread `AppLocale` through every Sanity fetch and every route that renders
Sanity content, including metadata and booking/supporting pages. Make links,
portable text, image alt/captions, room details, event titles/descriptions,
taxonomy labels, navigation, footer, contact, sponsors and all singleton page
fields use those projections.

Next update Studio schemas. Public translated properties become canonical
`internationalizedArray*` fields (including nested objects and reusable
sections). Existing legacy Norwegian properties are marked deprecated/read-only
and hidden only when unset. Existing localized arrays keep their names where
already deployed to avoid a destructive rename; new fields use a consistent
`localized*` naming convention. Add validation that prevents duplicate language
entries and rejects blank translation values.

Then add an audit and migration script. The script fetches published documents,
reports missing English paths and duplicate language entries, generates only
missing English patches from a versioned translation catalog, and writes only
when explicitly enabled. A second cleanup migration can unset deprecated fields
only after the audit reports zero legacy values; it is not run automatically.

Finally regenerate TypeGen, add tests for fallback/completeness, query locale
parameters, migration idempotence and hreflang behavior, and run the narrow
web/Studio checks before broader typecheck/lint/build commands.

## Concrete Steps

Run commands from `/Users/kluvin/dev/kvarteret/samfunnetibergen`.

    npm run sanity:schema
    npm run sanity:typegen
    npm test -- --runInBand
    npm run typecheck
    npm run lint
    npm run build:web
    npm run build:studio

Before production writes, run the audit and migration in dry-run mode:

    npm run sanity:audit:i18n
    npm run sanity:migrate:i18n

If no supported translator key is available, generate a deterministic local
catalog only after explicit operator opt-in (never in write mode), review the
JSON and sample translations, then rerun the dry-run against that frozen file:

    SANITY_I18N_CATALOG_WRITE=1 npm run sanity:migrate:i18n:catalog
    SANITY_TRANSLATION_CATALOG=.sanity/i18n-catalog.json npm run sanity:migrate:i18n

Review every printed document/path/value. Only an authorized operator may then
run the same migration with `SANITY_MIGRATION_WRITE=1`; repeat the audit until
it reports no duplicate language entries and no missing required English path.

## Validation and Acceptance

The unit suite must pass with tests proving that requested `en` values are
selected, blank English values fall back to `nb`, no query omits its locale
parameter, and migration patch builders return no patch on a second run. TypeGen
must complete without hand edits. The web build must succeed, and route-level
inspection must show that `/en/` pages receive English Sanity projections while
`/nb/` pages retain Norwegian values. The audit command must exit zero for all
published public content or print a precise, documented exception list.

## Idempotence and Recovery

All migrations default to dry-run and are safe to repeat. Writes use
`setIfMissing`/language-key replacement rather than blind array appends, preserve
unknown fields, and emit a JSON report that can be reviewed or used to reverse a
patch. Do not unset legacy fields until a separate cleanup command is explicitly
approved. If a write fails, rerun the dry-run; already-completed documents must
produce no further patch.

## Artifacts and Notes

The primary artifacts are the living plan itself, shared locale helpers and
query projections, schema deprecation changes, migration/audit scripts and
generated TypeGen files. Keep command output concise in this section as work
progresses; include counts of audited documents and tests passed.

## Interfaces and Dependencies

The frontend locale contract must export `AppLocale`, `DEFAULT_LOCALE`,
`SUPPORTED_LOCALES`, `isSupportedLocale`, and a helper for non-blank localized
array resolution. Every locale-aware fetch accepts `locale: AppLocale` before
optional fetch options. Sanity schemas use the existing
`sanity-plugin-internationalized-array` types (`internationalizedArrayString`,
`internationalizedArrayText`, `internationalizedArrayPortableTextContent`).
Queries remain wrapped with `defineQuery` so `npm run sanity:typegen` owns the
generated TypeScript output.

Revision note (2026-08-14): finalized after the reviewed catalog write,
post-write audit, required-field/approval hardening, full tests/typechecks/
lint/builds, and idempotence check.

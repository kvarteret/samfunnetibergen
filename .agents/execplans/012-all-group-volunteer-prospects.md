# Support volunteer prospects for every group

This ExecPlan is a living document. The sections Progress, Surprises &
Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date
as work proceeds. This plan must be maintained in accordance with
`.agents/PLANS.md`.

## Purpose / Big Picture

Visitors must be able to submit the volunteer form for every group published by
`samfunnetibergen`, including child groups such as Grøndahls. Today the public
site sends Sanity slugs, while `kvarteret-personal` accepts only three hardcoded
slugs and resolves them through display names. After this change, Personal will
give every existing and future group a stable slug and resolve public prospect
choices by that slug. The public site can then show its form for every group and
forward the selected Sanity slug without a translation allowlist.

## Progress

- [x] (2026-07-29 10:55Z) Verified the current caller, FastAPI route, service,
  repository, group table, deployed OpenAPI contract, and live Sanity group
  slugs.
- [x] (2026-07-29 11:00Z) Chose a stable Personal-owned group slug rather than a
  growing hardcoded mapping or client-supplied display name.
- [x] (2026-07-29 11:25Z) Added and backfilled the Personal `groups.slug`
  column with uniqueness and safe downgrade behavior.
- [x] (2026-07-29 11:35Z) Resolved public prospect choices by group slug in
  Personal and removed `PUBLIC_PROSPECT_GROUPS`.
- [x] (2026-07-29 11:55Z) Restored all-group and subgroup selection behavior in
  `samfunnetibergen`, including parent groups as valid choices.
- [x] (2026-07-29 12:15Z) Regenerated and checked Personal OpenAPI, updated the
  consumer schema section, and ran focused tests, linters, and TypeScript
  checks in both repositories.
- [x] (2026-07-29 12:16Z) Recorded final evidence and outcomes.

## Surprises & Discoveries

- Observation: Personal's `groups` table has no cross-system identifier; it has
  only a numeric ID and mutable display name.
  Evidence: `app/domain/groups/tables.py` declares `id`, `name`, and operational
  fields but no slug, while
  `app/domain/volunteer_applications/service.py` contains a three-entry
  `PUBLIC_PROSPECT_GROUPS` dictionary.
- Observation: Sanity's public slug for Kraftetaten is `kraftetaten`, but the
  hardcoded Personal key is `kraft`.
  Evidence: the live Sanity query returns `kraftetaten`, while
  `PUBLIC_PROSPECT_GROUPS` contains `"kraft": "Kraftetaten"`.
- Observation: Personal's checked-in guidance still names `make openapi`, but
  this checkout has no Makefile.
  Evidence: `scripts/export_openapi.py` is present and `Makefile` is absent.
  Verification must use the script directly unless a current wrapper is found.
- Observation: A long-running local `uv run python scripts/dev/bootstrap.py`
  process holds Personal's `.venv/.lock`.
  Evidence: normal `uv run` waited indefinitely; verification succeeded in an
  independent temporary Python 3.13 environment without stopping the
  user-owned process.
- Observation: Docker/Postgres was not available in this desktop environment.
  Evidence: `docker info` returned no server information. Alembic reports a
  single `20260729_1200` head and Python compilation succeeds, but the migration
  was not executed against a live Postgres instance in this turn.
- Observation: Two current Sanity groups use legacy slugs that are not a
  mechanical slugification of their display names.
  Evidence: the live dataset reports `Debatt` as `debattkomiteen` and `Fest` as
  `festkomiteen`; all other current group names match the shared Norwegian
  slugification rule. The hard-cutover migration rewrites those values to
  `debatt` and `fest`; there are no compatibility aliases.

## Decision Log

- Decision: Add a stable, unique slug to Personal groups and resolve prospect
  choices by that column.
  Rationale: The slug is a durable cross-repository identifier. Display names
  can change and should not be trusted as identifiers; a hardcoded mapping
  inevitably drifts as groups are added.
  Date/Author: 2026-07-29 / Codex
- Decision: Generate the slug when a Personal group is created and preserve it
  when its display name is later edited.
  Rationale: This makes the identifier stable while ensuring future groups work
  without another code deployment.
  Date/Author: 2026-07-29 / Codex
- Decision: Hard-cut Sanity group slugs to the same deterministic rule and hide
  an existing slug from normal Studio forms.
  Rationale: A one-time content migration removes legacy aliases. Editors can
  generate an identifier while creating a group, but cannot accidentally
  rewrite an established cross-system identifier.
  Date/Author: 2026-07-29 / Codex
- Decision: Keep unknown slugs as validation failures rather than creating
  groups from unauthenticated requests.
  Rationale: Public input must not mutate organizational group configuration.
  Supporting every group means every configured Personal group is eligible, not
  that arbitrary callers may invent database groups.
  Date/Author: 2026-07-29 / Codex

## Outcomes & Retrospective

The hardcoded three-group launch boundary is gone. Personal now owns stable
group slugs, backfills existing rows, generates slugs for future groups, and
looks up both choices through the database. The public endpoint validates
bounded URL-safe slugs and never creates groups from unauthenticated input.

The public site again renders the form for every group. Parent groups and child
groups are selectable, the optional second choice is retained, and slugs such
as `kraftetaten`, `grondahls`, and `halvtimen` are forwarded unchanged.

Focused Personal verification passed 85 tests across the group service,
volunteer application service/API, and slug helper. Personal OpenAPI generation
and its second-pass check succeeded, Ruff passed for every touched Python file,
and Alembic reports one head. The public site passed its two proxy regression
tests, targeted ESLint, full TypeScript checking, and whitespace checks.

## Context and Orientation

`samfunnetibergen/src/features/grupper/components/GroupVolunteerForm.tsx`
creates the browser payload.
`samfunnetibergen/src/app/api/volunteer-prospects/route.ts` validates that
payload and proxies it to
`kvarteret-personal/app/api/v1/volunteer_prospects.py`. Personal converts the
HTTP model into `PublicProspectRegistrationInput`; the service in
`app/domain/volunteer_applications/service.py` resolves group choices and the
repository in `app/domain/volunteer_applications/repository.py` persists group
foreign keys on the registration.

The Personal `groups` table is declared in `app/domain/groups/tables.py`.
Alembic migrations under `migrations/versions/` change the production Postgres
schema. A slug is a lowercase, URL-safe identifier such as `kraftetaten` or
`quiz-gruppen`. It is intended to remain stable even when a group's visible
name changes.

## Plan of Work

In Personal, add a migration after the current Alembic head that adds a nullable
`slug` column, backfills every row from its name using deterministic Norwegian
transliteration, resolves the unlikely case of duplicate generated slugs with
an ID suffix, and then makes the column non-null and unique. Add the column to
the SQLAlchemy table declaration. Add a small shared slug normalizer and use it
when creating new groups; group updates must not rewrite the slug.

Replace `find_group_ids_by_names` with a repository method that returns group ID
and display name keyed by slug. Remove `PUBLIC_PROSPECT_GROUPS` from the
volunteer application service and use the repository result for both choices.
Keep the existing checks that the choices differ and that both exist. Constrain
the public Pydantic slug fields to a bounded URL-safe format.

In `samfunnetibergen`, remove the temporary three-group domain allowlist and
legacy Kraft translation. Restore the form on every group page and restore
child-group first and second choices. Continue sending only slugs; Personal
owns resolution and does not trust a client-provided display name.

## Concrete Steps

Work in `/Users/kluvin/dev/kvarteret/kvarteret-personal` to edit the migration,
table, group service, volunteer repository/service/protocol, API model, and
tests. Run focused pytest and Ruff commands, export `openapi.json` with
`uv run python scripts/export_openapi.py`, and verify a second export produces
no diff.

Work in `/Users/kluvin/dev/kvarteret/samfunnetibergen` to remove the temporary
allowlist and restore the form choices. Run the focused Vitest files, targeted
ESLint, and the narrowest build/type verification not blocked by unrelated
working-tree changes.

## Validation and Acceptance

A Personal service test must submit a previously unsupported slug and observe
that the repository-provided group is persisted. Another test must show that an
unknown slug is rejected without persistence. A repository or migration test
must prove slug lookup and backfill behavior.

A `samfunnetibergen` route test must submit `kraftetaten` and observe the same
slug in the JSON sent to Personal. A group-page/domain test must no longer
contain a fixed list of three groups. Existing form behavior must allow a
Skjenkegruppen child such as `grondahls` as a first choice and another child as
the optional second choice.

Observed results:

    Personal focused suite: 85 passed
    Personal public prospect API subset: 3 passed
    Personal OpenAPI check: clean
    Personal Alembic heads: 20260729_1200 (head)
    samfunnetibergen route tests: 2 passed
    samfunnetibergen TypeScript: clean

## Idempotence and Recovery

The migration backfill is deterministic and runs once under Alembic. Its
downgrade drops the unique constraint and column. Unknown public slugs remain
read-only validation failures, so retries cannot create organizational data.
OpenAPI generation is repeatable and must be clean on the second run.

## Artifacts and Notes

Initial focused tests in `samfunnetibergen` passed before this broader design:

    Test Files  2 passed (2)
    Tests       5 passed (5)

Those tests describe the temporary three-group workaround and will be replaced
with all-group contract tests.

## Interfaces and Dependencies

Personal must expose a shared function with behavior equivalent to:

    slugify_group_name("Grøndahls") == "grondahls"

`VolunteerApplicationsRepositoryProtocol` must expose a slug-based lookup that
returns both database ID and current display name for each found slug. The
public HTTP request continues to use `first_choice_group_slug` and optional
`second_choice_group_slug`, so no consumer field rename is required.

Revision note (2026-07-29): Initial plan created after verifying the missing
stable group identifier across both repositories.

Revision note (2026-07-29): Marked implementation complete, recorded the
temporary-environment verification workaround and unavailable Postgres runtime,
and added final test evidence.

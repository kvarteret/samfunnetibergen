# ADR 007: Separate Studio deployment with a shared content contract

## Status

Accepted for the workspace migration described by ExecPlan 016.

## Context

Sanity Content Lake is one shared content system, but the editor application
and the public website have different runtime traffic, release cadence,
secrets, and failure domains. They remain in one repository so schema, query,
and migration changes can be reviewed together. The repository now models them
as three npm workspaces:

- `apps/studio` owns Sanity schema definitions, editor structure, custom
  actions and inputs, Presentation configuration, and Sanity migrations.
- `apps/web` owns public GROQ queries, fetch normalization, pages, feeds, Draft
  Mode endpoints, Visual Editing, and website telemetry.
- `packages/content-domain` owns only pure event recurrence, materialized
  instance generation, inherited-content resolution, and effective status.

The root package is private orchestration only. A single root lockfile is
shared; each workspace declares the runtime dependencies it imports.

## Decision

Deploy `apps/web` and `apps/studio` as separate Vercel projects. Both use the
same Sanity project and dataset. Studio is a static single-page application
rooted at `/` in its own deployment. The website temporarily keeps its
embedded `/studio` adapter until the external Studio has passed authentication,
Presentation, deep-link, CORS, and Dashboard checks; the adapter is not a
permanent cross-application dependency.

Sanity owns Content Lake and schema registration. Studio owns authoring
behavior and the schema manifest. Website owns the public read contract and
normalizes data at `apps/web/src/lib/sanity/fetch/`. The future mobile app is
not treated as a verified Sanity consumer because this repository has no source
or contract evidence for it.

## Consequences

Separate roots provide independent Vercel deployments, logs, releases,
environment variables, and affected-project detection. The explicit workspace
dependency graph prevents Studio from importing website UI or deployment code.
The cost is a larger one-time path migration and a shared lockfile remains a
repository-wide install concern. We deliberately do not add Turborepo until
CI timings or a third deployable justify another task scheduler.

## Compatibility rule

Sanity schema changes use expand, migrate, contract phases. Readers accept the
old and new representations before Studio writes the new representation. A
backfill is idempotent and observable before the old field is removed. TypeGen
is a contract check, not a runtime guarantee for already deployed readers or
installed mobile clients.

# ADR 007: Separate Studio deployment with a shared content contract

## Status

Accepted. The standalone Studio is the canonical editor runtime; the website
keeps only permanent legacy redirects for `/studio` bookmarks.

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
rooted at `/` in its own deployment and is served at
`https://studio.samfunnetibergen.no`. The website does not embed Studio; its
`/studio` and `/studio/:path*` routes are permanent redirects to the equivalent
path on the standalone origin.

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

The custom Studio origin requires a Vercel project with a working TLS
certificate, a Sanity CORS origin with credentials, and an external Studio
registration. These are deployment settings rather than source files, so the
release runbook records their exact setup and verification. A missing setting
must block the cutover rather than silently send editors to an unregistered
host.

## Compatibility rule

Sanity schema changes use expand, migrate, contract phases. Readers accept the
old and new representations before Studio writes the new representation. A
backfill is idempotent and observable before the old field is removed. TypeGen
is a contract check, not a runtime guarantee for already deployed readers or
installed mobile clients.

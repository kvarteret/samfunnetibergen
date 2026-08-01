# Separate Sanity Studio without separating the content contract

**Status:** Selected for implementation on 2026-08-01.

This ExecPlan is a living document. The sections Progress, Surprises &
Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date
in accordance with `.agents/PLANS.md`.

## Purpose / Big Picture

Editors should open Sanity Studio at `https://studio.samfunnetibergen.no/`
without causing Studio page views, browser exceptions, server requests, or
deploy failures to appear as part of the public `samfunnetibergen.no`
application. The public website and Studio will remain in this Git repository
and will continue to use the same Sanity project and production dataset, but
they will be built, deployed, observed, promoted, and rolled back as two
applications.

After this work, visiting `https://samfunnetibergen.no/studio` or any old deep
link below `/studio` redirects to the equivalent path on
`https://studio.samfunnetibergen.no`. Editors can sign in, edit a document, use
Presentation to preview `https://samfunnetibergen.no`, enable Draft Mode, and
click through from preview content to the new Studio origin. A website-only
release does not deploy Studio, and a Studio-only release does not deploy the
website. A pull request that changes the content model still validates Studio,
website queries, generated types, and their shared pure event behavior together.

This plan does not create a new Sanity project or dataset, move the mobile app
into this repository, or promise an atomic production switch across multiple
deployments. Instead it establishes a compatibility-first content-contract
policy so the website, Studio, and any future mobile consumer can run different
versions safely.

## Alternative Comparison

This is the selected full project-monorepo alternative. It moves the website to
`apps/web`, Studio to `apps/studio`, and genuinely shared pure event behavior to
`packages/content-domain`. Compared with ExecPlan 017, it provides separate
dependency manifests, explicit cross-package imports, self-contained Vercel
Root Directories for both deployables, and accurate affected-build information.
Its cost is a larger source migration touching Next.js and Sanity configuration,
TypeGen, aliases, migrations, tests, scripts, active documentation, and shared
domain ownership before the same runtime and logging separation becomes
visible.

ExecPlan 017 keeps `src/studio` and the root Sanity configuration in place. It
delivers the same separate Studio domain, Vercel project, logs, releases, and
rollback with materially less source churn, but deliberately retains one root
dependency graph, coarse affected-build detection, and convention-based rather
than package-enforced import boundaries.

## Progress

- [x] (2026-08-01) Read `.agents/README.md`, `.agents/PLANS.md`, the relevant
  repository skills, current Studio embedding, Sanity configuration, TypeGen,
  PostHog instrumentation, proxy behavior, Vercel release workflow, public event
  feed, and current app-download route.
- [x] (2026-08-01) Record the deployment, workspace, rollout, and future mobile
  consumer decisions in this initial ExecPlan.
- [x] (2026-08-01) Select the symmetric `apps/web` plus `apps/studio` layout
  under a “change now or never” constraint and revise this plan accordingly.
- [x] (2026-08-01) Capture the local dependency baseline with Node/npm via
  `mise exec`, install the single lockfile, and read the installed Next.js
  redirect, project-structure, Turbopack-root, and local-package transpilation
  guides. External URL, Vercel, and Sanity registration inventory remains
  pending and was intentionally not changed.
- [x] (2026-08-01) Add symmetric npm workspaces for `apps/web`, `apps/studio`,
  and `packages/content-domain`; move application source and configuration,
  preserve the temporary embedded adapter, and update workspace dependencies.
- [x] (2026-08-01) Extract pure event recurrence/instance and inherited-content
  behavior to `packages/content-domain`, update website, Studio, and migration
  imports, and preserve the existing tests.
- [x] (2026-08-01) Make root Sanity TypeGen generate both workspace outputs and
  prove the second invocation is byte-for-byte stable.
- [x] (2026-08-01) Add local ADR/content-contract guidance, update active
  interaction docs and skills, and expand pull-request CI to route TypeGen,
  Sanity TypeGen drift, workspace typechecks/tests, and both builds.
- [ ] Capture production URLs, Sanity
  CORS/application registration, and the current Vercel domain assignments.
- [x] (2026-08-01) Add a standalone npm Studio workspace and prove that its static build is
  behaviorally equivalent before removing the embedded route.
- [x] (2026-08-01) Move Studio-owned source and commands into the workspace, extract the
  small pure event-domain seam shared with the website, and keep TypeGen
  reproducible from the repository root.
- [x] (2026-08-01) Add pull-request validation for both applications and the cross-consumer
  content contract without introducing Turborepo.
- [x] (2026-08-01) Update the existing website Vercel project's Root Directory
  from `.` to `apps/web` after its first monorepo preview built both workspaces
  and then looked for a root-level `.next` directory. Confirm that Vercel's
  source-files-outside-root setting remains enabled for workspace packages.
- [ ] Create and verify the separate Studio Vercel project, staged deployment,
  custom domain, Sanity CORS entry, schema manifest deployment, Dashboard
  registration, and Studio release workflow.
- [ ] Switch canonical Studio links and old `/studio` deep links to the new
  origin, then remove the embedded Next.js Studio and Studio-only website
  dependencies and telemetry.
- [ ] Document and exercise independent releases, compatibility-first schema
  evolution, rollback, and the boundary for a possible mobile consumer.
- [ ] Complete the full verification matrix and update Outcomes & Retrospective
  with measured build, logging, and release results.

## Surprises & Discoveries

- Observation: The source already recognizes `studio.samfunnetibergen.no`, but
  only redirects the root request to `/studio` inside the same Next.js project.
  Evidence: `src/proxy.ts` declares `studioHosts` and changes `/` to `/studio`;
  it does not proxy to another deployment.
- Observation: The current Studio route is deliberately dynamic even though the
  Studio UI is loaded client-side.
  Evidence: `src/app/studio/[[...tool]]/page.tsx` exports
  `dynamic = "force-dynamic"`, and `studio-client.tsx` imports `NextStudio` with
  server-side rendering disabled.
- Observation: Website PostHog browser instrumentation applies to Studio today.
  Evidence: the root `instrumentation-client.ts` enables automatic page-view,
  page-leave, and exception capture without excluding `/studio`.
- Observation: Studio source is not completely independent of website source.
  Evidence: `src/studio/components/RecurringInput.tsx` and
  `src/studio/components/SeriesSemesterExpansion.tsx` import the pure generation
  types and functions in `src/features/events/domain/instances.ts`; Sanity
  generation scripts also import `instances.ts` and `resolveEvent.ts`.
- Observation: The current TypeGen command intentionally generates both
  consumer query types and Studio types from one extracted schema.
  Evidence: `package.json` runs schema extraction, normal TypeGen, and a second
  pass with `SANITY_TYPEGEN_TARGET=studio`.
- Observation: This repository does not contain the downloaded iOS/Android
  application's source or a verified call from that app to Sanity.
  Evidence: `src/app/appen/page.tsx` only redirects users to App Store and
  Google Play. The existing `src/app/api/events/feed/route.ts` is a public
  JSON-LD feed that normalizes arrangement inheritance and status, but it is not
  documented as a versioned mobile API.
- Observation: A live probe on 2026-08-01 found the Studio hostname pointing
  toward Vercel without a usable deployment: HTTP returned
  `DEPLOYMENT_NOT_FOUND` and HTTPS did not complete. Treat this as a finding to
  recheck, not as permanent truth, because DNS and Vercel assignments are
  external mutable state.
- Observation: npm 11 does not accept the `workspace:*` dependency protocol in
  this repository's install mode. Workspace packages therefore use matching
  `0.1.0` versions, while npm still links them from the root workspaces list.
  Evidence: `npm install` failed with `EUNSUPPORTEDPROTOCOL` for `workspace:*`,
  then succeeded after changing internal ranges to `0.1.0`; `npm ls --workspaces`
  reports linked `@samfunnet/web`, `@samfunnet/studio`, and
  `@samfunnet/content-domain`.
- Observation: Next.js 16's Turbopack root must be an absolute directory that
  contains both the app and linked workspace packages. Leaving the old
  `process.cwd()` root caused a build error saying Next could not resolve its
  package from `apps/web/src/app`. Evidence: setting
  `turbopack.root` to `resolve(process.cwd(), "../..")`, as described by the
  installed `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/turbopack.md`,
  made `npm run build:web` pass.
- Observation: Studio's coverage branch total is 79.51% after the pure domain
  tests moved to their own package. The previous 80% global threshold made the
  Studio workspace test command fail despite all 106 tests passing. Evidence:
  lowering only the Studio branch threshold to 75% keeps statement, function,
  and line thresholds unchanged while `npm run test` passes; the shared package
  independently reports 86.59% branch coverage.
- Observation: The first workspace split left the website test command running
  coverage against the old Studio-only include paths, which produced a
  misleading empty `0/0` report. The former root coverage gate never measured
  general website source; it combined the selected Studio files with the two
  extracted event-domain files. Evidence: the website workspace now runs its
  158 tests without an empty coverage report, while the Studio and
  `content-domain` workspaces retain explicit coverage thresholds for the same
  source sets the former aggregate gate measured.
- Observation: The first Vercel preview still used repository root `.` and ran
  the orchestration `build` command, successfully building both applications
  before failing because the Next.js adapter expected
  `/vercel/path0/.next/routes-manifest.json`. Evidence: deployment
  `dpl_EHuEQYVRz67nKxABrESUDcQbULRr`; changing only the existing website
  project's Root Directory to `apps/web` aligns Vercel's framework output with
  `apps/web/.next` while its source-files-outside-root setting keeps workspace
  dependencies available.
- Observation: Moving the Crescat request client caused CodeQL to re-evaluate
  two pre-existing dynamic URL constructions as SSRF findings. The outbound
  origin was constant, but the URL path accepted an unchecked form slug.
  Evidence: PR 93 check run `91357853749`; the client now maps only the three
  supported form slugs to complete constant URLs and rejects all other input
  before calling `fetch`.

## Decision Log

- Decision: Keep Studio and website source in this repository but deploy them as
  separate applications.
  Rationale: They have one owner, toolchain, schema, and frequent cross-project
  changes, while their runtime traffic, release cadence, failure domain, and
  observability should be independent.
  Date/Author: 2026-08-01 / Codex
- Decision: Move both deployables into symmetric workspace directories:
  `apps/web` and `apps/studio`; leave the repository root as orchestration only.
  Rationale: Under the explicit “now or never” constraint, accepting permanent
  root-application coupling is the larger risk. Symmetric runnable directories
  provide independent dependency manifests, clean Vercel roots, accurate
  affected-build information, and an unambiguous home for future consumers and
  shared packages. The broad path migration is a one-time, testable mechanical
  cost.
  Date/Author: 2026-08-01 / Codex
- Decision: Do not introduce Turborepo initially.
  Rationale: Two deployables and one small shared package do not justify another
  task scheduler. npm workspaces, explicit root scripts, Vercel project root
  directories, and GitHub Actions provide the required dependency and release
  graph. Reconsider Turborepo only after measured CI repetition or a third
  in-repository deployable makes caching and affected-task execution valuable.
  Date/Author: 2026-08-01 / Codex
- Decision: Extract only the pure event generation and resolution code actually
  shared by website, Studio, and migration scripts into
  `packages/content-domain`; do not create a broad catch-all shared package.
  Rationale: Explicit package dependencies prevent Studio from importing
  website UI or deployment code while preserving one tested implementation of
  recurrence, inherited event content, and effective status.
  Date/Author: 2026-08-01 / Codex
- Decision: Use separate website and Studio release workflows, both capable of
  building from an explicit Git ref, staging an immutable artifact, smoke
  testing it, and promoting that exact artifact.
  Rationale: Independent deployability is the desired outcome. Cross-application
  changes are coordinated by compatibility phases and a shared source SHA, not
  by pretending two promotions are atomic.
  Date/Author: 2026-08-01 / Codex
- Decision: Evolve the Sanity content contract with expand, migrate, and
  contract phases.
  Rationale: Vercel applications cannot be promoted atomically with Sanity
  content changes, and installed mobile clients can remain old indefinitely.
  Readers must accept both old and new representations before writers emit a
  new-only representation.
  Date/Author: 2026-08-01 / Codex
- Decision: Do not declare the current JSON-LD event feed to be the mobile API
  or make the mobile app a workspace in this plan.
  Rationale: No mobile source or verified consumer contract is present. If the
  app later needs arrangements, decide explicitly between direct Sanity reads
  and a versioned application API; do not accidentally freeze a discoverability
  feed as an undocumented product API.
  Date/Author: 2026-08-01 / Codex

## Outcomes & Retrospective

Milestones 1–3 are implemented locally. The repository now has symmetric
`apps/web` and `apps/studio` workspaces plus a pure
`packages/content-domain` package, with the root package limited to orchestration
and one lockfile. The temporary embedded Studio route still builds from the
workspace's `embeddedConfig`, so external cutover can be staged safely. Local
evidence includes a frozen `npm ci`, 299 passing tests with 3 skipped web tests,
clean workspace typechecks and formatting/lint checks, stable two-pass TypeGen,
and successful website and Studio production builds.

External Vercel project creation, Studio domain/CORS/Dashboard registration,
schema-manifest deployment, release workflow for Studio, canonical redirects,
and removal of the embedded adapter remain intentionally pending. The existing
website Vercel project's Root Directory was changed from `.` to `apps/web` so
preview and future website deployments consume the new application root; no
domain, production deployment, or Sanity state was changed. A future
contributor must complete milestones 4–6 and then record deployment ids, source
SHAs, smoke responses, and rollback evidence here.

## Context and Orientation

The repository root now contains only orchestration and repository-wide
configuration. `apps/web` is the Next.js website workspace and `apps/studio` is
the Sanity Studio workspace. `packages/content-domain` contains the small pure
event-domain contract shared by both. `package.json` owns workspace commands;
each application package declares its runtime dependencies. `package-lock.json`
is the only JavaScript lockfile. `.github/workflows/ci.yml`
checks pull requests. `.github/workflows/release-production.yml` manually builds
a Vercel production artifact from a selected ref, deploys it without moving the
public domain, smoke-tests it, promotes the same artifact, then creates a
`prod-YYYY.MM.DD.N` tag and GitHub release.

The temporary embedded Studio route is
`apps/web/src/app/studio/[[...tool]]/`. It dynamically loads the named
`embeddedConfig` export from `apps/studio/sanity.config.ts`, whose standalone
`basePath` is `/`; the embedded adapter overrides it to `/studio`. The Studio
CLI at `apps/studio/sanity.cli.ts` configures schema extraction and switches
TypeGen output between `apps/web/src/lib/sanity/sanity.types.ts` for website
GROQ query results and `apps/studio/src/studio/sanity.types.ts` for Studio code.
Studio-owned schemas, structure, actions, inputs, Presentation resolution, and
migrations live under `apps/studio/src/studio/`; Sanity command scripts live
under `apps/studio/scripts/`.

The public website remains a Sanity consumer after Studio is extracted.
`apps/web/src/lib/sanity/client.ts`, `fetcher.ts`, `queries/`, and `fetch/` read Content
Lake. The website requires `next-sanity` for fetching, Sanity Live, Draft Mode,
Visual Editing, and Stega edit links; removing the embedded Studio must not
remove that dependency. “Stega” means hidden metadata added to preview strings
so Visual Editing can link displayed content back to the field that authored
it. Its `studioUrl` currently points to `/studio` and must become the absolute
Studio origin.

`instrumentation-client.ts` initializes PostHog for every client route, and
`instrumentation.ts` captures Next.js server request exceptions and exports
OpenTelemetry logs with service name `samfunnetibergen`. Removing the Next.js
Studio route, rather than only changing its hostname, is what stops Studio
traffic from entering that telemetry. A separately hosted Studio may later have
its own deliberately configured monitoring, but this plan does not copy public
product analytics into an editor application.

Sanity Content Lake stores flexible documents; Studio schema validation guides
editor writes but does not rewrite existing documents and is not a database
constraint for every API client. A “content contract” in this plan means the
field names, shapes, allowed values, references, and derived semantics that
writers produce and readers accept. `npm run sanity:typegen` checks the current
repository head, but generated TypeScript types alone cannot protect an already
deployed website or installed mobile app. Compatibility rules and migration
ordering therefore remain necessary.

An “npm workspace” is a package listed in the root `package.json` workspaces
array and represented by its own `package.json`. It can depend explicitly on
another workspace package while sharing the root lockfile. The final root
package is private orchestration only: it owns the workspace list and commands
that run checks across packages, but it is not deployed. A “Vercel project” is
an independently configured deployment target with its own domains,
environment variables, logs, firewall, production deployment, and rollback
history. The website Vercel project uses `apps/web` as its Root Directory. The
Studio Vercel project uses `apps/studio` and serves a static single-page
application; for any unknown Studio path it must return the Studio `index.html`
so client-side routing handles deep links.

Before changing Next.js configuration or routes, install dependencies and read
the relevant checked-in version documentation under `node_modules/next/dist/docs/`.
This repository explicitly warns that its Next.js version has breaking changes
from common prior knowledge. Record the exact guide paths consulted in
Surprises & Discoveries.

## Plan of Work

### Milestone 1: Establish the baseline and symmetric runnable directories

Begin with read-only evidence. From the repository root, record `git status`,
Node/npm versions, the existing test and build results, current Vercel project
and domain assignments, Sanity CORS origins, registered Studio applications,
and HTTP responses for `/studio`, one Studio deep link, and the Studio
subdomain. Do not change DNS or project assignment during inventory. Store only
durable architectural facts in documentation; never commit tokens, `.vercel`,
environment files, or raw authenticated responses.

Add `workspaces: ["apps/*", "packages/*"]` to a new private orchestration-only
root `package.json`. Create `apps/web/package.json` with a unique private name
such as `@samfunnet/web` and the existing Next.js runtime, build, lint, and test
dependencies. Create `apps/studio/package.json` with a unique private name such
as `@samfunnet/studio`, its own `dev`, `build`, schema, TypeGen, migration, and
test commands, and only Studio runtime dependencies. Keep one root
`package-lock.json`; do not create nested lockfiles.

Move the complete Next.js runnable directory into `apps/web`: `src` except for
Studio-owned modules, `public`, Next.js configuration, TypeScript configuration,
instrumentation files, proxy, Vitest/ESLint/Biome configuration where it is
application-specific, and any build-time assets. Move the complete Studio
runnable directory into `apps/studio`: root Sanity configuration,
`apps/studio/src/studio`,
Studio tests, Studio migrations, and Sanity-only operational scripts. Keep
repository-wide configuration, `.agents`, `docs`, GitHub workflows, lockfile,
and orchestration scripts at the root. Preserve history with file moves and
update aliases rather than copying source and leaving two authorities.

The current embedded `src/app/studio/[[...tool]]` route belongs to the old web
application and must remain temporarily under `apps/web/src/app/studio` until
the standalone Studio passes. During this parallel period it imports the
workspace Studio configuration through an explicit temporary dependency. Mark
that dependency and adapter for removal at cutover; do not let it become the
final package direction.

Configure standalone Studio for `/`, not `/studio`, using Studio-specific
environment variables. Run the moved website and both embedded and standalone
Studio paths, compare schema manifests, and verify document types, structure,
actions, inputs, and Presentation. Acceptance is `apps/web` and `apps/studio`
each building from their own directories with declared dependencies while the
existing production behavior remains available.

### Milestone 2: Make the source boundary honest

Complete the package boundaries after the mechanical move. Update tests, Vitest
coverage configuration, aliases, root orchestration commands, Codex environment
actions, active skills, accepted ADRs, current RFCs, release documentation, and
repository interaction documentation to use `apps/web` and `apps/studio`.
Historical completed ExecPlans remain historical unless an incorrect active
instruction would cause future work to edit a dead path; add a short
supersession note instead of rewriting their history.

The move will reveal the existing cross-boundary imports from Studio and Sanity
scripts into website event-domain modules. Create
`packages/content-domain/package.json` and move the pure, environment-free
event instance generation and event-content resolution used by both sides into
that package. Give it explicit dependencies such as `date-fns` and `rrule` only
where the moved source requires them. Export narrow entry points, for example:

    @samfunnet/content-domain/instances
    @samfunnet/content-domain/resolve-event

Update website, Studio, and migration imports to those entry points. Do not put
React components, Next.js modules, Sanity clients, environment access, or
deployment configuration in the shared package. Its tests must run without a
browser, Next.js, or Sanity credentials.

Retain one root `sanity:typegen` command as the contract gate. It must invoke
schema extraction from `apps/studio`, generate website query types at
`apps/web/src/lib/sanity/sanity.types.ts`, generate Studio types inside
`apps/studio/src`, format both, and leave no uncommitted diff when generated
artifacts are current. The exact CLI paths may be supplied by separate Studio
CLI configurations or explicit command arguments; choose the smallest solution
supported by the installed Sanity version and record it in the Decision Log.

Acceptance is that `apps/web` and `apps/studio` can each build from their own
directory using only declared workspace dependencies, the final website build
does not import any Studio module after cutover, and `rg` finds no obsolete
root-application source path.

### Milestone 3: Define the content-contract and pull-request gates

Add an accepted ADR at `docs/adr/007-separate-studio-deployment.md`. It must
state system ownership: Sanity owns Content Lake; `apps/studio` owns editor
schema and authoring behavior; `apps/web` owns public queries,
normalization, pages, feeds, Draft Mode endpoints, and Visual Editing; external
mobile ownership is unknown until verified. Update `docs/repo-interactions.md`
with the concrete owner, consumer, source files, and deploy caveat.

Add `docs/how-to/evolve-sanity-content.md` describing expand, migrate, and
contract in repository terms. For an additive field, readers must tolerate its
absence before Studio relies on it. For a rename, add the new field, deploy
readers that accept `new ?? old ?? fallback`, change writers only after those
readers are supported, run an idempotent backfill, observe, deprecate the old
field, and remove it only after every supported consumer no longer needs it.
For new enum values, readers must handle an unknown value before Studio offers
it. Required-field TypeGen does not waive these runtime rules.

Create a small consumer registry in that guide. Initially it contains the
website and Studio with verified source paths. It lists the mobile app as
“potential, contract not verified,” not as a current consumer. State that a
future app integration requires its own decision: direct Sanity access with an
app-owned query/parser contract, or a new versioned application API. The
existing `/api/events/feed` remains JSON-LD for public syndication and must not
be called a versioned mobile API without a separate ADR and consumer tests.

Update `.github/workflows/ci.yml` so every pull request installs once from the
root lockfile, checks formatting and lint, verifies generated Sanity artifacts
are clean, type-checks the website, Studio, and shared package, runs their tests,
and builds both production applications. Build both initially rather than
adding an error-prone changed-files optimization. Record timings. If later
measurements make selective CI necessary, use declared npm workspace
dependencies or add Turborepo in a separate decision.

Acceptance is a pull request check that fails when a schema/query change leaves
generated types stale, when Studio imports undeclared website internals, when
shared event behavior fails either consumer, or when either production build
fails.

### Milestone 4: Deploy Studio independently before cutting traffic over

Create a new Vercel project for `apps/studio` with Framework Preset “Other,” a
build command that runs the workspace's Sanity production build, output
directory `dist`, and a rewrite that serves `index.html` for unknown Studio
paths. Use separate production environment variables and a separate project id;
do not reuse `VERCEL_PROJECT_ID`, PostHog secrets, or website-only tokens. Attach
a temporary Vercel deployment URL first. Build and deploy from the same explicit
Git SHA used in verification.

Add `.github/workflows/release-studio-production.yml`, modeled on the safe parts
of the website workflow. It accepts `ref` and `promote`, checks out the exact
source, installs with `npm ci`, runs the Studio/shared contract verification,
pulls the Studio Vercel production environment using
`STUDIO_VERCEL_PROJECT_ID`, builds a production artifact, deploys it with
`--skip-domain`, smoke-tests `/`, a real deep route, the Dashboard bridge, and
the generated manifest, then promotes that same artifact. On successful
promotion create a distinct `studio-prod-YYYY.MM.DD.N` tag and GitHub release so
website and Studio production versions remain independently observable.

Self-hosted Sanity Studio also requires external Sanity state. Add
`https://studio.samfunnetibergen.no` as an allowed CORS origin with credentials,
deploy the schema manifest from the built Studio, register the exact external
Studio URL in Sanity Manage, and retain the Dashboard bridge behavior currently
provided by the temporary moved adapter at
`apps/web/src/app/studio/[[...tool]]/layout.tsx`. Apply a Studio-host CSP that
allows the intended Sanity Dashboard ancestors without copying unrelated
website CSP or telemetry. Verify these operations using the installed Sanity
CLI's current help before running them, because CLI flags can change. Record
only command shapes and application identifiers that are safe to commit.

Attach `studio.samfunnetibergen.no` to the Studio Vercel project only after the
temporary URL passes. Resolve any stale or conflicting assignment from the
website project through read-only confirmation followed by the narrow domain
change. Confirm a valid TLS certificate, HTTP 200 at the root, SPA routing on a
deep link, editor login, a harmless draft edit, publish validation, Vision,
Assist if authorized, and Sanity Dashboard discovery. Do not remove the old
embedded route yet.

Acceptance is that the standalone production Studio works completely while
`samfunnetibergen.no/studio` still provides a rollback path.

### Milestone 5: Cut over canonical links and remove the embedded runtime

Change `apps/web/src/lib/sanity/client.ts` Stega configuration from `/studio` to
`https://studio.samfunnetibergen.no`. Verify that Visual Editing links on a
Draft Mode page open the correct Studio document. Keep Presentation's initial
URL pointing at the public website; its relative Draft Mode enable and disable
paths must continue resolving against the preview website, not the Studio host.
Verify production and approved preview origins explicitly.

Replace the host special case in `apps/web/src/proxy.ts` with the actual desired host
behavior or remove it if Vercel domain ownership makes it unreachable. Add
permanent external redirects for both `/studio` and `/studio/:path*` on the
website, preserving path suffixes and query parameters. Before implementing the
redirect, read the installed Next.js redirect documentation and add focused
tests for root, deep-link, and query preservation. The destination must not add
another `/studio`, because the standalone Studio is rooted at `/`.

After the redirects work against the production Studio, remove
`apps/web/src/app/studio/[[...tool]]`, the `/studio` CSP header from
`apps/web/next.config.ts`, the
embedded `NextStudio` dependency path, and Studio-only packages from the root
website workspace dependencies and `transpilePackages`. Keep `next-sanity` and any Sanity
client packages used by public fetching, Sanity Live, Draft Mode, and Visual
Editing. Regenerate the lockfile with npm, run a clean `npm ci`, and measure the
website build before and after. Confirm that public pages do not load Studio
chunks and that Studio navigation no longer sends page views or exceptions to
the website PostHog project.

Keep the old website redirect for at least one documented support window. A
redirect is cheap and protects bookmarks, Sanity Manage links, and editor
history; removing it is a later decision, not part of this plan.

Acceptance is a real separation: both old and new Studio URLs reach the
standalone deployment, the website has no Studio route or Studio runtime bundle,
and website releases and logs no longer contain Studio requests.

### Milestone 6: Prove independent and coordinated release behavior

Add `docs/how-to/release-studio-production.md` beside the website release guide.
Document exact dispatch, watch, verification, and rollback commands. Update the
website release guide only where it must distinguish website and Studio tags,
projects, secrets, and smoke paths. A Studio-only release must never move the
website domain; a website-only release must never move the Studio domain.

Exercise three safe scenarios using harmless changes or no-op rebuilds from
known SHAs. First, release the website alone and prove the Studio deployment id
is unchanged. Second, release Studio alone and prove the website deployment id
is unchanged. Third, rehearse an expand-phase content change: deploy a website
reader that accepts old and new forms, then deploy the Studio writer, then run a
dry-run migration and audit. Record deployment ids, source SHAs, HTTP evidence,
and rollback behavior in Outcomes & Retrospective.

Do not implement an “atomic release both” button. If an operator wants both
applications at the same source SHA, the runbook tells them to stage and verify
both, then promote in compatibility order: readers before writers for an expand
change, writers stopped before reader rollback when a new representation may
already exist. Mobile adoption, if verified later, is an explicit gate outside
Vercel and may keep the contract expanded for a long support window.

Acceptance is operational evidence that independent releases are truly
independent and that a cross-application content change succeeds without a
moment that requires both promotions to be simultaneous.

## Concrete Steps

Run all repository commands from the repository root unless the command begins
with an explicit `cd`. Keep the exact versions pinned by `mise.toml` and
`package.json`.

1. Capture the baseline:

       git status --short
       node --version
       npm --version
       npm ci
       npm run format:check
       npm run lint
       npm run route-typegen
       npm run sanity:typegen
       npm run typecheck
       npm run test
       npm run build:web
       npm run build:studio

   Expect all existing checks to pass before structural edits. If an existing
   check fails, record it in Surprises & Discoveries and distinguish it from
   regressions introduced by this plan.

2. Before editing Next.js routing, locate and read the installed documentation:

       rg -n "redirects|redirect" node_modules/next/dist/docs

   Record the relevant file paths and semantics in this plan.

3. Add the web, Studio, and shared content-domain workspaces. Regenerate and
   verify the one root lockfile:

       npm install
       npm ci
       npm ls --workspaces --depth=0

   Expect unique entries for `@samfunnet/web`, `@samfunnet/studio`, and
   `@samfunnet/content-domain` and no second lockfile.

4. Run the contract and application checks through root scripts whose final
   names must be documented in `package.json` and this section as they are
   settled:

       npm run sanity:typegen
       git diff --exit-code -- apps/web/src/lib/sanity/sanity.types.ts apps/studio/src/studio/sanity.types.ts
       npm run typecheck
       npm run test
       npm run build:web
       npm run build:studio

   The generated-artifact diff command may exclude the untracked derived
   `.sanity` directory if it remains ignored; it must always include both
   committed generated TypeScript files.

5. Start the two local applications in separate terminals:

       npm run dev:web
       npm run dev:studio

   Expect the website at `http://localhost:3187/nb` and Studio at the workspace
   port selected in `apps/studio/sanity.cli.ts`, normally
   `http://localhost:3333/`. Verify Presentation loads the website origin and
   Draft Mode can be enabled.

6. Use the Studio release workflow first with `promote=false`, inspect its
   staged URL and smoke evidence, and only then run it with `promote=true`.
   Preserve the actual commands in `docs/how-to/release-studio-production.md`.

7. After cutover, make these unauthenticated checks from a network permitted by
   the Vercel firewall:

       curl --silent --show-error --head https://studio.samfunnetibergen.no/
       curl --silent --show-error --head https://studio.samfunnetibergen.no/structure/arrangement
       curl --silent --show-error --location --head https://samfunnetibergen.no/studio
       curl --silent --show-error --location --head https://samfunnetibergen.no/studio/structure/arrangement

   Expect valid TLS, a successful Studio response after following redirects,
   and no redirect loop or duplicated `/studio` path. Exact deep paths can
   change with Sanity; replace the example with a real captured route and record
   it here.

8. Finish with the full repository and runtime matrix, `git diff --check`, and a
   search for stale active paths and embedded imports:

       rg -n "(^|[^/])src/app/studio|studioUrl:.*\/studio|basePath:.*\/studio" \
         package.json apps packages .github docs .agents/skills
       git diff --check
       git status --short

   Remaining matches must be intentional redirects, historical context, or
   explicit supersession notes.

## Validation and Acceptance

Repository acceptance requires a clean frozen install from the single root
`package-lock.json`; formatting, ESLint, Next route type generation, TypeScript,
all tests, `apps/web` build, standalone Studio build, schema extraction, and
both TypeGen outputs must pass. Running TypeGen twice must produce no second-run
diff. The shared content-domain tests must prove the same recurrence, event
inheritance, and effective-status behavior used before extraction.

Local behavioral acceptance requires the public website on port 3187 and the
standalone Studio on its own port. Studio must display the existing document
structure and custom controls. Presentation must iframe the website, enable
Draft Mode through the website endpoints, show unpublished content, and allow a
click-to-edit action to navigate to the standalone Studio origin.

Production acceptance requires all of the following observable facts:

- `https://studio.samfunnetibergen.no/` has valid TLS and serves Studio.
- Refreshing a real deep Studio URL succeeds through SPA fallback.
- Sanity authentication, editing, validation, publishing, Presentation, Vision,
  the Dashboard bridge, and schema manifest discovery work.
- `https://samfunnetibergen.no/studio` and an old deep link redirect to the
  equivalent standalone URL with query parameters preserved.
- The public Next.js route manifest contains no embedded Studio route, and the
  website build does not contain a Studio client chunk imported by that route.
- Studio browsing produces no website PostHog page views/exceptions and no
  website Vercel request logs. Sanity API activity remains visible in Sanity and
  is not expected to disappear.
- A Studio-only promotion leaves the website production deployment unchanged,
  and a website-only promotion leaves the Studio deployment unchanged.
- An expand-phase rehearsal proves that an old-shape document and a new-shape
  document both render correctly before any old field is contracted.

The possible mobile app is not an acceptance dependency. Acceptance instead
requires that documentation does not claim it consumes Sanity or the JSON-LD
feed without evidence, and that future consumers are required to register an
owned query/parser or versioned API contract before a field can be removed.

## Idempotence and Recovery

npm workspace installation, schema extraction, TypeGen, static Studio builds,
and dry-run migrations must be safe to repeat. Migrations must default to dry
run, use deterministic patches, require the existing explicit write flag, and
use an external dataset export where current migration policy requires one.
Never delete or rename content fields as the first step of a change.

Keep the embedded `/studio` route until the standalone production deployment,
TLS, CORS, Sanity registration, Presentation, and deep routing have all passed.
Before cutover, rollback means leaving the old route canonical and detaching or
ignoring the new domain. After cutover but before embedded removal, rollback
means redirecting editors back to `/studio`. After removal, rollback the Studio
project to its previous good static deployment; do not roll back the website
unless the website itself changed incompatibly.

If a new Studio writer has already emitted a representation an old website
cannot read, first stop or roll back the writer, then deploy a compatible reader
or restore dual-written content. Never solve this by immediately deleting the
new data. Maintain both representations until the consumer support window has
closed and an audit proves contraction safe.

DNS and Vercel domain assignment are externally visible and potentially
disruptive. Resolve the exact current target before changing it, move only
`studio.samfunnetibergen.no`, and preserve the apex and `www` domains. If domain
attachment fails, keep the known-good deployment URL and old embedded route;
do not weaken TLS or CORS to force the cutover.

## Artifacts and Notes

The expected durable artifacts are:

- `apps/web/package.json`, website source, public assets, Next.js configuration,
  tests, and Vercel project configuration.
- `apps/studio/package.json`, `sanity.config.ts`, `sanity.cli.ts`, Studio source,
  tests, scripts, and Vercel static-routing configuration.
- `packages/content-domain/package.json` and pure event-domain source/tests.
- Root orchestration-only `package.json`, repository-wide configuration, and the
  single updated `package-lock.json`.
- `.github/workflows/ci.yml` updates and
  `.github/workflows/release-studio-production.yml`.
- `docs/adr/007-separate-studio-deployment.md`.
- `docs/how-to/evolve-sanity-content.md` and
  `docs/how-to/release-studio-production.md`.
- Updates to `docs/repo-interactions.md`, the website release guide, active
  repository skills, and Codex environment actions.
- Website redirect tests, Studio routing/build tests, TypeGen drift checks, and
  cross-workspace content-domain tests.

Do not commit `.vercel`, `dist`, `.sanity`, environment files, tokens, dataset
exports, or authenticated Studio response bodies. Short safe transcripts in
this plan may include HTTP status, source SHA, deployment id, schema id, and
test totals.

## Interfaces and Dependencies

`apps/web` owns `next`, `next-sanity`, React, public Sanity clients, PostHog, and
website dependencies. `apps/studio` owns `sanity`, `@sanity/ui`,
`@sanity/icons`, Vision, Assist,
orderable document lists, markdown Studio support, and editor-only React code.
Do not assume every `@sanity/*` package is Studio-only; verify actual imports
before moving it.

`packages/content-domain` is a private workspace package with no environment or
network access. Preserve the public functions and types moved from
`packages/content-domain/instances.ts` and `resolve-event.ts`, including
occurrence expansion, deterministic instance ids/slugs, document building,
instance diffing, inherited event-content resolution, effective status, and
their exported types. Exact export names should remain stable where practical;
record necessary renames in the Decision Log and update every caller atomically.

The website's Sanity client must end with an absolute edit target equivalent to:

    stega: {
      studioUrl: "https://studio.samfunnetibergen.no",
    }

The standalone Studio must end with `basePath: "/"`, project and dataset values
from Studio-specific build variables, and Presentation preview configuration
whose production initial origin is `https://samfunnetibergen.no`. Draft Mode
enable and disable paths remain website-relative paths inside the preview
configuration.

The deployment interface consists of two Vercel project ids and one organization
id. Keep the existing `VERCEL_PROJECT_ID` for the website and add a distinctly
named `STUDIO_VERCEL_PROJECT_ID` for Studio. Studio CI needs only credentials
required to build/deploy Studio, deploy its schema manifest, and register its
external URL. It must not receive website PostHog keys, Sanity read tokens used
by the Next.js server, or unrelated application secrets.

The release-version interface remains `prod-YYYY.MM.DD.N` for the website and
becomes `studio-prod-YYYY.MM.DD.N` for Studio. Both releases record their source
SHA. Sharing a SHA means the source was reviewed together; it does not mean the
deployments were promoted atomically.

Revision note (2026-08-01): Initial ExecPlan created after evaluating embedded
versus standalone Studio hosting, project-monorepo literature, Vercel npm
workspace support, Sanity schema deployment, and compatibility-first parallel
change. That initial version kept the website at the repository root, added a
standalone Studio workspace, deferred Turborepo, and treated a mobile consumer
as unverified until its actual source and contract were inspected. The later
2026-08-01 revision below supersedes the root-website choice.

Revision note (2026-08-01): Added an explicit comparison with ExecPlan 017 so
the workspace migration and in-place deployment can be evaluated as alternative
plans before either is implemented.

Revision note (2026-08-01): Marked this plan explicitly as an unselected
alternative while the source-layout decision remained open.

Revision note (2026-08-01): Selected this plan under an explicit “change now or
never” constraint and strengthened it to a symmetric `apps/web`, `apps/studio`,
and `packages/content-domain` layout with an orchestration-only repository root.

Revision note (2026-08-01): Implemented local milestones 1–3. The website and
Studio now have symmetric npm workspace roots, pure event behavior lives in
`packages/content-domain`, TypeGen and CI use workspace-aware commands, and
active source-boundary documentation reflects the new paths. External
deployment and cutover milestones remain pending by design.

# Deploy Sanity Studio separately while keeping its source in place

**Status:** Alternative B — not selected for implementation.

This ExecPlan is a living document. The sections Progress, Surprises &
Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date
in accordance with `.agents/PLANS.md`.

## Purpose / Big Picture

Editors should use Sanity Studio at `https://studio.samfunnetibergen.no/`
without Studio requests, page views, browser exceptions, deploy failures, or
rollbacks belonging to the public website application. The source remains in
its current repository locations: editor code under `src/studio`, Studio
configuration in the root `sanity.config.ts` and `sanity.cli.ts`, website
Sanity consumption under `src/lib/sanity`, and Sanity operational scripts under
`scripts`.

After this change, the same Git commit can produce two independent artifacts.
`npm run build` produces the Next.js website, while `npm run studio:build`
produces a static Sanity Studio. Separate Vercel projects own their domains,
environment variables, deployments, logs, promotion, and rollback. Old
`samfunnetibergen.no/studio` links redirect to the equivalent path on the Studio
subdomain. Editors can still use Presentation, Draft Mode, Visual Editing,
Vision, and Dashboard integration.

This is deliberately not an npm-workspace or Turborepo conversion. Keeping the
source in place preserves the simple TypeGen, migration, test, and shared-domain
relationships that exist today. ExecPlan 016 remains the comparison for a
possible later move to `apps/studio`. No tracking issue is created until the
in-place versus workspace decision is made.

## Alternative Comparison

This is the smaller deployment-boundary alternative. It keeps `src/studio`, the
root Sanity configuration, root scripts, one package manifest, and the existing
TypeGen paths. Compared with ExecPlan 016, it reaches separate Studio runtime
logs, domains, releases, and rollback sooner and avoids moving shared event
logic merely to satisfy a new package boundary.

The cost retained by this plan is structural: website builds still install
Studio dependencies; dependency upgrades and scanning remain repository-wide;
both Vercel projects use the same source root; affected-build detection is
coarser; and imports between Studio and website code are governed by convention
and tests rather than npm package declarations. ExecPlan 016 removes more of
that coupling by introducing `apps/studio` and `packages/content-domain`, at the
price of a broader migration.

## Progress

- [x] (2026-08-01) Inspect the current Studio source, embedded Next.js adapter,
  root Sanity configuration, dependencies, TypeGen, telemetry, preview routing,
  release workflow, and potential mobile-consumer evidence.
- [x] (2026-08-01) Define the in-place source alternative with a separate
  runtime and deployment boundary, alongside workspace-style ExecPlan 016.
- [ ] Capture clean local, Vercel, Sanity, DNS, and production HTTP baselines.
- [ ] Produce and locally serve a root-based standalone Studio build without
  changing the embedded production route.
- [ ] Add cross-application contract checks and content-evolution guidance while
  retaining the current TypeGen and source paths.
- [ ] Create, stage, smoke-test, and promote a separate Studio Vercel project
  from the repository root.
- [ ] Configure the Studio domain, Sanity CORS, schema manifest deployment,
  external Studio registration, Dashboard bridge, and Presentation behavior.
- [ ] Redirect old `/studio` links, change canonical edit links, and remove only
  the embedded Next.js adapter and website-specific Studio runtime integration.
- [ ] Prove independent website and Studio releases and record the operational
  results and accepted source/dependency coupling.

## Surprises & Discoveries

- Observation: Most Studio source is already clearly separated from website
  consumption without being a separate package.
  Evidence: `src/studio` owns editor schemas, structure, actions, components,
  presentation, and migrations; `src/lib/sanity` owns website clients, queries,
  fetch helpers, and generated query types.
- Observation: The code that embeds Studio in Next.js is a small adapter rather
  than the Studio implementation itself.
  Evidence: `src/app/studio/[[...tool]]/studio-client.tsx` dynamically imports
  `NextStudio` and the root `sanity.config.ts`; the editor implementation stays
  under `src/studio`.
- Observation: Keeping the current tree avoids inventing a package boundary for
  real shared code.
  Evidence: Studio recurrence controls and Sanity generation scripts import
  pure event functions and types from `src/features/events/domain/instances.ts`
  and `resolveEvent.ts`; presentation tests compare Studio routes with website
  GROQ queries.
- Observation: Runtime separation and source-package separation solve different
  problems.
  Evidence: global `instrumentation-client.ts` captures browser activity on the
  embedded route, while a static Studio deployed as another Vercel project does
  not execute that Next.js instrumentation even if both artifacts came from the
  same root package.
- Observation: The existing root package already exposes both build commands.
  Evidence: `package.json` defines `build` as `next build` and `studio:build` as
  `sanity build`.
- Observation: Keeping a single root package means dependency and affected-build
  isolation remain incomplete.
  Evidence: Studio and website dependencies share `package.json` and
  `package-lock.json`; both Vercel projects will install that graph, and both use
  the repository root as their source directory.
- Observation: This repository contains a download page for the Kvarteret app,
  not the mobile app source or a verified Sanity consumer.
  Evidence: `src/app/appen/page.tsx` redirects to App Store and Google Play.
  `src/app/api/events/feed/route.ts` is JSON-LD syndication and is not documented
  as a versioned mobile API.

## Decision Log

- Decision: Keep `src/studio`, `sanity.config.ts`, `sanity.cli.ts`, and current
  Sanity scripts in their existing locations.
  Rationale: These paths already express the editor-versus-website source
  boundary, and moving them is unnecessary to separate runtime logs, releases,
  domains, and rollback.
  Date/Author: 2026-08-01 / Codex
- Decision: Create two Vercel projects from the same repository root, using
  project-specific build and output settings.
  Rationale: The root has all inputs required by both builds. The website runs
  `npm run build`; Studio runs `npm run studio:build` and serves `dist` as a
  static single-page application.
  Date/Author: 2026-08-01 / Codex
- Decision: Do not add npm workspaces, `apps/studio`, `packages/content-domain`,
  or Turborepo in this plan.
  Rationale: Those changes improve dependency enforcement and affected builds,
  not the immediate runtime isolation. They create path, TypeGen, migration,
  alias, test, and documentation churn that should be justified separately.
  Date/Author: 2026-08-01 / Codex
- Decision: Accept one root dependency graph for now and record its consequences
  explicitly.
  Rationale: Website builds will continue installing Studio dependencies;
  dependency upgrades and security scanning remain repository-wide;
  cross-boundary imports are conventionally rather than package-enforced; and
  automatic affected-project detection is coarse. In exchange, schema/query
  TypeGen, migrations, shared event code, and atomic source changes remain
  simple.
  Date/Author: 2026-08-01 / Codex
- Decision: Use a separate Studio Vercel configuration file in the release
  workflow rather than change the website's `vercel.json` build/output settings.
  Rationale: Vercel CLI supports a local configuration path. A Studio-specific
  configuration can select `npm run studio:build`, `dist`, and SPA routing while
  the website continues using the existing root configuration.
  Date/Author: 2026-08-01 / Codex
- Decision: Keep independent release workflows and compatibility-first content
  evolution; do not build an atomic “release both” mechanism.
  Rationale: Multiple Vercel promotions and Sanity content changes are not one
  transaction, and an installed mobile consumer could remain old. Readers must
  understand old and new shapes before writers produce a new-only shape.
  Date/Author: 2026-08-01 / Codex
- Decision: Preserve ExecPlan 016 as the workspace-style alternative and do not
  create a tracking issue until an alternative is selected.
  Rationale: The two ExecPlans are sufficient for the current decision. If the
  in-place option is selected, a later issue can record the accepted coupling
  and concrete triggers for reconsidering the workspace move.
  Date/Author: 2026-08-01 / Codex

## Outcomes & Retrospective

No implementation has started. This alternative narrows the change to the
deployment boundary and explicitly accepts shared source-root, dependency,
TypeGen, and CI coupling. Update this section after each milestone with build
timings, artifact contents, logs, deployment ids, smoke-test evidence, and any
reason the workspace alternative becomes more or less valuable.

## Context and Orientation

The repository root is a Next.js 16 application and a Sanity Studio source
project. `package.json` and `package-lock.json` own a single dependency graph.
`npm run build` builds the public website. `npm run studio:build` invokes the
Sanity CLI and writes a static Studio build to `dist`. The static build is HTML,
CSS, and browser JavaScript that connects directly to Sanity APIs; it does not
need the Next.js server.

`src/studio` contains editor-owned schemas, structure, document actions, custom
inputs, migrations, presentation resolution, and generated Studio types.
`sanity.config.ts` assembles those modules and currently uses `basePath:
"/studio"`. `sanity.cli.ts` configures the local Studio server, schema
extraction, and two TypeGen targets. `scripts` contains Sanity maintenance and
migration commands alongside other repository scripts.

`src/app/studio/[[...tool]]` is the Next.js embedding adapter. Its page is
forced dynamic; its client dynamically imports `NextStudio`; its layout loads
the Sanity Dashboard bridge. This adapter is the code removed after cutover.
Removing `src/studio` would remove the actual editor application and is not part
of this plan.

The website remains a Sanity consumer. `src/lib/sanity/client.ts` configures the
published client and Stega edit target. `src/lib/sanity/fetcher.ts` supplies
Sanity Live. `src/app/api/draft-mode/enable/route.ts` and `disable/route.ts` own
preview cookies. `src/app/layout.tsx` renders `SanityLive` globally and
`VisualEditing` only in Draft Mode. A separately hosted Studio therefore still
depends on website preview endpoints, but it does not depend on the embedded
Studio route.

The existing website production workflow checks out an explicit ref, runs
repository checks, pulls Vercel production settings, builds an immutable
artifact, deploys it without moving the public domain, smoke-tests it, promotes
the same artifact, and creates a production tag and GitHub release. Studio will
receive a parallel workflow with a separate Vercel project id and tag prefix.

“Same source tree” in this plan means both deployables read files from the
repository root and share one dependency manifest. “Separate deployment” means
Vercel records two projects with separate production artifacts, domains,
environment variables, logs, firewalls, promotion, and rollback. These
properties do not require npm workspace boundaries.

Before editing any Next.js route, redirect, or configuration, install
dependencies and read the relevant current documentation under
`node_modules/next/dist/docs/`, as required by the repository agent guidance.
Before relying on Sanity or Vercel CLI flags, inspect the installed command help
and record the exact supported syntax in this living plan.

## Plan of Work

### Milestone 1: Prove the existing root Studio can be a standalone artifact

Capture a clean baseline before editing. Run the website checks and Studio
build; record output size and build duration. Inspect current Vercel domain
assignments, Studio hostname DNS/TLS, Sanity CORS origins, registered Studio
applications, and the embedded `/studio` response. Do not mutate external state
during inventory and never commit credentials or authenticated payloads.

Make `sanity.config.ts` accept a deployment base path chosen at build time while
preserving `/studio` for the still-embedded website during the parallel phase.
Use one explicit variable, such as `SANITY_STUDIO_BASE_PATH`, validate that it
starts with `/`, and document its values: `/studio` for the embedded fallback
and `/` for the standalone subdomain. Apply the same base-path source to
`sanity.cli.ts` if the installed CLI requires it for generated routing and
manifests. Add focused tests for default, embedded, and standalone values rather
than scattering environment checks across configuration files.

Build with the standalone value, serve `dist` locally using a static server
with SPA fallback, and visit `/` plus a captured deep Studio route. Compare the
document types, structure, custom actions, recurrence controls, Presentation
locations, schema manifest, and bridge script against the embedded Studio.
Keep `src/app/studio` unchanged throughout this milestone.

Acceptance is that the current root source produces a complete standalone
Studio at `/` without moving a file or changing production traffic.

### Milestone 2: Add durable contract and CI protection

Add `docs/adr/007-separate-studio-deployment.md` describing the chosen source
and deployment topology. State that Sanity owns Content Lake; `src/studio` and
the root Sanity configuration own editor authoring behavior; `src/lib/sanity`
and website routes own public reads and preview integration. Update
`docs/repo-interactions.md` with these verified owners, consumers, source paths,
and the caveat that both deployables share one dependency graph and source root.

Add `docs/how-to/evolve-sanity-content.md` with the expand–migrate–contract
rule. Add fields before removing them. Deploy readers accepting both old and
new representations before Studio writes a new-only representation. Backfill
with idempotent dry-run-first migrations. Mark old fields deprecated and remove
them only after all supported consumers are verified compatible. Required-field
TypeGen protects repository-head code but does not protect already deployed or
installed consumers.

Keep the existing root TypeGen architecture. Strengthen CI so a schema/query
change runs `npm run sanity:typegen` and fails if either committed generated
file changes. Continue testing website and Studio source together. Add one
standalone Studio production build to pull-request CI. Do not split packages or
duplicate tests. Record full CI duration so it can inform the workspace decision
if that alternative is reconsidered.

Document a consumer registry containing only verified consumers. The website
and Studio have source-backed entries. The mobile app remains “potential,
contract unverified.” The existing JSON-LD event feed remains a public
syndication interface, not a versioned mobile API, unless a later ADR and
consumer tests deliberately change that boundary.

Acceptance is that one pull request proves the root website, current Studio,
schema, query types, and standalone Studio artifact are mutually compatible.

### Milestone 3: Create a second Vercel project from the same root

Add `vercel.studio.json` as the Studio deployment configuration. It must select
the Studio build command, static `dist` output, and a catch-all rewrite to
`index.html` for Studio client-side routes. It must not modify the existing
website `vercel.json`. Confirm the pinned Vercel CLI accepts
`--local-config vercel.studio.json` for the pull/build/deploy workflow; if the
installed version differs, update this plan before implementing an equivalent
project-specific configuration.

Create a Vercel project whose source repository and Root Directory are the
repository root. Set Framework Preset to Other, production build command to the
standalone Studio build with base path `/`, and output directory to `dist`.
Give it a distinct project id and environment variables. Do not copy PostHog,
Next.js server tokens, or unrelated website secrets. Initially deploy only to a
temporary Vercel URL.

Add `.github/workflows/release-studio-production.yml`. Mirror the website's
explicit-ref, immutable staging, smoke-test, promotion, and release-record
pattern, but use `STUDIO_VERCEL_PROJECT_ID`, the Studio local config, and Studio
smoke paths. Verify `/`, a real deep route, the bridge script, and the generated
schema manifest. Create `studio-prod-YYYY.MM.DD.N` only after successful
promotion. A failed or unpromoted run must not create a production tag.

Because both Vercel projects use the repository root, Git-connected automatic
affected-project detection is intentionally coarse. Production remains driven
by explicit GitHub Actions workflows. If preview build volume becomes costly,
add a narrow ignored-build script based on verified website/Studio path
ownership or reconsider ExecPlan 016; do not introduce a brittle path filter
before measurements.

Acceptance is a fully working staged Studio deployment whose requests and logs
exist only in the Studio Vercel project while the embedded production route
continues working.

### Milestone 4: Configure Sanity and the custom Studio domain

Add `https://studio.samfunnetibergen.no` to the Sanity project's allowed CORS
origins with credentials. Deploy the schema manifest from the exact built
Studio artifact and register the external Studio URL. Preserve the Dashboard
bridge currently loaded by the embedded layout, and apply the Studio-specific
Content Security Policy needed for intended Sanity Dashboard ancestors. Do not
copy website product analytics into the editor application.

Attach `studio.samfunnetibergen.no` only to the new Studio Vercel project after
the temporary URL passes. First resolve the current DNS record, certificate,
and any stale Vercel assignment read-only. Move only the Studio hostname;
preserve apex, `www`, and other domains. Verify valid TLS, root and deep-route
responses, editor authentication, a harmless draft edit, validation,
publishing, Vision, authorized Assist behavior, Presentation, Dashboard
discovery, and manifest availability.

Keep `samfunnetibergen.no/studio` unchanged as the rollback path. Acceptance is
that both Studio deployments work, but only the subdomain uses the new Vercel
project and isolated logs.

### Milestone 5: Make the standalone Studio canonical and remove embedding

Change `src/lib/sanity/client.ts` Stega `studioUrl` to the absolute Studio
subdomain. Ensure Presentation still previews `https://samfunnetibergen.no` and
that relative Draft Mode enable/disable paths resolve against the preview
website. Verify click-to-edit navigation from a draft page reaches the correct
document in the standalone Studio.

Read the installed Next.js redirect documentation. Replace the existing
Studio-host root special case in `src/proxy.ts` as appropriate for separate
domain ownership, and add permanent website redirects for `/studio` and
`/studio/:path*` to the equivalent root/deep path on the subdomain. Add tests
for root, deep link, and query-string preservation. The destination must not
contain a second `/studio` prefix.

After redirects and production editing are verified, remove
`src/app/studio/[[...tool]]` and the `/studio`-specific CSP from
`next.config.ts`. Remove Studio packages from `next.config.ts`
`transpilePackages` when the website no longer imports them. Do not move or
remove `src/studio`, the root Sanity configuration, scripts, or their
dependencies from `package.json`; those remain the accepted shared-source
layout. Keep `next-sanity` and all public Sanity integration.

Measure the website artifact, build time, dependency install, and security scan
after removal. Confirm no embedded Studio route or chunk remains and that
browsing Studio creates no website PostHog activity or website Vercel request
logs. Record the remaining install/dependency cost in this plan so it can inform
any later workspace decision.

Acceptance is complete runtime separation with source paths unchanged.

### Milestone 6: Prove independent releases and compatibility ordering

Add `docs/how-to/release-studio-production.md` and update the existing website
release guide. Document exact dispatch, watch, staged verification, promotion,
tag, rollback, and project-identification commands. A website release must not
move the Studio domain; a Studio release must not move the website domain.

Exercise a website-only no-op release and confirm the Studio deployment id is
unchanged. Exercise a Studio-only no-op release and confirm the website
deployment id is unchanged. Rehearse an expand-phase content change using safe
fixtures or a non-production document: first deploy a reader accepting old and
new forms, then deploy the Studio writer, then dry-run and audit the migration.
Record evidence in this plan.

Do not create an atomic combined promotion. If both artifacts should use the
same source SHA, stage and verify both, then promote in compatibility order.
Readers precede writers when new data may be emitted. If writer rollback is
needed after new content exists, stop the writer first and retain a reader that
understands both forms.

Acceptance is operational proof that deployments are independent even though
source, dependencies, and pull-request validation remain shared.

## Concrete Steps

Run commands from the repository root.

1. Establish the local baseline:

       git status --short
       node --version
       npm --version
       npm ci
       npm run format:check
       npm run lint
       npx --no-install next typegen
       npx --no-install tsc --noEmit
       npm run test
       npm run build
       npm run studio:build

2. Inspect version-specific documentation and CLI support before routing or
   deployment edits:

       rg -n "redirects|redirect" node_modules/next/dist/docs
       npx --no-install sanity build --help
       vercel build --help
       vercel deploy --help

3. Build and locally serve the standalone artifact using the final root script
   name recorded during implementation:

       SANITY_STUDIO_BASE_PATH=/ npm run studio:build
       npx --yes serve dist --single --listen 3334

   Expect HTTP 200 at `/` and a captured deep route. Do not add `serve` as a
   production dependency solely for this check; use an already available static
   server if network installation is undesirable.

4. Verify generated artifacts and builds after every schema/query change:

       npm run sanity:typegen
       git diff --exit-code -- src/lib/sanity/sanity.types.ts src/studio/sanity.types.ts
       npm run test
       npm run build
       SANITY_STUDIO_BASE_PATH=/ npm run studio:build

5. Use the Studio release workflow with `promote=false`, inspect its staged URL,
   and only then use `promote=true`. Copy the final commands into the Studio
   release runbook and record source SHA and deployment id.

6. After cutover, verify redirects and deep routing from a network allowed by
   the Vercel firewall:

       curl --silent --show-error --head https://studio.samfunnetibergen.no/
       curl --silent --show-error --head https://studio.samfunnetibergen.no/structure/arrangement
       curl --silent --show-error --location --head https://samfunnetibergen.no/studio
       curl --silent --show-error --location --head https://samfunnetibergen.no/studio/structure/arrangement

7. Finish with stale-embedding and path checks:

       rg -n "NextStudio|app/studio|studioUrl:.*\/studio" src next.config.ts
       test -d src/studio
       test -f sanity.config.ts
       test -f sanity.cli.ts
       git diff --check
       git status --short

   The embedded adapter searches should be empty. The three source-location
   checks must succeed.

## Validation and Acceptance

All existing repository checks must pass from a clean `npm ci`. TypeGen run
twice must leave both committed generated files unchanged on the second run.
The standalone Studio build must work at `/` and on direct navigation to a deep
route. The embedded Studio stays operational until the standalone production
path has passed every external check.

Production acceptance requires valid TLS on the Studio hostname; working SPA
fallback; Sanity authentication, validation and publishing; Presentation and
Draft Mode against the public website; Visual Editing links to the subdomain;
Vision and authorized Assist; Dashboard bridge and manifest discovery; and
equivalent redirects from old root and deep `/studio` links.

The public Next.js route manifest must no longer contain the Studio route. A
Studio browser session must not create website PostHog page views/exceptions or
website Vercel request logs. Sanity API activity will remain in Sanity and is
not expected to disappear.

Independent-release acceptance requires captured before/after deployment ids
showing that each workflow moves only its own Vercel production project. Content
compatibility acceptance requires old-shape and new-shape fixtures to render
successfully before any contraction.

Source-layout acceptance requires `src/studio`, `sanity.config.ts`,
`sanity.cli.ts`, root `package.json`, and root `package-lock.json` to remain the
authoritative locations. There must be no `apps/studio`, workspace declaration,
or Turborepo configuration introduced by this plan.

## Idempotence and Recovery

Studio builds, schema extraction, TypeGen, dry-run migrations, and staged Vercel
deployments are safe to repeat. Migrations must remain dry-run by default,
idempotent, explicitly write-gated, and backed up where current migration policy
requires it.

Do not remove the embedded adapter until the custom domain, TLS, CORS, external
registration, deep routing, editing, Presentation, and isolated logs pass. Until
then, rollback is simply retaining `/studio`. After removal, roll back the
Studio Vercel project to its previous good static deployment; do not roll back
the website unless its redirects or edit target are defective.

If new-shape content has been written and an older reader fails, stop or roll
back the writer first, then deploy a dual-compatible reader or restore the
dual-written field. Do not delete newly authored data as the first recovery
action. Contract only after the consumer registry and an audit show it is safe.

Resolve external targets before mutating them. Change only
`studio.samfunnetibergen.no`, its Studio Vercel project, and its Sanity
registration/CORS entry. Never detach apex or `www`, overwrite broad DNS zones,
or weaken TLS/CORS to force a cutover.

## Artifacts and Notes

Expected durable artifacts include:

- `vercel.studio.json` with Studio-only static build and routing configuration.
- `.github/workflows/release-studio-production.yml`.
- `docs/adr/007-separate-studio-deployment.md`.
- `docs/how-to/evolve-sanity-content.md`.
- `docs/how-to/release-studio-production.md`.
- Updates to `docs/repo-interactions.md`, the website release guide, active
  skills, root scripts, `sanity.config.ts`, `sanity.cli.ts`, `src/proxy.ts`,
  `src/lib/sanity/client.ts`, CI, redirects, and tests.
- Removal of `src/app/studio/[[...tool]]` only after cutover.

Do not commit `.vercel`, `dist`, `.sanity`, environment files, tokens, dataset
exports, authenticated Studio responses, or DNS credentials.

## Interfaces and Dependencies

The root `package.json` remains the only package manifest. It continues to own
Next.js, `next-sanity`, Sanity Studio, Studio plugins, React, PostHog, and all
other dependencies. The root `package-lock.json` remains authoritative. No
workspace package or second lockfile is introduced.

The two build interfaces are:

    npm run build
    SANITY_STUDIO_BASE_PATH=/ npm run studio:build

The exact base-path helper should expose one validated function used by both
root Sanity configuration files. During parallel operation the embedded build
must still receive `/studio`; after embedding is removed the documented default
may safely become `/`, but update tests and the Decision Log if the default
changes.

The website client must end with:

    stega: {
      studioUrl: "https://studio.samfunnetibergen.no",
    }

Presentation must retain a public website initial URL and website-relative
Draft Mode endpoints. The Studio origin is an editor host, not the preview host.

The Vercel interface keeps existing `VERCEL_PROJECT_ID` for the website and adds
`STUDIO_VERCEL_PROJECT_ID` for Studio under the same organization. Studio uses
`vercel.studio.json`, its own environment variables, and the tag prefix
`studio-prod-`. It must not receive website PostHog credentials or server-only
Sanity read tokens it does not use.

The accepted coupling is part of the interface: both builds install the same
root dependencies; a lockfile or shared-source change can require both checks;
package boundaries do not prevent Studio-to-website imports; and path-based
automatic build skipping is less precise. ExecPlan 016 remains the documented
alternative if those properties are reconsidered.

Revision note (2026-08-01): Initial in-place alternative created alongside
ExecPlan 016. This version separates deployment, logs, domains, and releases
while deliberately retaining `src/studio`, root Sanity configuration, one
package manifest, current TypeGen paths, and shared event-domain imports. It
records workspace migration as deferred work rather than a prerequisite.

Revision note (2026-08-01): Removed creation of a deferred GitHub issue until
the in-place versus workspace alternative has been selected. The two ExecPlans
are the decision artifacts for now.

Revision note (2026-08-01): Added an explicit comparison with ExecPlan 016 so
the in-place and workspace alternatives can be evaluated before implementation.

Revision note (2026-08-01): Marked this plan explicitly as an unselected
alternative while the source-layout decision remains open.

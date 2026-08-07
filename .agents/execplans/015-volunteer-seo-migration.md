# Migrate volunteer recruitment to a canonical search-friendly route

This ExecPlan is a living document. The sections Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date as work proceeds.

This plan is maintained in accordance with `.agents/PLANS.md` from the repository root.

## Purpose / Big Picture

People looking to volunteer in Bergen should land directly on one clearly named recruitment page at `/nb/bli-frivillig`. The former listing URL `/nb/grupper` and code-owned volunteer domains and legacy paths should permanently redirect there without chains, while individual group profiles remain stable under `/nb/grupper/{slug}`. Search engines should see the new URL as the only listing canonical, find it in the sitemap, understand the site, organization, and venue as distinct entities, and see the current organization name prominently in homepage metadata.

## Progress

- [x] (2026-08-07 19:23Z) Read `AGENTS.md`, `.agents/README.md`, `.agents/PLANS.md`, the SEO and verification skills, the publishing workflow, and current Next.js metadata, sitemap, redirect, and Proxy guidance.
- [x] (2026-08-07 19:31Z) Confirm the clean detached worktree started at `origin/develop` and create `codex/volunteer-seo-migration`.
- [x] (2026-08-07 19:34Z) Map code-owned listing links, redirects, Sanity link resolution, Studio Presentation routes, migrations, reserved slugs, sitemap contracts, metadata, and structured data.
- [x] (2026-08-07 19:36Z) Investigate Kvarteret apex ownership and decide not to add repository host handling that the deployment cannot be shown to receive.
- [x] (2026-08-07 19:35Z) Implement the route move, direct redirects, link contracts, metadata/content positioning, sitemap update, and entity alternate names.
- [x] (2026-08-07 19:36Z) Add and update focused regression tests and regenerate route and Sanity types without writing content.
- [x] (2026-08-07 19:38Z) Run focused and full tests, formatting, lint, type checks, both production builds, and built-app runtime smoke checks.
- [x] (2026-08-07 19:42Z) Inspect the complete tracked and untracked diff, confirm all residual `/grupper` links are intentional group-detail routes or migration inputs, and confirm every changed file belongs to the requested scope.
- [ ] Commit intentionally, push the branch, and open a draft pull request with deployment and Search Console follow-up.

## Surprises & Discoveries

- Observation: The checkout was detached but exactly matched `origin/HEAD`, whose default branch is `develop`.
  Evidence: both `git rev-parse HEAD` and `git rev-parse origin/HEAD` returned `4de5c94492393ed862b385d32f79b95d6edd5ecb` before branch creation.
- Observation: Kvarteret apex redirect ownership is not represented in this repository, while the production release deliberately avoids changing domain assignments.
  Evidence: `apps/web/src/proxy.ts` handles only `event.kvarteret.no`; `.github/workflows/release-production.yml` deploys with `vercel deploy --prebuilt --prod --skip-domain`; source search found no `kvarteret.no` apex handling. Read-only HTTP inspection was challenged at the Vercel edge and therefore did not provide new application-level evidence.
- Observation: The existing groups singleton is already the content owner for the listing and is referenced by Sanity links, so changing its document type would create needless content migration risk.
  Evidence: `apps/studio/src/studio/schemaTypes/documents/singletons/groupsPage.ts`, `apps/web/src/lib/sanity/queries/pages.ts`, and `apps/web/src/lib/sanity/fetch/groups.ts` form the authoring/query/fetch boundary.
- Observation: Literal inference made the first shared redirect fixture incompatible with Next.js because `as const` made the nested `has` array readonly.
  Evidence: the first full type check reported `readonly [...] cannot be assigned to the mutable type RouteHas[]`; changing the array to `satisfies NextRedirect[]` made the installed Next.js 16.2.12 type contract pass without widening away validation.

## Decision Log

- Decision: Keep the `groupsPage` Sanity singleton and `features/grupper` implementation names, but move the user-facing listing route to `apps/web/src/app/[locale]/bli-frivillig/page.tsx`.
  Rationale: The route expresses recruitment intent while the singleton and feature still accurately own group-list content. This avoids any production Sanity mutation and preserves individual group profiles.
  Date/Author: 2026-08-07 / Codex
- Decision: Make the route identity code-owned: title metadata, canonical, H1, and a short Bergen-focused introductory lead are fixed in code; Sanity continues to own the optional eyebrow, supporting title and description, and FAQ.
  Rationale: A route migration must not depend on a coordinated production content edit, while editors should retain ownership of supporting recruitment content.
  Date/Author: 2026-08-07 / Codex
- Decision: Do not add Kvarteret apex handling to `apps/web/src/proxy.ts`.
  Rationale: Source proves that this repository deploys without changing domains and only receives an explicitly configured subdomain. Adding apex branches without evidence that apex requests reach this app would be dead code and could make the migration claim misleading.
  Date/Author: 2026-08-07 / Codex
- Decision: Keep all group detail paths under `/grupper/{slug}`.
  Rationale: These are entity detail URLs, not the listing URL, and changing them would expand migration risk without a search or user benefit established by source.
  Date/Author: 2026-08-07 / Codex

## Outcomes & Retrospective

The application work is complete and verified. `/nb/bli-frivillig` is the sole listing canonical, carries a route-owned recruitment H1 and Bergen-focused lead, and continues to render the groups singleton's supporting title, description, and FAQ. Retired paths and the volunteer domain now point directly to the canonical, while all 28 current group detail URLs remain under `/nb/grupper/{slug}`. The sitemap, Sanity link projection and generated types, Studio Presentation mapping, reserved slugs, migrations, homepage title, and JSON-LD identities agree with that route contract.

No external state was changed. The remaining work at this point is publishing the draft pull request. After deployment, the owner of the external Kvarteret apex redirect must normalize the two malformed legacy destinations described in this plan, and the site owner must perform the documented Search Console migration checks.

## Context and Orientation

The Next.js website lives under `apps/web`. Locale-prefixed public routes live under `apps/web/src/app/[locale]`; the only configured locale is `nb`, Norwegian Bokmål. The current group listing page is `apps/web/src/app/[locale]/grupper/page.tsx`, while group profiles are a separate dynamic route at `apps/web/src/app/[locale]/grupper/[slug]/page.tsx`. The content for the listing comes from the Sanity singleton document type `groupsPage`; Sanity is the content management system, and no production document writes are part of this plan.

`apps/web/next.config.ts` owns simple permanent redirects, including host-aware rules. `apps/web/src/proxy.ts` runs request-aware routing before the application, but source only establishes a special case for `event.kvarteret.no`. `apps/web/src/lib/sanity/fragments/links.ts` converts Sanity references to public paths. `apps/studio/src/studio/presentation/resolve.ts` maps public routes back to Sanity documents for visual editing. `apps/web/src/app/sitemap.ts` and `sitemapEntries.ts` generate the localized sitemap. `apps/web/src/lib/page-metadata.ts` applies the root title template, and `apps/web/src/lib/structured-data.ts` creates the Organization, Place, and WebSite JSON-LD graph.

A canonical URL is the preferred public URL search engines should index. A permanent redirect is an HTTP 308 response in this Next.js version. JSON-LD is machine-readable structured data embedded in the page. The organization is Samfunnet i Bergen, historically also called Studentersamfunnet i Bergen; the venue is Det Akademiske Kvarter, commonly called Kvarteret. They must remain separate graph nodes.

## Plan of Work

Move the listing implementation from `apps/web/src/app/[locale]/grupper/page.tsx` to `apps/web/src/app/[locale]/bli-frivillig/page.tsx`. Replace the retired listing page with a permanent locale-preserving redirect. At the new route, use a code-owned title and description for metadata, set `/nb/bli-frivillig` as canonical, render `Bli frivillig` as the H1, and add a concise introduction describing volunteer opportunities in Bergen. Continue rendering the CMS eyebrow, supporting title and description, and FAQ so editorial ownership remains useful.

Update all list-route consumers while preserving detail-route consumers. This includes the navbar, homepage banner and its visible label, `groupsPage` and retired-document Sanity link resolution, Studio main-document and location routes, reserved generic page slugs, page-slug GROQ exclusions, retired volunteer-link migration output, fixed and dynamic sitemap exclusions, and direct redirects for `blifrivillig.no`, `/blifrivillig`, `/bli-aktiv`, `/komiteer`, and localized `/grupper`. Leave `/grupper/:group` and group-card/detail structured-data links unchanged.

Set a homepage route title that begins with `Samfunnet i Bergen` but does not include a second brand suffix; the root metadata template will append the site name once. Add `Studentersamfunnet i Bergen` only as the Organization alternate name and `Kvarteret` only as the Place alternate name. Keep the WebSite name as Samfunnet i Bergen without conflating it with the venue.

Add focused assertions for sitemap membership/exclusion, structured-data identity, link projections, redirects, content policies, Studio route/location output, migration idempotence, and route-owned metadata/content where practical. Regenerate Next.js route types and Sanity query types after source changes.

Document in the draft pull request that the external Kvarteret redirect owner must map `kvarteret.no/no/` directly to `https://samfunnetibergen.no/nb` and `kvarteret.no/studentersamfunnet/` directly to `https://samfunnetibergen.no/nb`, with a broader `/no/:path*` to `/nb/:path*` normalization only after validating destination paths. Also document the post-deployment Search Console sequence without performing it.

## Concrete Steps

All commands run from `/Users/kluvin/.codex/worktrees/7074/samfunnetibergen`. Use the repository-pinned Node 24.16.0 runtime on `PATH`.

Edit the route, link, redirect, sitemap, Studio, metadata, structured-data, and test files described above with repository-safe patches. Then run:

    PATH=/Users/kluvin/.local/share/mise/installs/node/24.16.0/bin:$PATH npm run route-typegen
    PATH=/Users/kluvin/.local/share/mise/installs/node/24.16.0/bin:$PATH npm run sanity:typegen
    PATH=/Users/kluvin/.local/share/mise/installs/node/24.16.0/bin:$PATH npm run test:web -- --run <focused files>
    PATH=/Users/kluvin/.local/share/mise/installs/node/24.16.0/bin:$PATH npm run test:studio -- --run <focused files>

After narrow checks pass, run the repository verification ladder:

    PATH=/Users/kluvin/.local/share/mise/installs/node/24.16.0/bin:$PATH npm run format:check
    PATH=/Users/kluvin/.local/share/mise/installs/node/24.16.0/bin:$PATH npm run lint
    PATH=/Users/kluvin/.local/share/mise/installs/node/24.16.0/bin:$PATH npm run typecheck
    PATH=/Users/kluvin/.local/share/mise/installs/node/24.16.0/bin:$PATH npm run test
    PATH=/Users/kluvin/.local/share/mise/installs/node/24.16.0/bin:$PATH npm run build:web
    PATH=/Users/kluvin/.local/share/mise/installs/node/24.16.0/bin:$PATH npm run build:studio

Inspect `git status --short`, `git diff --check`, and the complete diff. Stage only the files in this plan, commit with a terse migration message, push `codex/volunteer-seo-migration`, and create a draft pull request against `develop`.

## Validation and Acceptance

The new listing route must render a 200 response at `/nb/bli-frivillig` with H1 `Bli frivillig`, a Bergen-focused introduction, and canonical `/nb/bli-frivillig`. `/nb/grupper` must return a permanent redirect to the new locale-preserving route. Group cards and `/nb/grupper/{slug}` must remain unchanged.

A request on `blifrivillig.no` must receive one permanent redirect whose destination is the absolute final canonical `https://www.samfunnetibergen.no/nb/bli-frivillig`. Code-owned `/blifrivillig`, `/bli-aktiv`, and `/komiteer` paths must likewise target the final canonical without an intermediate route.

The sitemap test must prove that `/bli-frivillig` is included, `/grupper` and `/blifrivillig` listing paths are excluded, and `/grupper/{slug}` remains generated. The structured-data test must prove that only the organization has alternate name Studentersamfunnet i Bergen and only the place has alternate name Kvarteret. The homepage metadata should resolve through the root template to a title beginning with the current organization name without a duplicated `| Samfunnet i Bergen | Samfunnet i Bergen` suffix.

All focused tests, workspace tests, type checks, lint, and both builds should exit zero. If a broad check exposes unrelated baseline noise, record the exact failure and verify the touched paths separately before deciding whether publishing is safe.

Observed acceptance on 2026-08-07: 23 focused web assertions and 13 focused Studio assertions passed; the full suites passed 171 web tests with 3 existing skips, 107 Studio tests, and 35 shared-domain tests. Formatting, lint, all three TypeScript checks, the web build, and the Studio build exited zero. The built app returned HTTP 308 from `/nb/grupper`, `/grupper`, and `/nb/blifrivillig` to `/nb/bli-frivillig`, and from a `Host: blifrivillig.no` request directly to `https://samfunnetibergen.no/nb/bli-frivillig`. The rendered page had title `Bli frivillig | Samfunnet i Bergen`, canonical `/nb/bli-frivillig`, H1 `Bli frivillig`, and the expected Bergen lead. The homepage title was the absolute `Samfunnet i Bergen – studentkultur på Kvarteret`. The sitemap contained one canonical listing entry, no retired `/nb/grupper` listing entry, and 28 group detail entries.

## Idempotence and Recovery

All source edits and type generation commands are repeatable. No production Sanity migration write command, Vercel domain command, Search Console action, or release workflow is run. If generated types drift unexpectedly, inspect the query source and regenerate rather than editing generated output by hand. Git changes remain recoverable on the feature branch and are never reset destructively.

## Artifacts and Notes

Initial route evidence:

    origin/HEAD -> develop
    detached HEAD = origin/HEAD = 4de5c94492393ed862b385d32f79b95d6edd5ecb
    branch = codex/volunteer-seo-migration

Initial external-ownership evidence:

    apps/web/src/proxy.ts: special host is event.kvarteret.no
    .github/workflows/release-production.yml: vercel deploy --prebuilt --prod --skip-domain
    repository source: no kvarteret.no apex assignment or redirect rule

Final runtime redirect evidence:

    308 /nb/grupper -> /nb/bli-frivillig
    308 /grupper -> /nb/bli-frivillig
    308 /nb/blifrivillig -> /nb/bli-frivillig
    308 Host: blifrivillig.no /anything -> https://samfunnetibergen.no/nb/bli-frivillig

Final sitemap evidence:

    /nb/bli-frivillig listing entries: 1
    /nb/grupper retired listing entries: 0
    /nb/grupper/{slug} detail entries: 28

## Interfaces and Dependencies

The public listing page remains backed by `fetchGroupsPageContent()` and `fetchStudentGroups()` from `apps/web/src/lib/sanity/fetch/groups.ts`. `buildPageMetadata()` remains the route metadata helper and receives the new canonical path and route-owned title. `permanentRedirect()` from `next/navigation` remains the page-level redirect API and returns HTTP 308 in the installed Next.js version.

The source-link projection must resolve `groupsPage` and the retired `blifrivilligPage` reference to `/bli-frivillig`, while `studentGroup` references must continue resolving to `/grupper/{slug}`. Studio Presentation must map `/:locale/bli-frivillig` to `_id == "groupsPage"` and keep `/:locale/grupper/:slug` mapped to student groups.

Revision note (2026-08-07 19:42Z): Recorded the completed full-diff audit. All remaining `/grupper` route references serve individual group profiles or regression inputs; no unrelated worktree changes were found. Draft pull request publication is the only remaining step.

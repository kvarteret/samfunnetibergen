# ExecPlan 009 — E-50 Discoverability and Cost-Safe Crawler Access

This ExecPlan is a living document. Keep `Progress`, `Surprises & Discoveries`,
`Decision Log`, and `Outcomes & Retrospective` current as work proceeds.

## Purpose / Big Picture

Improve search, AI-answer, and social-preview discoverability without recreating
the crawler-driven Vercel cost spike.

Public pages receive consistent code-owned metadata, social cards, sitemap
entries, stable event URLs, and JSON-LD. `robots.txt` continues permitting
crawlers, while Vercel applies per-client rate limits:

- Search and user-triggered retrieval crawlers: 10 requests/minute per IP + JA4.
- Autonomous AI/training scrapers: 2 requests/minute per IP + JA4.
- Requests exceeding a limit receive HTTP 429, not a permanent denial or
  browser challenge.

Existing Studio and design-route `noindex` behavior remains unchanged. No Sanity
SEO fields or editor-facing SEO controls are added.

Implement on branch
`itleder/e-50-gjennomga-hvor-vi-ligger-an-pa-disoverability`.

## Progress

- [x] (2026-07-14 10:26+02:00) Capture repository, rendered metadata,
  robots.txt, sitemap, redirect/status, and live Vercel firewall baselines.
  Vercel traffic/usage and Core Web Vitals remain to be captured from the
  dashboard or a deployed branch.
- [x] (2026-07-14 10:54+02:00) Complete the scoped Website Specification
  audit and record evidence for every in-scope row in this plan.
- [x] (2026-07-14 10:54+02:00) Write RED tests for metadata, sitemap,
  structured data, event-feed, event-query, robots, and redirect contracts;
  the focused suite now passes GREEN.
- [x] (2026-07-14 10:54+02:00) Implement the shared metadata contract and
  deterministic default social image.
- [x] (2026-07-14 10:54+02:00) Correct sitemap coverage and event URL
  stability.
- [x] (2026-07-14 10:54+02:00) Add global and event-specific JSON-LD with a
  shared safe serializer and event builder.
- [x] (2026-07-14 10:54+02:00) Verify `robots.txt` permits search and AI
  crawlers.
- [x] (2026-07-14 10:54+02:00) Verify rendered HTML foundations, redirects,
  error statuses, semantic headings, feed discovery, and bounded sitemap/feed
  caching locally. Core Web Vitals and rich-results validation remain
  environment-dependent follow-up evidence.
- [ ] Replace emergency Vercel rules with tiered rate limits. The read-only
  baseline is captured; external mutation and the required 10-minute,
  24-hour, and seven-day observations remain pending explicit rollout approval.
- [x] (2026-07-14 10:54+02:00) Run automated and local rendered/structured-data
  verification. In-app browser bootstrap and Vercel firewall/cost checks could
  not be completed in this branch environment.
- [ ] Record final Vercel rule IDs, observations, and before/after usage in
  this plan after the external rollout.

## Surprises & Discoveries

- Vercel Pro can rate-limit by IP and JA4, but cannot establish one aggregate
  quota for all addresses belonging to a crawler provider. Distributed scraping
  can therefore exceed the nominal provider-wide rate.
- Observability Plus is not enabled. Use Vercel Firewall's 10-minute/24-hour
  traffic views and Usage/Billing comparisons instead of custom firewall
  metrics queries.
- The current GPTBot deny rule combines the GPTBot user agent and
  `74.7.227.156` with OR. It must be split so GPTBot becomes allowed while the
  abusive IP remains blocked.
- The event detail query currently turns approved ordinary events into 404s
  after their dates pass.
- The event JSON-LD feed emits non-localized URLs and can create an invalid end
  time when no explicit end time exists.
- The sitemap assigns request time as `lastModified`, creating false freshness.
- The attached Website Specification deliberately combines established
  standards, optional enhancements, unrelated quality concerns, and emerging
  agent conventions. Passing the checklist does not mean implementing every
  item.
- Next.js already supplies the doctype, UTF-8 charset, and viewport metadata.
  The application must still verify these in rendered HTML and make the current
  `lang="no"` value consistent with its only configured locale, `nb`.
- The repository already has `src/app/icon.svg` and `src/app/favicon.ico`, one
  permanent accessibility-to-`nyttig` redirect, and a JSON-LD event endpoint.
  It does not currently advertise that endpoint as an alternate representation.
- Both the sitemap and JSON-LD feed are forced dynamic; crawler traffic can
  repeatedly invoke application/Sanity work even when the response has not
  changed.
- The current production sitemap contains 94 URLs, gives every URL a
  request-time `<lastmod>`, omits `/nb/nyttig` and `/nb/rom/book`, and returns
  `Cache-Control: public, max-age=0, must-revalidate` with an initial cache
  miss.
- The current production homepage renders `lang="no"`, a title, canonical, and
  only partial Open Graph/Twitter metadata; it has no description, `og:image`,
  or large-image Twitter card. Next still emits the existing ICO and SVG icon
  links successfully.
- The live Vercel firewall snapshot at 2026-07-14 10:26+02:00 contains five
  enabled rules: `rule_allow_calendar_ZmjxPh` (bypass `/api/ical`),
  `rule_tight_limit_microsoft_crawler_arrangement_pages_t4dSK6` (Microsoft
  ASN 8075, 2/60s, challenge),
  `rule_rate_limit_public_arrangement_pages_B67PiX` (arrangement paths,
  10/60s, challenge),
  `rule_rule_for_ip_address_74_7_227_156_rgjpAN` (IP deny OR exact GPTBot
  user agent), and `rule_amazon_ai_bot_FUA4dI` (Amazonbot log).
- The live missing content route returns HTTP 404, and
  `/nb/tilgjengelighet` returns one HTTP 308 hop to `/nb/nyttig`; the host
  redirect targets in `src/proxy.ts` currently use Next's default temporary
  redirect status and need explicit permanent statuses if they are confirmed
  as legacy moves.
- Next 16 rejects non-literal segment configuration exports during production
  builds, so `src/app/sitemap.ts` exports the literal `revalidate = 3600`. A
  mirroring `SITEMAP_REVALIDATE_SECONDS` constant was later removed during
  review cleanup: it could not be wired to the real export (the sitemap module
  is not importable under vitest), so its test asserted nothing.
- Next's `alternates.types` resolver expects an array of link descriptors. A
  single descriptor object type-checks but renders no `<link>`; the event
  listing now emits one `application/ld+json` alternate link after this was
  caught in rendered HTML.
- The locale proxy also matched the extensionless `opengraph-image` route and
  redirected it to a nonexistent `/nb/opengraph-image`. The matcher now leaves
  the root image endpoint public; the generated response is a 1200x630 PNG.
- The in-app browser skill could not initialize in this environment because its
  runtime reported `Cannot redefine property: process`. Repeatable HTTP checks,
  production HTML inspection, and local image inspection were used instead;
  no browser session or browser credentials were accessed.

Update this section whenever implementation reveals another non-obvious
constraint.

## Decision Log

- Metadata remains owned in application code through
  `src/lib/page-metadata.ts`; do not restore Sanity SEO fields.
- Do not edit `src/app/studio/[[...tool]]/layout.tsx` or
  `src/app/[locale]/design/layout.tsx`. Their current `noindex` behavior is
  accepted.
- Keep `robots.txt` permissive. Crawl permission and cost control are separate
  concerns; robots directives do not enforce request rates.
- Search crawlers are less concerning than autonomous scrapers, so use
  10/minute for search/retrieval and 2/minute for AI scraping.
- Use fixed 60-second windows keyed by `ip, ja4`.
- Return HTTP 429 above the threshold so compliant crawlers can retry later.
- Keep social-preview crawlers outside the strict scraper rule.
- Treat the Website Specification as an audit source. Validate implementation
  choices against standards and vendor documentation; do not treat its own
  proposed protocols as established requirements.
- Include only checklist work that materially affects discovery in E-50:
  document foundations, SEO, stable machine-readable event data, crawl cost,
  representative semantic HTML, correct error statuses, and locale signals.
- Add bounded caching to sitemap and event-feed responses. This complements the
  firewall by reducing compute/Sanity cost for allowed crawler requests.
- Advertise the JSON-LD event feed from the arrangement listing as
  `application/ld+json`; do not mislabel it as RSS, Atom, or JSON Feed.
- Establish Core Web Vitals baselines, but create separate follow-up work for
  unrelated performance remediation rather than expanding E-50 indefinitely.
- Do not add `llms.txt` in this iteration. Google Search explicitly ignores it,
  OpenAI does not document support for it, and maintaining a second curated
  content surface would add staleness risk without a measurable benefit.
- Do not push, open a PR, release, or update Linear unless the execution request
  explicitly includes that external action.
- Create the implementation branch named by this ExecPlan and keep the
  requested untracked plan in the branch so its living evidence can be updated
  alongside the code.
  Rationale: the user requested a new PR branch, while the plan explicitly
  excludes pushing or opening the PR from this execution.
  Date/Author: 2026-07-14 / Codex
- Keep the Vercel firewall snapshot unchanged during this branch-only
  implementation. The target rule design is preserved in this plan, but
  changing third-party firewall state and beginning a timed observation window
  requires an explicit rollout approval and cannot be represented by the Git
  branch itself.
  Rationale: avoid an unreviewed production cost-control mutation while still
  leaving the code and exact target policy ready for the next controlled step.
  Date/Author: 2026-07-14 / Codex

## Outcomes & Retrospective

The code portion of E-50 is implemented on the requested branch. Public routes
now have code-owned metadata, stable canonicals, a deterministic social image,
accurate sitemap coverage, safe localized event JSON-LD, a discoverable cached
event feed, permanent host redirects, and stable approved historical event
URLs. Studio and design behavior was not changed, and no Sanity SEO schema or
editor surface was added.

The automated suite passes 208 tests with 96.07% statement coverage and
81.18% branch coverage. Lint, TypeScript, and the PostHog-empty production
build all pass. The local production server showed 96 sitemap URLs with no
`lastmod`, 5-minute feed caching with `x-nextjs-cache: HIT`, HTTP 200 for a
current event and a historical approved event, HTTP 404 for a missing event,
and HTTP 308 for both configured host redirects. The default social image
rendered as a 1200x630 PNG without clipping.

The Vercel firewall was intentionally not mutated: the five-rule baseline and
all existing IDs remain recorded above. Follow-up work must obtain rollout
approval, publish the two category rules in Log mode, observe them, activate
429 fixed-window limits, remove the superseded Microsoft/Amazonbot rules, and
record the 24-hour and seven-day usage comparisons. Field/lab Core Web Vitals
and Rich Results Test evidence also remain follow-up items because no deployed
branch or browser session was available here.

## Context and Orientation

Relevant implementation surfaces:

- `src/app/layout.tsx` owns root metadata.
- `src/lib/page-metadata.ts` builds route metadata.
- `src/app/opengraph-image.tsx` will provide the default social image.
- `src/app/sitemap.ts` and `src/app/sitemapEntries.ts` own sitemap generation.
- `src/app/robots.ts` owns crawler permission.
- `src/app/[locale]/arrangementer/[event]/page.tsx` renders event details.
- `src/app/api/events/feed/route.ts` exposes event JSON-LD.
- `src/lib/sanity/queries/events.ts` controls event reachability.

Current Vercel custom rules:

1. Calendar API bypass.
2. Microsoft ASN limit of 2/minute on the arrangement listing.
3. Public arrangement listing limit of 10/minute.
4. Deny for `74.7.227.156` OR exact GPTBot user agent.
5. Amazonbot log-only rule.

Target rules:

1. Keep Calendar API bypass.
2. Keep public arrangement listing at 10/minute.
3. Keep `74.7.227.156` as an IP-only deny.
4. Add autonomous AI/training scraper rate limit at 2/minute.
5. Add search/retrieval crawler rate limit at 10/minute.

Remove the Microsoft ASN special case and Amazonbot-only log rule because the
new category rules supersede them.

## Website Specification Review

The attached Website Specification is review input, not the acceptance test by
itself. Apply the following disposition so the implementer does not have to
decide which parts belong in E-50.

| Specification area | E-50 disposition |
| --- | --- |
| Foundations | Verify rendered doctype, `lang`, charset, viewport, unique title/description, canonical, favicon, and Open Graph. Change `html lang` to `nb`, complete metadata, and verify the existing SVG/ICO icons are reachable. App-install icons, theme-color, color-scheme, and unrelated CSS/UI primitives are follow-up work. |
| SEO | Implement or verify robots, sitemap, stable URLs, redirects, SSR content, real 404 status, meta-robots behavior, representative heading hierarchy/internal links, and JSON-LD. Sitemap indexes are unnecessary below 50,000 URLs; image/video sitemap extensions are unnecessary while media is discoverable in SSR HTML. Defer Breadcrumb UI/schema and IndexNow until there is a separate product decision. |
| Accessibility | For representative indexable pages, verify meaningful image alt text, one useful H1, nested headings, semantic landmarks, and descriptive internal links because they also affect machine comprehension. A full WCAG remediation belongs to the design-system/accessibility workstream. |
| Security | Verify HTTPS, absence of mixed-content resources on representative pages, and safe JSON-LD serialization. CSP, HSTS, security.txt, DNSSEC/CAA, cookie policy, and the broader security-header matrix belong to a dedicated security audit. Do not weaken existing Studio framing behavior. |
| Well-known URIs | Do not add speculative or inapplicable files. The site is not an identity provider, OAuth server, federated node, or native-app association surface. Revisit `traffic-advice` only if Chrome prefetch traffic appears in cost evidence. |
| Agent readiness | Implement crawler policy, stable URLs, embedded JSON-LD, and the existing machine-readable event representation. Defer `llms.txt`, `llms-full.txt`, Markdown mirrors, Content Signals, Web Bot Auth, MCP, A2A, Agent Skills, DNS-AID, AI Catalog, NLWeb, WebMCP, OKF, schemamap, and discovery Link headers until relevant vendors document support or a concrete agent product exists. |
| Performance | Capture field/lab Core Web Vitals for the homepage, arrangement listing, and event detail. Verify image sizing and that the LCP image is not lazy-loaded. Cache sitemap/feed responses. Treat unrelated CSS, animation, transport, font, and speculative-loading optimization as follow-up work unless E-50 causes a regression. |
| Privacy | No implementation in E-50. Do not change PostHog, consent, cookies, policies, or data collection while doing discoverability work. |
| Resilience | Verify missing/unapproved routes return a real 404 and primary content/navigation are present in initial HTML. Offline support, service workers, maintenance mode, uptime systems, and deprecation headers are separate concerns. |
| Internationalisation | Keep the `/nb` URL structure, use `lang="nb"`, and keep Norwegian metadata/JSON-LD consistent. Do not invent translated alternates or expand hreflang while `nb` is the only configured locale. |

Evidence must be recorded as `pass`, `fixed`, `deferred`, or `not applicable`
for every row. A deferred item must name the concrete trigger for reconsidering
it; do not create placeholder files merely to satisfy the checklist.

## Plan of Work

### 1. Establish the baseline and write RED tests

Record:

- `git status --short --branch` and the current commit.
- Current output from `npx vercel firewall overview`.
- Screenshots or written totals from Vercel Firewall traffic for 24 hours.
- Current daily request/compute usage and the preceding 30-day daily median.
- Current rendered metadata, `robots.txt`, and `sitemap.xml`.
- Rendered doctype, `<html lang>`, charset, viewport, icon responses, heading
  outline, internal links, and HTTP status for a missing route.
- Redirect status and hop count for every configured permanent redirect plus
  stale legacy URLs found in Search Console or current search results.
- Response cache headers and Vercel cache state for `sitemap.xml` and
  `/api/events/feed` across two unchanged requests.
- PageSpeed Insights/Search Console field data when available, otherwise
  repeatable Lighthouse lab results for the homepage, arrangement listing, and
  one event page.

Add failing tests before implementation for:

- Root title template, description, site name, canonical URLs, Open Graph, and
  Twitter metadata.
- Default social-image fallback and page-specific image override.
- `/nyttig` and `/rom/book` sitemap inclusion.
- Studio, design, submission forms, and internal routes remaining excluded from
  the sitemap.
- Absence of synthetic request-time `lastModified`.
- Safe JSON-LD serialization of CMS text containing `<`.
- Organization, WebSite, and Event schema output.
- Localized event URLs.
- Date-only events omitting `endDate` when no end time exists.
- Approved past events remaining reachable while unapproved events remain
  unavailable.
- Wildcard crawler permission with no GPTBot or Amazonbot disallow.
- Correct `nb` document language and framework foundation metadata in rendered
  HTML.
- Permanent redirects using 301/308 without chains or loops.
- Missing and unapproved routes returning 404 rather than a soft 404.
- Event-feed discovery with the correct `application/ld+json` type.
- Cacheable sitemap/feed responses that do not recompute during their bounded
  freshness window.

### 2. Consolidate code-owned metadata

Change the internal metadata interface to:

```ts
type PageMetadataOptions = {
  canonicalPath: string
  title: string
  description?: string | null
  imageUrl?: string | null
  openGraphType?: "website" | "article"
}
```

`buildPageMetadata` must emit:

- A raw page title, allowing the root `%s | Samfunnet i Bergen` template to
  apply once.
- Route-specific canonical URL.
- Open Graph title, description, canonical URL, site name, locale, type, and
  image.
- Twitter `summary_large_image` metadata using the same title, description, and
  image.
- The generated default social image when no content image exists.

Update root metadata with:

- `metadataBase` from `resolveSiteUrl()`.
- Default title and `%s | Samfunnet i Bergen` template.
- A concise default Norwegian description.
- Site name, Norwegian locale, and default social image.

Change the root `<html>` language from generic `no` to the configured BCP 47
locale `nb`. Verify, rather than manually reimplement, the doctype, UTF-8
charset, and viewport tags supplied by Next.js. Verify the existing SVG and ICO
icons return successful image responses and appear in rendered metadata; do not
add PWA/Apple icon work unless the audit proves the current search favicon is
invalid.

Create `src/app/opengraph-image.tsx` as a deterministic 1200x630
`ImageResponse`. Use existing site colors and typography, render "Samfunnet i
Bergen", and export its alt text, size, and content type. It must not fetch
Sanity or another network resource.

Migrate all public route `generateMetadata` implementations to the helper. Find
candidates with:

```sh
rg -n "generateMetadata|export const metadata" src/app
```

After migration, direct route metadata should remain only where
framework-specific behavior requires it, including the untouched Studio/design
layouts.

### 3. Correct sitemap and event discoverability

In the sitemap:

- Add `/nyttig` and `/rom/book`.
- Continue excluding `/design`, `/studio`, `/arrangementer/ny`, API routes, and
  retired paths.
- Remove the request-time `lastModified` parameter and field.
- Keep localized canonicals and language alternates.
- Keep dynamic page, room, group, and currently relevant event slugs.

For event reachability:

- Change `eventBySlugQuery` so every approved event remains available by slug
  after its date passes.
- Preserve preview access to drafts.
- Preserve 404 behavior for unpublished or unapproved events.
- Keep event listing and sitemap queries focused on current/upcoming events;
  stable detail URLs do not require every historical event to remain in the
  sitemap.

For redirect and status integrity:

- Inventory the redirect in `next.config.ts`, host redirects in `src/proxy.ts`,
  and legacy URLs still visible in Search Console/current search results.
- Use 308/301 for permanent moves, point directly at the final `/nb/...`
  canonical, and eliminate redirect chains or locale loops.
- Verify missing, unapproved, and malformed content URLs return HTTP 404 with a
  usable page; do not render not-found copy with HTTP 200.

Remove `dynamic = "force-dynamic"` from the sitemap and replace it with a
bounded one-hour revalidation window. The response must remain stable between
unchanged requests and continue reflecting published Sanity changes after the
window/revalidation path runs.

### 4. Add reusable structured data

Create one structured-data module used by both HTML pages and the JSON-LD feed.

It must provide:

- Safe JSON serialization that escapes `<` as `\u003c`.
- A global `@graph` containing minimal `Organization` and `WebSite` nodes.
- Event-node construction shared by the event page and feed.
- Oslo-aware timestamps when a time is supplied.
- Date-only values when only a date exists.
- No fabricated `endDate`; omit it unless an explicit valid end time exists.
- Localized canonicals under `/nb/arrangementer/{slug}`.
- Stable occurrence IDs using the canonical URL plus the date key.
- Event status, location, organizer, image, description, language, and offers
  only when source data exists.

Render the Organization/WebSite graph once in the root layout. Render event
JSON-LD on event detail pages only for current or future concrete occurrences.
Historical pages with no future occurrence remain readable but omit Event
rich-result markup.

Refactor `src/app/api/events/feed/route.ts` to use the shared builder and
`resolveSiteUrl()` instead of its hardcoded base URL.

Advertise the feed from `/[locale]/arrangementer` using an alternate link with
type `application/ld+json`, title `Arrangementer — Samfunnet i Bergen`, and the
canonical `/api/events/feed` URL. Add a five-minute CDN freshness window with
stale-while-revalidate support to the feed and remove `no-cache`; allowed bots
must normally receive cached data rather than triggering Sanity work. Do not
describe the endpoint as RSS, Atom, or JSON Feed.

### 5. Replace the emergency Vercel firewall policy

Before changing anything, capture the full existing rule names, conditions,
actions, order, and IDs in this plan.

Create and initially publish the two new category rules with action `Log`.
Observe matches for at least 10 minutes, confirming that ordinary browsers and
social-preview bots do not match. Then change each action to fixed-window Rate
Limit.

Use the existing host scope:

```text
^(www\.)?(blifrivillig\.no|samfunnetibergen\.no)$
```

Use user-agent `contains` conditions combined with OR, avoiding exact
full-version strings.

Autonomous AI/training scraper group — 2 requests per 60 seconds:

- `GPTBot`
- `Amazonbot`
- `ClaudeBot`
- `anthropic-ai`
- `PerplexityBot`
- `Bytespider`
- `CCBot`
- `cohere-ai`
- `Meta-ExternalAgent`

Search/retrieval group — 10 requests per 60 seconds:

- `Googlebot`
- `bingbot`
- `DuckDuckBot`
- `Applebot`
- `OAI-SearchBot`
- `ChatGPT-User`
- `Claude-User`
- `Perplexity-User`

Both rules use:

- Count keys: `ip, ja4`.
- Exceeded action: Rate Limit/HTTP 429.
- All project routes, with the existing `/api/ical` bypass ordered first.
- No persistent challenge duration.
- No deny action.

Then:

- Edit the current GPTBot/IP rule so it denies only `74.7.227.156`.
- Delete the Amazonbot log-only rule.
- Delete the Microsoft ASN arrangement rule.
- Preserve the general arrangement-page rule at 10/minute.
- Keep Vercel's managed AI Bots ruleset disabled or Log-only; do not set it to
  Deny.

### 6. Verify and tune

Run the full local verification:

```sh
npm test
npm run lint
npx tsc --noEmit
POSTHOG_CLI_API_KEY= POSTHOG_CLI_PROJECT_ID= npm run build
```

Use a production-like local build or deployment to verify:

- Every representative route has one correct title, description, canonical,
  Open Graph block, Twitter block, and social image.
- The generated card renders at 1200x630 without clipping.
- `/robots.txt` allows ordinary, search, and AI user agents.
- `/sitemap.xml` contains the intended canonical routes and no synthetic
  timestamps.
- Current event pages contain valid Event JSON-LD.
- Past approved event URLs return 200 without misleading Event markup.
- Google's Rich Results Test accepts a deployed current event page.
- Social-preview inspection succeeds for the homepage and an image-bearing
  event.
- Rendered pages contain the Next.js doctype/charset/viewport foundations and
  `lang="nb"`.
- Existing favicon URLs return 200 with image content types.
- Representative homepage, listing, event, room, group, and generic pages have
  one useful H1, no skipped heading level in their main content, semantic
  landmarks, meaningful image alt text, and descriptive internal links.
- Configured and discovered legacy redirects use one permanent hop to their
  localized canonical destination.
- Missing and unapproved content returns an actual 404.
- The arrangement listing advertises the JSON-LD feed, and repeated sitemap/feed
  requests show the configured cache behavior.
- Homepage, arrangement listing, and event detail have recorded LCP, INP/TBT,
  and CLS baselines. E-50 must not regress a measured metric by more than 10%;
  field failures or unrelated existing failures become named follow-up issues.

For firewall verification, use `/nb/kontakt`, not `/api/ical` or the separately
limited arrangement listing:

- Send three sequential requests with a GPTBot user agent; requests one and two
  succeed, request three returns 429.
- After the window resets, verify the route succeeds again.
- Send eleven sequential Googlebot requests; the eleventh returns 429.
- Verify a normal browser user agent is unaffected.
- Verify the calendar endpoint remains bypassed.
- Confirm the matches and actions in Vercel Firewall traffic.

Observe for 24 hours, then again after seven days:

- AI scraper traffic must be visibly constrained to the configured per-IP/JA4
  rate.
- Daily Vercel usage should remain below twice the preceding 30-day daily
  median.
- If distributed scraper traffic still pushes usage above that guardrail,
  lower the scraper group to 1/minute and add targeted IP/ASN rules based on
  recorded evidence.
- If legitimate search crawling is materially impaired, raise only the search
  group to 20/minute. Do not loosen the scraper rule.

## Concrete Steps

From `/Users/kluvin/dev/kvarteret/samfunnetibergen`:

1. Confirm the tree is clean and create the suggested branch.

   ```sh
   git status --short --branch
   git switch -c itleder/e-50-gjennomga-hvor-vi-ligger-an-pa-disoverability
   ```

2. Capture the code and Vercel baselines described above before mutation.
3. Implement each code phase with RED, GREEN, and refactor checkpoints. Run the
   relevant focused tests after each checkpoint.
4. Run the complete local verification suite.
5. Review `git diff --check`, `git diff --stat`, and the full diff for accidental
   Studio/Sanity changes, secrets, generated output, or unrelated edits.
6. Make the Vercel rule changes in Log mode, observe, activate rate limiting,
   and run the controlled request checks.
7. Update this document's living sections with timestamps, evidence, rule IDs,
   and outcomes.
8. Leave the verified branch ready for review. Do not push or create a PR unless
   the invoking request explicitly asks for it.

For this branch execution, steps 1–5 and the local portions of step 7 were
completed. The Vercel mutation in step 6 remains intentionally pending because
it changes production firewall state and starts a timed observation period that
cannot be completed honestly inside a local branch-only run.

## Validation and Acceptance

The issue is complete when:

- All tests pass with at least 80% coverage and no reduced thresholds.
- Lint, type checking, and production build pass.
- Public routes have consistent canonical, Open Graph, and Twitter metadata.
- A branded default social card exists and content images override it.
- Sitemap coverage is accurate and contains no fake freshness.
- Sitemap and event-feed requests use bounded cache/revalidation behavior.
- Approved event URLs remain stable after events pass.
- Current event pages expose valid, safely serialized JSON-LD.
- GPTBot, Amazonbot, and similar crawlers are allowed below their limits and
  receive 429 above them.
- Search crawlers receive the more generous 10/minute limit.
- Studio and design remain noindexed without changes.
- Rendered public HTML passes the scoped Website Specification review recorded
  above, including `lang="nb"`, correct redirects/404s, representative semantic
  structure, feed discovery, and foundation metadata.
- Core Web Vitals baselines are recorded and the E-50 changes introduce no
  greater than 10% regression.
- No Sanity SEO schema or editor surface is introduced.
- The 24-hour and seven-day observations, final firewall rule IDs, and any rate
  adjustments are recorded in this plan.

## Idempotence and Recovery

All code changes are additive or deterministic and can be reapplied safely.

Before firewall mutation, preserve the old rule snapshot. If the rollout
behaves incorrectly:

- Set the two new bot rules back to Log immediately.
- Restore deleted emergency rules only if costs begin spiking during diagnosis.
- Do not remove the calendar bypass or general arrangement limit.
- If only search indexing is affected, adjust the search rule independently.
- If costs remain high, tighten scraper limits or add evidence-backed IP/ASN
  blocks instead of rate-limiting all human traffic.

Never leave both a blanket GPTBot deny and the GPTBot rate-limit rule active.

## Artifacts and Notes

Record in this living plan:

- Baseline and final commit hashes.
- Before/after firewall rule IDs and conditions.
- RED and GREEN test outputs.
- Sample rendered metadata and JSON-LD.
- The completed Website Specification disposition table with evidence links or
  command output for each in-scope item.
- Redirect inventory, missing-route status checks, feed-discovery HTML, and
  sitemap/feed cache headers.
- Core Web Vitals baseline and post-change measurements.
- Rich Results validation result.
- 24-hour and seven-day Vercel usage comparison.
- Any departures from the initial 10/minute and 2/minute limits.

Baseline evidence captured before implementation on 2026-07-14:

    Branch: itleder/e-50-gjennomga-hvor-vi-ligger-an-pa-disoverability
    Commit: 59361f40773257c4603465ac6d0f82392fa578f0
    Implementation commit: d2c5b94 (feat: implement discoverability and crawler controls)
    robots.txt: HTTP 200; User-agent * Allow /; canonical sitemap; Vercel cache HIT
    sitemap.xml: HTTP 200; 94 URLs; request-time lastmod; cache MISS on first read
    /nb/does-not-exist-e50-baseline: HTTP 404
    /nb/tilgjengelighet: HTTP 308 -> /nb/nyttig
    Vercel custom rules: 5 enabled; full names, IDs, conditions, and actions are
    recorded in Surprises & Discoveries above.

Implementation evidence captured on 2026-07-14:

    npm test: 25 test files passed, 1 skipped; 208 tests passed, 3 skipped
    Coverage: 96.07% statements, 81.18% branches, 98.55% functions
    npm run lint: passed; npx tsc --noEmit: passed
    POSTHOG_CLI_API_KEY= POSTHOG_CLI_PROJECT_ID= npm run build: passed
    Local HTML: <!DOCTYPE html>, lang="nb", charset, viewport, complete OG/Twitter metadata
    Local sitemap: 96 URLs, /nb/nyttig and /nb/rom/book present, no <lastmod>
    Local feed: application/ld+json, public s-maxage=300, stale-while-revalidate=86400, x-nextjs-cache HIT
    Local feed discovery: one <link rel="alternate" type="application/ld+json" ...>
    Local event JSON-LD: localized /nb URL, Oslo +02:00 timestamp when timed, date-only occurrences without endDate
    Local historical event: HTTP 200, useful H1, no Event JSON-LD
    Local missing event: HTTP 404; local /nb/tilgjengelighet: HTTP 308 -> /nb/nyttig
    Local host redirects: HTTP 308 to the final event submission URL and /studio
    Local social image: image/png, 1200 x 630 RGBA
    In-app browser/CWV/Rich Results/Vercel traffic: not captured; see Decisions and Outcomes

Website Specification evidence:

Foundations are fixed and pass locally: the rendered homepage contains the
Next-generated doctype, `charSet="utf-8"`, viewport, `lang="nb"`, a unique
title, description, canonical, complete Open Graph/Twitter metadata, and
working `/favicon.ico` (`image/x-icon`) and `/icon.svg` (`image/svg+xml`)
responses. The 1200x630 Open Graph response was inspected as an image and has
no visible clipping.

SEO is fixed and passes the scoped checks: wildcard `robots.txt` allows `/` and
publishes the sitemap; the sitemap contains localized canonical routes,
`/nb/nyttig`, and `/nb/rom/book` without synthetic `<lastmod>`; the listing
advertises the JSON-LD feed; approved historical event URLs return 200; missing
content returns 404; and the configured accessibility and host redirects are
single-hop 308 moves. Studio/design noindex behavior remains untouched.

Accessibility is pass for the representative homepage, arrangement listing,
and event page sample: each has a useful single H1, nested section headings,
the main landmark, descriptive image alternatives where images convey content,
and descriptive internal links. Two empty alternatives on the homepage are
intentional decorative illustrations. Full WCAG remediation remains outside
E-50.

Security is pass for this scope: production redirects HTTP to HTTPS, the
structured-data serializer escapes `<`, and no mixed-content URL was introduced
by the code-owned metadata or image path. CSP, HSTS, security.txt, DNSSEC/CAA,
and the wider security-header matrix are deferred to a dedicated security
audit.

Well-known URI work is not applicable: this site is not an identity provider,
OAuth server, federated node, or native-app association surface. Agent
readiness is fixed for the supported scope through permissive robots rules,
stable URLs, embedded JSON-LD, and the cached event representation; `llms.txt`,
Content Signals, Web Bot Auth, MCP/A2A, and other emerging conventions are
deferred until a relevant vendor documents support or a concrete product
requires one.

Performance is partially verified: sitemap/feed caching, the static social
image dimensions, and non-lazy event image markup were inspected. Field/lab
Core Web Vitals and the no-more-than-10-percent regression comparison were not
available without a deployed branch and are follow-up work. Privacy is not
applicable to this implementation; PostHog, consent, cookies, and policies
were not changed. Resilience passes for SSR primary content, real 404s, and
historical event readability; offline/service-worker and maintenance concerns
are deferred. Internationalisation is fixed for the configured single locale:
URLs remain under `/nb`, rendered HTML uses `lang="nb"`, and JSON-LD uses
`inLanguage: "nb"`; no unconfigured language alternates were invented.

Normative references:

- [Vercel WAF rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting)
- [Vercel bot management](https://vercel.com/docs/bot-management)
- [OpenAI crawler identities and controls](https://developers.openai.com/api/docs/bots)
- [Robots Exclusion Protocol, RFC 9309](https://www.rfc-editor.org/rfc/rfc9309)
- [Google Event structured-data requirements](https://developers.google.com/search/docs/appearance/structured-data/event)
- [Google's generative AI search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [Next.js metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Website Specification checklist](https://specification.website/checklist/)

Treat [specification.website](https://specification.website/) and its linked
discussion as review input, not as normative standards. Treat the
[llms.txt proposal](https://llmstxt.org/) as an emerging convention to revisit
only when relevant assistants document support or measurable adoption.

## Interfaces and Dependencies

Internal interface changes:

- Replace the fallback-named `PageMetadataOptions` fields with `title`,
  `description`, and `imageUrl`.
- Add `openGraphType`.
- Remove `lastModified` from `SitemapEntryOptions`.
- Add typed structured-data builders and a safe rendering component.
- Reuse the event structured-data builder from both the event page and JSON-LD
  feed.
- Add an `application/ld+json` alternate link on the arrangement listing.
- Change sitemap caching to one-hour revalidation and event-feed caching to five
  minutes plus stale-while-revalidate.

No public HTTP API is removed. `/api/events/feed` retains its JSON-LD response
format but receives canonical localized URLs and corrected dates. No database
migration, Sanity schema change, or new runtime dependency is required. The
Sanity query contract changed, so `npm run sanity:typegen` regenerated the
corresponding query mapping in `src/lib/sanity/sanity.types.ts`.

Change note (2026-07-14): Implemented the code-owned discoverability,
structured-data, sitemap, feed, redirect, and local verification work; recorded
the Next.js resolver/proxy discoveries; and left Vercel firewall mutation and
long-horizon observations pending explicit rollout approval.

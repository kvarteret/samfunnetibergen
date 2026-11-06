# Arrangement statistics

`/{nb,en}/arrangementer/statistikk` shows PostHog numbers for arrangements and
group pages to Kvarteret Personal Admin and Gruppeadmin users. The page is
`noindex`, is not in the sitemap, and is excluded from PostHog tracking.

## Access

Personal decides access. Its `kvarteret_session` cookie is shared on
`.samfunnetibergen.no`, and the website forwards only that cookie to Personal's
`GET /api/v1/me/statistikk-tilgang`:

- Admin gets every arrangement and group page.
- Gruppeadmin gets arrangements whose organizer group (or parent arrangement's
  organizer group) matches a slug in its group-admin assignment, plus those
  groups' pages. Sanity and Personal group slugs follow the same rule (ADR 010).
- Anyone else is refused; visitors without a session are sent to
  `{PERSONAL_APP_BASE_URL}/login?next=/statistikk`, and Personal's `/statistikk`
  sends them back here. The Personal dashboard links there too.

Under `next dev` the page skips Personal and acts as Admin. Set
`STATISTICS_DEV_GROUPS=quiz,debattgruppen` to preview the Gruppeadmin view.

## Configuration

Website (server-only):

- `POSTHOG_QUERY_API_KEY`: a PostHog personal API key with only `query:read`.
- `POSTHOG_QUERY_PROJECT_ID`: numeric project id (falls back to
  `POSTHOG_CLI_PROJECT_ID`).
- `POSTHOG_QUERY_HOST`: defaults to `https://eu.posthog.com`.
- `PERSONAL_APP_BASE_URL`: defaults to `https://personal.samfunnetibergen.no`.

Personal:

- `SESSION_COOKIE_DOMAIN=.samfunnetibergen.no` so the session reaches the
  website. Logins on the `personal.kvarteret.no` alias stay host-only and do not
  carry over.
- `WEBSITE_BASE_URL`: defaults to `https://www.samfunnetibergen.no`.

Deploy Personal first; the website shows "utilgjengelig" until the access
endpoint answers.

## Metrics

Source: `apps/web/src/features/event-statistics/server/statistics.ts`.

- Views, unique sessions and unique visitors: `content_page_viewed`.
- Ticket and Facebook clicks: `ticket_link_clicked`,
  `facebook_event_link_clicked`.
- Time on page: median `$prev_pageview_duration` on `$pageview`/`$pageleave`
  for the arrangement path, counting visits between 1 s and 10 min, shown only with at least 10 such visits.

- Fremhevingskampanjer: Sanity stores "Promotert på forsiden" only as a flag,
  so campaign periods are rebuilt from the document history (transaction list
  plus the published document at each revision) with `SANITY_API_READ_TOKEN`.
  Front-page impressions come from `event_placement_viewed`, recorded since
  6 October 2026.
- Per dag: views divided by the days the page was live in the period, from its
  first view until its last date or today.

Visitors who decline tracking or block PostHog are not counted.

## Caching

Reports are built by `cached.ts` with `unstable_cache`: 15 minutes fresh,
then the next request gets the cached report immediately while a new one is
built in the background. The scope (Admin or the viewer's groups) is part of
the cache key. The page and the MCP endpoint share the entries.

## MCP endpoint for agents

`/api/mcp/statistikk` (Streamable HTTP, stateless, read-only) offers
`event_stats` and `event_stats_detail` with Admin scope, for internal agents
such as the Slack bot. Requests need `Authorization: Bearer <token>`.
The token is only in Infisical (Samfunnet Deployments `/mime`, as
`STATISTICS_MCP_TOKEN`); the website has its SHA-256 committed in
`features/event-statistics/server/mcp-auth.ts`, so nothing is configured on
the website side. To rotate, put a new token in `/mime`, commit its hash, and
deploy the website before Ludvig. For local testing, set
`STATISTICS_MCP_TOKEN_SHA256` to the hash of a token of your own. Only
aggregates are returned, never anything about a single visitor.

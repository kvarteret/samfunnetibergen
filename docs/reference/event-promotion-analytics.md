# Event promotion campaigns

Campaign analytics live only in PostHog. Sanity holds editorial promotion
settings and the frozen first published slug; there are no campaign-history
records, custom campaign controls or analytics views in Studio.

A campaign is one uninterrupted promoted period. A signed Sanity webhook emits
`event_promotion_changed` on published starts, ends and placement/order changes.
Each start's deterministic change ID identifies a campaign. Reordering keeps the
same period; removal ends it; re-promotion starts another. PostHog reconstructs
periods from the event ID and change timestamp, so delivery order doesn't matter.
The receiver awaits export before returning 200; failures return 502 for retry.
`$insert_id` is deterministic across retries. Only public editorial fields are
projected; no submitter information is sent. The service credential is used only
to freeze `initialSlug` when it is missing, not to write analytics history.

Website `event_placement_viewed` records a link at least 50% visible continuously
for one second while the tab is visible. Impressions are collected only for
promoted events, once per event document and surface per PostHog session.
The SDK's existing before-send hook deduplicates across navigation and reloads
using local storage, with an in-memory fallback if storage is unavailable.
`event_placement_clicked` records primary, keyboard or middle clicks.
`content_page_viewed` preserves existing event-detail traffic. Their event-time
promotion state, timestamp and readable event ID connect them to campaign periods
in PostHog. Surfaces distinguish `home-promoted`, `home-upcoming`, `events-list`,
`calendar`, `detail-parent` and `detail-child`. These are product events through
the existing SDK; they do not belong in operational Logs.

Browser analytics exclude all Vercel deployment domains and infoskjerm pages.
Generic click autocapture is disabled; explicit domain events, page views,
exceptions and session replay remain enabled. Before this policy was tightened,
ordinary event cards and repeat navigation produced additional impressions.
Use distinct session reach instead of comparing raw impression counts across
the change. Clicks still distinguish ordinary and promoted placements.

The statistics page shows reach decay for `home-promoted`: per campaign day,
the people who saw the event fremhevet and how many of them saw it for the
first time. A person's first day is searched from the start of impression
tracking, not the selected period, so returning people never count as new.
New reach falling towards zero means the campaign mostly repeats an audience.

`npm run events:backfill:placements -- --slug <slug>` estimates placements for
an event's promotion periods that ended before impressions were tracked. It
assumes every front-page session in the period saw the event fremhevet and every
view of its page came from that placement, and captures matching
`event_placement_viewed`/`event_placement_clicked` events under the original
visitor and session with `backfilled=true`. It dry-runs unless given `--send`
and refuses to run twice for one event. Taake was backfilled on 2026-10-07
(1 464 sessions, 96 clicks). Exclude `backfilled = true` when only measured
placements are wanted. Page-view entry surfaces and `event_placements_seen`
are not backfilled, so «Hvor på nettsiden» keeps zero for those periods.

Campaign chips on the statistics page limit the visibility sections to one
campaign's exact start and end; views per day then compare the campaign with
as many days just before it. A running campaign reads «i kø» when the front
page's own selection doesn't currently show the event, since being promoted in
Sanity only makes it a candidate.

`data-event-id` and analytics `event_id` use `initialSlug`; `event_document_id`
retains the Sanity ID and `event_slug` is the current URL slug. Existing events
were seeded with their published slug at rollout. Historical URL changes cannot
be recovered from this seed. Existing `content_id` stays unchanged for baseline
joins. All placement events include surface, position, locale, promoted state,
placement/order, occurrence date, placement ID and tracking version.
Placement events also carry the public event title, a readable placement name
and a short `summary` such as `The Snooks · Frontpage — promoted`. Add
`summary` as an Activity column to distinguish events without expanding rows.

The dashboard is https://eu.posthog.com/project/202551/dashboard/1002241.
Compare daily detail views before/during/after each campaign and exposures and
clicks by surface. Fast clicks can precede the one-second impression threshold;
raw clicks/exposures is descriptive and can exceed 100%. Ticket clicks are
intent, not verified sales. Selection doesn't guarantee homepage exposure:
event eligibility, dates and pool rotation govern actual display.

The Snooks started at 2026-10-06T16:56:52.196667Z, confirmed from published
revisions. There were 49 detail views over the 14 complete days 22 September–
5 October. Earlier analytics downtime affects 6 October. Other existing campaigns
are marked `campaign_start_known=false`; their timestamps are first observations,
not actual starts. Impressions begin at rollout and cannot be backfilled.
Before/after traffic is observational, not causal lift. Demand changes as the
event approaches and other advertising can change concurrently. Randomized
exposure would be needed to establish causal lift. Retention/export settings in
PostHog govern how long campaign history remains available.

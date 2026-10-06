# Event promotion campaigns

A campaign is one uninterrupted `isPromoted` period. Reordering or moving between
`top` and `pool` keeps its ID; removal ends it, and re-promotion starts another.
Selection does not guarantee homepage exposure: eligibility, event dates and
pool rotation determine actual display. Impressions measure that display.

The first published slug is frozen as `initialSlug`, used for `data-event-id`
and analytics `event_id`. `event_document_id` retains the Sanity ID, and
`event_slug` records the current URL slug. Existing events were seeded with their
current published slug at rollout; older URL changes cannot be reconstructed
from that seed. Existing `content_id` remains the Sanity ID for historical views.

## Events

- `event_placement_viewed`: an event link is at least 50% visible continuously
  for one second while the tab is visible. Once per placement per navigation.
- `event_placement_clicked`: primary, keyboard or middle click on an event link.
- `content_page_viewed`: existing event detail traffic, enriched with campaign
  state and readable event identity.
- `event_promotion_changed`: published starts, ends and placement/order changes.

Placement events include `event_id`, `event_document_id`, `event_slug`, `surface`,
`position`, `locale`, `is_promoted`, `promotion_campaign_id`, `promotion_placement`,
`promotion_order`, `occurrence_date`, `placement_id` and `tracking_version`.
Surfaces include `home-promoted`, `home-upcoming`, `events-list`, `calendar`,
`detail-parent` and `detail-child`. PostHog's existing session context connects
interactions. These are product events, not operational Logs.

Sanity `eventPromotionChange` documents preserve the campaign history. A signed
published-document webhook persists changes before awaiting PostHog export.
Deterministic IDs deduplicate CMS records and `$insert_id` deduplicates retries
in PostHog. Only public editorial fields are projected; no submitter details.
The receiver needs `SANITY_PROMOTION_WEBHOOK_SECRET` and
`SANITY_PROMOTION_HISTORY_TOKEN`, a dedicated service credential.

## Interpretation

Compare daily event detail views before/during/after a campaign and break down
placement impressions and clicks by surface and campaign. Report unique sessions
as well as totals. For CTR use sessions with a placement click divided by sessions
with its impression, restricted to matching campaign/surface; fast clicks can
occur before the one-second impression threshold, so raw clicks/impressions
need not behave as a probability. Ticket clicks are intent, not verified sales.

The Snooks (`konsert-med-the-snooks-1788875522439`) began its current campaign at
2026-10-06T16:56:52.196667Z, confirmed from published Sanity revisions. There were
49 event detail views across the 14 complete days 22 September–5 October.
6 October had an earlier analytics outage. Existing campaigns without verified
history use `startKnown=false` and the first observation time; do not interpret
that as their actual start. Impressions begin at rollout and cannot be backfilled.
Before/after comparisons are observational: demand naturally changes as an event
approaches and other advertising can change simultaneously. Causal lift requires
a randomized exposure experiment.

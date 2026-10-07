import "server-only"

import {
  isPromotableEventKind,
  selectHomepagePromotedEvents,
} from "@/features/events/domain/promotedOrdering"
import {
  fetchPublicEventSet,
  fetchPublicPromotedParentEvents,
} from "@/features/events/server/public-events"
import { sanityClient } from "@/lib/sanity/client"
import { getOsloDateString } from "@/lib/sanity/fetch/shared"
import {
  type CampaignPeriod,
  campaignDays,
  canSeeGroup,
  channelForDomain,
  type DailyPoint,
  daysBetween,
  deviceName,
  type EventDetail,
  type EventStatistic,
  type Exposure,
  fillDailySeries,
  isSafeIdentifier,
  leadTimeBuckets,
  type NamedCount,
  PLACEMENT_TRACKING_START,
  parseCampaignParam,
  periodStart,
  reachByDay,
  type StatisticsPeriod,
  type StatisticsScope,
  type SurfaceFunnel,
  TRAFFIC_CHANNELS,
  toCount,
  toOsloDay,
} from "../domain/statistics"
import {
  EVENT_PROJECTION,
  type EventDocument,
  toEventMeta,
} from "./event-documents"
import { hogqlString, hogqlStringList, runHogQL } from "./posthog-query"
import { fetchCampaignPeriods } from "./promotion-history"
import {
  ARRANGEMENT_PATH,
  DURATION_FILTER,
  medianWhenReliable,
  since,
} from "./statistics"

const eventBySlugQuery = `*[_type == "arrangement" && (slug.current == $slug || initialSlug == $slug)][0]${EVENT_PROJECTION}`
const instancesQuery = `*[_type == "arrangement" && parentEvent._ref == $id]${EVENT_PROJECTION}`

const PARENT_KINDS = new Set(["seriesParent", "festivalParent"])
const fetchOptions = { perspective: "published", stega: false } as const

/**
 * Statistics for one arrangement page. A series or festival parent covers the
 * parent page and every date in it, with a row per date.
 */
export async function buildEventDetail(
  scope: StatisticsScope,
  slug: string,
  period: StatisticsPeriod,
  campaignParam?: string | string[],
): Promise<EventDetail | null> {
  if (!isSafeIdentifier(slug)) return null
  const doc = await sanityClient.fetch<EventDocument | null>(
    eventBySlugQuery,
    { slug },
    fetchOptions,
  )
  if (!doc) return null
  const meta = toEventMeta(doc)
  if (!canSeeGroup(scope, meta.organizerSlug)) return null

  const isSeries = PARENT_KINDS.has(doc.eventKind ?? "")
  const instanceDocs = isSeries
    ? await sanityClient.fetch<EventDocument[]>(
        instancesQuery,
        { id: doc._id },
        fetchOptions,
      )
    : []
  const members = [doc, ...instanceDocs]
  const ids = members.map(member => member._id).filter(isSafeIdentifier)
  const slugs = [
    ...new Set(
      members
        .flatMap(member => [member.slug, member.initialSlug])
        .filter(isSafeIdentifier),
    ),
  ]

  const range = since(period)
  const viewedIn = (within: string) => `event = 'content_page_viewed'
    AND properties.content_type = 'arrangement' AND ${within}
    AND properties.content_id IN ${hogqlStringList(ids)}`
  const clickedIn = (
    within: string,
  ) => `event IN ('ticket_link_clicked', 'facebook_event_link_clicked')
    AND ${within}
    AND (properties.event_id IN ${hogqlStringList(ids)}
      OR (properties.event_id IS NULL
        AND properties.event_slug IN ${hogqlStringList(slugs)}))`
  const viewed = viewedIn(range)
  const clicked = clickedIn(range)

  // The flag usually sits on the event itself; a date in a series falls back
  // to its series' campaign.
  const campaignsPromise = fetchCampaignPeriods(doc._id).then(periods =>
    periods?.length || !doc.parent
      ? { periods, ownerId: doc._id }
      : fetchCampaignPeriods(doc.parent._id).then(parentPeriods => ({
          periods: parentPeriods,
          ownerId: doc.parent?._id ?? doc._id,
        })),
  )

  const [
    totals,
    daily,
    dailyClicks,
    duration,
    referrers,
    devices,
    perId,
    perIdClicks,
  ] = await Promise.all([
    runHogQL<{ views: number; sessions: number; visitors: number }>(
      `SELECT count() AS views, uniq(properties.$session_id) AS sessions,
           uniq(person_id) AS visitors
         FROM events WHERE ${viewed}`,
      "detail-totals",
    ),
    runHogQL<{ day: string; views: number; visitors: number }>(
      `SELECT toDate(toTimeZone(timestamp, 'Europe/Oslo')) AS day,
           count() AS views, uniq(person_id) AS visitors
         FROM events WHERE ${viewed}
         GROUP BY day ORDER BY day`,
      "detail-daily",
    ),
    runHogQL<{ day: string; ticket: number; facebook: number }>(
      `SELECT toDate(toTimeZone(timestamp, 'Europe/Oslo')) AS day,
           countIf(event = 'ticket_link_clicked') AS ticket,
           countIf(event = 'facebook_event_link_clicked') AS facebook
         FROM events WHERE ${clicked}
         GROUP BY day ORDER BY day`,
      "detail-daily-clicks",
    ),
    runHogQL<{ seconds: number; samples: number }>(
      `SELECT median(toFloat(properties.$prev_pageview_duration)) AS seconds,
             count() AS samples
         FROM events
         WHERE event IN ('$pageview', '$pageleave') AND ${range}
           AND ${DURATION_FILTER}
           AND extract(properties.$prev_pageview_pathname, '${ARRANGEMENT_PATH}')
             IN ${hogqlStringList(slugs)}`,
      "detail-duration",
    ),
    runHogQL<{ domain: string | null; views: number }>(
      `SELECT properties.$referring_domain AS domain, count() AS views
         FROM events WHERE ${viewed}
         GROUP BY domain ORDER BY views DESC LIMIT 200`,
      "detail-referrers",
    ),
    runHogQL<{ device: string | null; views: number }>(
      `SELECT properties.$device_type AS device, count() AS views
         FROM events WHERE ${viewed}
         GROUP BY device ORDER BY views DESC`,
      "detail-devices",
    ),
    isSeries
      ? runHogQL<{
          id: string
          views: number
          visitors: number
          sessions: number
        }>(
          `SELECT properties.content_id AS id, count() AS views,
               uniq(person_id) AS visitors, uniq(properties.$session_id) AS sessions
             FROM events WHERE ${viewed}
             GROUP BY id`,
          "detail-per-date",
        )
      : [],
    isSeries
      ? runHogQL<{
          id: string | null
          slug: string | null
          ticket: number
          facebook: number
        }>(
          `SELECT properties.event_id AS id, properties.event_slug AS slug,
               countIf(event = 'ticket_link_clicked') AS ticket,
               countIf(event = 'facebook_event_link_clicked') AS facebook
             FROM events WHERE ${clicked}
             GROUP BY id, slug`,
          "detail-per-date-clicks",
        )
      : [],
  ])

  const today = getOsloDateString()
  const placed = `properties.event_document_id IN ${hogqlStringList(ids)}`
  const { periods: campaigns, ownerId } = await campaignsPromise
  const selectedCampaign = campaigns
    ? parseCampaignParam(campaignParam, campaigns.length)
    : null
  // The visibility section covers the selected campaign, or else the period.
  const window =
    selectedCampaign === null || !campaigns
      ? null
      : campaignWindow(campaigns[selectedCampaign], today)
  const exposureRange = window?.range ?? range
  const ongoing = campaigns?.at(-1)?.until === null
  const [
    leadRows,
    placementRows,
    promotedDayRows,
    firstSeenRows,
    seenRows,
    entryViewRows,
    entryTicketRows,
    reachRows,
    campaignDailyRows,
    shownNow,
  ] = await Promise.all([
    runHogQL<{ id: string; day: string; views: number }>(
      `SELECT properties.content_id AS id,
           toString(toDate(toTimeZone(timestamp, 'Europe/Oslo'))) AS day,
           count() AS views
         FROM events
         WHERE event = 'content_page_viewed'
           AND properties.content_type = 'arrangement'
           AND timestamp >= now() - INTERVAL 180 DAY
           AND properties.content_id IN ${hogqlStringList(ids)}
         GROUP BY id, day`,
      "detail-lead-time",
    ),
    runHogQL<{ surface: string | null; impressions: number; clicks: number }>(
      `SELECT properties.surface AS surface,
           countIf(event = 'event_placement_viewed') AS impressions,
           countIf(event = 'event_placement_clicked') AS clicks
         FROM events
         WHERE event IN ('event_placement_viewed', 'event_placement_clicked')
           AND ${exposureRange} AND ${placed}
         GROUP BY surface`,
      "detail-placements",
    ),
    runHogQL<{ day: string }>(
      `SELECT DISTINCT toString(toDate(toTimeZone(timestamp, 'Europe/Oslo'))) AS day
         FROM events
         WHERE event = 'event_placement_viewed'
           AND properties.surface = 'home-promoted'
           AND ${range} AND ${placed}`,
      "detail-promoted-days",
    ),
    runHogQL<{ day: string }>(
      `SELECT toString(min(toDate(toTimeZone(timestamp, 'Europe/Oslo')))) AS day
         FROM events
         WHERE event = 'content_page_viewed'
           AND properties.content_type = 'arrangement'
           AND timestamp >= now() - INTERVAL 365 DAY
           AND properties.content_id IN ${hogqlStringList(ids)}`,
      "detail-first-seen",
    ),
    runHogQL<{ surface: string | null; seen: number }>(
      `SELECT properties.surface AS surface, count() AS seen
         FROM events
         WHERE event = 'event_placements_seen' AND ${exposureRange}
           AND arrayExists(
             id -> id IN ${hogqlStringList(ids)},
             JSONExtract(ifNull(toString(properties.event_document_ids), '[]'), 'Array(String)')
           )
         GROUP BY surface`,
      "detail-surface-seen",
    ),
    runHogQL<{ surface: string | null; views: number }>(
      `SELECT properties.entry_surface AS surface, count() AS views
         FROM events WHERE ${viewedIn(exposureRange)}
         GROUP BY surface`,
      "detail-entry-views",
    ),
    runHogQL<{ surface: string | null; tickets: number }>(
      `SELECT properties.entry_surface AS surface,
           countIf(event = 'ticket_link_clicked') AS tickets
         FROM events WHERE ${clickedIn(exposureRange)}
         GROUP BY surface`,
      "detail-entry-tickets",
    ),
    // A person's first day is searched over the past year, not the period,
    // so "first time" means never seen fremhevet before. Impressions before
    // tracking began exist only where a campaign was backfilled.
    runHogQL<{ day: string; people: number; first_time: number }>(
      `SELECT toString(seen_day) AS day, count() AS people,
           countIf(seen_day = first_day) AS first_time
         FROM (
           SELECT person_id, seen_day,
               min(seen_day) OVER (PARTITION BY person_id) AS first_day
             FROM (
               SELECT DISTINCT person_id,
                   toDate(toTimeZone(timestamp, 'Europe/Oslo')) AS seen_day
                 FROM events
                 WHERE event = 'event_placement_viewed'
                   AND properties.surface = 'home-promoted'
                   AND timestamp >= now() - INTERVAL 365 DAY
                   AND ${placed}
             )
         )
         WHERE seen_day >= toDate('${window?.days[0] ?? periodStart(today, period)}')
           AND seen_day <= toDate('${window?.days.at(-1) ?? today}')
         GROUP BY seen_day ORDER BY seen_day`,
      "detail-reach",
    ),
    // Views on the campaign's days and on as many days just before it.
    window
      ? runHogQL<{ day: string; views: number; visitors: number }>(
          `SELECT toDate(toTimeZone(timestamp, 'Europe/Oslo')) AS day,
               count() AS views, uniq(person_id) AS visitors
             FROM events
             WHERE ${viewedIn(
               `timestamp >= toDateTime('${window.before[0]} 00:00:00', 'Europe/Oslo')
                 AND timestamp < toDateTime('${window.days.at(-1)} 00:00:00', 'Europe/Oslo') + INTERVAL 1 DAY`,
             )}
             GROUP BY day ORDER BY day`,
          "detail-campaign-daily",
        )
      : [],
    ongoing ? isShownOnFrontPage(ownerId, today) : null,
  ])

  const eventDates = new Map(
    members.flatMap(member => {
      const date = (member.dates ?? []).filter(Boolean).sort()[0]
      return date ? [[member._id, date] as const] : []
    }),
  )
  const dailyClickRows = new Map(
    dailyClicks.map(row => [String(row.day).slice(0, 10), row]),
  )
  const days = fillDailySeries(daily, period, today)
  const ticketClicks = dailyClicks.reduce(
    (sum, row) => sum + toCount(row.ticket),
    0,
  )
  const facebookClicks = dailyClicks.reduce(
    (sum, row) => sum + toCount(row.facebook),
    0,
  )

  const channels = new Map<string, number>(
    TRAFFIC_CHANNELS.map(name => [name, 0]),
  )
  const sites = new Map<string, number>()
  for (const row of referrers) {
    const views = toCount(row.views)
    const channel = channelForDomain(row.domain)
    channels.set(channel, (channels.get(channel) ?? 0) + views)
    if (row.domain && row.domain !== "$direct") {
      const host = row.domain.replace(/^www\./, "")
      sites.set(host, (sites.get(host) ?? 0) + views)
    }
  }
  const ranked = (entries: Map<string, number>, limit: number): NamedCount[] =>
    [...entries]
      .map(([name, value]) => ({ name, value }))
      .filter(entry => entry.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, limit)

  const perIdViews = new Map(perId.map(row => [row.id, row]))
  const instances: EventStatistic[] = instanceDocs
    .map(instance => {
      const row = perIdViews.get(instance._id)
      const clicks = perIdClicks.filter(
        click =>
          click.id === instance._id ||
          (!click.id &&
            (click.slug === instance.slug ||
              click.slug === instance.initialSlug)),
      )
      return {
        ...toEventMeta(instance),
        instanceCount: 1,
        daily: [],
        firstSeen: null,
        views: toCount(row?.views),
        sessions: toCount(row?.sessions),
        visitors: toCount(row?.visitors),
        ticketClicks: clicks.reduce(
          (sum, click) => sum + toCount(click.ticket),
          0,
        ),
        facebookClicks: clicks.reduce(
          (sum, click) => sum + toCount(click.facebook),
          0,
        ),
        medianSeconds: null,
      }
    })
    .sort((a, b) => (a.firstDate ?? "").localeCompare(b.firstDate ?? ""))

  const seriesDates = instances
    .flatMap(instance => [instance.firstDate, instance.lastDate])
    .filter((date): date is string => date !== null)
    .sort()

  return {
    event: {
      ...meta,
      instanceCount: Math.max(1, instances.length),
      firstDate: seriesDates[0] ?? meta.firstDate,
      lastDate: seriesDates.at(-1) ?? meta.lastDate,
    },
    partOf:
      !isSeries && meta.series && meta.series.id !== meta.id
        ? { slug: meta.series.slug, title: meta.series.title }
        : null,
    totals: {
      views: toCount(totals[0]?.views),
      sessions: toCount(totals[0]?.sessions),
      visitors: toCount(totals[0]?.visitors),
      ticketClicks,
      facebookClicks,
      medianSeconds: medianWhenReliable(duration[0]),
    },
    daily: days,
    dailyClicks: days.map(({ day }) => ({
      day,
      ticket: toCount(dailyClickRows.get(day)?.ticket),
      facebook: toCount(dailyClickRows.get(day)?.facebook),
    })),
    channels: ranked(channels, TRAFFIC_CHANNELS.length),
    sites: ranked(sites, 8),
    devices: ranked(
      devices.reduce((byName, row) => {
        const name = deviceName(row.device)
        return byName.set(name, (byName.get(name) ?? 0) + toCount(row.views))
      }, new Map<string, number>()),
      4,
    ),
    instances,
    leadTime: leadTimeBuckets(
      leadRows.flatMap(row => {
        const eventDate = eventDates.get(row.id)
        return eventDate
          ? [
              {
                day: String(row.day).slice(0, 10),
                eventDate,
                views: toCount(row.views),
              },
            ]
          : []
      }),
      [...eventDates.values()],
      today,
    ),
    exposure: buildExposure({
      selectedCampaign,
      shownNow,
      window: window && {
        ...window,
        daily: fillDailySeries(
          campaignDailyRows,
          window.before.length + window.days.length,
          window.days.at(-1) ?? today,
        ),
      },
      placements: placementRows,
      seen: seenRows,
      entryViews: entryViewRows,
      entryTickets: entryTicketRows,
      reach: reachRows,
      campaigns,
      impressionDays: new Set(
        promotedDayRows.map(row => String(row.day).slice(0, 10)),
      ),
      daily: days,
      firstSeen: firstSeenRows[0]?.day
        ? String(firstSeenRows[0].day).slice(0, 10)
        : null,
      lastDate: seriesDates.at(-1) ?? meta.lastDate,
      today,
    }),
  }
}

const SURFACE_NAMES: Record<string, string> = {
  "home-promoted": "Forsiden, fremhevet",
  "home-upcoming": "Forsiden, Arrangementer",
  "events-list": "Arrangementlisten",
  calendar: "Arrangementkalenderen",
  "detail-parent": "Serie- og festivalsider",
  "detail-child": "Datoer på seriesider",
}

const LISTING_SURFACES = [
  "home-promoted",
  "home-upcoming",
  "events-list",
  "calendar",
] as const

/** Seen → clicked → visited → ticket click, per listing surface. */
function surfaceFunnels(
  placements: Array<{ surface: string | null; clicks: number }>,
  seen: Array<{ surface: string | null; seen: number }>,
  entryViews: Array<{ surface: string | null; views: number }>,
  entryTickets: Array<{ surface: string | null; tickets: number }>,
): SurfaceFunnel[] {
  const sum = <T extends { surface: string | null }>(
    rows: T[],
    surface: string,
    pick: (row: T) => unknown,
  ) =>
    rows
      .filter(row => row.surface === surface)
      .reduce((total, row) => total + toCount(pick(row)), 0)
  const listed = new Set<string>(LISTING_SURFACES)
  const others = <T extends { surface: string | null }>(
    rows: T[],
    pick: (row: T) => unknown,
  ) =>
    rows
      .filter(row => !row.surface || !listed.has(row.surface))
      .reduce((total, row) => total + toCount(pick(row)), 0)
  return [
    ...LISTING_SURFACES.map(surface => ({
      name: SURFACE_NAMES[surface],
      seen: sum(seen, surface, row => row.seen),
      clicks: sum(placements, surface, row => row.clicks),
      views: sum(entryViews, surface, row => row.views),
      ticketClicks: sum(entryTickets, surface, row => row.tickets),
    })),
    {
      name: "Andre veier inn",
      seen: null,
      clicks: null,
      views: others(entryViews, row => row.views),
      ticketClicks: others(entryTickets, row => row.tickets),
    },
  ]
}

/** Front-page exposure and how page views moved on promoted days. */
function buildExposure({
  selectedCampaign,
  shownNow,
  window,
  placements,
  seen,
  entryViews,
  entryTickets,
  reach,
  campaigns,
  impressionDays,
  daily,
  firstSeen,
  lastDate,
  today,
}: {
  selectedCampaign: number | null
  shownNow: boolean | null
  window: (CampaignWindow & { daily: DailyPoint[] }) | null
  placements: Array<{
    surface: string | null
    impressions: number
    clicks: number
  }>
  seen: Array<{ surface: string | null; seen: number }>
  entryViews: Array<{ surface: string | null; views: number }>
  entryTickets: Array<{ surface: string | null; tickets: number }>
  reach: Array<{ day: string; people: number; first_time: number }>
  campaigns: CampaignPeriod[] | null
  impressionDays: Set<string>
  daily: DailyPoint[]
  firstSeen: string | null
  lastDate: string | null
  today: string
}): Exposure {
  const onSurface = (surface: string, pick: "impressions" | "clicks") =>
    placements
      .filter(row => row.surface === surface)
      .reduce((sum, row) => sum + toCount(row[pick]), 0)
  const lastLive = lastDate && lastDate < today ? lastDate : today
  // A selected campaign is compared with as many days just before it. Else
  // Sanity history gives exact campaign days; without it, campaign days are
  // inferred from impressions, which are only tracked since a fixed date.
  const promotedDays = window
    ? new Set(window.days)
    : campaigns
      ? campaignDays(campaigns, today)
      : impressionDays
  const series = window?.daily ?? daily
  const live = series.filter(
    point =>
      (window || campaigns || point.day >= PLACEMENT_TRACKING_START) &&
      (!firstSeen || point.day >= firstSeen) &&
      point.day <= lastLive,
  )
  const promoted = live.filter(point => promotedDays.has(point.day))
  const other = live.filter(point => !promotedDays.has(point.day))
  const average = (points: typeof live) =>
    points.length
      ? Math.round(
          (points.reduce((sum, point) => sum + point.views, 0) /
            points.length) *
            10,
        ) / 10
      : null
  return {
    selectedCampaign,
    shownNow,
    highlightedImpressions: onSurface("home-promoted", "impressions"),
    highlightedClicks: onSurface("home-promoted", "clicks"),
    upcomingClicks: onSurface("home-upcoming", "clicks"),
    surfaces: surfaceFunnels(placements, seen, entryViews, entryTickets),
    reach: reachByDay(
      reach,
      window?.days ?? daily.map(point => point.day),
      promotedDays,
    ),
    campaigns:
      campaigns?.map(period => ({
        from: toOsloDay(period.from),
        until: period.until ? toOsloDay(period.until) : null,
      })) ?? null,
    promotedDays: window
      ? window.days.length
      : daily.filter(point => promotedDays.has(point.day)).length,
    viewsPerPromotedDay: average(promoted),
    viewsPerOtherDay: average(other),
    placements: placements
      .map(row => ({
        name: SURFACE_NAMES[row.surface ?? ""] ?? "Andre steder",
        impressions: toCount(row.impressions),
        clicks: toCount(row.clicks),
      }))
      .filter(row => row.impressions + row.clicks > 0)
      .sort((a, b) => b.impressions - a.impressions),
  }
}

type CampaignWindow = {
  /** HogQL condition on the campaign's exact start and end. */
  range: string
  /** Oslo dates the campaign covered, up to today. */
  days: string[]
  /** As many Oslo dates just before the campaign, for comparison. */
  before: string[]
}

const hogqlTimestamp = (iso: string) =>
  `toDateTime(${hogqlString(new Date(iso).toISOString().slice(0, 19).replace("T", " "))}, 'UTC')`

function campaignWindow(period: CampaignPeriod, today: string): CampaignWindow {
  const first = toOsloDay(period.from)
  const last = period.until ? toOsloDay(period.until) : today
  const days = daysBetween(first, last < today ? last : today)
  return {
    range: `timestamp >= ${hogqlTimestamp(period.from)}
      AND timestamp < ${period.until ? hogqlTimestamp(period.until) : "now()"}`,
    days,
    before: daysBetween(
      periodStart(first, days.length + 1),
      periodStart(first, 2),
    ),
  }
}

/** Whether the front page shows this event among its three fremhevet now. */
async function isShownOnFrontPage(eventId: string, today: string) {
  const options = { locale: "nb", from: today, to: null } as const
  const [{ events }, parents] = await Promise.all([
    fetchPublicEventSet(options),
    fetchPublicPromotedParentEvents(options),
  ])
  // Mirrors the selection on the front page.
  const candidates = [...parents, ...events]
    .filter(event => isPromotableEventKind(event.eventKind))
    .filter(event => event.isPromoted)
  return selectHomepagePromotedEvents(candidates, today).some(
    event => event._id === eventId,
  )
}

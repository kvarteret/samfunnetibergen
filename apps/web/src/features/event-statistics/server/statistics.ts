import "server-only"

import { sanityClient } from "@/lib/sanity/client"
import { getOsloDateString } from "@/lib/sanity/fetch/shared"
import {
  canSeeGroup,
  type EventStatistic,
  fillDailySeries,
  type GroupStatistic,
  isSafeIdentifier,
  type StatisticsPeriod,
  type StatisticsReport,
  type StatisticsScope,
  toCount,
  toSeconds,
} from "../domain/statistics"
import {
  EVENT_PROJECTION,
  type EventDocument,
  toEventMeta,
} from "./event-documents"
import { hogqlStringList, runHogQL } from "./posthog-query"

/*
 * PostHog sources (captured by this website):
 * - `content_page_viewed` with `content_type` "arrangement" / "group";
 *   `content_id` is the Sanity document id, `content_slug` the slug.
 * - `ticket_link_clicked` / `facebook_event_link_clicked`; `event_id` is the
 *   Sanity document id.
 * - `$pageview` / `$pageleave` carry `$prev_pageview_duration` for the page
 *   being left, which gives time spent per arrangement path.
 */

export const ARRANGEMENT_PATH = "^/(?:nb|en)/arrangementer/([^/?#]+)"
/*
 * Time on page counts visits between 1 s and 10 min; longer ones are tabs left
 * open. A median needs MIN_DURATION_SAMPLES visits, or a single idle tab
 * decides it.
 */
export const DURATION_FILTER =
  "toFloat(properties.$prev_pageview_duration) BETWEEN 1 AND 600"
const MIN_DURATION_SAMPLES = 10

export function medianWhenReliable(
  row: { seconds: unknown; samples: unknown } | undefined,
): number | null {
  return row && toCount(row.samples) >= MIN_DURATION_SAMPLES
    ? toSeconds(row.seconds)
    : null
}

const eventDocumentsQuery = `*[_type == "arrangement" && (_id in $ids || slug.current in $slugs || initialSlug in $slugs)]${EVENT_PROJECTION}`

const groupNamesQuery = `*[_type == "studentGroup" && defined(slug.current)]{
  "slug": slug.current,
  "name": localizedName[language == "nb" && defined(value) && value != ""][0].value
}`

export function since(period: StatisticsPeriod) {
  // Whole Oslo days, including today, so the series lines up with the chart.
  return `timestamp >= toStartOfDay(now('Europe/Oslo')) - INTERVAL ${period - 1} DAY`
}

export async function buildStatisticsReport(
  scope: StatisticsScope,
  period: StatisticsPeriod,
): Promise<StatisticsReport> {
  const range = since(period)
  const [viewRows, clickRows, durationRows, groupRows, groupNames] =
    await Promise.all([
      runHogQL<{
        id: string
        views: number
        sessions: number
        visitors: number
      }>(
        `SELECT properties.content_id AS id, count() AS views,
           uniq(properties.$session_id) AS sessions, uniq(person_id) AS visitors
         FROM events
         WHERE event = 'content_page_viewed'
           AND properties.content_type = 'arrangement' AND ${range}
         GROUP BY id ORDER BY views DESC LIMIT 2000`,
        "event-views",
      ),
      // Clicks before mid-September 2026 carry only `event_slug`.
      runHogQL<{
        id: string | null
        slug: string | null
        ticket: number
        facebook: number
      }>(
        `SELECT properties.event_id AS id, properties.event_slug AS slug,
           countIf(event = 'ticket_link_clicked') AS ticket,
           countIf(event = 'facebook_event_link_clicked') AS facebook
         FROM events
         WHERE event IN ('ticket_link_clicked', 'facebook_event_link_clicked')
           AND ${range}
         GROUP BY id, slug LIMIT 4000`,
        "event-clicks",
      ),
      runHogQL<{ slug: string; seconds: number; samples: number }>(
        `SELECT extract(properties.$prev_pageview_pathname, '${ARRANGEMENT_PATH}') AS slug,
           median(toFloat(properties.$prev_pageview_duration)) AS seconds,
             count() AS samples
         FROM events
         WHERE event IN ('$pageview', '$pageleave') AND ${range}
           AND ${DURATION_FILTER}
         GROUP BY slug HAVING slug != '' LIMIT 2000`,
        "event-durations",
      ),
      runHogQL<{
        slug: string
        views: number
        sessions: number
        visitors: number
      }>(
        `SELECT properties.content_slug AS slug, count() AS views,
           uniq(properties.$session_id) AS sessions, uniq(person_id) AS visitors
         FROM events
         WHERE event = 'content_page_viewed'
           AND properties.content_type = 'group' AND ${range}
         GROUP BY slug ORDER BY views DESC LIMIT 500`,
        "group-views",
      ),
      sanityClient.fetch<Array<{ slug: string; name: string | null }>>(
        groupNamesQuery,
        {},
        { perspective: "published", stega: false },
      ),
    ])

  const viewedIds = viewRows.map(row => row.id).filter(isSafeIdentifier)
  const clickedIds = clickRows.map(row => row.id).filter(isSafeIdentifier)
  const clickedSlugs = clickRows
    .filter(row => !row.id)
    .map(row => row.slug)
    .filter(isSafeIdentifier)
  const ids = [...new Set([...viewedIds, ...clickedIds])]
  const slugs = [...new Set(clickedSlugs)]
  const documents =
    ids.length || slugs.length
      ? await sanityClient.fetch<EventDocument[]>(
          eventDocumentsQuery,
          { ids, slugs },
          { perspective: "published", stega: false },
        )
      : []

  const views = new Map(viewRows.map(row => [row.id, row]))
  const clicks = new Map<string, { ticket: number; facebook: number }>()
  for (const row of clickRows) {
    const key = row.id ? `id:${row.id}` : row.slug ? `slug:${row.slug}` : null
    if (!key) continue
    const current = clicks.get(key) ?? { ticket: 0, facebook: 0 }
    current.ticket += toCount(row.ticket)
    current.facebook += toCount(row.facebook)
    clicks.set(key, current)
  }
  const clicksFor = (doc: EventDocument) => {
    const keys = [
      `id:${doc._id}`,
      `slug:${doc.slug}`,
      `slug:${doc.initialSlug}`,
    ]
    const unique = [...new Set(keys)]
    return unique.reduce(
      (sum, key) => {
        const found = clicks.get(key)
        return found
          ? {
              ticket: sum.ticket + found.ticket,
              facebook: sum.facebook + found.facebook,
            }
          : sum
      },
      { ticket: 0, facebook: 0 },
    )
  }
  const durations = new Map(
    durationRows.map(row => [row.slug, medianWhenReliable(row)]),
  )

  const events: EventStatistic[] = documents
    .filter(doc => canSeeGroup(scope, doc.organizer?.slug ?? null))
    .map(doc => {
      const viewed = views.get(doc._id)
      const clicked = clicksFor(doc)
      const meta = toEventMeta(doc)
      return {
        ...meta,
        instanceCount: 1,
        daily: [] as number[],
        firstSeen: null as string | null,
        views: toCount(viewed?.views),
        sessions: toCount(viewed?.sessions),
        visitors: toCount(viewed?.visitors),
        ticketClicks: toCount(clicked?.ticket),
        facebookClicks: toCount(clicked?.facebook),
        medianSeconds:
          durations.get(meta.slug) ??
          (doc.initialSlug ? durations.get(doc.initialSlug) : null) ??
          null,
      }
    })
    .sort((a, b) => b.views - a.views || b.ticketClicks - a.ticketClicks)

  const names = new Map(
    groupNames.map(group => [group.slug, group.name ?? group.slug]),
  )
  for (const group of scope.groups ?? []) {
    if (!names.has(group.slug)) names.set(group.slug, group.name)
  }
  const groupViews = new Map(groupRows.map(row => [row.slug, row]))
  const groupSlugs =
    scope.groups === null
      ? groupRows.map(row => row.slug).filter(isSafeIdentifier)
      : scope.groups.map(group => group.slug).filter(isSafeIdentifier)

  const scopedIds = events.map(event => event.id)
  const scopedSlugs = [
    ...new Set(events.map(event => event.slug).filter(isSafeIdentifier)),
  ]
  const today = getOsloDateString()
  const [
    eventSeries,
    eventTotals,
    durationTotal,
    groupSeries,
    groupTotals,
    groupSlugSeries,
    eventIdSeries,
    firstSeenRows,
  ] = await Promise.all([
    scopedIds.length
      ? runHogQL<{ day: string; views: number; visitors: number }>(
          `SELECT toDate(toTimeZone(timestamp, 'Europe/Oslo')) AS day, count() AS views,
               uniq(person_id) AS visitors
             FROM events
             WHERE event = 'content_page_viewed'
               AND properties.content_type = 'arrangement' AND ${range}
               AND properties.content_id IN ${hogqlStringList(scopedIds)}
             GROUP BY day ORDER BY day`,
          "event-daily",
        )
      : [],
    scopedIds.length
      ? runHogQL<{ sessions: number; visitors: number }>(
          `SELECT uniq(properties.$session_id) AS sessions,
               uniq(person_id) AS visitors
             FROM events
             WHERE event = 'content_page_viewed'
               AND properties.content_type = 'arrangement' AND ${range}
               AND properties.content_id IN ${hogqlStringList(scopedIds)}`,
          "event-totals",
        )
      : [],
    scopedSlugs.length
      ? runHogQL<{ seconds: number; samples: number }>(
          `SELECT median(toFloat(properties.$prev_pageview_duration)) AS seconds,
             count() AS samples
             FROM events
             WHERE event IN ('$pageview', '$pageleave') AND ${range}
               AND ${DURATION_FILTER}
               AND extract(properties.$prev_pageview_pathname, '${ARRANGEMENT_PATH}')
                 IN ${hogqlStringList(scopedSlugs)}`,
          "event-duration-total",
        )
      : [],
    groupSlugs.length
      ? runHogQL<{ day: string; views: number; visitors: number }>(
          `SELECT toDate(toTimeZone(timestamp, 'Europe/Oslo')) AS day, count() AS views,
               uniq(person_id) AS visitors
             FROM events
             WHERE event = 'content_page_viewed'
               AND properties.content_type = 'group' AND ${range}
               AND properties.content_slug IN ${hogqlStringList(groupSlugs)}
             GROUP BY day ORDER BY day`,
          "group-daily",
        )
      : [],
    groupSlugs.length
      ? runHogQL<{ views: number; sessions: number; visitors: number }>(
          `SELECT count() AS views, uniq(properties.$session_id) AS sessions,
               uniq(person_id) AS visitors
             FROM events
             WHERE event = 'content_page_viewed'
               AND properties.content_type = 'group' AND ${range}
               AND properties.content_slug IN ${hogqlStringList(groupSlugs)}`,
          "group-totals",
        )
      : [],
    groupSlugs.length
      ? runHogQL<{ slug: string; day: string; views: number }>(
          `SELECT properties.content_slug AS slug,
               toDate(toTimeZone(timestamp, 'Europe/Oslo')) AS day, count() AS views
             FROM events
             WHERE event = 'content_page_viewed'
               AND properties.content_type = 'group' AND ${range}
               AND properties.content_slug IN ${hogqlStringList(groupSlugs)}
             GROUP BY slug, day`,
          "group-daily-by-slug",
        )
      : [],
    scopedIds.length
      ? runHogQL<{ id: string; day: string; views: number }>(
          `SELECT properties.content_id AS id,
             toDate(toTimeZone(timestamp, 'Europe/Oslo')) AS day, count() AS views
           FROM events
           WHERE event = 'content_page_viewed'
             AND properties.content_type = 'arrangement' AND ${range}
             AND properties.content_id IN ${hogqlStringList(scopedIds)}
           GROUP BY id, day`,
          "event-daily-by-id",
        )
      : [],
    scopedIds.length
      ? runHogQL<{ id: string; day: string }>(
          `SELECT properties.content_id AS id,
             toString(min(toDate(toTimeZone(timestamp, 'Europe/Oslo')))) AS day
           FROM events
           WHERE event = 'content_page_viewed'
             AND properties.content_type = 'arrangement'
             AND timestamp >= now() - INTERVAL 365 DAY
             AND properties.content_id IN ${hogqlStringList(scopedIds)}
           GROUP BY id`,
          "event-first-seen",
        )
      : [],
  ])

  const seriesById = new Map<string, { day: string; views: number }[]>()
  for (const row of eventIdSeries) {
    seriesById.set(row.id, [
      ...(seriesById.get(row.id) ?? []),
      { day: row.day, views: row.views },
    ])
  }
  const firstSeen = new Map(
    firstSeenRows.map(row => [row.id, String(row.day).slice(0, 10)]),
  )
  for (const event of events) {
    event.firstSeen = firstSeen.get(event.id) ?? null
    event.daily = fillDailySeries(
      (seriesById.get(event.id) ?? []).map(row => ({ ...row, visitors: 0 })),
      period,
      today,
    ).map(point => point.views)
  }

  const groups: GroupStatistic[] = groupSlugs
    .map(slug => ({
      slug,
      name: names.get(slug) ?? slug,
      views: toCount(groupViews.get(slug)?.views),
      sessions: toCount(groupViews.get(slug)?.sessions),
      visitors: toCount(groupViews.get(slug)?.visitors),
      daily: fillDailySeries(
        groupSlugSeries
          .filter(row => row.slug === slug)
          .map(row => ({ day: row.day, views: row.views, visitors: 0 })),
        period,
        today,
      ).map(point => point.views),
    }))
    .sort((a, b) => b.views - a.views)

  return {
    period,
    events,
    eventTotals: {
      views: events.reduce((sum, event) => sum + event.views, 0),
      sessions: toCount(eventTotals[0]?.sessions),
      visitors: toCount(eventTotals[0]?.visitors),
      ticketClicks: events.reduce((sum, event) => sum + event.ticketClicks, 0),
      facebookClicks: events.reduce(
        (sum, event) => sum + event.facebookClicks,
        0,
      ),
      medianSeconds: medianWhenReliable(durationTotal[0]),
    },
    eventDaily: fillDailySeries(eventSeries, period, today),
    groups,
    groupTotals: {
      views: toCount(groupTotals[0]?.views),
      sessions: toCount(groupTotals[0]?.sessions),
      visitors: toCount(groupTotals[0]?.visitors),
    },
    groupDaily: fillDailySeries(groupSeries, period, today),
  }
}

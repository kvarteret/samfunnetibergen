export const STATISTICS_PERIODS = [7, 30, 90] as const
export type StatisticsPeriod = (typeof STATISTICS_PERIODS)[number]

export function parsePeriod(value: string | string[] | undefined) {
  const parsed = Number(Array.isArray(value) ? value[0] : value)
  return (STATISTICS_PERIODS as readonly number[]).includes(parsed)
    ? (parsed as StatisticsPeriod)
    : 30
}

export type StatisticsScope = {
  /** `null` grants every group (Admin). */
  groups: ReadonlyArray<{ slug: string; name: string }> | null
}

export function canSeeGroup(scope: StatisticsScope, slug: string | null) {
  if (scope.groups === null) return true
  if (!slug) return false
  return scope.groups.some(group => group.slug === slug)
}

export type EventStatistic = {
  id: string
  slug: string
  title: string
  organizerName: string | null
  organizerSlug: string | null
  imageUrl: string | null
  /** The series or festival this event belongs to (or is), if any. */
  series: { id: string; slug: string; title: string } | null
  /** Instances folded into this row; 1 for a single event. */
  instanceCount: number
  /** Shapes shared with the /arrangementer filters. */
  organizerGroup: { _id: string; name: string } | null
  eventType: {
    _id: string
    name: string
    taxonomyGroup: { _id: string; name: string } | null
  } | null
  firstDate: string | null
  lastDate: string | null
  isCancelled: boolean
  isSoldOut: boolean
  /** Whether the event page links to tickets or a Facebook event at all. */
  hasTicketLink: boolean
  hasFacebookLink: boolean
  /** "Promotert på forsiden" in Sanity right now. */
  isPromoted: boolean
  /** First day the page was ever viewed (Oslo date), if known. */
  firstSeen: string | null
  /** Views per day across the period, oldest first. */
  daily: number[]
  views: number
  sessions: number
  visitors: number
  ticketClicks: number
  facebookClicks: number
  medianSeconds: number | null
}

export type GroupStatistic = {
  slug: string
  name: string
  views: number
  sessions: number
  visitors: number
  /** Views per day, oldest first, for a sparkline. */
  daily: number[]
}

export type DailyPoint = { day: string; views: number; visitors: number }

export type StatisticsTotals = {
  views: number
  sessions: number
  visitors: number
  ticketClicks: number
  facebookClicks: number
  medianSeconds: number | null
}

export type StatisticsReport = {
  period: StatisticsPeriod
  events: EventStatistic[]
  eventTotals: StatisticsTotals
  eventDaily: DailyPoint[]
  groups: GroupStatistic[]
  groupTotals: Pick<StatisticsTotals, "views" | "sessions" | "visitors">
  groupDaily: DailyPoint[]
}

export function toCount(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0
}

export function toSeconds(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null
}

/** One point per Oslo calendar day, oldest first, with missing days as zero. */
export function fillDailySeries(
  rows: ReadonlyArray<{ day: unknown; views: unknown; visitors: unknown }>,
  days: number,
  today: string,
): DailyPoint[] {
  const byDay = new Map(rows.map(row => [String(row.day).slice(0, 10), row]))
  const end = new Date(`${today}T00:00:00Z`)
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(end)
    date.setUTCDate(end.getUTCDate() - (days - 1 - index))
    const day = date.toISOString().slice(0, 10)
    const row = byDay.get(day)
    return {
      day,
      views: toCount(row?.views),
      visitors: toCount(row?.visitors),
    }
  })
}

/** Sanity document ids and slugs only; anything else never reaches HogQL. */
export function isSafeIdentifier(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9._-]{1,200}$/.test(value)
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return "–"
  if (seconds < 60) return `${seconds} s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest ? `${minutes} min ${rest} s` : `${minutes} min`
}

export const EVENT_STATUS_FILTERS = [
  { value: "alle", label: "Alle" },
  { value: "kommende", label: "Kommende" },
  { value: "utlopt", label: "Utløpt" },
  { value: "avlyst", label: "Avlyst" },
  { value: "utsolgt", label: "Utsolgt" },
] as const
export type EventStatusFilter = (typeof EVENT_STATUS_FILTERS)[number]["value"]

/** Sortable table columns, keyed by their URL name. */
export const EVENT_SORT_COLUMNS = [
  "visninger",
  "per-dag",
  "besokende",
  "okter",
  "billettklikk",
  "facebook",
  "tid",
  "dato",
  "tittel",
] as const
export type EventSortColumn = (typeof EVENT_SORT_COLUMNS)[number]
export type SortParam = { id: EventSortColumn; desc: boolean }

export const DEFAULT_SORT: SortParam = { id: "visninger", desc: true }

/** `sorter=billettklikk` sorts descending; a leading `-` flips it. */
export function parseSortParam(value: string | null): SortParam {
  if (!value) return DEFAULT_SORT
  const ascending = value.startsWith("-")
  const id = ascending ? value.slice(1) : value
  return (EVENT_SORT_COLUMNS as readonly string[]).includes(id)
    ? { id: id as EventSortColumn, desc: !ascending }
    : DEFAULT_SORT
}

export function serializeSortParam(sort: SortParam): string | null {
  if (sort.id === DEFAULT_SORT.id && sort.desc === DEFAULT_SORT.desc)
    return null
  return sort.desc ? sort.id : `-${sort.id}`
}

export const EVENTS_PER_PAGE = 15

export function parseStatusFilter(value: string | null): EventStatusFilter {
  return EVENT_STATUS_FILTERS.some(option => option.value === value)
    ? (value as EventStatusFilter)
    : "alle"
}

/** An event has expired once its last date is before today (Oslo). */
export function isExpired(
  event: Pick<EventStatistic, "lastDate">,
  today: string,
) {
  return event.lastDate !== null && event.lastDate < today
}

export function matchesStatus(
  event: EventStatistic,
  status: EventStatusFilter,
  today: string,
): boolean {
  switch (status) {
    case "kommende":
      return !event.isCancelled && !isExpired(event, today)
    case "utlopt":
      return !event.isCancelled && isExpired(event, today)
    case "avlyst":
      return event.isCancelled
    case "utsolgt":
      return event.isSoldOut
    default:
      return true
  }
}

const median = (values: number[]) => {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[middle]
    : Math.round((sorted[middle - 1] + sorted[middle]) / 2)
}

/**
 * Fold series and festival instances (and their parent page) into one row per
 * series. Counts are summed; unique visitors and sessions are summed too, so
 * they can over-count people who saw several dates. Time on page is the
 * median of the instances' medians.
 */
export function aggregateSeries(
  events: readonly EventStatistic[],
): EventStatistic[] {
  const rows = new Map<string, EventStatistic[]>()
  for (const event of events) {
    const key = event.series?.id ?? event.id
    rows.set(key, [...(rows.get(key) ?? []), event])
  }
  return [...rows.values()].map(members => {
    const [first] = members
    if (!first.series || (members.length === 1 && first.series.id === first.id))
      return first.series ? { ...first, instanceCount: 1 } : first
    const sum = (pick: (event: EventStatistic) => number) =>
      members.reduce((total, event) => total + pick(event), 0)
    const dates = members
      .flatMap(event => [event.firstDate, event.lastDate])
      .filter((date): date is string => date !== null)
      .sort()
    const instances = members.filter(event => event.id !== first.series?.id)
    const withImage = members.find(event => event.imageUrl)
    return {
      ...first,
      id: first.series.id,
      slug: first.series.slug,
      title: first.series.title,
      imageUrl: withImage?.imageUrl ?? null,
      firstDate: dates[0] ?? null,
      lastDate: dates.at(-1) ?? null,
      isCancelled: instances.length > 0 && instances.every(e => e.isCancelled),
      isSoldOut: instances.some(event => event.isSoldOut),
      hasTicketLink: members.some(event => event.hasTicketLink),
      hasFacebookLink: members.some(event => event.hasFacebookLink),
      isPromoted: members.some(event => event.isPromoted),
      firstSeen:
        members
          .map(event => event.firstSeen)
          .filter((day): day is string => day !== null)
          .sort()[0] ?? null,
      daily: members.reduce<number[]>(
        (total, event) =>
          event.daily.map((value, index) => value + (total[index] ?? 0)),
        [],
      ),
      instanceCount: Math.max(1, instances.length),
      views: sum(event => event.views),
      sessions: sum(event => event.sessions),
      visitors: sum(event => event.visitors),
      ticketClicks: sum(event => event.ticketClicks),
      facebookClicks: sum(event => event.facebookClicks),
      medianSeconds: median(
        members
          .map(event => event.medianSeconds)
          .filter((value): value is number => value !== null),
      ),
    }
  })
}

const NORWEGIAN_LETTERS: Record<string, string> = { æ: "ae", ø: "o", å: "a" }

const fold = (value: string) =>
  value
    .toLocaleLowerCase("nb")
    .replace(/[æøå]/g, letter => NORWEGIAN_LETTERS[letter] ?? letter)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")

/** Every word must appear in the title, series title or organizer. */
export function matchesSearch(event: EventStatistic, query: string) {
  const words = fold(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const haystack = fold(
    [event.title, event.series?.title, event.organizerName]
      .filter(Boolean)
      .join(" "),
  )
  return words.every(word => haystack.includes(word))
}

const SEARCH_ENGINES =
  /(^|\.)(google|bing|duckduckgo|ecosia|yahoo|startpage|qwant|kagi|yandex|baidu)\.|search\.brave\.com/
const SOCIAL =
  /(^|\.)(facebook|instagram|tiktok|snapchat|linkedin|twitter|x|threads|reddit|messenger|youtube)\.com$|(^|\.)t\.co$/
const OWN_SITE = /(^|\.)samfunnetibergen\.no$/

export const TRAFFIC_CHANNELS = [
  "Søkemotorer",
  "Direkte",
  "Sosiale medier",
  "samfunnetibergen.no",
  "Andre nettsider",
] as const
export type TrafficChannel = (typeof TRAFFIC_CHANNELS)[number]

/** Group PostHog's `$referring_domain` into channels people recognise. */
export function channelForDomain(
  domain: string | null | undefined,
): TrafficChannel {
  const host = (domain ?? "")
    .trim()
    .toLowerCase()
    .replace(/^l\.|^m\.|^lm\./, "")
  if (!host || host === "$direct") return "Direkte"
  if (SEARCH_ENGINES.test(host)) return "Søkemotorer"
  if (SOCIAL.test(host)) return "Sosiale medier"
  if (OWN_SITE.test(host)) return "samfunnetibergen.no"
  return "Andre nettsider"
}

const DEVICE_NAMES: Record<string, string> = {
  Desktop: "Datamaskin",
  Mobile: "Mobil",
  Tablet: "Nettbrett",
}

export function deviceName(value: string | null | undefined) {
  return DEVICE_NAMES[value ?? ""] ?? "Ukjent"
}

/** `pending` marks a value that cannot exist yet, e.g. days still ahead. */
export type NamedCount = { name: string; value: number; pending?: boolean }

export type DailyClicks = { day: string; ticket: number; facebook: number }

export type EventDetail = {
  event: Omit<
    EventStatistic,
    | "views"
    | "sessions"
    | "visitors"
    | "ticketClicks"
    | "facebookClicks"
    | "medianSeconds"
    | "daily"
    | "firstSeen"
  >
  /** Set when this event is one date in a series. */
  partOf: { slug: string; title: string } | null
  totals: StatisticsTotals
  daily: DailyPoint[]
  dailyClicks: DailyClicks[]
  channels: NamedCount[]
  sites: NamedCount[]
  devices: NamedCount[]
  /** Per-date rows when the event is a series. */
  instances: EventStatistic[]
  /** Views by days before the event date, over the last 180 days. */
  leadTime: NamedCount[]
  exposure: Exposure
}

/** Ticket clicks per unique visitor, as a whole percentage. */
export function clickRate(clicks: number, visitors: number): string {
  if (visitors === 0) return "–"
  return `${Math.round((clicks / visitors) * 100)} %`
}

const shortDate = new Intl.DateTimeFormat("nb-NO", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Oslo",
})

export function formatDateRange(first: string, last: string | null) {
  const format = (day: string) => shortDate.format(new Date(`${day}T12:00:00Z`))
  return last && last !== first
    ? `${format(first)} – ${format(last)}`
    : format(first)
}

const DAY_MS = 24 * 60 * 60 * 1000
const dayNumber = (day: string) => Date.parse(`${day}T00:00:00Z`) / DAY_MS

/** Oslo date `days - 1` days before `today`: the first day of the period. */
export function periodStart(today: string, days: number) {
  return new Date((dayNumber(today) - (days - 1)) * DAY_MS)
    .toISOString()
    .slice(0, 10)
}

/**
 * Days the event page was live inside the period: from its first view (or the
 * period start) until its last date (or today), at least one.
 */
export function liveDays(
  event: Pick<EventStatistic, "firstSeen" | "lastDate">,
  start: string,
  today: string,
): number {
  const from = [start, event.firstSeen ?? start].sort().at(-1) ?? start
  const until =
    event.lastDate && event.lastDate < today ? event.lastDate : today
  return Math.max(1, dayNumber(until) - dayNumber(from) + 1)
}

/** Views per live day, so newly published events compare fairly. */
export function viewsPerLiveDay(
  event: Pick<EventStatistic, "firstSeen" | "lastDate" | "views">,
  start: string,
  today: string,
): number {
  return Math.round((event.views / liveDays(event, start, today)) * 10) / 10
}

export const LEAD_TIME_BUCKETS = [
  { label: "30+ dager før", min: 30, max: Number.POSITIVE_INFINITY },
  { label: "15–29 dager før", min: 15, max: 29 },
  { label: "8–14 dager før", min: 8, max: 14 },
  { label: "4–7 dager før", min: 4, max: 7 },
  { label: "2–3 dager før", min: 2, max: 3 },
  { label: "Dagen før", min: 1, max: 1 },
  { label: "Samme dag", min: 0, max: 0 },
  { label: "Etterpå", min: Number.NEGATIVE_INFINITY, max: -1 },
] as const

/**
 * Views grouped by how many days before the event date they happened. Buckets
 * no date of the event has reached yet are marked pending.
 */
export function leadTimeBuckets(
  rows: ReadonlyArray<{ day: string; eventDate: string; views: number }>,
  eventDates: readonly string[] = [],
  today?: string,
): NamedCount[] {
  const daysLeft =
    today && eventDates.length
      ? Math.min(...eventDates.map(date => dayNumber(date) - dayNumber(today)))
      : Number.NEGATIVE_INFINITY
  const totals: NamedCount[] = LEAD_TIME_BUCKETS.map(bucket => ({
    name: bucket.label,
    value: 0,
    ...(bucket.max < daysLeft ? { pending: true } : {}),
  }))
  for (const row of rows) {
    const before = dayNumber(row.eventDate) - dayNumber(row.day)
    const index = LEAD_TIME_BUCKETS.findIndex(
      bucket => before >= bucket.min && before <= bucket.max,
    )
    if (index >= 0) totals[index].value += row.views
  }
  return totals
}

/** Placement impressions are recorded from this Oslo date. */
export const PLACEMENT_TRACKING_START = "2026-10-06"

/** A promotion period from Sanity history; `until: null` while running. */
export type CampaignPeriod = { from: string; until: string | null }

const osloDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Oslo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

/** Oslo date (YYYY-MM-DD) of an ISO timestamp. */
export function toOsloDay(timestamp: string) {
  return osloDay.format(new Date(timestamp))
}

/** `kampanje=2` selects the second campaign; anything else selects none. */
export function parseCampaignParam(
  value: string | string[] | undefined,
  count: number,
): number | null {
  const parsed = Number(Array.isArray(value) ? value[0] : value)
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= count
    ? parsed - 1
    : null
}

/** Oslo dates from `first` to `last`, inclusive. */
export function daysBetween(first: string, last: string) {
  const days: string[] = []
  for (let day = dayNumber(first); day <= dayNumber(last); day++) {
    days.push(new Date(day * DAY_MS).toISOString().slice(0, 10))
  }
  return days
}

/** «1 dag», «12 dager»: how long a campaign ran, or has run so far. */
export function campaignDuration(
  campaign: { from: string; until: string | null },
  today: string,
) {
  const days = daysBetween(campaign.from, campaign.until ?? today).length
  return days === 1 ? "1 dag" : `${days} dager`
}

/** Every Oslo date a campaign covered, up to and including today. */
export function campaignDays(
  periods: readonly CampaignPeriod[],
  today: string,
) {
  const days = new Set<string>()
  for (const period of periods) {
    const first = dayNumber(toOsloDay(period.from))
    const last = dayNumber(period.until ? toOsloDay(period.until) : today)
    for (let day = first; day <= Math.min(last, dayNumber(today)); day++) {
      days.add(new Date(day * DAY_MS).toISOString().slice(0, 10))
    }
  }
  return days
}

export type Exposure = {
  /** Campaign periods from Sanity history (Oslo dates), or null if unknown. */
  campaigns: Array<{ from: string; until: string | null }> | null
  /** Index into `campaigns` the section is limited to, or null for the period. */
  selectedCampaign: number | null
  /** For a running campaign: whether the event is among the three shown on the
   * front page right now, rather than waiting in the queue. */
  shownNow: boolean | null
  /** Sessions that saw the event among the three fremhevet on the front page. */
  highlightedImpressions: number
  highlightedClicks: number
  /** Clicks from the front page's "Arrangementer" list; tracked for all events. */
  upcomingClicks: number
  /** Days in the period covered by a campaign (Sanity), or with a front-page
   * promoted impression when the history is unavailable. */
  promotedDays: number
  /** Average page views per day on promoted days and on other live days. */
  viewsPerPromotedDay: number | null
  viewsPerOtherDay: number | null
  placements: Array<{ name: string; impressions: number; clicks: number }>
  /** Seen, clicked and resulting visits per listing surface. */
  surfaces: SurfaceFunnel[]
  /** People who saw it fremhevet per campaign day, oldest first. */
  reach: ReachPoint[]
}

/** `firstTime` counts people who had never seen the event fremhevet before. */
export type ReachPoint = { day: string; people: number; firstTime: number }

/**
 * Daily reach on any day with impressions, and on campaign days since
 * impressions were first recorded, where missing days count as zero.
 */
export function reachByDay(
  rows: ReadonlyArray<{ day: unknown; people: unknown; first_time: unknown }>,
  days: readonly string[],
  campaignDays: ReadonlySet<string>,
): ReachPoint[] {
  const byDay = new Map(rows.map(row => [String(row.day).slice(0, 10), row]))
  return days
    .filter(
      day =>
        byDay.has(day) ||
        (day >= PLACEMENT_TRACKING_START && campaignDays.has(day)),
    )
    .map(day => {
      const row = byDay.get(day)
      return {
        day,
        people: toCount(row?.people),
        firstTime: toCount(row?.first_time),
      }
    })
}

export type SurfaceFunnel = {
  name: string
  /** Page views where the event card was seen; null for "other ways in". */
  seen: number | null
  clicks: number | null
  /** Event page views and ticket clicks that came from this surface. */
  views: number
  ticketClicks: number
}

/** Clicks per impression, as a whole percentage. */
export function clickThroughRate(clicks: number, impressions: number) {
  if (impressions === 0) return "–"
  return `${Math.round((clicks / impressions) * 100)} %`
}

/** Shown wherever the statistics say "Fremhevet". */
export const FREMHEVET_DEFINITION =
  "Vises blant de opptil tre arrangementene øverst på forsiden. Arrangementer blir kandidater når de er satt som «Promotert på forsiden» i Sanity; står flere i kø, vises de tre første."
